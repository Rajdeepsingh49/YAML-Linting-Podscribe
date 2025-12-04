/**
 * Comprehensive YAML Fixer Test Suite
 * 
 * 50+ test cases covering:
 * - Syntax normalization (colons, spaces, indentation, quotes)
 * - Structure reorganization (field relocation, nesting)
 * - Type coercion (word-to-number, boolean conversion)
 * - All major Kubernetes resource types
 * - Edge cases (empty files, comments, multi-document)
 * - Performance tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as yaml from 'js-yaml';
import { MultiPassFixer, fixYamlContent } from '../src/semantic/intelligent-fixer';
import { StructureReorganizer, reorganizeDocument } from '../src/fixers/structure-reorganizer';
import { coerceValue, validateFieldValue, isNumericField, isBooleanField } from '../src/knowledge/type-registry';
import { ASTBuilder } from '../src/parser/ast-builder';
import { getSchema, isKnownKind, getAllKinds } from '../src/schema/k8s-schemas';
import { ErrorReporter } from '../src/reporting/error-reporter';

// ==========================================
// TEST UTILITIES
// ==========================================

/**
 * Check if YAML is valid by attempting to parse it
 */
function isValidYaml(content: string): boolean {
    try {
        yaml.loadAll(content);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse YAML and return first document
 */
function parseYaml(content: string): any {
    const docs = yaml.loadAll(content);
    return docs[0];
}

// ==========================================
// SYNTAX NORMALIZATION TESTS
// ==========================================

describe('Pass 1: Syntax Normalization', () => {
    let fixer: MultiPassFixer;

    beforeEach(() => {
        fixer = new MultiPassFixer();
    });

    describe('Missing Colons', () => {
        it('should fix missing colon after apiVersion', async () => {
            const input = `apiVersion apps/v1
kind: Deployment
metadata:
  name: test`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('apiVersion: apps/v1');
            expect(result.changes.some(c => c.reason.includes('colon'))).toBe(true);
        });

        it('should fix missing colon after known Kubernetes keys', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
  name test-pod
spec:
  containers:
    - name: test
      image nginx`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('name: test-pod');
            expect(result.content).toContain('image: nginx');
        });

        it('should handle multiple missing colons in one file', async () => {
            const input = `apiVersion v1
kind Pod
metadata
  name test`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('apiVersion: v1');
            expect(result.content).toContain('kind: Pod');
        });
    });

    describe('Missing Spaces After Colons', () => {
        it('should add space after colon when missing', async () => {
            const input = `apiVersion:v1
kind:Pod
metadata:
  name:test`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('apiVersion: v1');
            expect(result.content).toContain('kind: Pod');
            expect(result.content).toContain('name: test');
        });

        it('should not break URL values', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
  annotations:
    url: http://example.com`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('http://example.com');
        });
    });

    describe('Indentation Normalization', () => {
        it('should convert tabs to 2 spaces', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
\tname: test`;

            const result = await fixer.fix(input);
            expect(result.content).not.toContain('\t');
            expect(result.content).toContain('  name: test');
        });

        it('should normalize odd indentation to 2-space increments', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
   name: test`;

            const result = await fixer.fix(input);
            // Should normalize to 2 or 4 spaces
            const parsed = parseYaml(result.content);
            expect(parsed.metadata.name).toBe('test');
        });
    });

    describe('List Dash Spacing', () => {
        it('should add space after list dash', async () => {
            const input = `apiVersion: v1
kind: Pod
spec:
  containers:
    -name: test
      image: nginx`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('- name: test');
        });
    });

    describe('Unclosed Quotes', () => {
        it('should close unclosed single quotes', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: 'test-pod`;

            const result = await fixer.fix(input);
            // Should close the quote
            expect(isValidYaml(result.content)).toBe(true);
        });

        it('should close unclosed double quotes', async () => {
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: "test-pod`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('Typo Corrections', () => {
        it('should fix common typos in field names', async () => {
            const input = `apiversion: v1
kind: Pod
metdata:
  name: test
sepc:
  contianers:
    - name: test
      imge: nginx`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('apiVersion:');
            expect(result.content).toContain('metadata:');
            expect(result.content).toContain('spec:');
            expect(result.content).toContain('containers:');
            expect(result.content).toContain('image:');
        });
    });
});

// ==========================================
// TYPE COERCION TESTS
// ==========================================

describe('Pass 3: Type Coercion', () => {
    describe('Numeric Field Coercion', () => {
        it('should coerce quoted numbers to integers', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test
spec:
  replicas: "3"
  selector:
    matchLabels:
      app: test
  template:
    spec:
      containers:
        - name: test
          image: nginx`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            expect(parsed.spec.replicas).toBe(3);
        });

        it('should coerce word numbers to integers', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test
spec:
  replicas: three
  selector:
    matchLabels:
      app: test
  template:
    spec:
      containers:
        - name: test
          image: nginx`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            expect(parsed.spec.replicas).toBe(3);
        });

        it('should coerce probe timing values', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  containers:
    - name: test
      image: nginx
      livenessProbe:
        httpGet:
          path: /health
          port: "8080"
        initialDelaySeconds: "30"
        periodSeconds: "10"`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            const probe = parsed.spec.containers[0].livenessProbe;
            expect(probe.initialDelaySeconds).toBe(30);
            expect(probe.periodSeconds).toBe(10);
        });
    });

    describe('Boolean Field Coercion', () => {
        it('should coerce "yes" to true', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  hostNetwork: yes
  containers:
    - name: test
      image: nginx`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            expect(parsed.spec.hostNetwork).toBe(true);
        });

        it('should coerce "no" to false', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  hostPID: no
  containers:
    - name: test
      image: nginx`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            expect(parsed.spec.hostPID).toBe(false);
        });

        it('should coerce "on/off" to boolean', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  containers:
    - name: test
      image: nginx
      stdin: on
      tty: off`;

            const result = await fixer.fix(input);
            const parsed = parseYaml(result.content);
            expect(parsed.spec.containers[0].stdin).toBe(true);
            expect(parsed.spec.containers[0].tty).toBe(false);
        });
    });

    describe('Type Registry', () => {
        it('should identify numeric fields correctly', () => {
            expect(isNumericField('replicas')).toBe(true);
            expect(isNumericField('containerPort')).toBe(true);
            expect(isNumericField('initialDelaySeconds')).toBe(true);
            expect(isNumericField('name')).toBe(false);
        });

        it('should identify boolean fields correctly', () => {
            expect(isBooleanField('hostNetwork')).toBe(true);
            expect(isBooleanField('privileged')).toBe(true);
            expect(isBooleanField('readOnly')).toBe(true);
            expect(isBooleanField('image')).toBe(false);
        });

        it('should coerce values with confidence scoring', () => {
            const result = coerceValue('replicas', '3');
            expect(result.success).toBe(true);
            expect(result.value).toBe(3);
            expect(result.confidence).toBeGreaterThan(0.9);
        });

        it('should validate field values', () => {
            const validResult = validateFieldValue('containerPort', 8080);
            expect(validResult.valid).toBe(true);

            const invalidResult = validateFieldValue('containerPort', 99999);
            expect(invalidResult.valid).toBe(false);
        });
    });
});

