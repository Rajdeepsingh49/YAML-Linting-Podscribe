/**
 * Schema-Driven Structure Reorganizer
 * 
 * Understands correct Kubernetes field nesting and relocates misplaced fields
 * to their correct positions based on the resource schema.
 */

import type { K8sResourceSchema, FieldDefinition } from '../schema/schema-types.js';
import { getSchema, isKnownKind, getFieldPath, getRequiredPaths } from '../schema/k8s-schemas.js';
import type { ASTNode, MapNode, ScalarNode, RootNode, DocumentNode } from '../parser/ast-types.js';
import { ASTBuilder } from '../parser/ast-builder.js';

// ==========================================
// TYPES
// ==========================================

export interface RelocationResult {
    field: string;
    value: any;
    sourcePath: string;
    targetPath: string;
    confidence: number;
    reason: string;
}

export interface StructuralChange {
    type: 'relocate' | 'create' | 'merge' | 'remove';
    path: string;
    description: string;
    before?: any;
    after?: any;
    confidence: number;
}

export interface ReorganizeResult {
    document: any;
    changes: StructuralChange[];
    isValid: boolean;
    errors: string[];
}

// ==========================================
// FIELD LOCATION RULES
// ==========================================

/**
 * Defines where fields should be located for different resource kinds
 */
