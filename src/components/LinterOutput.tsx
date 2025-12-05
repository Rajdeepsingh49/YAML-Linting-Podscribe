import React from 'react';

interface ValidationError {
    message: string;
    field?: string;
    line?: number | null;
    column?: number | null;
    details?: string;
    severity?: 'error' | 'warning';
    kind?: string;
    document?: number;
    code?: string;
    fixable?: boolean;
}

interface LinterOutputProps {
    isValid: boolean | null;
    errors: ValidationError[];
    warnings: ValidationError[];
    indentationErrors?: ValidationError[];
    loading: boolean;
    documentCount?: number;
    onFixIndentation?: () => void;
    onFixSyntax?: () => void;
}

/**
 * LinterOutput Component - Minimalist Pixel-Perfect Design
 */
export const LinterOutput: React.FC<LinterOutputProps> = ({
    isValid,
    errors,
    warnings,
    indentationErrors = [],
    loading,

    onFixIndentation,
    onFixSyntax
}) => {
    // Loading state
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--color-blue)]/30 border-t-[var(--color-blue)] rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        Validating...
                    </p>
                </div>
            </div>
        );
    }

    const hasIndentationErrors = indentationErrors.length > 0;
    const totalIssues = errors.length + warnings.length + indentationErrors.length;

    // Empty state
    if (isValid === null && totalIssues === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[var(--color-bg-card)] p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                    Ready to Validate
                </h3>
                <p className="text-xs text-[var(--color-text-tertiary)] max-w-[200px]">
                    Paste your Kubernetes manifest to see validation results
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-card)]">
            {/* Minimal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Results
                    </h2>
                    {totalIssues > 0 ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-red)]/10 text-[var(--color-red)] rounded-full border border-[var(--color-red)]/20">
                            {totalIssues} Issue{totalIssues !== 1 ? 's' : ''}
                        </span>
                    ) : isValid ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-green)]/10 text-[var(--color-green)] rounded-full border border-[var(--color-green)]/20">
                            Valid
                        </span>
                    ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {(hasIndentationErrors || onFixSyntax) && (
                        <>
                            {hasIndentationErrors && onFixIndentation && (
                                <button
                                    onClick={onFixIndentation}
                                    className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-md transition-all flex items-center gap-1.5 btn-press btn-hover"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue)]"></span>
                                    Fix Indentation
                                </button>
                            )}
                            {onFixSyntax && (
                                <button
                                    onClick={onFixSyntax}
                                    className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-md transition-all flex items-center gap-1.5 btn-press btn-hover"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-purple)]"></span>
                                    Fix Syntax
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Success State */}
                {totalIssues === 0 && isValid && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-0 animate-fade-in-soft" style={{ animationFillMode: 'forwards' }}>
                        <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-green)]/20 to-[var(--color-green)]/5 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[var(--color-green)]/20 animate-scale-in">
                            <svg className="w-8 h-8 text-[var(--color-green)]" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">
                            No Issues Found
                        </h3>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                            Your manifest is syntactically correct.
                        </p>
                    </div>
                )}

                {/* Indentation Errors */}
                {hasIndentationErrors && (
                    <section className="space-y-3 animate-fade-in-soft" style={{ animationDelay: '100ms' }}>
                        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider pl-1">
                            Indentation
                        </h3>
                        <div className="grid gap-2">
                            {indentationErrors.map((error, index) => (
                                <IssueCard
                                    key={`indent-${index}`}
                                    error={error}
                                    type="indentation"
                                    index={index}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Schema Errors */}
                {errors.length > 0 && (
                    <section className="space-y-3 animate-fade-in-soft" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider pl-1">
                            Schema Violations
                        </h3>
                        <div className="grid gap-2">
                            {errors.map((error, index) => (
                                <IssueCard
                                    key={`error-${index}`}
                                    error={error}
                                    type="error"
                                    index={index}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                    <section className="space-y-3 animate-fade-in-soft" style={{ animationDelay: '300ms' }}>
                        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider pl-1">
                            Warnings
                        </h3>
                        <div className="grid gap-2">
                            {warnings.map((warning, index) => (
                                <IssueCard
                                    key={`warning-${index}`}
                                    error={warning}
                                    type="warning"
                                    index={index}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

/**
 * Minimalist Issue Card
 */
const IssueCard: React.FC<{ error: ValidationError; type: 'indentation' | 'error' | 'warning'; index: number }> = ({ error, type, index }) => {
    const colors = {
        indentation: 'var(--color-blue)',
        error: 'var(--color-red)',
        warning: 'var(--color-orange)'
    };

    const color = colors[type];

    return (
        <div
            className="group flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-border-hover)] transition-all duration-200 hover:shadow-sm hover:translate-x-1 animate-fade-in-soft"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Line Number Indicator */}
            <div className="flex flex-col items-center min-w-[2.5rem] pt-0.5">
                <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase">Line</span>
                <span className="text-sm font-mono font-bold" style={{ color }}>
                    {error.line || '-'}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-[var(--color-text-primary)] font-medium leading-snug">
                        {error.message}
                    </p>
                    {error.fixable && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                            AUTOFIX
                        </span>
                    )}
                </div>

                {(error.field || error.details) && (
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                        {error.field && (
                            <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-mono border border-[var(--color-border)]">
                                {error.field}
                            </code>
                        )}
                        {error.details && (
                            <span className="text-[var(--color-text-tertiary)] truncate max-w-full">
                                {error.details}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
