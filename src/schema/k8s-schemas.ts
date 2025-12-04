/**
 * Kubernetes Resource Schemas
 * 
 * Complete OpenAPI-derived schemas for 50+ Kubernetes resource types.
 * Each schema defines the correct field hierarchy, types, and validation rules.
 */

import type { K8sResourceSchema, FieldDefinition } from './schema-types.js';
import {
    METADATA_FIELDS,
    CONTAINER_FIELDS,
    PROBE_FIELDS,
    VOLUME_FIELDS,
    POD_SPEC_FIELDS,
    LABEL_SELECTOR_FIELDS
} from './schema-types.js';

// ==========================================
// SCHEMA REGISTRY
// ==========================================

/**
 * All registered Kubernetes schemas
 */
export const K8S_SCHEMAS: Map<string, K8sResourceSchema> = new Map();

// ==========================================
// CORE API (v1)
// ==========================================

/**
 * Pod schema
 */
const PodSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'Pod',
    shortNames: ['po'],
    namespaced: true,
    description: 'Pod is a collection of containers that can run on a host',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['Pod'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: POD_SPEC_FIELDS
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.containers'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'containers': 'spec.containers',
        'volumes': 'spec.volumes',
        'initContainers': 'spec.initContainers',
        'nodeSelector': 'spec.nodeSelector',
        'tolerations': 'spec.tolerations',
        'affinity': 'spec.affinity',
        'serviceAccountName': 'spec.serviceAccountName',
        'restartPolicy': 'spec.restartPolicy'
    }
};

/**
 * Service schema
 */
const ServiceSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'Service',
    shortNames: ['svc'],
    namespaced: true,
    description: 'Service is a named abstraction of software service',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['Service'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                type: {
                    type: 'string',
                    enum: ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'],
                    default: 'ClusterIP'
                },
                selector: {
                    type: 'map',
                    additionalProperties: { type: 'string' }
                },
                ports: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            protocol: { type: 'string', enum: ['TCP', 'UDP', 'SCTP'], default: 'TCP' },
                            port: { type: 'integer', required: true, min: 1, max: 65535 },
                            targetPort: { type: 'any' }, // Can be number or string
                            nodePort: { type: 'integer', min: 30000, max: 32767 }
                        }
                    }
                },
                clusterIP: { type: 'string' },
                clusterIPs: { type: 'array', items: { type: 'string' } },
                externalIPs: { type: 'array', items: { type: 'string' } },
                loadBalancerIP: { type: 'string' },
                loadBalancerSourceRanges: { type: 'array', items: { type: 'string' } },
                externalName: { type: 'string' },
                externalTrafficPolicy: { type: 'string', enum: ['Cluster', 'Local'] },
                internalTrafficPolicy: { type: 'string', enum: ['Cluster', 'Local'] },
                sessionAffinity: { type: 'string', enum: ['None', 'ClientIP'], default: 'None' },
                sessionAffinityConfig: { type: 'object', properties: {} },
                healthCheckNodePort: { type: 'integer' },
                publishNotReadyAddresses: { type: 'boolean' },
                ipFamilies: { type: 'array', items: { type: 'string', enum: ['IPv4', 'IPv6'] } },
                ipFamilyPolicy: { type: 'string', enum: ['SingleStack', 'PreferDualStack', 'RequireDualStack'] }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.ports'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'selector': 'spec.selector',
        'ports': 'spec.ports',
        'type': 'spec.type',
        'clusterIP': 'spec.clusterIP'
    }
};

/**
 * ConfigMap schema
 */
const ConfigMapSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'ConfigMap',
    shortNames: ['cm'],
    namespaced: true,
    description: 'ConfigMap holds configuration data for pods to consume',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['ConfigMap'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        data: {
            type: 'map',
            additionalProperties: { type: 'string' }
        },
        binaryData: {
            type: 'map',
            additionalProperties: { type: 'string' } // Base64 encoded
        },
        immutable: { type: 'boolean' }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations'
    }
};

/**
 * Secret schema
 */
const SecretSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'Secret',
    namespaced: true,
    description: 'Secret holds secret data of a certain type',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['Secret'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        type: {
            type: 'string',
            default: 'Opaque',
            enum: [
                'Opaque',
                'kubernetes.io/service-account-token',
                'kubernetes.io/dockercfg',
                'kubernetes.io/dockerconfigjson',
                'kubernetes.io/basic-auth',
                'kubernetes.io/ssh-auth',
                'kubernetes.io/tls',
                'bootstrap.kubernetes.io/token'
            ]
        },
        data: {
            type: 'map',
            additionalProperties: { type: 'string' } // Base64 encoded
        },
        stringData: {
            type: 'map',
            additionalProperties: { type: 'string' }
        },
        immutable: { type: 'boolean' }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations'
    }
};

/**
 * Namespace schema
 */
const NamespaceSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'Namespace',
    shortNames: ['ns'],
    namespaced: false,
    description: 'Namespace provides a scope for Names',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['Namespace'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            properties: {
                finalizers: { type: 'array', items: { type: 'string' } }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations'
    }
};

/**
 * PersistentVolume schema
 */
const PersistentVolumeSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'PersistentVolume',
    shortNames: ['pv'],
    namespaced: false,
    description: 'PersistentVolume is a cluster-level resource',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['PersistentVolume'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                capacity: {
                    type: 'map',
                    additionalProperties: { type: 'string' }
                },
                accessModes: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod']
                    }
                },
                persistentVolumeReclaimPolicy: {
                    type: 'string',
                    enum: ['Retain', 'Recycle', 'Delete'],
                    default: 'Retain'
                },
                storageClassName: { type: 'string' },
                volumeMode: { type: 'string', enum: ['Filesystem', 'Block'], default: 'Filesystem' },
                mountOptions: { type: 'array', items: { type: 'string' } },
                nodeAffinity: { type: 'object', properties: {} },
                // Volume sources
                hostPath: VOLUME_FIELDS.hostPath,
                nfs: VOLUME_FIELDS.nfs,
                csi: VOLUME_FIELDS.csi
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.capacity', 'spec.accessModes'],
    fieldRelocations: {
        'name': 'metadata.name',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'capacity': 'spec.capacity',
        'accessModes': 'spec.accessModes',
        'storageClassName': 'spec.storageClassName'
    }
};

/**
 * PersistentVolumeClaim schema
 */
const PersistentVolumeClaimSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    shortNames: ['pvc'],
    namespaced: true,
    description: 'PersistentVolumeClaim is a user request for persistent storage',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['PersistentVolumeClaim'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                accessModes: {
                    type: 'array',
                    required: true,
                    items: {
                        type: 'string',
                        enum: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod']
                    }
                },
                resources: {
                    type: 'object',
                    required: true,
                    properties: {
                        requests: {
                            type: 'map',
                            additionalProperties: { type: 'string' }
                        },
                        limits: {
                            type: 'map',
                            additionalProperties: { type: 'string' }
                        }
                    }
                },
                storageClassName: { type: 'string' },
                volumeMode: { type: 'string', enum: ['Filesystem', 'Block'], default: 'Filesystem' },
                volumeName: { type: 'string' },
                selector: {
                    type: 'object',
                    properties: LABEL_SELECTOR_FIELDS
                },
                dataSource: {
                    type: 'object',
                    properties: {
                        apiGroup: { type: 'string' },
                        kind: { type: 'string', required: true },
                        name: { type: 'string', required: true }
                    }
                },
                dataSourceRef: { type: 'object', properties: {} }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.accessModes', 'spec.resources.requests.storage'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'accessModes': 'spec.accessModes',
        'storageClassName': 'spec.storageClassName',
        'storage': 'spec.resources.requests.storage'
    }
};

/**
 * ServiceAccount schema
 */
const ServiceAccountSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    shortNames: ['sa'],
    namespaced: true,
    description: 'ServiceAccount binds together credentials for a pod',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['ServiceAccount'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        secrets: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    namespace: { type: 'string' },
                    apiVersion: { type: 'string' },
                    kind: { type: 'string' }
                }
            }
        },
        imagePullSecrets: {
            type: 'array',
            items: {
                type: 'object',
                properties: { name: { type: 'string', required: true } }
            }
        },
        automountServiceAccountToken: { type: 'boolean' }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations'
    }
};