const FIELD_LOCATIONS: Record<string, Record<string, string>> = {
    // Common fields for all resources
    '*': {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'generateName': 'metadata.generateName',
        'finalizers': 'metadata.finalizers'
    },

    // Deployment-specific
    'Deployment': {
        'replicas': 'spec.replicas',
        'selector': 'spec.selector',
        'matchLabels': 'spec.selector.matchLabels',
        'matchExpressions': 'spec.selector.matchExpressions',
        'strategy': 'spec.strategy',
        'minReadySeconds': 'spec.minReadySeconds',
        'revisionHistoryLimit': 'spec.revisionHistoryLimit',
        'progressDeadlineSeconds': 'spec.progressDeadlineSeconds',
        'paused': 'spec.paused',
        // Pod template fields
        'containers': 'spec.template.spec.containers',
        'initContainers': 'spec.template.spec.initContainers',
        'volumes': 'spec.template.spec.volumes',
        'nodeSelector': 'spec.template.spec.nodeSelector',
        'tolerations': 'spec.template.spec.tolerations',
        'affinity': 'spec.template.spec.affinity',
        'serviceAccountName': 'spec.template.spec.serviceAccountName',
        'serviceAccount': 'spec.template.spec.serviceAccountName',
        'imagePullSecrets': 'spec.template.spec.imagePullSecrets',
        'restartPolicy': 'spec.template.spec.restartPolicy',
        'terminationGracePeriodSeconds': 'spec.template.spec.terminationGracePeriodSeconds',
        'dnsPolicy': 'spec.template.spec.dnsPolicy',
        'hostNetwork': 'spec.template.spec.hostNetwork',
        'hostPID': 'spec.template.spec.hostPID',
        'securityContext': 'spec.template.spec.securityContext',
        'schedulerName': 'spec.template.spec.schedulerName',
        'priorityClassName': 'spec.template.spec.priorityClassName'
    },

    // StatefulSet-specific
    'StatefulSet': {
        'replicas': 'spec.replicas',
        'serviceName': 'spec.serviceName',
        'selector': 'spec.selector',
        'matchLabels': 'spec.selector.matchLabels',
        'podManagementPolicy': 'spec.podManagementPolicy',
        'updateStrategy': 'spec.updateStrategy',
        'volumeClaimTemplates': 'spec.volumeClaimTemplates',
        'containers': 'spec.template.spec.containers',
        'initContainers': 'spec.template.spec.initContainers',
        'volumes': 'spec.template.spec.volumes',
        'nodeSelector': 'spec.template.spec.nodeSelector',
        'tolerations': 'spec.template.spec.tolerations',
        'affinity': 'spec.template.spec.affinity',
        'serviceAccountName': 'spec.template.spec.serviceAccountName'
    },

    // DaemonSet-specific
    'DaemonSet': {
        'selector': 'spec.selector',
        'matchLabels': 'spec.selector.matchLabels',
        'updateStrategy': 'spec.updateStrategy',
        'containers': 'spec.template.spec.containers',
        'initContainers': 'spec.template.spec.initContainers',
        'volumes': 'spec.template.spec.volumes',
        'nodeSelector': 'spec.template.spec.nodeSelector',
        'tolerations': 'spec.template.spec.tolerations',
        'affinity': 'spec.template.spec.affinity',
        'serviceAccountName': 'spec.template.spec.serviceAccountName',
        'hostNetwork': 'spec.template.spec.hostNetwork'
    },

    // Job-specific
    'Job': {
        'parallelism': 'spec.parallelism',
        'completions': 'spec.completions',
        'backoffLimit': 'spec.backoffLimit',
        'activeDeadlineSeconds': 'spec.activeDeadlineSeconds',
        'ttlSecondsAfterFinished': 'spec.ttlSecondsAfterFinished',
        'suspend': 'spec.suspend',
        'containers': 'spec.template.spec.containers',
        'restartPolicy': 'spec.template.spec.restartPolicy',
        'volumes': 'spec.template.spec.volumes'
    },

    // CronJob-specific
    'CronJob': {
        'schedule': 'spec.schedule',
        'timeZone': 'spec.timeZone',
        'concurrencyPolicy': 'spec.concurrencyPolicy',
        'suspend': 'spec.suspend',
        'startingDeadlineSeconds': 'spec.startingDeadlineSeconds',
        'successfulJobsHistoryLimit': 'spec.successfulJobsHistoryLimit',
        'failedJobsHistoryLimit': 'spec.failedJobsHistoryLimit',
        'containers': 'spec.jobTemplate.spec.template.spec.containers',
        'restartPolicy': 'spec.jobTemplate.spec.template.spec.restartPolicy',
        'volumes': 'spec.jobTemplate.spec.template.spec.volumes'
    },

    // Service-specific
    'Service': {
        'type': 'spec.type',
        'selector': 'spec.selector',
        'ports': 'spec.ports',
        'clusterIP': 'spec.clusterIP',
        'externalIPs': 'spec.externalIPs',
        'loadBalancerIP': 'spec.loadBalancerIP',
        'sessionAffinity': 'spec.sessionAffinity',
        'externalTrafficPolicy': 'spec.externalTrafficPolicy'
    },

    // Ingress-specific
    'Ingress': {
        'ingressClassName': 'spec.ingressClassName',
        'defaultBackend': 'spec.defaultBackend',
        'tls': 'spec.tls',
        'rules': 'spec.rules'
    },

    // Pod-specific
    'Pod': {
        'containers': 'spec.containers',
        'initContainers': 'spec.initContainers',
        'volumes': 'spec.volumes',
        'nodeSelector': 'spec.nodeSelector',
        'tolerations': 'spec.tolerations',
        'affinity': 'spec.affinity',
        'serviceAccountName': 'spec.serviceAccountName',
        'restartPolicy': 'spec.restartPolicy',
        'terminationGracePeriodSeconds': 'spec.terminationGracePeriodSeconds',
        'hostNetwork': 'spec.hostNetwork',
        'dnsPolicy': 'spec.dnsPolicy',
        'securityContext': 'spec.securityContext'
    },

    // ConfigMap/Secret
    'ConfigMap': {
        'data': 'data',
        'binaryData': 'binaryData',
        'immutable': 'immutable'
    },
    'Secret': {
        'type': 'type',
        'data': 'data',
        'stringData': 'stringData',
        'immutable': 'immutable'
    },

    // RBAC
    'Role': {
        'rules': 'rules'
    },
    'ClusterRole': {
        'rules': 'rules',
        'aggregationRule': 'aggregationRule'
    },
    'RoleBinding': {
        'roleRef': 'roleRef',
        'subjects': 'subjects'
    },
    'ClusterRoleBinding': {
        'roleRef': 'roleRef',
        'subjects': 'subjects'
    },

    // Storage
    'PersistentVolume': {
        'capacity': 'spec.capacity',
        'accessModes': 'spec.accessModes',
        'storageClassName': 'spec.storageClassName',
        'persistentVolumeReclaimPolicy': 'spec.persistentVolumeReclaimPolicy',
        'volumeMode': 'spec.volumeMode',
        'hostPath': 'spec.hostPath',
        'nfs': 'spec.nfs'
    },
    'PersistentVolumeClaim': {
        'accessModes': 'spec.accessModes',
        'storageClassName': 'spec.storageClassName',
        'volumeMode': 'spec.volumeMode',
        'resources': 'spec.resources',
        'storage': 'spec.resources.requests.storage',
        'volumeName': 'spec.volumeName',
        'selector': 'spec.selector'
    },
    'StorageClass': {
        'provisioner': 'provisioner',
        'parameters': 'parameters',
        'reclaimPolicy': 'reclaimPolicy',
        'volumeBindingMode': 'volumeBindingMode',
        'allowVolumeExpansion': 'allowVolumeExpansion',
        'mountOptions': 'mountOptions'
    },

    // Autoscaling
    'HorizontalPodAutoscaler': {
        'scaleTargetRef': 'spec.scaleTargetRef',
        'minReplicas': 'spec.minReplicas',
        'maxReplicas': 'spec.maxReplicas',
        'metrics': 'spec.metrics',
        'behavior': 'spec.behavior'
    }
};