// ==========================================
// STRUCTURE REORGANIZATION TESTS
// ==========================================

describe('Structure Reorganization', () => {
    describe('Field Relocation', () => {
        it('should relocate labels from root to metadata', () => {
            const doc = {
                apiVersion: 'v1',
                kind: 'Pod',
                labels: { app: 'test' },
                metadata: { name: 'test-pod' },
                spec: { containers: [{ name: 'test', image: 'nginx' }] }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.labels).toBeUndefined();
            expect(result.document.metadata.labels).toEqual({ app: 'test' });
        });

        it('should relocate name from root to metadata', () => {
            const doc = {
                apiVersion: 'v1',
                kind: 'Pod',
                name: 'test-pod',
                metadata: {},
                spec: { containers: [{ name: 'test', image: 'nginx' }] }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.name).toBeUndefined();
            expect(result.document.metadata.name).toBe('test-pod');
        });

        it('should relocate containers from spec to spec.template.spec for Deployment', () => {
            const doc = {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: { name: 'test' },
                spec: {
                    replicas: 1,
                    containers: [{ name: 'test', image: 'nginx' }],
                    selector: { matchLabels: { app: 'test' } }
                }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.spec.containers).toBeUndefined();
            expect(result.document.spec.template.spec.containers).toHaveLength(1);
        });

        it('should create required structure for Deployment', () => {
            const doc = {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                name: 'test',
                replicas: 3
            };

            const result = reorganizeDocument(doc);
            expect(result.document.metadata).toBeDefined();
            expect(result.document.spec).toBeDefined();
            expect(result.document.spec.template).toBeDefined();
            expect(result.document.spec.selector).toBeDefined();
        });
    });

    describe('Workload Resources', () => {
        it('should handle StatefulSet field relocation', () => {
            const doc = {
                apiVersion: 'apps/v1',
                kind: 'StatefulSet',
                metadata: { name: 'test' },
                spec: {
                    serviceName: 'test-svc',
                    nodeSelector: { role: 'db' },
                    selector: { matchLabels: { app: 'test' } }
                }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.spec.template.spec.nodeSelector).toEqual({ role: 'db' });
        });

        it('should handle DaemonSet field relocation', () => {
            const doc = {
                apiVersion: 'apps/v1',
                kind: 'DaemonSet',
                metadata: { name: 'test' },
                spec: {
                    tolerations: [{ key: 'node-role.kubernetes.io/master', effect: 'NoSchedule' }],
                    selector: { matchLabels: { app: 'test' } }
                }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.spec.template.spec.tolerations).toBeDefined();
        });

        it('should handle Job field relocation', () => {
            const doc = {
                apiVersion: 'batch/v1',
                kind: 'Job',
                metadata: { name: 'test' },
                spec: {
                    backoffLimit: 4,
                    restartPolicy: 'Never'
                }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.spec.template.spec.restartPolicy).toBe('Never');
        });

        it('should handle CronJob nested structure', () => {
            const doc = {
                apiVersion: 'batch/v1',
                kind: 'CronJob',
                metadata: { name: 'test' },
                spec: {
                    schedule: '*/5 * * * *',
                    containers: [{ name: 'test', image: 'busybox' }]
                }
            };

            const result = reorganizeDocument(doc);
            expect(result.document.spec.jobTemplate.spec.template.spec.containers).toBeDefined();
        });
    });
});