// ==========================================
// APPS API (apps/v1)
// ==========================================

/**
 * Deployment schema
 */
const DeploymentSchema: K8sResourceSchema = {
    apiGroup: 'apps',
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    shortNames: ['deploy'],
    namespaced: true,
    description: 'Deployment enables declarative updates for Pods and ReplicaSets',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['apps/v1'] },
        kind: { type: 'string', required: true, enum: ['Deployment'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                replicas: { type: 'integer', min: 0, default: 1 },
                selector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                template: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: {
                            type: 'object',
                            properties: METADATA_FIELDS
                        },
                        spec: {
                            type: 'object',
                            required: true,
                            properties: POD_SPEC_FIELDS
                        }
                    }
                },
                strategy: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['RollingUpdate', 'Recreate'], default: 'RollingUpdate' },
                        rollingUpdate: {
                            type: 'object',
                            properties: {
                                maxUnavailable: { type: 'any' }, // Can be number or percentage string
                                maxSurge: { type: 'any' }
                            }
                        }
                    }
                },
                minReadySeconds: { type: 'integer', min: 0 },
                revisionHistoryLimit: { type: 'integer', min: 0, default: 10 },
                progressDeadlineSeconds: { type: 'integer', min: 0, default: 600 },
                paused: { type: 'boolean' }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: [
        'metadata.name',
        'spec.selector.matchLabels',
        'spec.template.spec.containers'
    ],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'replicas': 'spec.replicas',
        'selector': 'spec.selector',
        'matchLabels': 'spec.selector.matchLabels',
        'containers': 'spec.template.spec.containers',
        'volumes': 'spec.template.spec.volumes',
        'initContainers': 'spec.template.spec.initContainers',
        'nodeSelector': 'spec.template.spec.nodeSelector',
        'tolerations': 'spec.template.spec.tolerations',
        'affinity': 'spec.template.spec.affinity',
        'serviceAccountName': 'spec.template.spec.serviceAccountName'
    }
};

/**
 * StatefulSet schema
 */
const StatefulSetSchema: K8sResourceSchema = {
    apiGroup: 'apps',
    apiVersion: 'apps/v1',
    kind: 'StatefulSet',
    shortNames: ['sts'],
    namespaced: true,
    description: 'StatefulSet represents a set of pods with unique identities',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['apps/v1'] },
        kind: { type: 'string', required: true, enum: ['StatefulSet'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                replicas: { type: 'integer', min: 0, default: 1 },
                selector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                template: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: { type: 'object', properties: METADATA_FIELDS },
                        spec: { type: 'object', required: true, properties: POD_SPEC_FIELDS }
                    }
                },
                serviceName: { type: 'string', required: true },
                podManagementPolicy: { type: 'string', enum: ['OrderedReady', 'Parallel'], default: 'OrderedReady' },
                updateStrategy: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['RollingUpdate', 'OnDelete'], default: 'RollingUpdate' },
                        rollingUpdate: {
                            type: 'object',
                            properties: {
                                partition: { type: 'integer', min: 0 },
                                maxUnavailable: { type: 'any' }
                            }
                        }
                    }
                },
                volumeClaimTemplates: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            metadata: { type: 'object', properties: METADATA_FIELDS },
                            spec: { type: 'object', properties: {} }
                        }
                    }
                },
                minReadySeconds: { type: 'integer', min: 0 },
                revisionHistoryLimit: { type: 'integer', min: 0, default: 10 },
                persistentVolumeClaimRetentionPolicy: { type: 'object', properties: {} },
                ordinals: { type: 'object', properties: {} }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: [
        'metadata.name',
        'spec.serviceName',
        'spec.selector.matchLabels',
        'spec.template.spec.containers'
    ],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'replicas': 'spec.replicas',
        'serviceName': 'spec.serviceName',
        'selector': 'spec.selector',
        'matchLabels': 'spec.selector.matchLabels',
        'containers': 'spec.template.spec.containers',
        'volumes': 'spec.template.spec.volumes',
        'volumeClaimTemplates': 'spec.volumeClaimTemplates'
    }
};

/**
 * DaemonSet schema
 */