/**
 * Nested structure expectations
 * These are fields that should be nested inside containers or other parent contexts
 */
const NESTED_CONTAINER_FIELDS = new Set([
    'image', 'imagePullPolicy', 'command', 'args', 'workingDir',
    'ports', 'containerPort', 'env', 'envFrom', 'resources',
    'limits', 'requests', 'volumeMounts', 'livenessProbe',
    'readinessProbe', 'startupProbe', 'lifecycle', 'securityContext',
    'stdin', 'tty', 'terminationMessagePath', 'terminationMessagePolicy'
]);

const PROBE_FIELDS = new Set([
    'httpGet', 'tcpSocket', 'exec', 'grpc',
    'initialDelaySeconds', 'periodSeconds', 'timeoutSeconds',
    'successThreshold', 'failureThreshold'
]);

const VOLUME_MOUNT_FIELDS = new Set([
    'mountPath', 'subPath', 'readOnly', 'mountPropagation'
]);

// ==========================================
// STRUCTURE REORGANIZER CLASS
// ==========================================

export class StructureReorganizer {
    private changes: StructuralChange[];

    constructor() {
        this.changes = [];
    }

    /**
     * Reorganize a YAML document based on its kind's schema
     */
    reorganize(document: any): ReorganizeResult {
        this.changes = [];
        const errors: string[] = [];

        // Get the kind
        const kind = document.kind;
        if (!kind) {
            return {
                document,
                changes: [],
                isValid: false,
                errors: ['Document has no "kind" field']
            };
        }

        // Deep clone to avoid mutating original
        const doc = JSON.parse(JSON.stringify(document));

        // Get field locations for this kind
        const commonLocations = FIELD_LOCATIONS['*'] || {};
        const kindLocations = FIELD_LOCATIONS[kind] || {};
        const allLocations = { ...commonLocations, ...kindLocations };

        // Find and relocate misplaced fields
        const fieldsToRelocate = this.findMisplacedFields(doc, allLocations);

        for (const relocation of fieldsToRelocate) {
            this.relocateField(doc, relocation);
            this.changes.push({
                type: 'relocate',
                path: relocation.targetPath,
                description: `Moved "${relocation.field}" from ${relocation.sourcePath} to ${relocation.targetPath}`,
                before: relocation.value,
                after: relocation.value,
                confidence: relocation.confidence
            });
        }

        // Ensure required structure exists
        this.ensureRequiredStructure(doc, kind);

        // Validate the result
        let isValid = true;
        try {
            // Basic validation
            if (!doc.apiVersion) {
                errors.push('Missing required field: apiVersion');
                isValid = false;
            }
            if (!doc.metadata) {
                errors.push('Missing required field: metadata');
                isValid = false;
            }
        } catch (error: any) {
            errors.push(error.message);
            isValid = false;
        }

        return {
            document: doc,
            changes: this.changes,
            isValid,
            errors
        };
    }

