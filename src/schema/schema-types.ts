/**
 * Schema Types for Kubernetes Resources
 * 
 * TypeScript interfaces for defining Kubernetes resource schemas
 * with field types, validation rules, and nesting information.
 */

// ==========================================
// FIELD TYPE DEFINITIONS
// ==========================================

/**
 * Primitive types for fields
 */
export type FieldType =
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'object'
    | 'array'
    | 'map'
    | 'any';

/**
 * Field definition with validation rules
 */
export interface FieldDefinition {
    /** Field type */
    type: FieldType;
    /** Whether field is required */
    required?: boolean;
    /** Default value if not specified */
    default?: any;
    /** Description for documentation */
    description?: string;

    // Numeric constraints
    /** Minimum value for numbers */
    min?: number;
    /** Maximum value for numbers */
    max?: number;

    // String constraints
    /** Regex pattern for validation */
    pattern?: string;
    /** Minimum length for strings */
    minLength?: number;
    /** Maximum length for strings */
    maxLength?: number;

    // Enum constraint
    /** Allowed values */
    enum?: string[];

    // Nested type definitions
    /** For 'object' type: child field definitions */
    properties?: Record<string, FieldDefinition>;
    /** For 'array' type: item schema */
    items?: FieldDefinition;
    /** For 'map' type: value schema (keys are always strings) */
    additionalProperties?: FieldDefinition;

    // Nesting context
    /** Valid parent paths for this field */
    validParents?: string[][];
    /** Whether this field marks a list container */
    isListContainer?: boolean;

    // Validation
    /** Custom validation function */
    validate?: (value: any) => { valid: boolean; message?: string };
}

/**
 * Complete schema for a Kubernetes resource kind
 */
export interface K8sResourceSchema {
    /** API group (e.g., 'apps', 'core', 'networking.k8s.io') */
    apiGroup: string;
    /** API version (e.g., 'v1', 'v1beta1') */
    apiVersion: string;
    /** Resource kind (e.g., 'Deployment', 'Service') */
    kind: string;
    /** Short names for kubectl (e.g., ['deploy'] for Deployment) */
    shortNames?: string[];
    /** Whether resource is namespaced */
    namespaced: boolean;
    /** Description */
    description?: string;

    /** Root-level field definitions */
    spec: Record<string, FieldDefinition>;

    /** Required field paths (e.g., ['metadata.name', 'spec.containers']) */
    requiredPaths: string[];

    /** Common field relocations (e.g., {labels: 'metadata.labels'}) */
    fieldRelocations?: Record<string, string>;
}

/**
 * Schema registry mapping kind to schema
 */
export interface SchemaRegistry {
    schemas: Map<string, K8sResourceSchema>;
    getSchema(kind: string): K8sResourceSchema | undefined;
    getSchemaByApiVersionKind(apiVersion: string, kind: string): K8sResourceSchema | undefined;
    validateResource(resource: any): SchemaValidationResult;
}

/**
 * Result of schema validation
 */
export interface SchemaValidationResult {
    valid: boolean;
    errors: SchemaValidationError[];
    warnings: SchemaValidationError[];
    missingRequired: string[];
    unknownFields: string[];
    typeErrors: SchemaValidationError[];
}

/**
 * Individual validation error
 */
export interface SchemaValidationError {
    path: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
    expectedType?: FieldType;
    actualType?: string;
    expectedValues?: string[];
    actualValue?: any;
    suggestion?: string;
}

// ==========================================
// FIELD PATH UTILITIES
// ==========================================

/**
 * Represents a path to a field in a resource
 */
export type FieldPath = string[];

/**
 * Join path segments into dot-separated string
 */
export function joinPath(path: FieldPath): string {
    return path.join('.');
}

/**
 * Split dot-separated path into segments
 */
export function splitPath(path: string): FieldPath {
    return path.split('.');
}

/**
 * Get parent path
 */
export function getParentPath(path: FieldPath): FieldPath {
    return path.slice(0, -1);
}

/**
 * Get field name from path
 */
export function getFieldName(path: FieldPath): string {
    return path[path.length - 1] || '';
}

// ==========================================
// COMMON FIELD TEMPLATES
// ==========================================

/**
 * Common metadata fields
 */
