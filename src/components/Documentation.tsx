import React, { useState, useEffect } from 'react';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LoopIcon from '@mui/icons-material/Loop';
import BuildIcon from '@mui/icons-material/Build';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloudIcon from '@mui/icons-material/Cloud';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import TerminalIcon from '@mui/icons-material/Terminal';
import ApiIcon from '@mui/icons-material/Api';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HelpIcon from '@mui/icons-material/Help';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ErrorIcon from '@mui/icons-material/Error';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import LockIcon from '@mui/icons-material/Lock';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ScaleIcon from '@mui/icons-material/Scale';

interface DocumentationProps {
    onClose?: () => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'overview', title: 'Overview', icon: <MenuBookIcon fontSize="small" /> },
        { id: 'quickstart', title: 'Quick Start', icon: <RocketLaunchIcon fontSize="small" /> },
        { id: 'validation-pipeline', title: 'Validation Pipeline', icon: <LoopIcon fontSize="small" /> },
        { id: 'yaml-fixer', title: 'YAML Fixer Engine', icon: <BuildIcon fontSize="small" /> },
        { id: 'semantic-engine', title: 'Semantic Engine', icon: <PsychologyIcon fontSize="small" /> },
        { id: 'knowledge-base', title: 'Knowledge Base', icon: <LibraryBooksIcon fontSize="small" /> },
        { id: 'confidence-system', title: 'Confidence System', icon: <AnalyticsIcon fontSize="small" /> },
        { id: 'supported-resources', title: 'Supported Resources', icon: <CloudIcon fontSize="small" /> },
        { id: 'best-practices', title: 'Best Practices', icon: <VerifiedIcon fontSize="small" /> },
        { id: 'error-reference', title: 'Error Reference', icon: <WarningIcon fontSize="small" /> },
        { id: 'cli-usage', title: 'CLI Usage', icon: <TerminalIcon fontSize="small" /> },
        { id: 'api-reference', title: 'API Reference', icon: <ApiIcon fontSize="small" /> },
        { id: 'architecture', title: 'Architecture', icon: <AccountTreeIcon fontSize="small" /> },
        { id: 'faq', title: 'FAQ', icon: <HelpIcon fontSize="small" /> },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const contentDiv = document.getElementById('docs-content');
            if (!contentDiv) return;
            const scrollPosition = contentDiv.scrollTop;
            let currentSection = sections[0].id;
            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element && scrollPosition >= element.offsetTop - 120) {
                    currentSection = section.id;
                }
            }
            setActiveSection(currentSection);
        };
        const contentDiv = document.getElementById('docs-content');
        if (contentDiv) {
            contentDiv.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => contentDiv?.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex w-full h-full bg-[var(--color-bg-primary)] overflow-hidden animate-fade-in-soft">
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 border-r border-[var(--color-border)]/50 bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm overflow-y-auto">
                <div className="p-5 space-y-4">
                    <div className="px-2 pb-4 border-b border-[var(--color-border)]/30">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Podscribe</h2>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                    title="Back to Editor"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">Documentation v2.0</p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 pl-9 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)]/50 rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30"
                        />
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-text-tertiary)]" style={{ fontSize: 16 }} />
                    </div>
                    <nav className="space-y-0.5">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5 btn-press ${activeSection === section.id
                                    ? 'bg-[var(--color-blue)] text-white shadow-md'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                    }`}
                            >
                                {section.icon}
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div id="docs-content" className="flex-1 overflow-y-auto scroll-smooth">
                <div className="max-w-4xl mx-auto px-10 py-10 space-y-16">

                    {/* OVERVIEW */}
                    <section id="overview" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <MenuBookIcon className="text-[var(--color-blue)]" />
                            <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">Overview</h1>
                        </div>
                        <p className="text-[var(--color-text-secondary)] text-lg">
                            Podscribe is a production-grade Kubernetes YAML linter and fixer with a 9-stage validation pipeline, semantic intelligence, and automatic error correction.
                        </p>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Validation Stages', value: '9' },
                                { label: 'Known Fields', value: '150+' },
                                { label: 'Fix Types', value: '8' },
                                { label: 'K8s Resources', value: '24+' }
                            ].map((stat) => (
                                <div key={stat.label} className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]/50">
                                    <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</div>
                                    <div className="text-xs text-[var(--color-text-tertiary)]">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Real-Time Validation', desc: '500ms debounce for instant feedback', icon: <SpeedIcon /> },
                                { title: 'Schema Validation', desc: 'Kubernetes API v1.29 schemas', icon: <VerifiedIcon /> },
                                { title: 'Auto-Fix Engine', desc: '3-phase fixing with confidence scoring', icon: <AutoFixHighIcon /> },
                                { title: 'Security Checks', desc: 'Privileged containers, host network', icon: <SecurityIcon /> },
                                { title: 'Multi-Document', desc: 'Multiple YAML documents in one file', icon: <DescriptionIcon /> },
                                { title: 'Semantic Intelligence', desc: 'Context-aware typo correction', icon: <PsychologyIcon /> },
                            ].map((f) => (
                                <div key={f.title} className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl flex gap-3">
                                    <div className="text-[var(--color-blue)]">{f.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-[var(--color-text-primary)]">{f.title}</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* QUICK START */}
                    <section id="quickstart" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <RocketLaunchIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Quick Start</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: 1, title: 'Paste Your YAML', desc: 'Copy your Kubernetes manifest into the left editor panel' },
                                { step: 2, title: 'Real-time Validation', desc: 'See instant feedback as you type (500ms debounce)' },
                                { step: 3, title: 'Review Results', desc: 'Check errors (red) and warnings (orange) in the console panel' },
                                { step: 4, title: 'Auto-Fix', desc: 'Enable Auto-Fix toggle for automatic error correction' },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-blue)] text-white rounded-full flex items-center justify-center text-sm font-bold">{item.step}</div>
                                    <div>
                                        <h4 className="font-bold text-[var(--color-text-primary)]">{item.title}</h4>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]/50 overflow-hidden">
                            <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]/30 flex items-center gap-2">
                                <CodeIcon style={{ fontSize: 14 }} className="text-[var(--color-text-tertiary)]" />
                                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Example: Valid Deployment</span>
                            </div>
                            <pre className="p-4 text-sm font-mono text-[var(--color-text-secondary)] overflow-x-auto">{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
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
          initialDelaySeconds: 30`}</pre>
                        </div>
                    </section>

                    {/* VALIDATION PIPELINE */}
                    <section id="validation-pipeline" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <LoopIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Validation Pipeline</h2>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">9-stage validation ensuring production-ready manifests.</p>
                        <div className="space-y-3">
                            {[
                                { stage: 0, name: 'Environment Context', file: 'stage0-context.ts', desc: 'Detects environment (dev/staging/prod) from namespace and labels.' },
                                { stage: 1, name: 'Helm/Kustomize Rendering', file: 'stage1-render.ts', desc: 'Renders Helm charts or Kustomize overlays if detected.' },
                                { stage: 2, name: 'YAML Parse', file: 'stage2-parse.ts', desc: 'Parses YAML with js-yaml. Handles multi-document files.' },
                                { stage: 3, name: 'Schema Validation', file: 'stage3-schema.ts', desc: 'Validates against K8s API schemas using AJV.' },
                                { stage: 4, name: 'Graph Analysis', file: 'stage4-graph.ts', desc: 'Analyzes Service→Pod matching, ConfigMap refs.' },
                                { stage: 5, name: 'Static Checks', file: 'stage5-checks.ts', desc: 'Resource limits, probes, image tags, security.' },
                                { stage: 6, name: 'Admission Simulation', file: 'stage6-admission.ts', desc: 'Pod Security Standards (PSS) checks.' },
                                { stage: 7, name: 'Policy Evaluation', file: 'stage7-policy.ts', desc: 'Custom Kyverno-style ClusterPolicies.' },
                                { stage: 8, name: 'Server Validation', file: 'stage8-server.ts', desc: 'Optional kubectl --dry-run=server.' },
                            ].map((item) => (
                                <div key={item.stage} className="flex gap-4 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-blue)]/10 text-[var(--color-blue)] rounded-lg flex items-center justify-center font-bold">{item.stage}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-[var(--color-text-primary)]">{item.name}</h4>
                                            <code className="text-[10px] px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] rounded">{item.file}</code>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* YAML FIXER ENGINE */}
                    <section id="yaml-fixer" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <BuildIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">YAML Fixer Engine</h2>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">3-phase architecture. Phase 1 always runs (even on broken YAML).</p>
                        <div className="space-y-4">
                            <div className="p-5 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-blue)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">Phase 1: Syntax Normalization</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Typo correction: metdata → metadata</li>
                                    <li>• Missing colons: apiVersion apps/v1 → apiVersion: apps/v1</li>
                                    <li>• Indentation: tabs to spaces, alignment</li>
                                    <li>• Quote balancing: fixes unclosed quotes</li>
                                </ul>
                            </div>
                            <div className="p-5 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-green)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">Phase 2: Parse Validation</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">Attempts js-yaml parsing. Reports errors with line numbers if failed.</p>
                            </div>
                            <div className="p-5 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-purple)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">Phase 3: Semantic Fixes</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Field relocation: moves name/namespace under metadata</li>
                                    <li>• Template injection: adds missing spec.template</li>
                                    <li>• Container wrapping: wraps orphaned container specs</li>
                                </ul>
                            </div>
                        </div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">Known Typo Corrections</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            {[
                                ['metdata', 'metadata'], ['namespce', 'namespace'], ['conatiners', 'containers'],
                                ['containre', 'container'], ['volumne', 'volume'], ['lables', 'labels'],
                                ['annotatons', 'annotations'], ['replicsa', 'replicas'], ['sepc', 'spec'],
                            ].map(([typo, correct]) => (
                                <div key={typo} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                                    <code className="text-[var(--color-red)]">{typo}</code>
                                    <span className="text-[var(--color-text-tertiary)]">→</span>
                                    <code className="text-[var(--color-green)]">{correct}</code>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SEMANTIC ENGINE */}
                    <section id="semantic-engine" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <PsychologyIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Semantic Engine</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'SemanticParser', file: 'semantic-parser.ts', desc: 'Builds semantic line representation with parent-child relationships.' },
                                { title: 'ContextAnalyzer', file: 'context-analyzer.ts', desc: 'Tracks current path, detects block scalars, identifies line types.' },
                                { title: 'IndentationTracker', file: 'indentation-tracker.ts', desc: 'Maintains indent stack for proper nesting.' },
                                { title: 'IntelligentFixer', file: 'intelligent-fixer.ts', desc: 'Orchestrates fixers, runs up to 3 iterations.' },
                            ].map((item) => (
                                <div key={item.title} className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-bold text-[var(--color-text-primary)]">{item.title}</h4>
                                        <code className="text-[10px] px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] rounded">{item.file}</code>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">Fixer Components</h4>
                        <div className="space-y-3">
                            {[
                                { name: 'ContextAwareKeyFixer', desc: 'Detects missing colons using field knowledge and sibling patterns.' },
                                { name: 'FieldNormalizer', desc: 'Fuzzy matches typos against 150+ known fields (Levenshtein distance ≤ 2).' },
                                { name: 'ListStructureFixer', desc: 'Fixes broken list items: "- nginx" → "- name: nginx"' },
                                { name: 'TypeCoercer', desc: 'Converts values: "yes"→"true", "three"→"3" for numeric fields.' },
                            ].map((item) => (
                                <div key={item.name} className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
                                    <code className="text-sm font-semibold text-[var(--color-blue)]">{item.name}</code>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* KNOWLEDGE BASE */}
                    <section id="knowledge-base" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <LibraryBooksIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Knowledge Base</h2>
                        </div>
                        <div className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl">
                            <h4 className="font-bold text-[var(--color-text-primary)] mb-3">Field Patterns (field-patterns.ts)</h4>
                            <p className="text-sm text-[var(--color-text-tertiary)] mb-2">150+ known Kubernetes fields:</p>
                            <div className="flex flex-wrap gap-1">
                                {['apiVersion', 'kind', 'metadata', 'spec', 'containers', 'image', 'ports', 'env', 'resources', 'volumeMounts', 'livenessProbe'].map(f => (
                                    <code key={f} className="px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded text-xs">{f}</code>
                                ))}
                                <span className="text-[var(--color-text-tertiary)] text-xs">+140 more...</span>
                            </div>
                        </div>
                        <div className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl">
                            <h4 className="font-bold text-[var(--color-text-primary)] mb-3">Type Registry (type-registry.ts)</h4>
                            <div className="grid grid-cols-4 gap-3 text-xs">
                                <div><p className="font-semibold text-[var(--color-text-primary)] mb-1">Boolean</p><p className="text-[var(--color-text-tertiary)]">hostNetwork, readOnly, privileged, tty</p></div>
                                <div><p className="font-semibold text-[var(--color-text-primary)] mb-1">Number</p><p className="text-[var(--color-text-tertiary)]">replicas, port, containerPort</p></div>
                                <div><p className="font-semibold text-[var(--color-text-primary)] mb-1">String</p><p className="text-[var(--color-text-tertiary)]">name, image, namespace</p></div>
                                <div><p className="font-semibold text-[var(--color-text-primary)] mb-1">Object/Array</p><p className="text-[var(--color-text-tertiary)]">metadata, spec, containers</p></div>
                            </div>
                        </div>
                    </section>

                    {/* CONFIDENCE SYSTEM */}
                    <section id="confidence-system" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <AnalyticsIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Confidence System</h2>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">Every fix has a confidence score (0.0-1.0). Fixes below threshold are not applied.</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-green)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">High (0.85-1.0)</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Known field missing colon</li>
                                    <li>• Known alias correction</li>
                                    <li>• Typo with distance 1</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-orange)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">Medium (0.7-0.85)</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Pattern match with children</li>
                                    <li>• Strong sibling pattern</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-[var(--color-bg-card)] border-l-4 border-[var(--color-text-tertiary)] rounded-r-xl">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-2">Low (0.5-0.7)</h4>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Pattern match alone</li>
                                    <li>• List restructure</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--color-text-tertiary)]"><strong>Default:</strong> 0.8 | <strong>Aggressive mode:</strong> 0.6</p>
                    </section>

                    {/* SUPPORTED RESOURCES */}
                    <section id="supported-resources" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <CloudIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Supported Resources</h2>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'Job', 'CronJob', 'Service', 'Ingress', 'NetworkPolicy', 'ConfigMap', 'Secret', 'PersistentVolumeClaim', 'PersistentVolume', 'StorageClass', 'ServiceAccount', 'Role', 'RoleBinding', 'ClusterRole', 'ClusterRoleBinding', 'Namespace', 'ResourceQuota', 'LimitRange', 'HorizontalPodAutoscaler'].map((r) => (
                                <div key={r} className="px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-lg text-sm text-[var(--color-text-secondary)] text-center">{r}</div>
                            ))}
                        </div>
                    </section>

                    {/* BEST PRACTICES */}
                    <section id="best-practices" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <VerifiedIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Best Practices</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: <ScaleIcon />, title: 'Resource Management', items: ['CPU/memory limits defined', 'Requests specified', 'Requests ≤ Limits'] },
                                { icon: <HealthAndSafetyIcon />, title: 'Health Checks', items: ['Liveness probes', 'Readiness probes', 'Startup probes'] },
                                { icon: <StorageIcon />, title: 'High Availability', items: ['Replicas ≥ 2 in prod', 'Pod disruption budgets', 'Anti-affinity rules'] },
                                { icon: <LockIcon />, title: 'Security', items: ['No privileged containers', 'No host network', 'Avoid latest tag'] },
                            ].map((cat) => (
                                <div key={cat.title} className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl flex gap-3">
                                    <div className="text-[var(--color-blue)]">{cat.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-[var(--color-text-primary)] mb-1">{cat.title}</h4>
                                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-0.5">
                                            {cat.items.map((i) => <li key={i}>• {i}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ERROR REFERENCE */}
                    <section id="error-reference" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <WarningIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Error Reference</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 border-l-4 border-[var(--color-red)] bg-[var(--color-bg-card)] rounded-r-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <ErrorIcon className="text-[var(--color-red)]" style={{ fontSize: 18 }} />
                                    <h4 className="font-bold text-[var(--color-text-primary)]">Schema Errors (Critical)</h4>
                                </div>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Missing required fields (apiVersion, kind, metadata)</li>
                                    <li>• Invalid field types</li>
                                    <li>• Unknown fields or typos</li>
                                </ul>
                            </div>
                            <div className="p-4 border-l-4 border-[var(--color-orange)] bg-[var(--color-bg-card)] rounded-r-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <WarningIcon className="text-[var(--color-orange)]" style={{ fontSize: 18 }} />
                                    <h4 className="font-bold text-[var(--color-text-primary)]">Warnings (Best Practice)</h4>
                                </div>
                                <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                    <li>• Missing resource limits</li>
                                    <li>• No health probes</li>
                                    <li>• Using 'latest' tag</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* CLI USAGE */}
                    <section id="cli-usage" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <TerminalIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">CLI Usage</h2>
                        </div>
                        <div className="bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)]/50 overflow-hidden">
                            <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]/30">
                                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Commands</span>
                            </div>
                            <pre className="p-4 text-sm font-mono text-[var(--color-text-secondary)]">{`# Scan a single file
podscribe scan deployment.yaml

# Scan a directory
podscribe scan ./manifests

# Skip server validation
podscribe scan . --skip-server-validation

# Use custom policies
podscribe scan . --policy-dir ./policies`}</pre>
                        </div>
                    </section>

                    {/* API REFERENCE */}
                    <section id="api-reference" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <ApiIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">API Reference</h2>
                        </div>
                        <div className="border border-[var(--color-border)]/50 rounded-xl overflow-hidden">
                            <div className="bg-[var(--color-bg-secondary)] px-4 py-2 border-b border-[var(--color-border)]/30 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-[var(--color-green)] text-white text-xs font-bold rounded">POST</span>
                                <code className="text-sm font-mono">/api/yaml/validate</code>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <h5 className="font-semibold text-sm mb-2">Request</h5>
                                    <pre className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs font-mono text-[var(--color-text-secondary)]">{`{ "content": "apiVersion: v1...", "options": { "aggressive": false } }`}</pre>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-sm mb-2">Response</h5>
                                    <pre className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs font-mono text-[var(--color-text-secondary)]">{`{ "success": true, "fixed": "...", "errors": [], "isValid": true }`}</pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ARCHITECTURE */}
                    <section id="architecture" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <AccountTreeIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Architecture</h2>
                        </div>
                        <div className="bg-[var(--color-bg-tertiary)] p-6 rounded-xl border border-[var(--color-border)]/50">
                            <pre className="text-sm font-mono text-[var(--color-text-secondary)]">{`src/
├── components/          # React UI
├── core/                # yaml-validator, yaml-fixer
├── semantic/            # SemanticParser, IntelligentFixer
├── fixers/              # KeyFixer, FieldNormalizer, ListFixer
├── knowledge/           # field-patterns, type-registry
├── confidence/          # scorer.ts
└── stages/              # stage0-8 validation pipeline`}</pre>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><h4 className="font-bold mb-2">Frontend</h4><p className="text-sm text-[var(--color-text-secondary)]">React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor</p></div>
                            <div><h4 className="font-bold mb-2">Backend</h4><p className="text-sm text-[var(--color-text-secondary)]">Node.js, Express, tsx, js-yaml, Ajv</p></div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section id="faq" className="scroll-mt-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <HelpIcon className="text-[var(--color-blue)]" />
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">FAQ</h2>
                        </div>
                        <div className="space-y-3">
                            {[
                                { q: 'What K8s versions are supported?', a: 'Validates against K8s API v1.29, compatible with v1.16+.' },
                                { q: 'Can I validate multiple documents?', a: 'Yes, separate with --- and each is validated independently.' },
                                { q: 'What is the confidence threshold?', a: 'Default 0.8. Aggressive mode uses 0.6.' },
                                { q: 'Can I add custom policies?', a: 'Yes, use --policy-dir with Kyverno-style ClusterPolicy YAML files.' },
                            ].map((faq, idx) => (
                                <div key={idx} className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)]/50 rounded-xl">
                                    <h4 className="font-bold text-[var(--color-text-primary)] mb-1">{faq.q}</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="text-center py-10 border-t border-[var(--color-border)]/30 text-[var(--color-text-tertiary)] text-sm">
                        <p>Podscribe v2.0 • Kubernetes YAML Linter</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