    /**
     * Find fields that are in the wrong location
     */
    private findMisplacedFields(doc: any, locations: Record<string, string>): RelocationResult[] {
        const relocations: RelocationResult[] = [];

        // Check root-level fields
        for (const [field, targetPath] of Object.entries(locations)) {
            if (doc[field] !== undefined) {
                const pathParts = targetPath.split('.');

                // Check if the field is already at the correct location
                if (pathParts[0] === field && pathParts.length === 1) {
                    continue; // Field is already at root and should be
                }

                // Check if field exists at target already
                let existsAtTarget = false;
                let current = doc;
                for (const part of pathParts) {
                    if (current && current[part] !== undefined) {
                        current = current[part];
                    } else {
                        break;
                    }
                }

                if (targetPath.split('.').length > 1) {
                    // Field should not be at root
                    relocations.push({
                        field,
                        value: doc[field],
                        sourcePath: field,
                        targetPath,
                        confidence: 0.80,
                        reason: `"${field}" should be under ${targetPath.split('.').slice(0, -1).join('.')}`
                    });
                }
            }
        }

        // Check for nested container fields at wrong level
        this.findMisplacedContainerFields(doc, relocations);

        return relocations;
    }

    /**
     * Find container-related fields that are at the wrong nesting level
     */
    private findMisplacedContainerFields(doc: any, relocations: RelocationResult[]): void {
        const kind = doc.kind;

        // Check if container fields are at spec level instead of spec.template.spec
        if (['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet'].includes(kind)) {
            const spec = doc.spec || {};

            for (const field of ['containers', 'initContainers', 'volumes']) {
                if (spec[field] && !spec.template?.spec?.[field]) {
                    relocations.push({
                        field,
                        value: spec[field],
                        sourcePath: `spec.${field}`,
                        targetPath: `spec.template.spec.${field}`,
                        confidence: 0.85,
                        reason: `"${field}" should be under spec.template.spec for ${kind}`
                    });
                }
            }

            // Check for pod spec fields at wrong level
            for (const field of ['nodeSelector', 'tolerations', 'affinity', 'serviceAccountName']) {
                if (spec[field] && !spec.template?.spec?.[field]) {
                    relocations.push({
                        field,
                        value: spec[field],
                        sourcePath: `spec.${field}`,
                        targetPath: `spec.template.spec.${field}`,
                        confidence: 0.82,
                        reason: `"${field}" should be under spec.template.spec for ${kind}`
                    });
                }
            }
        }

        // Check for Job
        if (kind === 'Job') {
            const spec = doc.spec || {};
            for (const field of ['containers', 'restartPolicy', 'volumes']) {
                if (spec[field] && !spec.template?.spec?.[field]) {
                    relocations.push({
                        field,
                        value: spec[field],
                        sourcePath: `spec.${field}`,
                        targetPath: `spec.template.spec.${field}`,
                        confidence: 0.85,
                        reason: `"${field}" should be under spec.template.spec for ${kind}`
                    });
                }
            }
        }

        // Check for CronJob (deeper nesting)
        if (kind === 'CronJob') {
            const spec = doc.spec || {};
            for (const field of ['containers', 'restartPolicy', 'volumes']) {
                if (spec[field]) {
                    relocations.push({
                        field,
                        value: spec[field],
                        sourcePath: `spec.${field}`,
                        targetPath: `spec.jobTemplate.spec.template.spec.${field}`,
                        confidence: 0.85,
                        reason: `"${field}" should be under spec.jobTemplate.spec.template.spec for ${kind}`
                    });
                }
            }
        }
    }