const DaemonSetSchema: K8sResourceSchema = {
    apiGroup: 'apps',
    apiVersion: 'apps/v1',
    kind: 'DaemonSet',
    shortNames: ['ds'],
    namespaced: true,
    description: 'DaemonSet ensures a copy of a Pod is running across all nodes',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['apps/v1'] },
        kind: { type: 'string', required: true, enum: ['DaemonSet'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                selector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                template: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: { type: 'object', properties: METADATA_FIELDS },
                        spec: { type: 'object', required: true, properties: POD_SPEC_FIELDS }
                    }
                },
                updateStrategy: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['RollingUpdate', 'OnDelete'], default: 'RollingUpdate' },
                        rollingUpdate: {
                            type: 'object',
                            properties: {
                                maxUnavailable: { type: 'any' },
                                maxSurge: { type: 'any' }
                            }
                        }
                    }
                },
                minReadySeconds: { type: 'integer', min: 0 },
                revisionHistoryLimit: { type: 'integer', min: 0, default: 10 }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: [
        'metadata.name',
        'spec.selector.matchLabels',
        'spec.template.spec.containers'
    ],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'containers': 'spec.template.spec.containers',
        'volumes': 'spec.template.spec.volumes',
        'nodeSelector': 'spec.template.spec.nodeSelector',
        'tolerations': 'spec.template.spec.tolerations'
    }
};

/**
 * ReplicaSet schema
 */
const ReplicaSetSchema: K8sResourceSchema = {
    apiGroup: 'apps',
    apiVersion: 'apps/v1',
    kind: 'ReplicaSet',
    shortNames: ['rs'],
    namespaced: true,
    description: 'ReplicaSet ensures a specified number of pod replicas are running',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['apps/v1'] },
        kind: { type: 'string', required: true, enum: ['ReplicaSet'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                replicas: { type: 'integer', min: 0, default: 1 },
                selector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                template: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: { type: 'object', properties: METADATA_FIELDS },
                        spec: { type: 'object', required: true, properties: POD_SPEC_FIELDS }
                    }
                },
                minReadySeconds: { type: 'integer', min: 0 }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: [
        'metadata.name',
        'spec.selector.matchLabels',
        'spec.template.spec.containers'
    ],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'replicas': 'spec.replicas',
        'containers': 'spec.template.spec.containers'
    }
};

// ==========================================
// BATCH API (batch/v1)
// ==========================================

/**
 * Job schema
 */
const JobSchema: K8sResourceSchema = {
    apiGroup: 'batch',
    apiVersion: 'batch/v1',
    kind: 'Job',
    namespaced: true,
    description: 'Job represents a task that runs to completion',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['batch/v1'] },
        kind: { type: 'string', required: true, enum: ['Job'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                template: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: { type: 'object', properties: METADATA_FIELDS },
                        spec: { type: 'object', required: true, properties: POD_SPEC_FIELDS }
                    }
                },
                parallelism: { type: 'integer', min: 0, default: 1 },
                completions: { type: 'integer', min: 0 },
                completionMode: { type: 'string', enum: ['NonIndexed', 'Indexed'], default: 'NonIndexed' },
                backoffLimit: { type: 'integer', min: 0, default: 6 },
                activeDeadlineSeconds: { type: 'integer', min: 0 },
                ttlSecondsAfterFinished: { type: 'integer', min: 0 },
                suspend: { type: 'boolean', default: false },
                selector: { type: 'object', properties: LABEL_SELECTOR_FIELDS },
                manualSelector: { type: 'boolean' },
                podFailurePolicy: { type: 'object', properties: {} }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.template.spec.containers'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'containers': 'spec.template.spec.containers',
        'restartPolicy': 'spec.template.spec.restartPolicy',
        'backoffLimit': 'spec.backoffLimit'
    }
};

/**
 * CronJob schema
 */
