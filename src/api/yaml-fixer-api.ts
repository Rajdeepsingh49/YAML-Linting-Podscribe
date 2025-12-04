/**
 * Enhanced TypeScript API client for YAML Fixer
 * 
 * Provides rich error reporting with confidence scoring,
 * pass breakdown, and detailed fix information.
 */

// ==========================================
// TYPES
// ==========================================

export interface FixOptions {
    aggressive?: boolean;
    indentSize?: number;
    confidenceThreshold?: number;
    maxIterations?: number;
    autoFix?: boolean;
}

export interface FixChange {
    type: 'syntax' | 'structure' | 'semantic' | 'type';
    line: number;
    column?: number;
    original: string;
    fixed: string;
    reason: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    confidence: number;
    ruleId?: string;
}

export interface ValidationError {
    line: number;
    column?: number;
    message: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    code: string;
    fixable: boolean;
}

export interface PassBreakdown {
    pass: number;
    name: string;
    changesCount: number;
    duration: number;
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
        high: number;
        medium: number;
        low: number;
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

export interface FixResponse {
    success: boolean;
    fixed: string;
    errors: ValidationError[];
    changes: FixChange[];
    fixedCount: number;
    confidence: number;
    isValid: boolean;
    passBreakdown: PassBreakdown[];
    summary?: ValidationSummary;
    diff?: DiffView;
    phase?: string;
    error?: string;
    // Low confidence changes that may need review
    needsReview?: FixChange[];
}

export interface ValidateResponse {
    valid: boolean;
    errors: ValidationError[];
    structuralIssues: any[];
    detectedKind?: string;
    detectedApiVersion?: string;
    error?: string;
}

// ==========================================
// API CLIENT
// ==========================================

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001';

/**
 * Fix broken YAML content with rich reporting
 */
export async function fixYaml(content: string, options: FixOptions = {}): Promise<FixResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/yaml/fix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                options: {
                    confidenceThreshold: 0.7,
                    maxIterations: 3,
                    indentSize: 2,
                    autoFix: true,
                    ...options
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Identify changes that need user review (low confidence)
        const threshold = options.confidenceThreshold ?? 0.7;
        result.needsReview = (result.changes || []).filter(
            (c: FixChange) => c.confidence < threshold
        );

        return result;
    } catch (error) {
        console.error('YAML Fixer API Error:', error);
        throw error;
    }
}

/**
 * Validate YAML content without fixing
 */
export async function validateYaml(content: string): Promise<ValidateResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/yaml/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('YAML Validator API Error:', error);
        throw error;
    }
}

/**
 * Fix YAML locally without API (uses the multi-pass fixer directly)
 */
export async function fixYamlLocal(content: string, options: FixOptions = {}): Promise<FixResponse> {
    // Dynamic import to avoid bundling issues
    const { MultiPassFixer } = await import('../semantic/intelligent-fixer.js');
    const { ErrorReporter } = await import('../reporting/error-reporter.js');

    const fixer = new MultiPassFixer({
        confidenceThreshold: options.confidenceThreshold ?? 0.7,
        aggressive: options.aggressive ?? false,
        maxIterations: options.maxIterations ?? 3,
        indentSize: options.indentSize ?? 2,
        autoFix: options.autoFix ?? true
    });

    const reporter = new ErrorReporter();
    reporter.startSession();

    const result = await fixer.fix(content);

    // Add changes to reporter
    reporter.addChanges(result.changes);

    // Generate full report
    const fullReport = reporter.generateFullReport(
        content,
        result.content,
        result.isValid,
        result.errors
    );

    // Identify changes that need review
    const threshold = options.confidenceThreshold ?? 0.7;
    const needsReview = result.changes.filter(c => c.confidence < threshold);

    return {
        success: result.isValid,
        fixed: result.content,
        errors: result.errors.map(e => ({
            line: 0,
            message: e,
            severity: 'error' as const,
            code: 'PARSE_ERROR',
            fixable: false
        })),
        changes: result.changes,
        fixedCount: result.changes.length,
        confidence: result.confidence,
        isValid: result.isValid,
        passBreakdown: result.passBreakdown,
        summary: fullReport.summary,
        diff: fullReport.diff,
        needsReview
    };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: string): string {
    switch (severity) {
        case 'critical': return '#dc2626'; // red-600
        case 'error': return '#ea580c';    // orange-600
        case 'warning': return '#ca8a04';  // yellow-600
        case 'info': return '#2563eb';     // blue-600
        default: return '#6b7280';         // gray-500
    }
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return '#16a34a';  // green-600
    if (confidence >= 0.7) return '#ca8a04';  // yellow-600
    return '#dc2626';                          // red-600
}

/**
 * Get type icon for UI display
 */
export function getTypeIcon(type: string): string {
    switch (type) {
        case 'syntax': return '📝';
        case 'structure': return '🏗️';
        case 'semantic': return '🔍';
        case 'type': return '🔄';
        default: return '⚙️';
    }
}

/**
 * Format confidence as percentage
 */
export function formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
}

/**
 * Group changes by type
 */
export function groupChangesByType(changes: FixChange[]): Map<string, FixChange[]> {
    const groups = new Map<string, FixChange[]>();

    for (const change of changes) {
        if (!groups.has(change.type)) {
            groups.set(change.type, []);
        }
        groups.get(change.type)!.push(change);
    }

    return groups;
}

/**
 * Group changes by severity
 */
export function groupChangesBySeverity(changes: FixChange[]): Map<string, FixChange[]> {
    const groups = new Map<string, FixChange[]>();
    const order = ['critical', 'error', 'warning', 'info'];

    for (const severity of order) {
        groups.set(severity, []);
    }

    for (const change of changes) {
        groups.get(change.severity)?.push(change);
    }

    return groups;
}

/**
 * Filter changes by confidence threshold
 */
export function filterByConfidence(changes: FixChange[], threshold: number): {
    accepted: FixChange[];
    needsReview: FixChange[];
} {
    return {
        accepted: changes.filter(c => c.confidence >= threshold),
        needsReview: changes.filter(c => c.confidence < threshold)
    };
}