    /**
     * Relocate a field from source path to target path
     */
    private relocateField(doc: any, relocation: RelocationResult): void {
        // Remove from source
        if (relocation.sourcePath.includes('.')) {
            const sourceParts = relocation.sourcePath.split('.');
            let sourceParent = doc;
            for (let i = 0; i < sourceParts.length - 1; i++) {
                sourceParent = sourceParent[sourceParts[i]];
                if (!sourceParent) return;
            }
            delete sourceParent[sourceParts[sourceParts.length - 1]];
        } else {
            delete doc[relocation.sourcePath];
        }

        // Create path to target and set value
        const targetParts = relocation.targetPath.split('.');
        let current = doc;

        for (let i = 0; i < targetParts.length - 1; i++) {
            const part = targetParts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        const lastPart = targetParts[targetParts.length - 1];

        // Handle merging if target already exists
        if (current[lastPart] !== undefined) {
            if (typeof current[lastPart] === 'object' && typeof relocation.value === 'object' &&
                !Array.isArray(current[lastPart]) && !Array.isArray(relocation.value)) {
                // Merge objects
                Object.assign(current[lastPart], relocation.value);
            } else if (Array.isArray(current[lastPart]) && Array.isArray(relocation.value)) {
                // Merge arrays
                current[lastPart].push(...relocation.value);
            }
            // Otherwise keep existing value
        } else {
            current[lastPart] = relocation.value;
        }
    }

    /**
     * Ensure required structure exists for the resource kind
     */
    private ensureRequiredStructure(doc: any, kind: string): void {
        // Ensure metadata exists
        if (!doc.metadata) {
            doc.metadata = {};
            this.changes.push({
                type: 'create',
                path: 'metadata',
                description: 'Created required metadata object',
                confidence: 1.0
            });
        }

        // Kind-specific structure
        switch (kind) {
            case 'Deployment':
            case 'StatefulSet':
            case 'DaemonSet':
            case 'ReplicaSet':
                this.ensurePath(doc, ['spec', 'template', 'spec']);
                this.ensurePath(doc, ['spec', 'selector']);
                break;

            case 'Job':
                this.ensurePath(doc, ['spec', 'template', 'spec']);
                break;

            case 'CronJob':
                this.ensurePath(doc, ['spec', 'jobTemplate', 'spec', 'template', 'spec']);
                break;

            case 'Service':
                this.ensurePath(doc, ['spec']);
                break;

            case 'Ingress':
                this.ensurePath(doc, ['spec']);
                break;

            case 'PersistentVolumeClaim':
                this.ensurePath(doc, ['spec', 'resources', 'requests']);
                break;
        }
    }

    /**
     * Ensure a nested path exists in the document
     */
    private ensurePath(doc: any, path: string[]): void {
        let current = doc;
        let createdPath = '';

        for (const part of path) {
            createdPath = createdPath ? `${createdPath}.${part}` : part;
            if (!current[part]) {
                current[part] = {};
                this.changes.push({
                    type: 'create',
                    path: createdPath,
                    description: `Created required structure: ${createdPath}`,
                    confidence: 0.95
                });
            }
            current = current[part];
        }
    }

    /**
     * Get the correct path for a field based on kind
     */
    static getCorrectPath(kind: string, field: string): string | null {
        const commonLocations = FIELD_LOCATIONS['*'] || {};
        const kindLocations = FIELD_LOCATIONS[kind] || {};

        return kindLocations[field] || commonLocations[field] || null;
    }

    /**
     * Check if a field is at the correct location
     */
    static isFieldAtCorrectLocation(kind: string, field: string, currentPath: string): boolean {
        const correctPath = StructureReorganizer.getCorrectPath(kind, field);
        if (!correctPath) return true; // Unknown field, assume correct

        return currentPath === correctPath || currentPath.endsWith(`.${field}`);
    }
}

// ==========================================
// EXPORTS
// ==========================================

export const structureReorganizer = new StructureReorganizer();

/**
 * Convenience function to reorganize a document
 */
export function reorganizeDocument(document: any): ReorganizeResult {
    const reorganizer = new StructureReorganizer();
    return reorganizer.reorganize(document);
}

/**
 * Get the correct path for a field
 */
export function getCorrectFieldPath(kind: string, field: string): string | null {
    return StructureReorganizer.getCorrectPath(kind, field);
}