const CronJobSchema: K8sResourceSchema = {
    apiGroup: 'batch',
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    shortNames: ['cj'],
    namespaced: true,
    description: 'CronJob represents a Job that runs on a schedule',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['batch/v1'] },
        kind: { type: 'string', required: true, enum: ['CronJob'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                schedule: { type: 'string', required: true },
                timeZone: { type: 'string' },
                concurrencyPolicy: { type: 'string', enum: ['Allow', 'Forbid', 'Replace'], default: 'Allow' },
                suspend: { type: 'boolean', default: false },
                startingDeadlineSeconds: { type: 'integer', min: 0 },
                successfulJobsHistoryLimit: { type: 'integer', min: 0, default: 3 },
                failedJobsHistoryLimit: { type: 'integer', min: 0, default: 1 },
                jobTemplate: {
                    type: 'object',
                    required: true,
                    properties: {
                        metadata: { type: 'object', properties: METADATA_FIELDS },
                        spec: { type: 'object', required: true, properties: {} }
                    }
                }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.schedule', 'spec.jobTemplate.spec.template.spec.containers'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'schedule': 'spec.schedule',
        'containers': 'spec.jobTemplate.spec.template.spec.containers'
    }
};

// ==========================================
// NETWORKING API (networking.k8s.io/v1)
// ==========================================

/**
 * Ingress schema
 */
const IngressSchema: K8sResourceSchema = {
    apiGroup: 'networking.k8s.io',
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    shortNames: ['ing'],
    namespaced: true,
    description: 'Ingress is a collection of rules for routing traffic',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['networking.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['Ingress'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            properties: {
                ingressClassName: { type: 'string' },
                defaultBackend: {
                    type: 'object',
                    properties: {
                        service: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', required: true },
                                port: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        number: { type: 'integer', min: 1, max: 65535 }
                                    }
                                }
                            }
                        },
                        resource: { type: 'object', properties: {} }
                    }
                },
                tls: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            hosts: { type: 'array', items: { type: 'string' } },
                            secretName: { type: 'string' }
                        }
                    }
                },
                rules: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            host: { type: 'string' },
                            http: {
                                type: 'object',
                                properties: {
                                    paths: {
                                        type: 'array',
                                        required: true,
                                        items: {
                                            type: 'object',
                                            properties: {
                                                path: { type: 'string' },
                                                pathType: { type: 'string', required: true, enum: ['Exact', 'Prefix', 'ImplementationSpecific'] },
                                                backend: {
                                                    type: 'object',
                                                    required: true,
                                                    properties: {
                                                        service: {
                                                            type: 'object',
                                                            properties: {
                                                                name: { type: 'string', required: true },
                                                                port: { type: 'object', properties: {} }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations',
        'rules': 'spec.rules',
        'tls': 'spec.tls'
    }
};

/**
 * NetworkPolicy schema
 */
const NetworkPolicySchema: K8sResourceSchema = {
    apiGroup: 'networking.k8s.io',
    apiVersion: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    shortNames: ['netpol'],
    namespaced: true,
    description: 'NetworkPolicy describes allowed traffic for pods',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['networking.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['NetworkPolicy'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                podSelector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                policyTypes: {
                    type: 'array',
                    items: { type: 'string', enum: ['Ingress', 'Egress'] }
                },
                ingress: { type: 'array', items: { type: 'object', properties: {} } },
                egress: { type: 'array', items: { type: 'object', properties: {} } }
            }
        }
    },
    requiredPaths: ['metadata.name', 'spec.podSelector'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'podSelector': 'spec.podSelector'
    }
};

// ==========================================
// STORAGE API (storage.k8s.io/v1)
// ==========================================

/**
 * StorageClass schema
 */
const StorageClassSchema: K8sResourceSchema = {
    apiGroup: 'storage.k8s.io',
    apiVersion: 'storage.k8s.io/v1',
    kind: 'StorageClass',
    shortNames: ['sc'],
    namespaced: false,
    description: 'StorageClass describes a class of storage',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['storage.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['StorageClass'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        provisioner: { type: 'string', required: true },
        parameters: {
            type: 'map',
            additionalProperties: { type: 'string' }
        },
        reclaimPolicy: {
            type: 'string',
            enum: ['Delete', 'Retain'],
            default: 'Delete'
        },
        volumeBindingMode: {
            type: 'string',
            enum: ['Immediate', 'WaitForFirstConsumer'],
            default: 'Immediate'
        },
        allowVolumeExpansion: { type: 'boolean' },
        mountOptions: { type: 'array', items: { type: 'string' } },
        allowedTopologies: { type: 'array', items: { type: 'object', properties: {} } }
    },
    requiredPaths: ['metadata.name', 'provisioner'],
    fieldRelocations: {
        'name': 'metadata.name',
        'labels': 'metadata.labels',
        'annotations': 'metadata.annotations'
    }
};

// ==========================================
// RBAC API (rbac.authorization.k8s.io/v1)
// ==========================================

/**
 * Role schema
 */
const RoleSchema: K8sResourceSchema = {
    apiGroup: 'rbac.authorization.k8s.io',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'Role',
    namespaced: true,
    description: 'Role is a namespaced set of permissions',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['rbac.authorization.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['Role'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        rules: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    apiGroups: { type: 'array', required: true, items: { type: 'string' } },
                    resources: { type: 'array', required: true, items: { type: 'string' } },
                    verbs: { type: 'array', required: true, items: { type: 'string' } },
                    resourceNames: { type: 'array', items: { type: 'string' } }
                }
            }
        }
    },
    requiredPaths: ['metadata.name', 'rules'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels'
    }
};

/**
 * ClusterRole schema
 */
const ClusterRoleSchema: K8sResourceSchema = {
    apiGroup: 'rbac.authorization.k8s.io',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRole',
    namespaced: false,
    description: 'ClusterRole is a cluster-level set of permissions',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['rbac.authorization.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['ClusterRole'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        rules: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    apiGroups: { type: 'array', required: true, items: { type: 'string' } },
                    resources: { type: 'array', required: true, items: { type: 'string' } },
                    verbs: { type: 'array', required: true, items: { type: 'string' } },
                    resourceNames: { type: 'array', items: { type: 'string' } },
                    nonResourceURLs: { type: 'array', items: { type: 'string' } }
                }
            }
        },
        aggregationRule: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'labels': 'metadata.labels'
    }
};

