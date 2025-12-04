/**
 * Error Reporter
 * 
 * Enhanced error reporting with rich metadata, diff views,
 * and summary statistics for YAML validation fixes.
 */

import type { FixChange } from '../semantic/intelligent-fixer.js';

// ==========================================
// TYPES
// ==========================================

export interface FixReport {
    lineNumber: number;
    column?: number;
    originalText: string;
    problemType: 'syntax' | 'structure' | 'semantic' | 'type';
    appliedFix: string;
    confidence: number;
    reason: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    ruleId?: string;
}

export interface ValidationSummary {
    totalIssues: number;
    byCategory: {
        syntax: number;
        structure: number;
        semantic: number;
        type: number;
    };
    bySeverity: {
        critical: number;
        error: number;
        warning: number;
        info: number;
    };
    byConfidence: {
        high: number;    // >= 0.9
        medium: number;  // >= 0.7 and < 0.9
        low: number;     // < 0.7
    };
    parsingSuccess: boolean;
    fixedCount: number;
    remainingIssues: number;
    overallConfidence: number;
    processingTimeMs: number;
}

export interface DiffLine {
    type: 'unchanged' | 'removed' | 'added' | 'modified';
    lineNumber: number;
    originalLineNumber?: number;
    content: string;
    originalContent?: string;
}

export interface DiffView {
    lines: DiffLine[];
    changedLineCount: number;
    addedLineCount: number;
    removedLineCount: number;
}

export interface GroupedChanges {
    byType: Map<string, FixReport[]>;
    bySeverity: Map<string, FixReport[]>;
    byLine: Map<number, FixReport[]>;
}

export interface FullReport {
    summary: ValidationSummary;
    reports: FixReport[];
    grouped: GroupedChanges;
    diff: DiffView;
    originalContent: string;
    fixedContent: string;
    isValid: boolean;
    errors: string[];
}

// ==========================================
// ERROR REPORTER CLASS
// ==========================================

export class ErrorReporter {
    private reports: FixReport[];
    private startTime: number;

    constructor() {
        this.reports = [];
        this.startTime = Date.now();
    }

    /**
     * Start a new reporting session
     */
    startSession(): void {
        this.reports = [];
        this.startTime = Date.now();
    }

    /**
     * Add a fix change as a report
     */
    addChange(change: FixChange): void {
        this.reports.push({
            lineNumber: change.line,
            originalText: change.original,
            problemType: change.type as any,
            appliedFix: change.fixed,
            confidence: change.confidence,
            reason: change.reason,
            severity: change.severity,
            ruleId: this.getRuleId(change)
        });
    }

    /**
     * Add multiple changes
     */
    addChanges(changes: FixChange[]): void {
        for (const change of changes) {
            this.addChange(change);
        }
    }

    /**
     * Generate rule ID from change type and reason
     */
    private getRuleId(change: FixChange): string {
        const type = change.type.toUpperCase();
        const reason = change.reason.toLowerCase();

        if (reason.includes('missing colon')) return `${type}/MISSING_COLON`;
        if (reason.includes('typo')) return `${type}/TYPO`;
        if (reason.includes('indentation')) return `${type}/INDENT`;
        if (reason.includes('quote')) return `${type}/QUOTE`;
        if (reason.includes('relocated')) return `${type}/RELOCATE`;
        if (reason.includes('converted')) return `${type}/COERCE`;
        if (reason.includes('space')) return `${type}/SPACING`;

        return `${type}/GENERAL`;
    }