export const METADATA_FIELDS: Record<string, FieldDefinition> = {
    name: {
        type: 'string',
        required: true,
        pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$',
        maxLength: 253,
        description: 'Name must be unique within a namespace'
    },
    namespace: {
        type: 'string',
        pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$',
        maxLength: 63,
        description: 'Namespace defines the space within which name must be unique'
    },
    generateName: {
        type: 'string',
        pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$',
        description: 'Prefix for generating a unique name'
    },
    labels: {
        type: 'map',
        additionalProperties: { type: 'string' },
        description: 'Map of string keys and values for organizing resources'
    },
    annotations: {
        type: 'map',
        additionalProperties: { type: 'string' },
        description: 'Map of string keys and values for storing arbitrary metadata'
    },
    uid: {
        type: 'string',
        description: 'Unique identifier assigned by the system'
    },
    resourceVersion: {
        type: 'string',
        description: 'Version of the resource for optimistic concurrency'
    },
    generation: {
        type: 'integer',
        description: 'Sequence number representing a specific generation'
    },
    creationTimestamp: {
        type: 'string',
        description: 'Timestamp of when the resource was created'
    },
    deletionTimestamp: {
        type: 'string',
        description: 'Timestamp of when the resource will be deleted'
    },
    finalizers: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of finalizers that must be empty before deletion'
    },
    ownerReferences: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                apiVersion: { type: 'string', required: true },
                kind: { type: 'string', required: true },
                name: { type: 'string', required: true },
                uid: { type: 'string', required: true },
                controller: { type: 'boolean' },
                blockOwnerDeletion: { type: 'boolean' }
            }
        }
    }
};

/**
 * Common container fields
 */
export const CONTAINER_FIELDS: Record<string, FieldDefinition> = {
    name: {
        type: 'string',
        required: true,
        pattern: '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$',
        description: 'Name of the container'
    },
    image: {
        type: 'string',
        required: true,
        description: 'Container image name'
    },
    imagePullPolicy: {
        type: 'string',
        enum: ['Always', 'Never', 'IfNotPresent'],
        default: 'IfNotPresent',
        description: 'Image pull policy'
    },
    command: {
        type: 'array',
        items: { type: 'string' },
        description: 'Entrypoint array'
    },
    args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments to the entrypoint'
    },
    workingDir: {
        type: 'string',
        description: 'Container working directory'
    },
    ports: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                containerPort: { type: 'integer', required: true, min: 1, max: 65535 },
                hostPort: { type: 'integer', min: 1, max: 65535 },
                protocol: { type: 'string', enum: ['TCP', 'UDP', 'SCTP'], default: 'TCP' },
                hostIP: { type: 'string' }
            }
        }
    },
    env: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string', required: true },
                value: { type: 'string' },
                valueFrom: {
                    type: 'object',
                    properties: {
                        configMapKeyRef: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', required: true },
                                key: { type: 'string', required: true },
                                optional: { type: 'boolean' }
                            }
                        },
                        secretKeyRef: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', required: true },
                                key: { type: 'string', required: true },
                                optional: { type: 'boolean' }
                            }
                        },
                        fieldRef: {
                            type: 'object',
                            properties: {
                                apiVersion: { type: 'string' },
                                fieldPath: { type: 'string', required: true }
                            }
                        },
                        resourceFieldRef: {
                            type: 'object',
                            properties: {
                                containerName: { type: 'string' },
                                resource: { type: 'string', required: true },
                                divisor: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    },
    envFrom: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                prefix: { type: 'string' },
                configMapRef: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', required: true },
                        optional: { type: 'boolean' }
                    }
                },
                secretRef: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', required: true },
                        optional: { type: 'boolean' }
                    }
                }
            }
        }
    },
    resources: {
        type: 'object',
        properties: {
            limits: {
                type: 'map',
                additionalProperties: { type: 'string' },
                description: 'Maximum resource limits'
            },
            requests: {
                type: 'map',
                additionalProperties: { type: 'string' },
                description: 'Minimum resource requests'
            }
        }
    },
    volumeMounts: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string', required: true },
                mountPath: { type: 'string', required: true },
                subPath: { type: 'string' },
                readOnly: { type: 'boolean', default: false },
                mountPropagation: { type: 'string', enum: ['None', 'HostToContainer', 'Bidirectional'] }
            }
        }
    },
    livenessProbe: { type: 'object', properties: {} }, // Will be defined with PROBE_FIELDS
    readinessProbe: { type: 'object', properties: {} },
    startupProbe: { type: 'object', properties: {} },
    lifecycle: {
        type: 'object',
        properties: {
            postStart: { type: 'object', properties: {} },
            preStop: { type: 'object', properties: {} }
        }
    },
    terminationMessagePath: { type: 'string', default: '/dev/termination-log' },
    terminationMessagePolicy: { type: 'string', enum: ['File', 'FallbackToLogsOnError'], default: 'File' },
    securityContext: {
        type: 'object',
        properties: {
            runAsUser: { type: 'integer' },
            runAsGroup: { type: 'integer' },
            runAsNonRoot: { type: 'boolean' },
            readOnlyRootFilesystem: { type: 'boolean' },
            privileged: { type: 'boolean', default: false },
            allowPrivilegeEscalation: { type: 'boolean' },
            capabilities: {
                type: 'object',
                properties: {
                    add: { type: 'array', items: { type: 'string' } },
                    drop: { type: 'array', items: { type: 'string' } }
                }
            },
            seLinuxOptions: { type: 'object', properties: {} },
            seccompProfile: { type: 'object', properties: {} }
        }
    },
    stdin: { type: 'boolean', default: false },
    stdinOnce: { type: 'boolean', default: false },
    tty: { type: 'boolean', default: false }
};