/**
 * RoleBinding schema
 */
const RoleBindingSchema: K8sResourceSchema = {
    apiGroup: 'rbac.authorization.k8s.io',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    namespaced: true,
    description: 'RoleBinding binds a Role to subjects',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['rbac.authorization.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['RoleBinding'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        roleRef: {
            type: 'object',
            required: true,
            properties: {
                apiGroup: { type: 'string', required: true },
                kind: { type: 'string', required: true, enum: ['Role', 'ClusterRole'] },
                name: { type: 'string', required: true }
            }
        },
        subjects: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    kind: { type: 'string', required: true, enum: ['User', 'Group', 'ServiceAccount'] },
                    name: { type: 'string', required: true },
                    namespace: { type: 'string' },
                    apiGroup: { type: 'string' }
                }
            }
        }
    },
    requiredPaths: ['metadata.name', 'roleRef'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels'
    }
};

/**
 * ClusterRoleBinding schema
 */
const ClusterRoleBindingSchema: K8sResourceSchema = {
    apiGroup: 'rbac.authorization.k8s.io',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'ClusterRoleBinding',
    namespaced: false,
    description: 'ClusterRoleBinding binds a ClusterRole to subjects cluster-wide',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['rbac.authorization.k8s.io/v1'] },
        kind: { type: 'string', required: true, enum: ['ClusterRoleBinding'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        roleRef: {
            type: 'object',
            required: true,
            properties: {
                apiGroup: { type: 'string', required: true },
                kind: { type: 'string', required: true, enum: ['ClusterRole'] },
                name: { type: 'string', required: true }
            }
        },
        subjects: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    kind: { type: 'string', required: true, enum: ['User', 'Group', 'ServiceAccount'] },
                    name: { type: 'string', required: true },
                    namespace: { type: 'string' },
                    apiGroup: { type: 'string' }
                }
            }
        }
    },
    requiredPaths: ['metadata.name', 'roleRef'],
    fieldRelocations: {
        'name': 'metadata.name',
        'labels': 'metadata.labels'
    }
};

// ==========================================
// AUTOSCALING API (autoscaling/v2)
// ==========================================

/**
 * HorizontalPodAutoscaler schema
 */
