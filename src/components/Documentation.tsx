import React, { useState, useEffect } from 'react';

/**
 * Comprehensive Documentation Component
 * Complete guide covering every aspect of the K8s YAML Linter
 */
export const Documentation: React.FC = () => {
    const [activeSection, setActiveSection] = useState('section-1');

    const sections = [
        { id: 'section-1', title: 'Getting Started' },
        { id: 'section-2', title: 'Features Overview' },
        { id: 'section-3', title: 'Validation Pipeline' },
        { id: 'section-4', title: 'Supported Resources' },
        { id: 'section-5', title: 'Best Practices' },
        { id: 'section-6', title: 'Error Types & Solutions' },
        { id: 'section-7', title: 'CLI Usage' },
        { id: 'section-8', title: 'API Reference' },
        { id: 'section-9', title: 'Examples' },
        { id: 'section-10', title: 'FAQ' },
        { id: 'section-11', title: 'Architecture' },
        { id: 'section-12', title: 'Technology Stack' }
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    // Update active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            const contentDiv = document.getElementById('docs-content');
            if (!contentDiv) return;

            const scrollPosition = contentDiv.scrollTop;

            // Find the section that is currently active
            // We iterate through all sections and find the last one that is above the viewport center
            let currentSection = sections[0].id;

            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    // Get offset relative to the container
                    const offsetTop = element.offsetTop;
                    // If we've scrolled past this section (minus some buffer), it's the current one
                    if (scrollPosition >= offsetTop - 100) {
                        currentSection = section.id;
                    }
                }
            }
            setActiveSection(currentSection);
        };

        const contentDiv = document.getElementById('docs-content');
        if (contentDiv) {
            contentDiv.addEventListener('scroll', handleScroll);
            // Trigger once to set initial state
            handleScroll();
        }

        return () => {
            if (contentDiv) {
                contentDiv.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    return (
        <div className="flex w-full h-full bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 px-2">
                        Documentation
                    </h2>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors btn-press btn-hover ${activeSection === section.id
                                    ? 'bg-[var(--color-blue)] text-white shadow-sm'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div id="docs-content" className="flex-1 overflow-y-auto scroll-smooth">
                <div className="max-w-4xl mx-auto px-12 py-12 space-y-16">
                    {/* Hero Section */}
                    <header className="text-center space-y-4 pb-8 border-b border-[var(--color-border)]">
                        <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
                            Kubernetes YAML Linter
                        </h1>
                        <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
                            Production-ready validation tool for Kubernetes manifests with real-time feedback,
                            comprehensive schema checking, and best practices enforcement
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <div className="px-4 py-2 bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 rounded-lg">
                                <div className="text-2xl font-bold text-[var(--color-blue)]">9</div>
                                <div className="text-xs text-[var(--color-text-tertiary)]">Validation Stages</div>
                            </div>
                            <div className="px-4 py-2 bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 rounded-lg">
                                <div className="text-2xl font-bold text-[var(--color-green)]">500ms</div>
                                <div className="text-xs text-[var(--color-text-tertiary)]">Debounce Time</div>
                            </div>
                            <div className="px-4 py-2 bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 rounded-lg">
                                <div className="text-2xl font-bold text-[var(--color-purple)]">15+</div>
                                <div className="text-xs text-[var(--color-text-tertiary)]">Resource Types</div>
                            </div>
                        </div>
                    </header>

                    {/* 1. Getting Started */}
                    <section id="section-1" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            1. Getting Started
                        </h2>

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Quick Start</h3>
                            <ol className="space-y-3 text-[var(--color-text-secondary)]">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-blue)] text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                                    <div>
                                        <strong className="text-[var(--color-text-primary)]">Paste Your YAML:</strong> Copy your Kubernetes manifest into the left editor panel
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-blue)] text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                                    <div>
                                        <strong className="text-[var(--color-text-primary)]">Real-time Validation:</strong> See instant feedback as you type (500ms debounce)
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-blue)] text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                                    <div>
                                        <strong className="text-[var(--color-text-primary)]">Review Results:</strong> Check errors (red) and warnings (orange) in the right panel
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-[var(--color-blue)] text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                                    <div>
                                        <strong className="text-[var(--color-text-primary)]">Export/Import:</strong> Use toolbar buttons to save or load YAML files
                                    </div>
                                </li>
                            </ol>

                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)] mt-6">
                                <h4 className="font-semibold text-[var(--color-text-primary)] mb-2">First Validation Example</h4>
                                <pre className="text-sm text-[var(--color-text-secondary)] font-mono overflow-x-auto">
                                    {`apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80`}
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* 2. Features Overview */}
                    <section id="section-2" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            2. Features Overview
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Real-Time Validation', desc: 'Instant feedback with 500ms debounce as you type', icon: '⚡' },
                                { title: 'Schema Validation', desc: 'Validates against Kubernetes API schema v1.29', icon: '✓' },
                                { title: 'Security Checks', desc: 'Detects privileged containers, host network usage', icon: '🔒' },
                                { title: 'Best Practices', desc: 'Resource limits, probes, high availability checks', icon: '⭐' },
                                { title: 'Multi-Document', desc: 'Validates multiple YAML documents in one file', icon: '📄' },
                                { title: 'Export/Import', desc: 'Save and load YAML files with one click', icon: '💾' },
                            ].map((feature, idx) => (
                                <div key={idx} className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:shadow-md transition-shadow">
                                    <div className="text-2xl mb-2">{feature.icon}</div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{feature.title}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Validation Pipeline */}
                    <section id="section-3" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            3. Validation Pipeline (9 Stages)
                        </h2>

                        <p className="text-[var(--color-text-secondary)]">
                            The linter uses a comprehensive 9-stage validation pipeline to ensure your Kubernetes manifests are production-ready:
                        </p>

                        <div className="space-y-4">
                            {[
                                {
                                    stage: 'Stage 0: Environment Context',
                                    desc: 'Detects environment (dev/staging/prod) based on namespace and labels',
                                    details: ['Namespace analysis', 'Label inspection', 'Context determination']
                                },
                                {
                                    stage: 'Stage 1: Helm/Kustomize Rendering',
                                    desc: 'Renders templates if Helm charts or Kustomize overlays are detected',
                                    details: ['Helm template rendering', 'Kustomize overlay application', 'Variable substitution']
                                },
                                {
                                    stage: 'Stage 2: YAML Structural Parse',
                                    desc: 'Parses YAML structure and validates syntax',
                                    details: ['YAML syntax validation', 'Multi-document parsing', 'Encoding detection']
                                },
                                {
                                    stage: 'Stage 3: Kubernetes Schema Validation',
                                    desc: 'Validates against official Kubernetes API schema',
                                    details: ['Required fields check', 'Type validation', 'API version compatibility']
                                },
                                {
                                    stage: 'Stage 4: Semantic Graph Analysis',
                                    desc: 'Analyzes relationships between resources',
                                    details: ['Service-to-Pod matching', 'ConfigMap/Secret references', 'PVC bindings']
                                },
                                {
                                    stage: 'Stage 5: Context-Aware Static Checks',
                                    desc: 'Environment-specific validation rules',
                                    details: ['Resource limits (required in prod)', 'Probe configuration', 'Replica count checks']
                                },
                                {
                                    stage: 'Stage 6: Admission Controller Simulation',
                                    desc: 'Simulates Kubernetes admission webhooks',
                                    details: ['Pod Security Standards', 'Resource quotas', 'Namespace restrictions']
                                },
                                {
                                    stage: 'Stage 7: Policy-as-Code Evaluation',
                                    desc: 'Evaluates custom policies from policy directory',
                                    details: ['OPA/Rego policies', 'Custom validation rules', 'Compliance checks']
                                },
                                {
                                    stage: 'Stage 8: Server-Side Validation',
                                    desc: 'Optional dry-run against actual Kubernetes API server',
                                    details: ['kubectl dry-run', 'Server-side validation', 'Cluster-specific checks']
                                }
                            ].map((stage, idx) => (
                                <div key={idx} className="border-l-4 border-[var(--color-blue)] pl-4 py-2 bg-[var(--color-bg-secondary)] rounded-r-lg">
                                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{stage.stage}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">{stage.desc}</p>
                                    <ul className="text-xs text-[var(--color-text-tertiary)] space-y-1">
                                        {stage.details.map((detail, i) => (
                                            <li key={i}>• {detail}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Supported Resources */}
                    <section id="section-4" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            4. Supported Kubernetes Resources
                        </h2>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                'Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'Job', 'CronJob',
                                'Service', 'Ingress', 'NetworkPolicy',
                                'ConfigMap', 'Secret', 'PersistentVolumeClaim', 'PersistentVolume', 'StorageClass',
                                'ServiceAccount', 'Role', 'RoleBinding', 'ClusterRole', 'ClusterRoleBinding',
                                'Namespace', 'ResourceQuota', 'LimitRange', 'HorizontalPodAutoscaler'
                            ].map((resource, idx) => (
                                <div key={idx} className="px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-secondary)] text-center">
                                    {resource}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. Best Practices */}
                    <section id="section-5" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            5. Best Practices Enforced
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-[var(--color-green)]/10 border border-[var(--color-green)]/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-[var(--color-green)] mb-2">✓ Resource Management</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• CPU and memory limits defined</li>
                                    <li>• Resource requests specified</li>
                                    <li>• Requests ≤ Limits validation</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-[var(--color-blue)] mb-2">✓ Health Checks</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Liveness probes configured</li>
                                    <li>• Readiness probes configured</li>
                                    <li>• Startup probes for slow-starting containers</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-[var(--color-purple)] mb-2">✓ High Availability</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Replicas ≥ 2 for production</li>
                                    <li>• Pod disruption budgets</li>
                                    <li>• Anti-affinity rules</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--color-orange)]/10 border border-[var(--color-orange)]/20 p-4 rounded-lg">
                                <h3 className="font-semibold text-[var(--color-orange)] mb-2">⚠ Security</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• No privileged containers</li>
                                    <li>• No host network/PID/IPC</li>
                                    <li>• Avoid 'latest' image tag</li>
                                    <li>• Security context configured</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 6. Error Types */}
                    <section id="section-6" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            6. Error Types & Solutions
                        </h2>

                        <div className="space-y-4">
                            <div className="border-l-4 border-[var(--color-red)] pl-4 py-2">
                                <h3 className="font-semibold text-[var(--color-red)] mb-2">Schema Errors (Red)</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-2">Critical issues that prevent deployment:</p>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Missing required fields (apiVersion, kind, metadata)</li>
                                    <li>• Invalid field types</li>
                                    <li>• Selector mismatch (Service/Deployment)</li>
                                    <li>• Invalid resource names</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-[var(--color-orange)] pl-4 py-2">
                                <h3 className="font-semibold text-[var(--color-orange)] mb-2">Warnings (Orange)</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-2">Best practice violations that should be addressed:</p>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Missing resource limits/requests</li>
                                    <li>• No health probes configured</li>
                                    <li>• Using 'latest' image tag</li>
                                    <li>• Single replica in production</li>
                                    <li>• Privileged security context</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 7. CLI Usage */}
                    <section id="section-7" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            7. CLI Usage
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Installation</h3>
                                <pre className="text-sm font-mono text-[var(--color-text-secondary)]">npm install -g k8s-yaml-lint</pre>
                            </div>

                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Basic Usage</h3>
                                <pre className="text-sm font-mono text-[var(--color-text-secondary)]">
                                    {`# Scan a single file
node dist/cli.js scan deployment.yaml

# Scan a directory
node dist/cli.js scan ./manifests

# Skip server validation
node dist/cli.js scan . --skip-server-validation

# Use custom policy directory
node dist/cli.js scan . --policy-dir ./policies`}
                                </pre>
                            </div>

                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Exit Codes</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• <code className="bg-[var(--color-bg-primary)] px-1 rounded">0</code> - Success (no errors, warnings OK)</li>
                                    <li>• <code className="bg-[var(--color-bg-primary)] px-1 rounded">2</code> - Validation errors found</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 8. API Reference */}
                    <section id="section-8" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            8. API Reference
                        </h2>

                        <div className="space-y-4">
                            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                                <div className="bg-[var(--color-bg-secondary)] px-4 py-2 border-b border-[var(--color-border)]">
                                    <code className="text-sm font-mono text-[var(--color-text-primary)]">POST /api/validate</code>
                                </div>
                                <div className="p-4 space-y-3 bg-[var(--color-bg-card)]">
                                    <div>
                                        <h4 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Request Body:</h4>
                                        <pre className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] p-2 rounded">
                                            {`{
  "yaml": "apiVersion: v1\\nkind: Pod\\n..."
}`}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[var(--color-text-primary)] text-sm mb-1">Response:</h4>
                                        <pre className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] p-2 rounded">
                                            {`{
  "valid": true,
  "errors": [],
  "warnings": [],
  "documentCount": 1
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 9. Examples */}
                    <section id="section-9" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            9. Examples
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
                                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Production-Ready Deployment</h3>
                                <pre className="text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto">
                                    {`apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
    env: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21.6
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5`}
                                </pre>
                            </div>
                        </div>
                    </section>

                    {/* 10. FAQ */}
                    <section id="section-10" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            10. Frequently Asked Questions
                        </h2>

                        <div className="space-y-4">
                            {[
                                {
                                    q: 'What Kubernetes versions are supported?',
                                    a: 'The linter validates against Kubernetes API v1.29, but is compatible with manifests from v1.16+.'
                                },
                                {
                                    q: 'Can I validate multiple documents in one file?',
                                    a: 'Yes! Separate documents with --- and the linter will validate each one independently.'
                                },
                                {
                                    q: 'How do I disable server-side validation?',
                                    a: 'Use the --skip-server-validation flag in CLI mode, or it\'s disabled by default in the web UI.'
                                },
                                {
                                    q: 'Can I add custom validation rules?',
                                    a: 'Yes, place OPA/Rego policy files in a directory and use --policy-dir flag.'
                                },
                                {
                                    q: 'Why am I seeing warnings for valid YAML?',
                                    a: 'Warnings indicate best practice violations, not syntax errors. They help improve production readiness.'
                                }
                            ].map((faq, idx) => (
                                <div key={idx} className="border-l-4 border-[var(--color-blue)] pl-4 py-2">
                                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{faq.q}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 11. Architecture */}
                    <section id="section-11" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            11. Architecture
                        </h2>

                        <div className="space-y-4">
                            <p className="text-[var(--color-text-secondary)]">
                                The application follows a modern client-server architecture with clear separation of concerns:
                            </p>

                            <div className="bg-[var(--color-bg-tertiary)] p-6 rounded-lg border border-[var(--color-border)] font-mono text-sm">
                                <div className="space-y-1 text-[var(--color-text-secondary)]">
                                    <div className="text-[var(--color-blue)] font-semibold">┌─ Frontend (React + TypeScript)</div>
                                    <div>│  ├─ Layout Component</div>
                                    <div>│  ├─ CodeEditor (Monaco)</div>
                                    <div>│  ├─ LinterOutput</div>
                                    <div>│  └─ Documentation</div>
                                    <div className="text-[var(--color-blue)] font-semibold mt-2">└─ Backend (Node.js + Express)</div>
                                    <div>   ├─ 9-Stage Validation Pipeline</div>
                                    <div>   ├─ Schema Loader</div>
                                    <div>   ├─ Policy Engine</div>
                                    <div>   └─ API Server (Port 3001)</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 12. Technology Stack */}
                    <section id="section-12" className="space-y-6 scroll-mt-8">
                        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] pb-2 border-b-2 border-[var(--color-blue)]">
                            12. Technology Stack
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-[var(--color-text-primary)]">Frontend</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• React 19 + TypeScript</li>
                                    <li>• Vite (Build Tool)</li>
                                    <li>• Tailwind CSS v3</li>
                                    <li>• Monaco Editor</li>
                                    <li>• Material-UI Icons</li>
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-[var(--color-text-primary)]">Backend</h3>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Node.js + Express</li>
                                    <li>• TypeScript</li>
                                    <li>• js-yaml Parser</li>
                                    <li>• Ajv (JSON Schema)</li>
                                    <li>• @kubernetes/client-node</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="text-center py-8 border-t border-[var(--color-border)] text-[var(--color-text-tertiary)] text-sm">
                        <p>Built with ❤️ using React, TypeScript, and Node.js</p>
                        <p className="mt-2">Kubernetes YAML Linter v2.0 • Enhanced Validation Engine</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