    /**
     * Generate validation summary
     */
    generateSummary(isValid: boolean): ValidationSummary {
        const summary: ValidationSummary = {
            totalIssues: this.reports.length,
            byCategory: { syntax: 0, structure: 0, semantic: 0, type: 0 },
            bySeverity: { critical: 0, error: 0, warning: 0, info: 0 },
            byConfidence: { high: 0, medium: 0, low: 0 },
            parsingSuccess: isValid,
            fixedCount: this.reports.length,
            remainingIssues: isValid ? 0 : 1,
            overallConfidence: this.calculateOverallConfidence(),
            processingTimeMs: Date.now() - this.startTime
        };

        for (const report of this.reports) {
            // By category
            summary.byCategory[report.problemType]++;

            // By severity
            summary.bySeverity[report.severity]++;

            // By confidence
            if (report.confidence >= 0.9) {
                summary.byConfidence.high++;
            } else if (report.confidence >= 0.7) {
                summary.byConfidence.medium++;
            } else {
                summary.byConfidence.low++;
            }
        }

        return summary;
    }

    /**
     * Calculate overall confidence
     */
    private calculateOverallConfidence(): number {
        if (this.reports.length === 0) return 1.0;

        const total = this.reports.reduce((sum, r) => sum + r.confidence, 0);
        return total / this.reports.length;
    }

    /**
     * Group changes by various criteria
     */
    groupChanges(): GroupedChanges {
        const byType = new Map<string, FixReport[]>();
        const bySeverity = new Map<string, FixReport[]>();
        const byLine = new Map<number, FixReport[]>();

        for (const report of this.reports) {
            // By type
            if (!byType.has(report.problemType)) {
                byType.set(report.problemType, []);
            }
            byType.get(report.problemType)!.push(report);

            // By severity
            if (!bySeverity.has(report.severity)) {
                bySeverity.set(report.severity, []);
            }
            bySeverity.get(report.severity)!.push(report);

            // By line
            if (!byLine.has(report.lineNumber)) {
                byLine.set(report.lineNumber, []);
            }
            byLine.get(report.lineNumber)!.push(report);
        }

        return { byType, bySeverity, byLine };
    }

    /**
     * Generate diff view between original and fixed content
     */
    generateDiff(original: string, fixed: string): DiffView {
        const originalLines = original.split('\n');
        const fixedLines = fixed.split('\n');
        const diffLines: DiffLine[] = [];

        let addedCount = 0;
        let removedCount = 0;
        let changedCount = 0;

        // Simple line-by-line diff
        const maxLines = Math.max(originalLines.length, fixedLines.length);

        for (let i = 0; i < maxLines; i++) {
            const originalLine = originalLines[i];
            const fixedLine = fixedLines[i];

            if (originalLine === undefined && fixedLine !== undefined) {
                // Added line
                diffLines.push({
                    type: 'added',
                    lineNumber: i + 1,
                    content: fixedLine
                });
                addedCount++;
            } else if (originalLine !== undefined && fixedLine === undefined) {
                // Removed line
                diffLines.push({
                    type: 'removed',
                    lineNumber: i + 1,
                    originalLineNumber: i + 1,
                    content: originalLine
                });
                removedCount++;
            } else if (originalLine !== fixedLine) {
                // Modified line
                diffLines.push({
                    type: 'modified',
                    lineNumber: i + 1,
                    originalLineNumber: i + 1,
                    content: fixedLine!,
                    originalContent: originalLine
                });
                changedCount++;
            } else {
                // Unchanged line
                diffLines.push({
                    type: 'unchanged',
                    lineNumber: i + 1,
                    originalLineNumber: i + 1,
                    content: originalLine!
                });
            }
        }

        return {
            lines: diffLines,
            changedLineCount: changedCount,
            addedLineCount: addedCount,
            removedLineCount: removedCount
        };
    }

    /**
     * Generate full report
     */
    generateFullReport(original: string, fixed: string, isValid: boolean, errors: string[] = []): FullReport {
        return {
            summary: this.generateSummary(isValid),
            reports: [...this.reports],
            grouped: this.groupChanges(),
            diff: this.generateDiff(original, fixed),
            originalContent: original,
            fixedContent: fixed,
            isValid,
            errors
        };
    }

    /**
     * Get reports sorted by line number
     */
    getReportsByLine(): FixReport[] {
        return [...this.reports].sort((a, b) => a.lineNumber - b.lineNumber);
    }