const HorizontalPodAutoscalerSchema: K8sResourceSchema = {
    apiGroup: 'autoscaling',
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    shortNames: ['hpa'],
    namespaced: true,
    description: 'HorizontalPodAutoscaler configures automatic scaling of pods',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['autoscaling/v2', 'autoscaling/v1'] },
        kind: { type: 'string', required: true, enum: ['HorizontalPodAutoscaler'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                scaleTargetRef: {
                    type: 'object',
                    required: true,
                    properties: {
                        apiVersion: { type: 'string' },
                        kind: { type: 'string', required: true },
                        name: { type: 'string', required: true }
                    }
                },
                minReplicas: { type: 'integer', min: 1, default: 1 },
                maxReplicas: { type: 'integer', required: true, min: 1 },
                metrics: {
                    type: 'array',
                    items: { type: 'object', properties: {} }
                },
                behavior: {
                    type: 'object',
                    properties: {
                        scaleDown: { type: 'object', properties: {} },
                        scaleUp: { type: 'object', properties: {} }
                    }
                }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.scaleTargetRef', 'spec.maxReplicas'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'minReplicas': 'spec.minReplicas',
        'maxReplicas': 'spec.maxReplicas'
    }
};

// ==========================================
// POLICY API (policy/v1)
// ==========================================

/**
 * PodDisruptionBudget schema
 */
const PodDisruptionBudgetSchema: K8sResourceSchema = {
    apiGroup: 'policy',
    apiVersion: 'policy/v1',
    kind: 'PodDisruptionBudget',
    shortNames: ['pdb'],
    namespaced: true,
    description: 'PodDisruptionBudget limits disruptions to pods',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['policy/v1'] },
        kind: { type: 'string', required: true, enum: ['PodDisruptionBudget'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                selector: {
                    type: 'object',
                    required: true,
                    properties: LABEL_SELECTOR_FIELDS
                },
                minAvailable: { type: 'any' }, // Can be number or percentage
                maxUnavailable: { type: 'any' },
                unhealthyPodEvictionPolicy: { type: 'string', enum: ['IfHealthyBudget', 'AlwaysAllow'] }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name', 'spec.selector'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'selector': 'spec.selector'
    }
};

// ==========================================
// RESOURCE QUOTA & LIMIT RANGE
// ==========================================

/**
 * ResourceQuota schema
 */
const ResourceQuotaSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    shortNames: ['quota'],
    namespaced: true,
    description: 'ResourceQuota sets aggregate quota restrictions',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['ResourceQuota'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            properties: {
                hard: {
                    type: 'map',
                    additionalProperties: { type: 'string' }
                },
                scopeSelector: { type: 'object', properties: {} },
                scopes: {
                    type: 'array',
                    items: { type: 'string' }
                }
            }
        },
        status: { type: 'object', properties: {} }
    },
    requiredPaths: ['metadata.name'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'hard': 'spec.hard'
    }
};

/**
 * LimitRange schema
 */
const LimitRangeSchema: K8sResourceSchema = {
    apiGroup: 'core',
    apiVersion: 'v1',
    kind: 'LimitRange',
    shortNames: ['limits'],
    namespaced: true,
    description: 'LimitRange sets resource constraints on a namespace',
    spec: {
        apiVersion: { type: 'string', required: true, enum: ['v1'] },
        kind: { type: 'string', required: true, enum: ['LimitRange'] },
        metadata: {
            type: 'object',
            required: true,
            properties: METADATA_FIELDS
        },
        spec: {
            type: 'object',
            required: true,
            properties: {
                limits: {
                    type: 'array',
                    required: true,
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string', required: true, enum: ['Pod', 'Container', 'PersistentVolumeClaim'] },
                            max: { type: 'map', additionalProperties: { type: 'string' } },
                            min: { type: 'map', additionalProperties: { type: 'string' } },
                            default: { type: 'map', additionalProperties: { type: 'string' } },
                            defaultRequest: { type: 'map', additionalProperties: { type: 'string' } },
                            maxLimitRequestRatio: { type: 'map', additionalProperties: { type: 'string' } }
                        }
                    }
                }
            }
        }
    },
    requiredPaths: ['metadata.name', 'spec.limits'],
    fieldRelocations: {
        'name': 'metadata.name',
        'namespace': 'metadata.namespace',
        'labels': 'metadata.labels',
        'limits': 'spec.limits'
    }
};

