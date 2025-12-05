
import { describe, it, expect } from 'vitest';
import { MultiPassFixer } from '../src/semantic/intelligent-fixer.js';

describe('Universal Enhancements', () => {
    const fixer = new MultiPassFixer({
        confidenceThreshold: 0.7,
        aggressive: true,
        maxIterations: 3
    });

    describe('Enhancement 1: Universal Bare Key Detection', () => {
        it('should fix bare keys that are parents of indented blocks', async () => {
            const input = `
apiVersion: v1
kind: Pod
metadata
  name: my-pod
spec
  containers:
    - name: nginx
`;
            const result = await fixer.fix(input);
            expect(result.content).toContain('metadata:');
            expect(result.content).toContain('spec:');
            expect(result.changes.some(c => c.reason.includes('Detected bare key'))).toBe(true);
        });

        it('should not fix bare keys that are not parents', async () => {
            const input = `
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  # This is a comment
  some-random-word
  other-field: value
`;
            const result = await fixer.fix(input);
            // "some-random-word" should NOT be fixed because next line "other-field" has same indent
            expect(result.content).toContain('some-random-word');
            expect(result.content).not.toContain('some-random-word:');
        });
    });

    describe('Enhancement 2: Universal Map Value Detection', () => {
        it('should fix map entries missing colons', async () => {
            const input = `
apiVersion: v1
kind: Pod
metadata:
  labels:
    app my-app
    tier frontend
`;
            const result = await fixer.fix(input);
            expect(result.content).toContain('app: my-app');
            expect(result.content).toContain('tier: frontend');
            expect(result.changes.some(c => c.reason.includes('Detected map entry missing colon'))).toBe(true);
        });
    });

    describe('Enhancement 3: Universal Numeric Type Inference', () => {
        it('should infer numeric types for fields with numeric names', async () => {
            const input = `
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: nginx
      image: nginx
      ports:
        - containerPort: "80"
      resources:
        limits:
          memory: "128Mi"
          cpu: "500m"
  replicas: "3"
  terminationGracePeriodSeconds: thirty
  activeDeadlineSeconds: "600"
`;
            const result = await fixer.fix(input);
            expect(result.content).toContain('replicas: 3');
            expect(result.content).toContain('terminationGracePeriodSeconds: 30');
            expect(result.content).toContain('activeDeadlineSeconds: 600');
            // Should NOT change memory/cpu strings
            expect(result.content).toContain('memory: "128Mi"');
            expect(result.content).toContain('cpu: "500m"');
        });
    });

    describe('Enhancement 4: Universal Duplicate Key Removal', () => {
        it('should remove duplicate keys at same level', async () => {
            const input = `
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: test
    app: prod
spec:
  containers:
    - name: nginx
      image: nginx
`;
            const result = await fixer.fix(input);
            // Should keep first one? Or last one?
            // Our implementation keeps the first one encountered and skips subsequent ones.
            expect(result.content).toContain('app: test');
            expect(result.content).not.toContain('app: prod');
            expect(result.changes.some(c => c.reason.includes('Removed duplicate key'))).toBe(true);
        });
    });

    describe('Enhancement 5: Universal Nested Structure Detection', () => {
        it('should group probe fields under httpGet', async () => {
            const input = `
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: nginx
      livenessProbe:
        path: /health
        port: 8080
        initialDelaySeconds: 30
`;
            const result = await fixer.fix(input);
            expect(result.content).toContain('httpGet:');
            expect(result.content).toContain('  path: /health');
            expect(result.content).toContain('  port: 8080');
            // initialDelaySeconds should remain outside
            expect(result.content).toContain('initialDelaySeconds: 30');
        });

        it('should group probe fields under exec', async () => {
            const input = `
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: nginx
      readinessProbe:
        command:
          - cat
          - /tmp/healthy
        initialDelaySeconds: 5
`;
            const result = await fixer.fix(input);
            expect(result.content).toContain('exec:');
            expect(result.content).toContain('  command:');
        });
    });
});