    /**
     * Get reports sorted by severity
     */
    getReportsBySeverity(): FixReport[] {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        return [...this.reports].sort((a, b) =>
            severityOrder[a.severity] - severityOrder[b.severity]
        );
    }

    /**
     * Get low confidence reports that need user review
     */
    getLowConfidenceReports(threshold: number = 0.7): FixReport[] {
        return this.reports.filter(r => r.confidence < threshold);
    }

    /**
     * Format report as text
     */
    formatAsText(): string {
        const lines: string[] = [];

        lines.push('═'.repeat(60));
        lines.push('YAML Validation Report');
        lines.push('═'.repeat(60));
        lines.push('');

        // Summary
        const summary = this.generateSummary(true);
        lines.push('SUMMARY:');
        lines.push(`  Total Issues: ${summary.totalIssues}`);
        lines.push(`  Fixed: ${summary.fixedCount}`);
        lines.push(`  Overall Confidence: ${(summary.overallConfidence * 100).toFixed(1)}%`);
        lines.push(`  Processing Time: ${summary.processingTimeMs}ms`);
        lines.push('');

        // By category
        lines.push('BY CATEGORY:');
        lines.push(`  Syntax:    ${summary.byCategory.syntax}`);
        lines.push(`  Structure: ${summary.byCategory.structure}`);
        lines.push(`  Semantic:  ${summary.byCategory.semantic}`);
        lines.push(`  Type:      ${summary.byCategory.type}`);
        lines.push('');

        // By severity
        lines.push('BY SEVERITY:');
        lines.push(`  Critical: ${summary.bySeverity.critical}`);
        lines.push(`  Error:    ${summary.bySeverity.error}`);
        lines.push(`  Warning:  ${summary.bySeverity.warning}`);
        lines.push(`  Info:     ${summary.bySeverity.info}`);
        lines.push('');

        // Details
        lines.push('─'.repeat(60));
        lines.push('CHANGES:');
        lines.push('─'.repeat(60));

        for (const report of this.getReportsByLine()) {
            lines.push('');
            lines.push(`Line ${report.lineNumber}: [${report.severity.toUpperCase()}] ${report.ruleId}`);
            lines.push(`  Problem: ${report.reason}`);
            lines.push(`  Before:  ${report.originalText.trim()}`);
            lines.push(`  After:   ${report.appliedFix.trim()}`);
            lines.push(`  Confidence: ${(report.confidence * 100).toFixed(0)}%`);
        }

        lines.push('');
        lines.push('═'.repeat(60));

        return lines.join('\n');
    }

    /**
     * Format report as JSON
     */
    formatAsJson(): string {
        return JSON.stringify(this.generateFullReport('', '', true), null, 2);
    }

    /**
     * Format diff as unified diff format
     */
    formatDiffUnified(original: string, fixed: string): string {
        const diff = this.generateDiff(original, fixed);
        const lines: string[] = [];

        lines.push('--- original');
        lines.push('+++ fixed');

        for (const line of diff.lines) {
            switch (line.type) {
                case 'unchanged':
                    lines.push(` ${line.content}`);
                    break;
                case 'removed':
                    lines.push(`-${line.content}`);
                    break;
                case 'added':
                    lines.push(`+${line.content}`);
                    break;
                case 'modified':
                    lines.push(`-${line.originalContent}`);
                    lines.push(`+${line.content}`);
                    break;
            }
        }

        return lines.join('\n');
    }

    /**
     * Get all reports
     */
    getReports(): FixReport[] {
        return [...this.reports];
    }

    /**
     * Clear all reports
     */
    clear(): void {
        this.reports = [];
        this.startTime = Date.now();
    }
}

// ==========================================
// EXPORTS
// ==========================================

export const errorReporter = new ErrorReporter();

/**
 * Create a new error reporter instance
 */
export function createErrorReporter(): ErrorReporter {
    return new ErrorReporter();
}
