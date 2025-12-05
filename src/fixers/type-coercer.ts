/**
 * Type Coercer
 * Converts values to expected types and adds missing colons
 */

import type { SemanticLine, FixSuggestion, FixerOptions } from '../semantic/types.js';
import { SemanticParser } from '../semantic/semantic-parser.js';
import { getExpectedType, coerceValue, matchesExpectedType } from '../knowledge/type-registry.js';
import { isKnownField } from '../knowledge/field-patterns.js';

export class TypeCoercer {
    private parser: SemanticParser;
    private options: FixerOptions;

    constructor(parser: SemanticParser, options: FixerOptions) {
        this.parser = parser;
        this.options = options;
    }

    /**
     * Find and fix type mismatches
     */
    findTypeMismatches(): FixSuggestion[] {
        const fixes: FixSuggestion[] = [];
        const lines = this.parser.getLines();

        for (const line of lines) {
            // Skip if no key or special line types
            if (!line.key || line.type === 'blank' || line.type === 'comment' || line.type === 'block-scalar') {
                continue;
            }

            // Check for type mismatches
            const fix = this.detectTypeMismatch(line);
            if (fix && fix.confidence >= this.options.confidenceThreshold) {
                fixes.push(fix);
            }
        }

        return fixes;
    }

    /**
     * Detect type mismatch in a line
     */
    private detectTypeMismatch(line: SemanticLine): FixSuggestion | null {
        const fieldName = line.key!;
        const expectedType = getExpectedType(fieldName);

        // Skip if we don't know the expected type
        if (!expectedType) return null;

        // Skip if it's an object or array (should not have inline values)
        if (expectedType === 'object' || expectedType === 'array') {
            return this.handleObjectOrArrayWithValue(line, expectedType);
        }

        // Check if value exists
        if (!line.value) return null;

        // Check if value matches expected type
        if (matchesExpectedType(fieldName, line.value)) {
            return null; // Value is correct type
        }

        // Try to coerce value
        const result = coerceValue(fieldName, line.value);
        if (result.success && result.value !== line.value) {
            return this.createCoercionFix(line, String(result.value), expectedType);
        }

        return null;
    }

    /**
     * Handle case where object/array field has inline value
     */
    private handleObjectOrArrayWithValue(line: SemanticLine, expectedType: string): FixSuggestion | null {
        if (line.value && line.value.trim() !== '') {
            // This is likely an error - object/array should not have inline value
            const indent = ' '.repeat(line.indent);
            const prefix = line.isListItem ? '- ' : '';
            const fixed = `${indent}${prefix}${line.key}:`;

            return {
                lineNumber: line.lineNumber,
                type: 'type-coercion',
                original: line.content,
                fixed,
                reason: `Field "${line.key}" expects ${expectedType}, should not have inline value`,
                confidence: 0.8,
                severity: 'error',
            };
        }

        return null;
    }

    /**
     * Create type coercion fix
     */
    private createCoercionFix(
        line: SemanticLine,
        coercedValue: string,
        expectedType: string
    ): FixSuggestion {
        const indent = ' '.repeat(line.indent);
        const prefix = line.isListItem ? '- ' : '';
        const fixed = `${indent}${prefix}${line.key}: ${coercedValue}`;

        const confidence = isKnownField(line.key!) ? 0.85 : 0.7;

        return {
            lineNumber: line.lineNumber,
            type: 'type-coercion',
            original: line.content,
            fixed,
            reason: `Coercing "${line.value}" to ${expectedType} type: "${coercedValue}"`,
            confidence,
            severity: 'warning',
            metadata: { isKnownField: isKnownField(line.key!) },
        };
    }

    /**
     * Apply fixes to YAML content
     */
    applyFixes(yamlContent: string, fixes: FixSuggestion[]): string {
        const lines = yamlContent.split('\n');

        for (const fix of fixes) {
            if (fix.lineNumber > 0 && fix.lineNumber <= lines.length) {
                lines[fix.lineNumber - 1] = fix.fixed;
            }
        }

        return lines.join('\n');
    }
}