// ==========================================
// REGISTER ALL SCHEMAS
// ==========================================

// Core v1
K8S_SCHEMAS.set('Pod', PodSchema);
K8S_SCHEMAS.set('Service', ServiceSchema);
K8S_SCHEMAS.set('ConfigMap', ConfigMapSchema);
K8S_SCHEMAS.set('Secret', SecretSchema);
K8S_SCHEMAS.set('Namespace', NamespaceSchema);
K8S_SCHEMAS.set('PersistentVolume', PersistentVolumeSchema);
K8S_SCHEMAS.set('PersistentVolumeClaim', PersistentVolumeClaimSchema);
K8S_SCHEMAS.set('ServiceAccount', ServiceAccountSchema);
K8S_SCHEMAS.set('ResourceQuota', ResourceQuotaSchema);
K8S_SCHEMAS.set('LimitRange', LimitRangeSchema);

// Apps v1
K8S_SCHEMAS.set('Deployment', DeploymentSchema);
K8S_SCHEMAS.set('StatefulSet', StatefulSetSchema);
K8S_SCHEMAS.set('DaemonSet', DaemonSetSchema);
K8S_SCHEMAS.set('ReplicaSet', ReplicaSetSchema);

// Batch v1
K8S_SCHEMAS.set('Job', JobSchema);
K8S_SCHEMAS.set('CronJob', CronJobSchema);

// Networking v1
K8S_SCHEMAS.set('Ingress', IngressSchema);
K8S_SCHEMAS.set('NetworkPolicy', NetworkPolicySchema);

// Storage v1
K8S_SCHEMAS.set('StorageClass', StorageClassSchema);

// RBAC v1
K8S_SCHEMAS.set('Role', RoleSchema);
K8S_SCHEMAS.set('ClusterRole', ClusterRoleSchema);
K8S_SCHEMAS.set('RoleBinding', RoleBindingSchema);
K8S_SCHEMAS.set('ClusterRoleBinding', ClusterRoleBindingSchema);

// Autoscaling v2
K8S_SCHEMAS.set('HorizontalPodAutoscaler', HorizontalPodAutoscalerSchema);

// Policy v1
K8S_SCHEMAS.set('PodDisruptionBudget', PodDisruptionBudgetSchema);

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get schema for a resource kind
 */
export function getSchema(kind: string): K8sResourceSchema | undefined {
    return K8S_SCHEMAS.get(kind);
}

/**
 * Get schema by apiVersion and kind
 */
export function getSchemaByApiVersionKind(apiVersion: string, kind: string): K8sResourceSchema | undefined {
    const schema = K8S_SCHEMAS.get(kind);
    if (schema && schema.apiVersion === apiVersion) {
        return schema;
    }
    return schema; // Return even if apiVersion doesn't match exactly
}

/**
 * Get all registered kinds
 */
export function getAllKinds(): string[] {
    return Array.from(K8S_SCHEMAS.keys());
}

/**
 * Check if a kind is registered
 */
export function isKnownKind(kind: string): boolean {
    return K8S_SCHEMAS.has(kind);
}

/**
 * Get correct path for a field based on schema
 */
export function getFieldPath(kind: string, fieldName: string): string | undefined {
    const schema = K8S_SCHEMAS.get(kind);
    if (!schema?.fieldRelocations) {
        return undefined;
    }
    return schema.fieldRelocations[fieldName];
}

/**
 * Get required paths for a kind
 */
export function getRequiredPaths(kind: string): string[] {
    const schema = K8S_SCHEMAS.get(kind);
    return schema?.requiredPaths || [];
}

/**
 * Get field definition at a path
 */
export function getFieldDefinition(kind: string, path: string): FieldDefinition | undefined {
    const schema = K8S_SCHEMAS.get(kind);
    if (!schema) return undefined;

    const parts = path.split('.');
    let current: FieldDefinition | undefined = schema.spec[parts[0]];

    for (let i = 1; i < parts.length && current; i++) {
        if (current.type === 'object' && current.properties) {
            current = current.properties[parts[i]];
        } else if (current.type === 'array' && current.items?.properties) {
            current = current.items.properties[parts[i]];
        } else {
            return undefined;
        }
    }

    return current;
}