// ==========================================
// KUBERNETES RESOURCE TYPE TESTS
// ==========================================

describe('Kubernetes Resource Types', () => {
    describe('Schema Registry', () => {
        it('should have schemas for all major resource types', () => {
            const expectedKinds = [
                'Pod', 'Service', 'ConfigMap', 'Secret', 'Namespace',
                'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet',
                'Job', 'CronJob', 'Ingress', 'NetworkPolicy',
                'PersistentVolume', 'PersistentVolumeClaim', 'StorageClass',
                'Role', 'ClusterRole', 'RoleBinding', 'ClusterRoleBinding',
                'HorizontalPodAutoscaler', 'PodDisruptionBudget',
                'ServiceAccount', 'ResourceQuota', 'LimitRange'
            ];

            for (const kind of expectedKinds) {
                expect(isKnownKind(kind)).toBe(true);
                expect(getSchema(kind)).toBeDefined();
            }
        });

        it('should return undefined for unknown kinds', () => {
            expect(isKnownKind('UnknownResource')).toBe(false);
            expect(getSchema('UnknownResource')).toBeUndefined();
        });
    });

    describe('Pod', () => {
        it('should fix broken Pod manifest', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion v1
kind Pod
metadata
  name test-pod
spec
  containers
  - name test
    image nginx
    ports
    - containerPort "80"`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);

            const parsed = parseYaml(result.content);
            expect(parsed.kind).toBe('Pod');
            expect(parsed.spec.containers[0].ports[0].containerPort).toBe(80);
        });
    });

    describe('Service', () => {
        it('should fix broken Service manifest', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Service
metadata:
  name: test-service
spec:
  type ClusterIP
  ports:
    - port "80"
      targetPort: "8080"
  selector:
    app: test`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);

            const parsed = parseYaml(result.content);
            expect(parsed.spec.type).toBe('ClusterIP');
            expect(parsed.spec.ports[0].port).toBe(80);
        });
    });

    describe('ConfigMap and Secret', () => {
        it('should handle ConfigMap correctly', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  key1 value1
  key2: value2`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });

        it('should handle Secret correctly', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Secret
metadata:
  name: test-secret
type: Opaque
data:
  password: cGFzc3dvcmQ=`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('Deployment', () => {
        it('should fix complex broken Deployment', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion apps/v1
kind Deployment
metdata:
  name my-app
  lables:
    app: my-app
sepc:
  replicas "3"
  selectro:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      contianers:
        - name my-app
          imge: nginx:latest
          ports:
            - containerPort "80"
          resurces:
            limits:
              cpu: "500m"
              memory: "128Mi"`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.7);

            const parsed = parseYaml(result.content);
            expect(parsed.kind).toBe('Deployment');
            expect(parsed.spec.replicas).toBe(3);
        });
    });

    describe('Ingress', () => {
        it('should handle Ingress manifest', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: test-ingress
spec
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType Prefix
            backend:
              service:
                name: test-service
                port:
                  number "80"`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('RBAC Resources', () => {
        it('should handle Role manifest', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "watch", "list"]`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });

        it('should handle RoleBinding manifest', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
subjects:
  - kind: User
    name: jane
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });
});

// ==========================================
// MULTI-DOCUMENT TESTS
// ==========================================

describe('Multi-Document Files', () => {
    it('should handle multiple documents separated by ---', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion: v1
kind: ConfigMap
metadata:
  name: config1
data:
  key: value
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: config2
data:
  key: value2`;

        const result = await fixer.fix(input);
        expect(isValidYaml(result.content)).toBe(true);

        const docs = yaml.loadAll(result.content);
        expect(docs).toHaveLength(2);
    });

    it('should fix errors in all documents', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion v1
kind ConfigMap
metadata:
  name: config1
---
apiVersion v1
kind ConfigMap
metadata:
  name: config2`;

        const result = await fixer.fix(input);
        expect(isValidYaml(result.content)).toBe(true);
        expect(result.content).toContain('apiVersion: v1');
    });
});

// ==========================================
// EDGE CASES
// ==========================================

describe('Edge Cases', () => {
    describe('Empty and Minimal Files', () => {
        it('should handle empty file', async () => {
            const fixer = new MultiPassFixer();
            const result = await fixer.fix('');
            expect(result.content).toBe('');
            expect(result.isValid).toBe(true);
        });

        it('should handle file with only comments', async () => {
            const fixer = new MultiPassFixer();
            const input = `# This is a comment
# Another comment`;

            const result = await fixer.fix(input);
            expect(result.content).toContain('#');
        });

        it('should handle file with only document separator', async () => {
            const fixer = new MultiPassFixer();
            const result = await fixer.fix('---');
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('Whitespace Handling', () => {
        it('should handle trailing whitespace', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1   
kind: Pod   
metadata:
  name: test   `;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });

        it('should handle blank lines in document', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod

metadata:

  name: test

spec:
  containers:
    - name: test
      image: nginx`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('Special Characters', () => {
        it('should handle values with special YAML characters', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: ConfigMap
metadata:
  name: special
data:
  message: "Hello: World # test"
  path: /some/path:with:colons`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);
        });
    });

    describe('Complex Nesting', () => {
        it('should handle deeply nested structures', async () => {
            const fixer = new MultiPassFixer();
            const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  containers:
    - name: test
      image: nginx
      env:
        - name: CONFIG
          valueFrom:
            configMapKeyRef:
              name: myconfig
              key: setting`;

            const result = await fixer.fix(input);
            expect(isValidYaml(result.content)).toBe(true);

            const parsed = parseYaml(result.content);
            expect(parsed.spec.containers[0].env[0].valueFrom.configMapKeyRef.name).toBe('myconfig');
        });
    });
});

// ==========================================
// AST BUILDER TESTS
// ==========================================

describe('AST Builder', () => {
    it('should build AST from valid YAML', () => {
        const builder = new ASTBuilder();
        const input = `apiVersion: v1
kind: Pod
metadata:
  name: test`;

        const root = builder.build(input);
        expect(root.documents).toHaveLength(1);
        expect(root.totalLines).toBe(4);
    });

    it('should handle broken YAML gracefully', () => {
        const builder = new ASTBuilder();
        const input = `apiVersion: v1
kind Pod missing colon
metadata:
  name: test`;

        const root = builder.build(input);
        expect(root.documents.length).toBeGreaterThan(0);

        const analysis = ASTBuilder.analyze(root);
        expect(analysis.allDiagnostics.length).toBeGreaterThan(0);
    });

    it('should detect Kubernetes kind from AST', () => {
        const builder = new ASTBuilder();
        const input = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test`;

        const root = builder.build(input);
        const analysis = ASTBuilder.analyze(root);
        expect(analysis.detectedKind).toBe('Deployment');
        expect(analysis.detectedApiVersion).toBe('apps/v1');
    });
});

// ==========================================
// ERROR REPORTER TESTS
// ==========================================

describe('Error Reporter', () => {
    it('should generate summary correctly', () => {
        const reporter = new ErrorReporter();
        reporter.addChange({
            line: 1,
            original: 'apiVersion v1',
            fixed: 'apiVersion: v1',
            reason: 'Added missing colon',
            type: 'syntax',
            confidence: 0.95,
            severity: 'error'
        });
        reporter.addChange({
            line: 2,
            original: 'replicas: "3"',
            fixed: 'replicas: 3',
            reason: 'Converted to number',
            type: 'type',
            confidence: 0.90,
            severity: 'warning'
        });

        const summary = reporter.generateSummary(true);
        expect(summary.totalIssues).toBe(2);
        expect(summary.byCategory.syntax).toBe(1);
        expect(summary.byCategory.type).toBe(1);
        expect(summary.bySeverity.error).toBe(1);
        expect(summary.bySeverity.warning).toBe(1);
    });

    it('should generate diff correctly', () => {
        const reporter = new ErrorReporter();
        const original = 'line1\nline2\nline3';
        const fixed = 'line1\nmodified\nline3';

        const diff = reporter.generateDiff(original, fixed);
        expect(diff.changedLineCount).toBe(1);
        expect(diff.lines[1].type).toBe('modified');
    });

    it('should format report as text', () => {
        const reporter = new ErrorReporter();
        reporter.addChange({
            line: 1,
            original: 'test',
            fixed: 'test: value',
            reason: 'Added colon',
            type: 'syntax',
            confidence: 0.95,
            severity: 'error'
        });

        const text = reporter.formatAsText();
        expect(text).toContain('YAML Validation Report');
        expect(text).toContain('SUMMARY');
        expect(text).toContain('Line 1');
    });
});

// ==========================================
// CONFIDENCE SCORING TESTS
// ==========================================

describe('Confidence Scoring', () => {
    it('should give high confidence to obvious fixes', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion: v1
kind: Pod
metadata:
  name:test`;

        const result = await fixer.fix(input);
        const spaceAfterColon = result.changes.find(c => c.reason.includes('space'));
        if (spaceAfterColon) {
            expect(spaceAfterColon.confidence).toBeGreaterThan(0.9);
        }
    });

    it('should give moderate confidence to type coercion', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: test
spec:
  replicas: three
  selector:
    matchLabels:
      app: test
  template:
    spec:
      containers:
        - name: test
          image: nginx`;

        const result = await fixer.fix(input);
        const coercion = result.changes.find(c => c.type === 'type');
        if (coercion) {
            expect(coercion.confidence).toBeGreaterThanOrEqual(0.8);
            expect(coercion.confidence).toBeLessThan(1.0);
        }
    });

    it('should calculate overall confidence correctly', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion v1
kind Pod
metadata:
  name: test`;

        const result = await fixer.fix(input);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
    });
});

// ==========================================
// PASS BREAKDOWN TESTS
// ==========================================

describe('Pass Breakdown', () => {
    it('should track changes per pass', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion v1
kind Pod
metadata:
  name: test`;

        const result = await fixer.fix(input);
        expect(result.passBreakdown).toHaveLength(5);
        expect(result.passBreakdown[0].name).toBe('Syntax Normalization');
        expect(result.passBreakdown[1].name).toBe('AST Reconstruction');
        expect(result.passBreakdown[2].name).toBe('Semantic Validation');
        expect(result.passBreakdown[3].name).toBe('Validation Iteration');
        expect(result.passBreakdown[4].name).toBe('Confidence Scoring');
    });

    it('should measure duration for each pass', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion: v1
kind: Pod
metadata:
  name: test`;

        const result = await fixer.fix(input);
        for (const pass of result.passBreakdown) {
            expect(pass.duration).toBeGreaterThanOrEqual(0);
        }
    });
});

// ==========================================
// PERFORMANCE TESTS
// ==========================================

describe('Performance', () => {
    it('should process small files quickly (< 100ms)', async () => {
        const fixer = new MultiPassFixer();
        const input = `apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  containers:
    - name: test
      image: nginx`;

        const start = Date.now();
        await fixer.fix(input);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100);
    });

    it('should handle medium files (100+ lines) under 200ms', async () => {
        const fixer = new MultiPassFixer();

        // Generate a medium-sized manifest
        const containers = Array.from({ length: 20 }, (_, i) => `
    - name: container-${i}
      image: nginx:${i}
      ports:
        - containerPort: ${8080 + i}`).join('');

        const input = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: large-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:${containers}`;

        const start = Date.now();
        await fixer.fix(input);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(200);
    });

    it('should handle multi-document files efficiently', async () => {
        const fixer = new MultiPassFixer();

        // Generate multi-document manifest
        const docs = Array.from({ length: 10 }, (_, i) => `
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-${i}
data:
  key${i}: value${i}`).join('\n---');

        const start = Date.now();
        await fixer.fix(docs);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(300);
    });
});
