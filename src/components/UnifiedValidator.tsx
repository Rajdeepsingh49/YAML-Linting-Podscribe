import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Documentation } from './Documentation';

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
            setChanges(data.changes || []);
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
        <div className="h-screen flex flex-col bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] overflow-hidden font-sans animate-fade-in-soft" data-theme={theme}>
            {/* Header Bar - Clean & Borderless */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl z-30 animate-slide-down">
                {/* Left: Brand (logo + name) - refined and centered vertically */}
                <div className="flex items-center gap-0">
                    <div className="leading-tight">
                        <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Podscribe</h1>
                        <div className="text-[11px] text-[var(--color-text-tertiary)] -mt-0.5">Kubernetes YAML Linter</div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">
                    {/* Console Toggle */}
                    <button
                        onClick={() => setShowConsole(!showConsole)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 btn-press ${showConsole
                            ? 'bg-[var(--color-blue)] text-white shadow-sm'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]/60'
                            }`}
                        title="Toggle Console"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Console</span>
                        {(changes.length > 0 || errors.length > 0) && (
                            <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-white/25 text-[10px] font-bold">
                                {changes.length + errors.length}
                            </span>
                        )}
                    </button>

                    {/* Documentation */}
                    <button
                        onClick={() => setShowDocumentation(true)}
                        className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]/60 transition-all btn-press btn-hover"
                        title="Documentation"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]/60 transition-all btn-press btn-hover"
                        title="Toggle Theme"
                    >
                        {theme === 'light' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Workspace Area */}
            <div className="flex-1 flex overflow-hidden bg-[var(--color-bg-secondary)]">
                {/* Editor Area */}
                <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                    <div className="flex-1 flex h-full">
                        {/* Input Panel */}
                        <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)] animate-slide-up" style={{ animationDelay: '100ms' }}>
                            {/* Panel Header - Borderless */}
                            <div className="h-11 flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]/40">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue)]"></div>
                                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Input YAML</span>
                                </div>
                                {inputYaml && (
                                    <button
                                        onClick={handleClear}
                                        className="text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-red)] transition-colors px-2 py-1 rounded-full hover:bg-[var(--color-bg-primary)]/80 btn-press"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {/* Editor */}
                            <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    defaultLanguage="yaml"
                                    value={inputYaml}
                                    onChange={(value) => setInputYaml(value || '')}
                                    onMount={handleInputEditorMount}
                                    theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                                    options={{
                                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                        fontSize: 13,
                                        lineHeight: 21,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        padding: { top: 20, bottom: 20 },
                                        renderLineHighlight: 'all',
                                        smoothScrolling: true,
                                        cursorBlinking: 'smooth',
                                        cursorWidth: 2,
                                        fontLigatures: true,
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        folding: true,
                                        scrollbar: {
                                            vertical: 'visible',
                                            horizontal: 'visible',
                                            useShadows: false,
                                            verticalScrollbarSize: 10,
                                            horizontalScrollbarSize: 10,
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Output Panel */}
                        <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)] animate-slide-up" style={{ animationDelay: '200ms' }}>
                            {/* Panel Header - Borderless & Elegant */}
                            <div className="h-11 flex items-center justify-between px-4 bg-[var(--color-bg-secondary)]/40">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${outputYaml ? (isValid ? 'bg-[var(--color-green)]' : 'bg-[var(--color-orange)]') : 'bg-[var(--color-text-tertiary)]/50'}`}></div>
                                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                        {fixEnabled ? 'Fixed Output' : 'Validation'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {/* Auto-Fix Toggle - Borderless Pill */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-bg-primary)]/80">
                                        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Auto-Fix</span>
                                        <div
                                            className={`relative w-8 h-[18px] rounded-full transition-all cursor-pointer btn-press ${fixEnabled ? 'bg-[var(--color-green)]' : 'bg-[var(--color-text-tertiary)]/30'}`}
                                            onClick={() => setFixEnabled(!fixEnabled)}
                                        >
                                            <div className={`absolute top-[3px] left-[3px] w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${fixEnabled ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                                        </div>
                                    </div>

                                    {/* Validate Button - Clean Pill */}
                                    <button
                                        onClick={handleValidate}
                                        disabled={isValidating || !inputYaml.trim()}
                                        className="flex items-center gap-1.5 bg-[var(--color-blue)] hover:bg-[var(--color-blue-dark)] text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 btn-hover"
                                    >
                                        {isValidating ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Validating</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Validate</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Actions - Borderless Icons */}
                                    {outputYaml && (
                                        <div className="flex items-center gap-0.5 ml-1">
                                            <button
                                                onClick={handleCopy}
                                                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-blue)] hover:bg-[var(--color-bg-primary)]/80 rounded-full transition-colors btn-press btn-hover"
                                                title="Copy to clipboard"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-blue)] hover:bg-[var(--color-bg-primary)]/80 rounded-full transition-colors btn-press btn-hover"
                                                title="Download YAML"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Editor */}
                            <div className="flex-1 relative">
                                {!outputYaml && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-tertiary)] z-10">
                                        <svg className="w-16 h-16 mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-[13px] font-medium">Validation results will appear here</p>
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
                                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                        fontSize: 13,
                                        lineHeight: 21,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        padding: { top: 20, bottom: 20 },
                                        renderLineHighlight: 'none',
                                        smoothScrolling: true,
                                        fontLigatures: true,
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        folding: true,
                                        domReadOnly: true,
                                        scrollbar: {
                                            vertical: 'visible',
                                            horizontal: 'visible',
                                            useShadows: false,
                                            verticalScrollbarSize: 10,
                                            horizontalScrollbarSize: 10,
                                        },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </main>

                {/* Console Sidebar - Refined & Polished */}
                {
                    showConsole && (
                        <aside className="w-[360px] flex-shrink-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-3xl flex flex-col animate-slide-in-right z-20 shadow-xl">
                            {/* Console Header */}
                            <div className="h-11 flex items-center justify-between px-3.5 bg-[var(--color-bg-secondary)]/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-blue-dark)] flex items-center justify-center shadow-sm">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Console</span>
                                </div>
                                <button
                                    onClick={() => setShowConsole(false)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]/50 transition-all btn-press btn-hover"
                                    title="Close"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tabs - Segmented Control */}
                            <div className="px-3 py-2">
                                <div className="flex p-0.5 rounded-lg bg-[var(--color-bg-secondary)]/50">
                                    <button
                                        onClick={() => setConsoleTab('fixes')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold transition-all duration-150 btn-press ${consoleTab === 'fixes'
                                            ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Fixes
                                        {changes.length > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-green)] text-white text-[9px] font-bold flex items-center justify-center">
                                                {changes.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setConsoleTab('errors')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold transition-all duration-150 btn-press ${consoleTab === 'errors'
                                            ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Errors
                                        {errors.length > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-red)] text-white text-[9px] font-bold flex items-center justify-center">
                                                {errors.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                                {consoleTab === 'fixes' ? (
                                    changes.length > 0 ? (
                                        changes.map((change, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-[var(--color-bg-secondary)]/40 rounded-lg p-3 hover:bg-[var(--color-bg-secondary)]/60 transition-all animate-fade-in-soft"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    {/* Line Number */}
                                                    <div className="w-7 h-7 rounded-md bg-[var(--color-green)]/15 text-[var(--color-green)] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                        {change.line}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {/* Type */}
                                                        <span className="inline-block text-[9px] font-bold uppercase text-[var(--color-green)] tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-green)]/10 mb-1.5">
                                                            {change.type}
                                                        </span>
                                                        {/* Reason */}
                                                        <p className="text-[10px] text-[var(--color-text-primary)] mb-2 leading-relaxed font-medium">
                                                            {change.reason}
                                                        </p>
                                                        {/* Diff */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-start gap-1.5">
                                                                <span className="text-[8px] font-bold text-[var(--color-red)] w-8 pt-1">FROM</span>
                                                                <code className="flex-1 text-[9px] font-mono bg-[var(--color-red)]/10 text-[var(--color-red)] px-2 py-1 rounded break-all">
                                                                    {change.original}
                                                                </code>
                                                            </div>
                                                            <div className="flex items-start gap-1.5">
                                                                <span className="text-[8px] font-bold text-[var(--color-green)] w-8 pt-1">TO</span>
                                                                <code className="flex-1 text-[9px] font-mono bg-[var(--color-green)]/10 text-[var(--color-green)] px-2 py-1 rounded break-all">
                                                                    {change.fixed}
                                                                </code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-[var(--color-text-tertiary)] animate-fade-in-soft">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)]/50 flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-medium">No fixes applied</p>
                                            <p className="text-[10px] mt-0.5 opacity-50">Run validation to see fixes</p>
                                        </div>
                                    )
                                ) : (
                                    errors.length > 0 ? (
                                        Object.entries(groupedErrors).map(([severity, severityErrors], groupIdx) => (
                                            <div key={severity} className="space-y-1.5 animate-fade-in-soft" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                                                <div className="flex items-center gap-1.5 px-0.5 py-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${severity === 'critical' || severity === 'error' ? 'bg-[var(--color-red)]' : severity === 'warning' ? 'bg-[var(--color-orange)]' : 'bg-[var(--color-blue)]'}`}></span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                                                        {severity} · {severityErrors.length}
                                                    </span>
                                                </div>
                                                {severityErrors.map((error, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`bg-[var(--color-bg-secondary)]/40 rounded-lg p-3 hover:bg-[var(--color-bg-secondary)]/60 transition-all border-l-[3px] ${severity === 'critical' || severity === 'error' ? 'border-l-[var(--color-red)]' :
                                                            severity === 'warning' ? 'border-l-[var(--color-orange)]' : 'border-l-[var(--color-blue)]'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <span className="text-[9px] font-mono bg-[var(--color-bg-primary)]/50 px-1.5 py-0.5 rounded text-[var(--color-text-secondary)] font-bold">
                                                                L{error.line}
                                                            </span>
                                                            {error.code && (
                                                                <span className="text-[9px] font-mono text-[var(--color-text-tertiary)]">
                                                                    {error.code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] font-medium text-[var(--color-text-primary)] leading-relaxed">
                                                            {error.message}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 text-[var(--color-text-tertiary)] animate-fade-in-soft">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)]/50 flex items-center justify-center mb-3">
                                                <svg className="w-6 h-6 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-medium">No errors found</p>
                                            <p className="text-[10px] mt-0.5 opacity-50">Your YAML is valid!</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </aside>
                    )
                }
            </div >

            {/* Footer - Status Bar */}
            < footer className="h-[32px] flex-shrink-0 flex items-center justify-between px-6 border-t border-[var(--color-border-light)] bg-[var(--color-bg-primary)] text-[11px] text-[var(--color-text-secondary)]" >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'connected' ? 'bg-[var(--color-green)]' : 'bg-[var(--color-red)]'}`}></div>
                        <span className="font-medium">{serverStatus === 'connected' ? 'System Online' : 'System Offline'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span>Frontend v2.0.0</span>
                    <span className="text-[var(--color-border)]">|</span>
                    <span>Validator Engine v1.5.0</span>
                </div>
            </footer >

            {/* Documentation Overlay - Full Screen */}
            {
                showDocumentation && (
                    <div className="fixed inset-0 z-50 bg-[var(--color-bg-primary)] animate-fade-in">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setShowDocumentation(false)}
                                className="p-2 rounded-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] shadow-md transition-all hover:scale-105 btn-press"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <Documentation />
                    </div>
                )
            }

            {/* Toast Notifications */}
            <div className="fixed top-20 right-6 z-[100] space-y-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="glass-strong texture px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up pointer-events-auto border border-[var(--color-border)]/50"
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
            {
                showConfetti && (
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
                )
            }
        </div >
    );
};