/**
 * Probe fields (livenessProbe, readinessProbe, startupProbe)
 */
export const PROBE_FIELDS: Record<string, FieldDefinition> = {
    httpGet: {
        type: 'object',
        properties: {
            path: { type: 'string' },
            port: { type: 'any', required: true }, // Can be number or string (named port)
            host: { type: 'string' },
            scheme: { type: 'string', enum: ['HTTP', 'HTTPS'], default: 'HTTP' },
            httpHeaders: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', required: true },
                        value: { type: 'string', required: true }
                    }
                }
            }
        }
    },
    tcpSocket: {
        type: 'object',
        properties: {
            port: { type: 'any', required: true },
            host: { type: 'string' }
        }
    },
    exec: {
        type: 'object',
        properties: {
            command: { type: 'array', items: { type: 'string' } }
        }
    },
    grpc: {
        type: 'object',
        properties: {
            port: { type: 'integer', required: true },
            service: { type: 'string' }
        }
    },
    initialDelaySeconds: { type: 'integer', min: 0, default: 0 },
    periodSeconds: { type: 'integer', min: 1, default: 10 },
    timeoutSeconds: { type: 'integer', min: 1, default: 1 },
    successThreshold: { type: 'integer', min: 1, default: 1 },
    failureThreshold: { type: 'integer', min: 1, default: 3 },
    terminationGracePeriodSeconds: { type: 'integer', min: 0 }
};

/**
 * Volume source fields
 */
export const VOLUME_FIELDS: Record<string, FieldDefinition> = {
    name: { type: 'string', required: true },
    emptyDir: {
        type: 'object',
        properties: {
            medium: { type: 'string', enum: ['', 'Memory'] },
            sizeLimit: { type: 'string' }
        }
    },
    hostPath: {
        type: 'object',
        properties: {
            path: { type: 'string', required: true },
            type: { type: 'string', enum: ['', 'DirectoryOrCreate', 'Directory', 'FileOrCreate', 'File', 'Socket', 'CharDevice', 'BlockDevice'] }
        }
    },
    configMap: {
        type: 'object',
        properties: {
            name: { type: 'string', required: true },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        key: { type: 'string', required: true },
                        path: { type: 'string', required: true },
                        mode: { type: 'integer' }
                    }
                }
            },
            defaultMode: { type: 'integer' },
            optional: { type: 'boolean' }
        }
    },
    secret: {
        type: 'object',
        properties: {
            secretName: { type: 'string', required: true },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        key: { type: 'string', required: true },
                        path: { type: 'string', required: true },
                        mode: { type: 'integer' }
                    }
                }
            },
            defaultMode: { type: 'integer' },
            optional: { type: 'boolean' }
        }
    },
    persistentVolumeClaim: {
        type: 'object',
        properties: {
            claimName: { type: 'string', required: true },
            readOnly: { type: 'boolean', default: false }
        }
    },
    downwardAPI: {
        type: 'object',
        properties: {
            items: { type: 'array', items: { type: 'object', properties: {} } },
            defaultMode: { type: 'integer' }
        }
    },
    projected: {
        type: 'object',
        properties: {
            sources: { type: 'array', items: { type: 'object', properties: {} } },
            defaultMode: { type: 'integer' }
        }
    },
    nfs: {
        type: 'object',
        properties: {
            server: { type: 'string', required: true },
            path: { type: 'string', required: true },
            readOnly: { type: 'boolean', default: false }
        }
    },
    csi: {
        type: 'object',
        properties: {
            driver: { type: 'string', required: true },
            readOnly: { type: 'boolean', default: false },
            fsType: { type: 'string' },
            volumeAttributes: { type: 'map', additionalProperties: { type: 'string' } },
            nodePublishSecretRef: { type: 'object', properties: { name: { type: 'string', required: true } } }
        }
    }
};

