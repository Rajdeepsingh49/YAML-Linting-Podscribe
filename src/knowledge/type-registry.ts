/**
 * Comprehensive Type Registry
 * 
 * Complete type definitions for all Kubernetes fields including:
 * - Field types with constraints (min/max, patterns, enums)
 * - Type coercion rules with confidence scoring
 * - Word-to-number mapping
 * - Boolean string conversions
 * - Base64 validation
 */

// ==========================================
// TYPES
// ==========================================

export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'map' | 'any';

export interface FieldTypeDefinition {
    type: FieldType;
    required?: boolean;

    // Numeric constraints
    min?: number;
    max?: number;

    // String constraints
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;

    // Enum
    enum?: string[];

    // Nested types
    itemType?: FieldType;
    valueType?: FieldType;

    // Default value
    default?: any;

    // Description
    description?: string;

    // Coercion rules
    coercionRules?: CoercionRule[];
}

export interface CoercionRule {
    from: FieldType;
    confidence: number;
    transform: (value: any) => any;
}

export interface CoercionResult {
    success: boolean;
    value: any;
    confidence: number;
    originalType: string;
    targetType: FieldType;
    reason?: string;
}

export interface TypeValidationResult {
    valid: boolean;
    errors: string[];
    coercedValue?: any;
    confidence?: number;
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Complete type definitions for Kubernetes fields
 */
export const TYPE_DEFINITIONS: Record<string, FieldTypeDefinition> = {
    // ==========================================
    // NUMERIC FIELDS
    // ==========================================

    replicas: {
        type: 'integer',
        min: 0,
        default: 1,
        description: 'Number of desired pod replicas'
    },
    port: {
        type: 'integer',
        min: 1,
        max: 65535,
        description: 'Port number'
    },
    containerPort: {
        type: 'integer',
        min: 1,
        max: 65535,
        description: 'Container port to expose'
    },
    targetPort: {
        type: 'any', // Can be number or named port string
        description: 'Target port on the pod'
    },
    hostPort: {
        type: 'integer',
        min: 1,
        max: 65535,
        description: 'Host port to bind'
    },
    nodePort: {
        type: 'integer',
        min: 30000,
        max: 32767,
        description: 'NodePort service port'
    },
    initialDelaySeconds: {
        type: 'integer',
        min: 0,
        default: 0,
        description: 'Seconds to wait before starting probes'
    },
    periodSeconds: {
        type: 'integer',
        min: 1,
        default: 10,
        description: 'How often to perform the probe'
    },
    timeoutSeconds: {
        type: 'integer',
        min: 1,
        default: 1,
        description: 'Probe timeout in seconds'
    },
    successThreshold: {
        type: 'integer',
        min: 1,
        default: 1,
        description: 'Minimum consecutive successes'
    },
    failureThreshold: {
        type: 'integer',
        min: 1,
        default: 3,
        description: 'Minimum consecutive failures'
    },
    terminationGracePeriodSeconds: {
        type: 'integer',
        min: 0,
        default: 30,
        description: 'Grace period for termination'
    },
    activeDeadlineSeconds: {
        type: 'integer',
        min: 0,
        description: 'Active deadline for job/pod'
    },
    ttlSecondsAfterFinished: {
        type: 'integer',
        min: 0,
        description: 'TTL for finished jobs'
    },
    backoffLimit: {
        type: 'integer',
        min: 0,
        default: 6,
        description: 'Number of retries for job'
    },
    parallelism: {
        type: 'integer',
        min: 0,
        default: 1,
        description: 'Max parallel pods for job'
    },
    completions: {
        type: 'integer',
        min: 0,
        description: 'Desired number of completions'
    },
    minReadySeconds: {
        type: 'integer',
        min: 0,
        default: 0,
        description: 'Minimum seconds for a pod to be ready'
    },
    revisionHistoryLimit: {
        type: 'integer',
        min: 0,
        default: 10,
        description: 'Number of old replicasets to keep'
    },
    progressDeadlineSeconds: {
        type: 'integer',
        min: 0,
        default: 600,
        description: 'Progress deadline for deployment'
    },
    minReplicas: {
        type: 'integer',
        min: 1,
        default: 1,
        description: 'Minimum replicas for HPA'
    },
    maxReplicas: {
        type: 'integer',
        min: 1,
        description: 'Maximum replicas for HPA'
    },
    runAsUser: {
        type: 'integer',
        min: 0,
        description: 'UID to run container as'
    },
    runAsGroup: {
        type: 'integer',
        min: 0,
        description: 'GID to run container as'
    },
    fsGroup: {
        type: 'integer',
        min: 0,
        description: 'Filesystem group ID'
    },
    defaultMode: {
        type: 'integer',
        min: 0,
        max: 511, // 0777 in octal
        description: 'Default file mode'
    },
    mode: {
        type: 'integer',
        min: 0,
        max: 511,
        description: 'File mode'
    },
    successfulJobsHistoryLimit: {
        type: 'integer',
        min: 0,
        default: 3,
        description: 'Successful job history to keep'
    },
    failedJobsHistoryLimit: {
        type: 'integer',
        min: 0,
        default: 1,
        description: 'Failed job history to keep'
    },
    startingDeadlineSeconds: {
        type: 'integer',
        min: 0,
        description: 'Deadline for starting a job'
    },

    // ==========================================
    // BOOLEAN FIELDS
    // ==========================================

    hostNetwork: {
        type: 'boolean',
        default: false,
        description: 'Use host network namespace'
    },
    hostPID: {
        type: 'boolean',
        default: false,
        description: 'Use host PID namespace'
    },
    hostIPC: {
        type: 'boolean',
        default: false,
        description: 'Use host IPC namespace'
    },
    privileged: {
        type: 'boolean',
        default: false,
        description: 'Run container in privileged mode'
    },
    readOnlyRootFilesystem: {
        type: 'boolean',
        default: false,
        description: 'Mount root filesystem as read-only'
    },
    runAsNonRoot: {
        type: 'boolean',
        description: 'Must run as non-root user'
    },
    allowPrivilegeEscalation: {
        type: 'boolean',
        default: true,
        description: 'Allow privilege escalation'
    },
    readOnly: {
        type: 'boolean',
        default: false,
        description: 'Mount as read-only'
    },
    optional: {
        type: 'boolean',
        description: 'Whether the reference is optional'
    },
    automountServiceAccountToken: {
        type: 'boolean',
        description: 'Auto-mount service account token'
    },
    shareProcessNamespace: {
        type: 'boolean',
        default: false,
        description: 'Share process namespace'
    },
    suspend: {
        type: 'boolean',
        default: false,
        description: 'Suspend execution'
    },
    immutable: {
        type: 'boolean',
        description: 'Make resource immutable'
    },
    publishNotReadyAddresses: {
        type: 'boolean',
        description: 'Publish not-ready addresses'
    },
    enableServiceLinks: {
        type: 'boolean',
        default: true,
        description: 'Enable service environment variables'
    },
    stdin: {
        type: 'boolean',
        default: false,
        description: 'Allocate stdin buffer'
    },
    stdinOnce: {
        type: 'boolean',
        default: false,
        description: 'Close stdin after first attach'
    },
    tty: {
        type: 'boolean',
        default: false,
        description: 'Allocate TTY'
    },
    paused: {
        type: 'boolean',
        default: false,
        description: 'Pause deployment'
    },

    // ==========================================
    // STRING FIELDS WITH ENUMS
    // ==========================================

    imagePullPolicy: {
        type: 'string',
        enum: ['Always', 'Never', 'IfNotPresent'],
        default: 'IfNotPresent',
        description: 'Image pull policy'
    },
    restartPolicy: {
        type: 'string',
        enum: ['Always', 'OnFailure', 'Never'],
        default: 'Always',
        description: 'Pod restart policy'
    },
    protocol: {
        type: 'string',
        enum: ['TCP', 'UDP', 'SCTP'],
        default: 'TCP',
        description: 'Network protocol'
    },
    serviceType: {
        type: 'string',
        enum: ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'],
        default: 'ClusterIP',
        description: 'Service type'
    },
    sessionAffinity: {
        type: 'string',
        enum: ['None', 'ClientIP'],
        default: 'None',
        description: 'Session affinity'
    },
    dnsPolicy: {
        type: 'string',
        enum: ['ClusterFirst', 'ClusterFirstWithHostNet', 'Default', 'None'],
        default: 'ClusterFirst',
        description: 'DNS policy'
    },
    concurrencyPolicy: {
        type: 'string',
        enum: ['Allow', 'Forbid', 'Replace'],
        default: 'Allow',
        description: 'CronJob concurrency policy'
    },
    podManagementPolicy: {
        type: 'string',
        enum: ['OrderedReady', 'Parallel'],
        default: 'OrderedReady',
        description: 'StatefulSet pod management'
    },
    pathType: {
        type: 'string',
        enum: ['Exact', 'Prefix', 'ImplementationSpecific'],
        description: 'Ingress path type'
    },
    accessMode: {
        type: 'string',
        enum: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany', 'ReadWriteOncePod'],
        description: 'Volume access mode'
    },
    volumeMode: {
        type: 'string',
        enum: ['Filesystem', 'Block'],
        default: 'Filesystem',
        description: 'Volume mode'
    },
    reclaimPolicy: {
        type: 'string',
        enum: ['Retain', 'Recycle', 'Delete'],
        default: 'Retain',
        description: 'PV reclaim policy'
    },
    volumeBindingMode: {
        type: 'string',
        enum: ['Immediate', 'WaitForFirstConsumer'],
        default: 'Immediate',
        description: 'Storage class binding mode'
    },
    scheme: {
        type: 'string',
        enum: ['HTTP', 'HTTPS'],
        default: 'HTTP',
        description: 'HTTP scheme'
    },
    operator: {
        type: 'string',
        enum: ['In', 'NotIn', 'Exists', 'DoesNotExist', 'Gt', 'Lt', 'Equal'],
        description: 'Label selector operator'
    },
    effect: {
        type: 'string',
        enum: ['NoSchedule', 'PreferNoSchedule', 'NoExecute'],
        description: 'Taint/toleration effect'
    },
    secretType: {
        type: 'string',
        enum: [
            'Opaque',
            'kubernetes.io/service-account-token',
            'kubernetes.io/dockercfg',
            'kubernetes.io/dockerconfigjson',
            'kubernetes.io/basic-auth',
            'kubernetes.io/ssh-auth',
            'kubernetes.io/tls',
            'bootstrap.kubernetes.io/token'
        ],
        default: 'Opaque',
        description: 'Secret type'
    },

    // ==========================================
    // STRING FIELDS WITH PATTERNS
    // ==========================================

    name: {
        type: 'string',
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        maxLength: 253,
        description: 'Resource name (DNS subdomain)'
    },
    namespace: {
        type: 'string',
        pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
        maxLength: 63,
        description: 'Namespace name'
    },
    image: {
        type: 'string',
        description: 'Container image reference'
    },
    schedule: {
        type: 'string',
        pattern: /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/,
        description: 'Cron schedule expression'
    },
    mountPath: {
        type: 'string',
        pattern: /^\/.*/,
        description: 'Volume mount path'
    },
    path: {
        type: 'string',
        description: 'File or URL path'
    },
    clusterIP: {
        type: 'string',
        pattern: /^((None)|(\d{1,3}\.){3}\d{1,3})$/,
        description: 'Cluster IP address'
    },

    // ==========================================
    // OBJECT FIELDS
    // ==========================================

    metadata: {
        type: 'object',
        required: true,
        description: 'Resource metadata'
    },
    spec: {
        type: 'object',
        required: true,
        description: 'Resource specification'
    },
    status: {
        type: 'object',
        description: 'Resource status'
    },
    selector: {
        type: 'object',
        description: 'Label selector'
    },
    matchLabels: {
        type: 'map',
        valueType: 'string',
        description: 'Label match criteria'
    },
    labels: {
        type: 'map',
        valueType: 'string',
        description: 'Resource labels'
    },
    annotations: {
        type: 'map',
        valueType: 'string',
        description: 'Resource annotations'
    },
    nodeSelector: {
        type: 'map',
        valueType: 'string',
        description: 'Node selection criteria'
    },
    resources: {
        type: 'object',
        description: 'Container resources'
    },
    limits: {
        type: 'map',
        valueType: 'string',
        description: 'Resource limits'
    },
    requests: {
        type: 'map',
        valueType: 'string',
        description: 'Resource requests'
    },
    securityContext: {
        type: 'object',
        description: 'Security context'
    },
    affinity: {
        type: 'object',
        description: 'Affinity rules'
    },
    data: {
        type: 'map',
        valueType: 'string',
        description: 'ConfigMap/Secret data'
    },
    stringData: {
        type: 'map',
        valueType: 'string',
        description: 'Plain text secret data'
    },

    // ==========================================
    // ARRAY FIELDS
    // ==========================================

    containers: {
        type: 'array',
        itemType: 'object',
        required: true,
        description: 'Container specifications'
    },
    initContainers: {
        type: 'array',
        itemType: 'object',
        description: 'Init container specifications'
    },
    volumes: {
        type: 'array',
        itemType: 'object',
        description: 'Volume specifications'
    },
    volumeMounts: {
        type: 'array',
        itemType: 'object',
        description: 'Volume mount specifications'
    },
    ports: {
        type: 'array',
        itemType: 'object',
        description: 'Port specifications'
    },
    env: {
        type: 'array',
        itemType: 'object',
        description: 'Environment variables'
    },
    envFrom: {
        type: 'array',
        itemType: 'object',
        description: 'Environment source references'
    },
    command: {
        type: 'array',
        itemType: 'string',
        description: 'Container entrypoint'
    },
    args: {
        type: 'array',
        itemType: 'string',
        description: 'Container arguments'
    },
    tolerations: {
        type: 'array',
        itemType: 'object',
        description: 'Tolerations'
    },
    rules: {
        type: 'array',
        itemType: 'object',
        description: 'Rules (Ingress/RBAC)'
    },
    subjects: {
        type: 'array',
        itemType: 'object',
        description: 'RBAC subjects'
    },
    accessModes: {
        type: 'array',
        itemType: 'string',
        description: 'PVC access modes'
    },
    imagePullSecrets: {
        type: 'array',
        itemType: 'object',
        description: 'Image pull secret references'
    },
    finalizers: {
        type: 'array',
        itemType: 'string',
        description: 'Finalizers'
    }
};

// ==========================================
// WORD TO NUMBER MAPPING
// ==========================================

export const WORD_TO_NUMBER: Record<string, number> = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
    'hundred': 100,
    'thousand': 1000
};

