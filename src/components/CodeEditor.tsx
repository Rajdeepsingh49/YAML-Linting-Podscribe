import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor, type OnMount } from '@monaco-editor/react';

export interface EditorMarker {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    message: string;
    severity: number; // monaco.MarkerSeverity
}

interface CodeEditorProps {
    value: string;
    onChange?: (value: string | undefined) => void;
    markers?: EditorMarker[];
    theme?: 'light' | 'dark';
    diffMode?: boolean;
    originalValue?: string;
    modifiedValue?: string;
    readOnly?: boolean;
}

/**
 * CodeEditor Component - Modern Theme Support
 * Features: Custom light/dark themes, smooth integration
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    markers = [],
    theme = 'light',
    diffMode = false,
    originalValue = '',
    modifiedValue = '',
    readOnly = false
}) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Define custom light theme
        monaco.editor.defineTheme('modern-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '718096', fontStyle: 'italic' },
                { token: 'keyword', foreground: '2563EB', fontStyle: 'bold' },
                { token: 'string', foreground: '10B981' },
                { token: 'number', foreground: 'F59E0B' },
                { token: 'type', foreground: '7C3AED' },
                { token: 'variable', foreground: 'EF4444' },
            ],
            colors: {
                'editor.background': '#FFFFFF',
                'editor.foreground': '#1A1A1A',
                'editor.lineHighlightBackground': '#F8F9FA',
                'editor.selectionBackground': '#2563EB40',
                'editorLineNumber.foreground': '#718096',
                'editorLineNumber.activeForeground': '#4A5568',
                'editorCursor.foreground': '#2563EB',
                'editor.selectionHighlightBackground': '#2563EB30',
                'editorIndentGuide.background': '#F1F3F5',
                'editorIndentGuide.activeBackground': '#E2E8F0',
                'editorWidget.background': '#FFFFFF',
                'editorWidget.border': '#E2E8F0',
            },
        });

        // Define custom dark theme
        monaco.editor.defineTheme('modern-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
                { token: 'keyword', foreground: '3B82F6', fontStyle: 'bold' },
                { token: 'string', foreground: '34D399' },
                { token: 'number', foreground: 'FBBF24' },
                { token: 'type', foreground: '8B5CF6' },
                { token: 'variable', foreground: 'F87171' },
            ],
            colors: {
                'editor.background': '#121212', // Pure blackish
                'editor.foreground': '#F5F5F7',
                'editor.lineHighlightBackground': '#1C1C1E',
                'editor.selectionBackground': '#3B82F640',
                'editorLineNumber.foreground': '#636366',
                'editorLineNumber.activeForeground': '#98989D',
                'editorCursor.foreground': '#0A84FF',
                'editor.selectionHighlightBackground': '#1A3045',
                'editorIndentGuide.background': '#2C2C2E',
                'editorIndentGuide.activeBackground': '#48484A',
                'editorWidget.background': '#1C1C1E',
                'editorWidget.border': '#2C2C2E',
            },
        });

        monaco.editor.setTheme(theme === 'dark' ? 'modern-dark' : 'modern-light');
    };

    // Update theme when prop changes
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(theme === 'dark' ? 'modern-dark' : 'modern-light');
        }
    }, [theme]);

    // Apply markers when they change
    useEffect(() => {
        if (monacoRef.current && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelMarkers(model, 'owner', markers);
            }
        }
    }, [markers]);

    return (
        <div className="h-full w-full bg-[var(--color-bg-card)]">
            <div className="h-full">
                {diffMode ? (
                    <DiffEditor
                        height="100%"
                        original={originalValue}
                        modified={modifiedValue}
                        onMount={(editor, monaco) => {
                            // Reuse the same theme setup logic
                            handleEditorDidMount(editor as any, monaco);
                        }}
                        theme={theme === 'dark' ? 'modern-dark' : 'modern-light'}
                        options={{
                            readOnly: true,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
                            fontSize: 14,
                            lineHeight: 22,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 },
                            renderSideBySide: true,
                            smoothScrolling: true,
                            fontLigatures: true,
                            lineNumbers: 'on',
                            glyphMargin: false,
                            folding: true,
                            renderOverviewRuler: false,
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto',
                                useShadows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            },
                        }}
                    />
                ) : (
                    <Editor
                        height="100%"
                        defaultLanguage="yaml"
                        value={value}
                        onChange={onChange}
                        onMount={handleEditorDidMount}
                        theme={theme === 'dark' ? 'modern-dark' : 'modern-light'}
                        options={{
                            readOnly: readOnly,
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace",
                            lineHeight: 22,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20, bottom: 20 },
                            renderLineHighlight: 'all',
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            cursorSmoothCaretAnimation: 'on',
                            fontLigatures: true,
                            lineNumbers: 'on',
                            glyphMargin: false,
                            folding: true,
                            lineDecorationsWidth: 0,
                            lineNumbersMinChars: 4,
                            renderWhitespace: 'selection',
                            scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto',
                                useShadows: false,
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                            },
                            bracketPairColorization: {
                                enabled: true,
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
};