/**
 * Pod spec fields (for template.spec in workloads)
 */
export const POD_SPEC_FIELDS: Record<string, FieldDefinition> = {
    containers: {
        type: 'array',
        required: true,
        items: { type: 'object', properties: CONTAINER_FIELDS },
        description: 'List of containers in the pod'
    },
    initContainers: {
        type: 'array',
        items: { type: 'object', properties: CONTAINER_FIELDS },
        description: 'List of initialization containers'
    },
    volumes: {
        type: 'array',
        items: { type: 'object', properties: VOLUME_FIELDS },
        description: 'List of volumes available to containers'
    },
    restartPolicy: {
        type: 'string',
        enum: ['Always', 'OnFailure', 'Never'],
        default: 'Always'
    },
    terminationGracePeriodSeconds: {
        type: 'integer',
        min: 0,
        default: 30
    },
    activeDeadlineSeconds: { type: 'integer', min: 0 },
    dnsPolicy: {
        type: 'string',
        enum: ['ClusterFirst', 'ClusterFirstWithHostNet', 'Default', 'None'],
        default: 'ClusterFirst'
    },
    dnsConfig: {
        type: 'object',
        properties: {
            nameservers: { type: 'array', items: { type: 'string' } },
            searches: { type: 'array', items: { type: 'string' } },
            options: { type: 'array', items: { type: 'object', properties: {} } }
        }
    },
    nodeSelector: {
        type: 'map',
        additionalProperties: { type: 'string' }
    },
    nodeName: { type: 'string' },
    serviceAccountName: { type: 'string' },
    serviceAccount: { type: 'string' }, // Deprecated, use serviceAccountName
    automountServiceAccountToken: { type: 'boolean' },
    hostNetwork: { type: 'boolean', default: false },
    hostPID: { type: 'boolean', default: false },
    hostIPC: { type: 'boolean', default: false },
    shareProcessNamespace: { type: 'boolean', default: false },
    securityContext: {
        type: 'object',
        properties: {
            runAsUser: { type: 'integer' },
            runAsGroup: { type: 'integer' },
            runAsNonRoot: { type: 'boolean' },
            fsGroup: { type: 'integer' },
            fsGroupChangePolicy: { type: 'string', enum: ['Always', 'OnRootMismatch'] },
            supplementalGroups: { type: 'array', items: { type: 'integer' } },
            seLinuxOptions: { type: 'object', properties: {} },
            seccompProfile: { type: 'object', properties: {} },
            sysctls: { type: 'array', items: { type: 'object', properties: {} } }
        }
    },
    imagePullSecrets: {
        type: 'array',
        items: {
            type: 'object',
            properties: { name: { type: 'string', required: true } }
        }
    },
    affinity: {
        type: 'object',
        properties: {
            nodeAffinity: { type: 'object', properties: {} },
            podAffinity: { type: 'object', properties: {} },
            podAntiAffinity: { type: 'object', properties: {} }
        }
    },
    tolerations: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                key: { type: 'string' },
                operator: { type: 'string', enum: ['Exists', 'Equal'], default: 'Equal' },
                value: { type: 'string' },
                effect: { type: 'string', enum: ['NoSchedule', 'PreferNoSchedule', 'NoExecute'] },
                tolerationSeconds: { type: 'integer' }
            }
        }
    },
    priorityClassName: { type: 'string' },
    priority: { type: 'integer' },
    preemptionPolicy: { type: 'string', enum: ['Never', 'PreemptLowerPriority'] },
    topologySpreadConstraints: {
        type: 'array',
        items: { type: 'object', properties: {} }
    },
    hostname: { type: 'string' },
    subdomain: { type: 'string' },
    schedulerName: { type: 'string', default: 'default-scheduler' },
    runtimeClassName: { type: 'string' },
    enableServiceLinks: { type: 'boolean', default: true },
    overhead: { type: 'map', additionalProperties: { type: 'string' } },
    readinessGates: { type: 'array', items: { type: 'object', properties: {} } },
    setHostnameAsFQDN: { type: 'boolean' }
};

/**
 * Label selector fields
 */
export const LABEL_SELECTOR_FIELDS: Record<string, FieldDefinition> = {
    matchLabels: {
        type: 'map',
        additionalProperties: { type: 'string' }
    },
    matchExpressions: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                key: { type: 'string', required: true },
                operator: { type: 'string', required: true, enum: ['In', 'NotIn', 'Exists', 'DoesNotExist'] },
                values: { type: 'array', items: { type: 'string' } }
            }
        }
    }
};