// ==========================================
// BOOLEAN STRING MAPPING
// ==========================================

export const BOOLEAN_STRINGS: Record<string, boolean> = {
    // True values
    'true': true,
    'yes': true,
    'on': true,
    '1': true,
    'enabled': true,
    'enable': true,
    'active': true,

    // False values
    'false': false,
    'no': false,
    'off': false,
    '0': false,
    'disabled': false,
    'disable': false,
    'inactive': false
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get type definition for a field
 */
export function getTypeDefinition(fieldName: string): FieldTypeDefinition | undefined {
    return TYPE_DEFINITIONS[fieldName];
}

/**
 * Get expected type for a field
 */
export function getExpectedType(fieldName: string): FieldType | undefined {
    return TYPE_DEFINITIONS[fieldName]?.type;
}

/**
 * Check if a field expects a numeric value
 */
export function isNumericField(fieldName: string): boolean {
    const def = TYPE_DEFINITIONS[fieldName];
    return def?.type === 'integer' || def?.type === 'number';
}

/**
 * Check if a field expects a boolean value
 */
export function isBooleanField(fieldName: string): boolean {
    return TYPE_DEFINITIONS[fieldName]?.type === 'boolean';
}

/**
 * Check if value matches expected type
 */
export function matchesExpectedType(fieldName: string, value: any): boolean {
    const def = TYPE_DEFINITIONS[fieldName];
    if (!def) return true; // Unknown field, assume valid

    const valueType = typeof value;

    switch (def.type) {
        case 'integer':
        case 'number':
            return valueType === 'number' && !isNaN(value);
        case 'boolean':
            return valueType === 'boolean';
        case 'string':
            return valueType === 'string';
        case 'object':
        case 'map':
            return valueType === 'object' && value !== null && !Array.isArray(value);
        case 'array':
            return Array.isArray(value);
        case 'any':
            return true;
        default:
            return true;
    }
}

/**
 * Coerce a value to the expected type with confidence scoring
 */
export function coerceValue(fieldName: string, value: any): CoercionResult {
    const def = TYPE_DEFINITIONS[fieldName];
    const originalType = typeof value;

    // No definition, return as-is
    if (!def) {
        return {
            success: true,
            value,
            confidence: 1.0,
            originalType,
            targetType: 'any'
        };
    }

    // Already correct type
    if (matchesExpectedType(fieldName, value)) {
        return {
            success: true,
            value,
            confidence: 1.0,
            originalType,
            targetType: def.type
        };
    }

    // Attempt coercion
    switch (def.type) {
        case 'integer':
        case 'number':
            return coerceToNumber(value, def);
        case 'boolean':
            return coerceToBoolean(value);
        case 'string':
            return coerceToString(value);
        default:
            return {
                success: false,
                value,
                confidence: 0,
                originalType,
                targetType: def.type,
                reason: `Cannot coerce ${originalType} to ${def.type}`
            };
    }
}

/**
 * Coerce value to number
 */
function coerceToNumber(value: any, def: FieldTypeDefinition): CoercionResult {
    const originalType = typeof value;
    let result: number | null = null;
    let confidence = 0;

    // String to number
    if (typeof value === 'string') {
        const trimmed = value.trim();

        // Quoted number
        if (/^["'](-?\d+)["']$/.test(trimmed)) {
            result = parseInt(trimmed.replace(/["']/g, ''), 10);
            confidence = 0.95;
        }
        // Plain number string
        else if (/^-?\d+$/.test(trimmed)) {
            result = parseInt(trimmed, 10);
            confidence = 0.95;
        }
        // Float
        else if (/^-?\d*\.\d+$/.test(trimmed)) {
            result = parseFloat(trimmed);
            confidence = 0.90;
        }
        // Word to number
        else if (WORD_TO_NUMBER[trimmed.toLowerCase()] !== undefined) {
            result = WORD_TO_NUMBER[trimmed.toLowerCase()];
            confidence = 0.85;
        }
    }
    // Boolean to number
    else if (typeof value === 'boolean') {
        result = value ? 1 : 0;
        confidence = 0.70;
    }

    if (result !== null && !isNaN(result)) {
        // Validate constraints
        if (def.min !== undefined && result < def.min) {
            return {
                success: false,
                value,
                confidence: 0,
                originalType,
                targetType: def.type,
                reason: `Value ${result} is below minimum ${def.min}`
            };
        }
        if (def.max !== undefined && result > def.max) {
            return {
                success: false,
                value,
                confidence: 0,
                originalType,
                targetType: def.type,
                reason: `Value ${result} is above maximum ${def.max}`
            };
        }

        return {
            success: true,
            value: def.type === 'integer' ? Math.floor(result) : result,
            confidence,
            originalType,
            targetType: def.type
        };
    }

    return {
        success: false,
        value,
        confidence: 0,
        originalType,
        targetType: def.type,
        reason: `Cannot convert "${value}" to number`
    };
}

/**
 * Coerce value to boolean
 */
function coerceToBoolean(value: any): CoercionResult {
    const originalType = typeof value;

    // String to boolean
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();

        // Remove quotes
        const unquoted = lower.replace(/^["']|["']$/g, '');

        if (BOOLEAN_STRINGS[unquoted] !== undefined) {
            return {
                success: true,
                value: BOOLEAN_STRINGS[unquoted],
                confidence: 0.90,
                originalType,
                targetType: 'boolean'
            };
        }
    }

    // Number to boolean
    if (typeof value === 'number') {
        return {
            success: true,
            value: value !== 0,
            confidence: 0.75,
            originalType,
            targetType: 'boolean'
        };
    }

    return {
        success: false,
        value,
        confidence: 0,
        originalType,
        targetType: 'boolean',
        reason: `Cannot convert "${value}" to boolean`
    };
}

/**
 * Coerce value to string
 */
function coerceToString(value: any): CoercionResult {
    const originalType = typeof value;

    if (value === null || value === undefined) {
        return {
            success: true,
            value: '',
            confidence: 0.80,
            originalType,
            targetType: 'string'
        };
    }

    // Number/boolean to string
    if (typeof value === 'number' || typeof value === 'boolean') {
        return {
            success: true,
            value: String(value),
            confidence: 0.95,
            originalType,
            targetType: 'string'
        };
    }

    return {
        success: false,
        value,
        confidence: 0,
        originalType,
        targetType: 'string',
        reason: `Cannot convert ${originalType} to string`
    };
}

/**
 * Validate a value against field definition
 */
export function validateFieldValue(fieldName: string, value: any): TypeValidationResult {
    const def = TYPE_DEFINITIONS[fieldName];
    const errors: string[] = [];

    if (!def) {
        return { valid: true, errors: [] };
    }

    // Type check
    if (!matchesExpectedType(fieldName, value)) {
        // Try coercion
        const coerced = coerceValue(fieldName, value);
        if (coerced.success && coerced.confidence >= 0.7) {
            return {
                valid: true,
                errors: [],
                coercedValue: coerced.value,
                confidence: coerced.confidence
            };
        }
        errors.push(`Expected ${def.type}, got ${typeof value}`);
    }

    // Additional validations for specific types
    if (def.type === 'string' && typeof value === 'string') {
        if (def.pattern && !def.pattern.test(value)) {
            errors.push(`Value does not match pattern ${def.pattern}`);
        }
        if (def.minLength !== undefined && value.length < def.minLength) {
            errors.push(`Value is shorter than minimum length ${def.minLength}`);
        }
        if (def.maxLength !== undefined && value.length > def.maxLength) {
            errors.push(`Value is longer than maximum length ${def.maxLength}`);
        }
        if (def.enum && !def.enum.includes(value)) {
            errors.push(`Value must be one of: ${def.enum.join(', ')}`);
        }
    }

    if ((def.type === 'integer' || def.type === 'number') && typeof value === 'number') {
        if (def.min !== undefined && value < def.min) {
            errors.push(`Value ${value} is below minimum ${def.min}`);
        }
        if (def.max !== undefined && value > def.max) {
            errors.push(`Value ${value} is above maximum ${def.max}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate base64 encoding (for Secret data)
 */
export function isValidBase64(value: string): boolean {
    if (typeof value !== 'string') return false;

    // Base64 regex
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(value)) return false;

    // Length must be multiple of 4
    if (value.length % 4 !== 0) return false;

    // Try to decode
    try {
        if (typeof atob !== 'undefined') {
            atob(value);
        } else {
            Buffer.from(value, 'base64');
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Get enum values for a field
 */
export function getEnumValues(fieldName: string): string[] | undefined {
    return TYPE_DEFINITIONS[fieldName]?.enum;
}

/**
 * Get default value for a field
 */
export function getDefaultValue(fieldName: string): any {
    return TYPE_DEFINITIONS[fieldName]?.default;
}

/**
 * Check if a field is required
 */
export function isRequiredField(fieldName: string): boolean {
    return TYPE_DEFINITIONS[fieldName]?.required === true;
}
