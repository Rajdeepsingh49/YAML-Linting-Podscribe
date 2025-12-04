import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface ValidationError {
    line: number;
    column?: number;
    message: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    code?: string;
    fixable?: boolean;
}

interface ValidationChange {
    type: string;
    line: number;
    original: string;
    fixed: string;
    reason: string;
    severity: string;
}

interface ValidationResponse {
    success: boolean;
    originalValid: boolean;
    fixed: string;
    errors: ValidationError[];
    fixedCount: number;
    changes: ValidationChange[];
    isValid: boolean;
    structuralExplanation?: string;
}

interface ToastNotification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const UnifiedValidator: React.FC = () => {
    // State
    const [inputYaml, setInputYaml] = useState('');
    const [outputYaml, setOutputYaml] = useState('');
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [changes, setChanges] = useState<ValidationChange[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [fixedCount, setFixedCount] = useState(0);
    const [isValid, setIsValid] = useState(false);
    const [fixEnabled, setFixEnabled] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [showDocumentation, setShowDocumentation] = useState(false);
    const [showConsole, setShowConsole] = useState(false);
    const [consoleTab, setConsoleTab] = useState<'fixes' | 'errors'>('fixes');
    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected'>('connected');

    // Refs
    const inputEditorRef = useRef<any>(null);
    const outputEditorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const toastIdRef = useRef(0);

    // Toast notifications
    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const id = toastIdRef.current++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // Check server status
    useEffect(() => {
        const checkServer = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/yaml/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: 'test: true', options: {} }),
                });
                setServerStatus(response.ok ? 'connected' : 'disconnected');
            } catch {
                setServerStatus('disconnected');
            }
        };
        checkServer();
        const interval = setInterval(checkServer, 30000);
        return () => clearInterval(interval);
    }, []);

    // Validation handler
    const handleValidate = useCallback(async () => {
        if (!inputYaml.trim()) {
            addToast('Please enter YAML content', 'error');
            return;
        }

        setIsValidating(true);

        try {
            const response = await fetch('http://localhost:3001/api/yaml/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputYaml,
                    options: { aggressive: false, indentSize: 2 },
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data: ValidationResponse = await response.json();

            // Only set fixed output if fix is enabled
            if (fixEnabled) {
                setOutputYaml(data.fixed);
            } else {
                setOutputYaml(''); // Clear output if fix is disabled
            }

            setErrors(data.errors || []);
            setChanges(data.changes || []);
            setFixedCount(data.fixedCount);
            setIsValid(data.isValid);

            // Open console to show results
            setShowConsole(true);

            // Set appropriate tab
            if (fixEnabled && data.fixedCount > 0) {
                setConsoleTab('fixes');
            } else if (data.errors.length > 0) {
                setConsoleTab('errors');
            }

            if (data.isValid && data.fixedCount === 0) {
                addToast('YAML is perfect! No issues found.', 'success');
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2000);
            } else if (fixEnabled && data.isValid && data.fixedCount > 0) {
                addToast(`Fixed ${data.fixedCount} issue${data.fixedCount > 1 ? 's' : ''}`, 'success');
            } else if (!fixEnabled && data.errors.length > 0) {
                addToast(`Found ${data.errors.length} error${data.errors.length > 1 ? 's' : ''}`, 'info');
            }
        } catch (error) {
            console.error('Validation error:', error);
            addToast('Failed to connect to validation server', 'error');
            setServerStatus('disconnected');
        } finally {
            setIsValidating(false);
        }
    }, [inputYaml, fixEnabled, addToast]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleValidate();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleDownload();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
                e.preventDefault();
                handleClear();
            } else if (e.key === 'Escape') {
                setShowDocumentation(false);
                setShowConsole(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleValidate]);

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
        }
    }, [theme]);

    // Monaco editor setup
    const handleInputEditorMount: OnMount = (editor, monaco) => {
        inputEditorRef.current = editor;
        monacoRef.current = monaco;
    };

    const handleOutputEditorMount: OnMount = (editor, monaco) => {
        outputEditorRef.current = editor;
        if (!monacoRef.current) monacoRef.current = monaco;
    };

    // Utility functions
    const handleCopy = () => {
        if (outputYaml) {
            navigator.clipboard.writeText(outputYaml);
            addToast('Copied to clipboard', 'success');
        }
    };

    const handleDownload = () => {
        if (outputYaml) {
            const blob = new Blob([outputYaml], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fixed-manifest.yaml';
            a.click();
            URL.revokeObjectURL(url);
            addToast('Downloaded successfully', 'success');
        }
    };

    const handleClear = () => {
        setInputYaml('');
        setOutputYaml('');
        setErrors([]);
        setChanges([]);
        setFixedCount(0);
        setShowConsole(false);
    };

    // Group errors by severity
    const groupedErrors = errors.reduce((acc, error) => {
        const severity = error.severity;
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(error);
        return acc;
    }, {} as Record<string, ValidationError[]>);

    return (
        <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Header Bar - 60px Fixed */}
            <header className="h-[60px] flex items-center justify-between px-6 border-b border-[var(--color-border-light)] bg-[var(--color-bg-primary)]">
                {/* Left: Title with Blue Dot */}
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-pulse"></div>
                    <h1 className="text-display text-lg font-semibold text-[var(--color-text-primary)]">
                        YAML Validator
                    </h1>
                </div>

                {/* Right: Settings & Theme Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowDocumentation(true)}
                        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors btn-press"
                        aria-label="Documentation"
                        title="Documentation"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors btn-press"
                        aria-label="Toggle theme"
                        title="Toggle theme"
                    >
                        {theme === 'light' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 overflow-hidden p-6 pb-0">
                <div className={`h-full max-w-[1600px] mx-auto flex gap-6 transition-all duration-300 ${showConsole ? 'mr-[424px]' : ''}`}>
                    {/* Input Panel */}
                    <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] overflow-hidden tint-input">
                        {/* Panel Header */}
                        <div className="h-10 flex items-center justify-between px-5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)]">
                            <div>
                                <div className="text-mono text-[13px] font-medium text-[var(--color-text-secondary)]">Input</div>
                                <div className="text-[11px] text-[var(--color-text-tertiary)]">Paste your YAML</div>
                            </div>
                            {inputYaml && (
                                <button
                                    onClick={handleClear}
                                    className="text-[13px] text-[var(--color-blue)] hover:opacity-70 transition-opacity btn-press"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {/* Editor */}
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                value={inputYaml}
                                onChange={(value) => setInputYaml(value || '')}
                                onMount={handleInputEditorMount}
                                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                                options={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 13,
                                    lineHeight: 20,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 20, bottom: 20 },
                                    renderLineHighlight: 'none',
                                    smoothScrolling: true,
                                    cursorBlinking: 'smooth',
                                    cursorWidth: 2,
                                    fontLigatures: true,
                                    lineNumbers: 'on',
                                    glyphMargin: false,
                                    folding: false,
                                    scrollbar: {
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        useShadows: false,
                                        verticalScrollbarSize: 8,
                                        horizontalScrollbarSize: 8,
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* Output Panel - Non-Editable Appearance */}
                    <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] overflow-hidden bg-[#F8F8F8] dark:bg-[#2A2A2A]" style={{ opacity: 0.95 }}>
                        {/* Panel Header with Actions */}
                        <div className="h-10 flex items-center justify-between px-5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)]">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-mono text-[13px] font-medium text-[var(--color-text-secondary)]">Output</div>
                                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                                        {fixEnabled ? 'Fixed YAML' : 'Validation only'}
                                    </div>
                                </div>
                                {outputYaml && (
                                    <div className={`status-pill ${isValid ? 'valid' : 'warning'}`}>
                                        {isValid ? '✓ Valid' : '⚠ Issues'}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Fix Toggle */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">Fix</span>
                                    <div
                                        className={`toggle-switch ${fixEnabled ? 'active' : ''}`}
                                        onClick={() => setFixEnabled(!fixEnabled)}
                                        title={fixEnabled ? 'Auto-fix enabled' : 'Auto-fix disabled'}
                                    />
                                </div>
                                {/* Validate Button */}
                                <button
                                    onClick={handleValidate}
                                    disabled={isValidating || !inputYaml.trim()}
                                    className="gradient-blue text-white px-4 py-2 rounded-lg text-[13px] font-semibold shadow-blue disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-all"
                                >
                                    {isValidating ? (
                                        <div className="flex items-center gap-2">
                                            <div className="spinner border-white border-t-transparent w-3 h-3"></div>
                                            <span>Validating...</span>
                                        </div>
                                    ) : (
                                        'Validate'
                                    )}
                                </button>
                                {/* Copy/Download */}
                                {outputYaml && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-blue)] transition-colors btn-press"
                                            aria-label="Copy"
                                            title="Copy"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-blue)] transition-colors btn-press"
                                            aria-label="Download"
                                            title="Download"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Editor - Read-only appearance */}
                        <div className="flex-1 relative">
                            {!outputYaml && (
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-tertiary)] text-[13px]">
                                    {fixEnabled ? 'Fixed YAML will appear here' : 'Enable fix toggle to see fixed YAML'}
                                </div>
                            )}
                            <Editor
                                height="100%"
                                defaultLanguage="yaml"
                                value={outputYaml}
                                onMount={handleOutputEditorMount}
                                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                                options={{
                                    readOnly: true,
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 13,
                                    lineHeight: 20,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 20, bottom: 20 },
                                    renderLineHighlight: 'none',
                                    smoothScrolling: true,
                                    fontLigatures: true,
                                    lineNumbers: 'on',
                                    glyphMargin: false,
                                    folding: false,
                                    domReadOnly: true,
                                    scrollbar: {
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        useShadows: false,
                                        verticalScrollbarSize: 8,
                                        horizontalScrollbarSize: 8,
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Console Slider - Right Side */}
            {showConsole && (
                <div className="fixed right-0 top-[60px] bottom-[32px] w-[400px] glass-strong border-l border-[var(--color-border)] z-40 flex flex-col animate-slide-in">
                    {/* Console Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Console</h3>
                        <button
                            onClick={() => setShowConsole(false)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors btn-press"
                            aria-label="Close console"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--color-border)]">
                        <button
                            onClick={() => setConsoleTab('fixes')}
                            className={`flex-1 px-4 py-2 text-[13px] font-medium transition-colors ${consoleTab === 'fixes'
                                    ? 'text-[var(--color-blue)] border-b-2 border-[var(--color-blue)]'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            Fixes ({fixedCount})
                        </button>
                        <button
                            onClick={() => setConsoleTab('errors')}
                            className={`flex-1 px-4 py-2 text-[13px] font-medium transition-colors ${consoleTab === 'errors'
                                    ? 'text-[var(--color-blue)] border-b-2 border-[var(--color-blue)]'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            Errors ({errors.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {consoleTab === 'fixes' ? (
                            <div className="space-y-3">
                                {changes.length > 0 ? (
                                    changes.map((change, idx) => (
                                        <div key={idx} className="glass rounded-lg p-3 border border-[var(--color-border)]">
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-[var(--color-green)] flex items-center justify-center text-white text-[10px] font-bold">
                                                    {change.line}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[11px] font-semibold uppercase text-[var(--color-green)] mb-1">
                                                        {change.type}
                                                    </div>
                                                    <div className="text-[12px] text-[var(--color-text-primary)] mb-2">
                                                        {change.reason}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[11px] text-[var(--color-text-tertiary)]">Before:</div>
                                                        <code className="block text-[11px] font-mono bg-[var(--color-bg-secondary)] px-2 py-1 rounded text-[var(--color-red)]">
                                                            {change.original}
                                                        </code>
                                                        <div className="text-[11px] text-[var(--color-text-tertiary)]">After:</div>
                                                        <code className="block text-[11px] font-mono bg-[var(--color-bg-secondary)] px-2 py-1 rounded text-[var(--color-green)]">
                                                            {change.fixed}
                                                        </code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--color-text-tertiary)] text-[13px]">
                                        No fixes applied
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {errors.length > 0 ? (
                                    Object.entries(groupedErrors).map(([severity, severityErrors]) => (
                                        <div key={severity}>
                                            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                                                {severity} ({severityErrors.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {severityErrors.map((error, idx) => (
                                                    <div key={idx} className={`error-card ${severity}`}>
                                                        <div className="flex items-start gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${severity === 'critical' || severity === 'error' ? 'bg-[var(--color-red)]' :
                                                                    severity === 'warning' ? 'bg-[var(--color-orange)]' : 'bg-[var(--color-blue)]'
                                                                }`}>
                                                                {error.line}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-[12px] font-medium text-[var(--color-text-primary)]">
                                                                    {error.message}
                                                                </div>
                                                                {error.code && (
                                                                    <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono mt-1">
                                                                        {error.code}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--color-text-tertiary)] text-[13px]">
                                        No errors found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer - Status Bar */}
            <footer className="h-[32px] flex items-center justify-between px-6 border-t border-[var(--color-border-light)] bg-[#FAFAFA] dark:bg-[#1E1E1E] text-[11px] text-[var(--color-text-secondary)]">
                {/* Left: Server Status */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${serverStatus === 'connected' ? 'bg-[var(--color-green)]' : 'bg-[var(--color-red)]'}`}></div>
                    <span>{serverStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
                </div>

                {/* Center: Empty */}
                <div></div>

                {/* Right: Versions */}
                <div className="flex items-center gap-4">
                    <span>Frontend v1.0.0</span>
                    <span className="text-[var(--color-border)]">|</span>
                    <span>API v1.2.0</span>
                </div>
            </footer>

            {/* Documentation Overlay */}
            {showDocumentation && (
                <>
                    <div className="overlay" onClick={() => setShowDocumentation(false)}></div>
                    <div className="fixed inset-4 glass-strong rounded-2xl z-[100] overflow-hidden flex flex-col animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Documentation</h2>
                            <button
                                onClick={() => setShowDocumentation(false)}
                                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors btn-press"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
                                <h3>YAML Validator</h3>
                                <p>A powerful, Apple-inspired YAML validation tool with automatic fixing capabilities for Kubernetes manifests and generic YAML files.</p>

                                <h4>Features</h4>
                                <ul>
                                    <li><strong>Real-time Validation:</strong> Instant YAML syntax and structure validation</li>
                                    <li><strong>Auto-Fix:</strong> Automatically fix common YAML errors and formatting issues</li>
                                    <li><strong>Kubernetes Support:</strong> Specialized validation for K8s resources</li>
                                    <li><strong>Error Console:</strong> Detailed error reporting with line numbers and suggestions</li>
                                    <li><strong>Dark Mode:</strong> Beautiful light and dark themes</li>
                                </ul>

                                <h4>Supported Kubernetes Resources</h4>
                                <ul>
                                    <li>Deployments, StatefulSets, DaemonSets</li>
                                    <li>Services, Ingress, ConfigMaps</li>
                                    <li>Pods, Jobs, CronJobs</li>
                                    <li>PersistentVolumes, PersistentVolumeClaims</li>
                                    <li>And 10+ more resource types</li>
                                </ul>

                                <h4>Keyboard Shortcuts</h4>
                                <ul>
                                    <li><code>Cmd/Ctrl + Enter</code> - Validate YAML</li>
                                    <li><code>Cmd/Ctrl + S</code> - Download fixed YAML</li>
                                    <li><code>Cmd/Ctrl + L</code> - Clear all</li>
                                    <li><code>Esc</code> - Close panels</li>
                                </ul>

                                <h4>How to Use</h4>
                                <ol>
                                    <li>Paste your YAML content in the left input panel</li>
                                    <li>Enable the "Fix" toggle if you want automatic fixes</li>
                                    <li>Click "Validate" to check your YAML</li>
                                    <li>View fixes and errors in the console slider</li>
                                    <li>Copy or download the fixed YAML from the output panel</li>
                                </ol>

                                <h4>API Information</h4>
                                <p>The validator uses a backend API running on <code>http://localhost:3001</code></p>
                                <p><strong>Endpoint:</strong> <code>POST /api/yaml/validate</code></p>
                                <p><strong>Features:</strong> Security checks, best practices validation, resource-specific rules</p>

                                <h4>Version Information</h4>
                                <p>Frontend: v1.0.0 | Backend API: v1.2.0</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Toast Notifications */}
            <div className="fixed top-20 right-6 z-[100] space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="glass-strong texture px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up"
                    >
                        <span className={`text-lg ${toast.type === 'success' ? 'text-[var(--color-green)]' :
                                toast.type === 'error' ? 'text-[var(--color-red)]' : 'text-[var(--color-blue)]'
                            }`}>
                            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
                        </span>
                        <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* Confetti */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[200]">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10px',
                                animation: `confetti-fall ${2 + Math.random()}s linear forwards`,
                                animationDelay: `${Math.random() * 0.5}s`,
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#34C759', '#30D158', '#007AFF', '#0A84FF'][Math.floor(Math.random() * 4)],
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
