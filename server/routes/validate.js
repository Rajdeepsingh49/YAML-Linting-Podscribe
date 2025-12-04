import express from 'express';
import { YAMLValidator } from '../../src/core/yaml-validator-complete.ts';

const router = express.Router();

/**
 * POST /api/yaml/validate
 * Unified endpoint for validating and fixing YAML.
 * 
 * Request body:
 * {
 *   content: string,
 *   options: {
 *     aggressive?: boolean,
 *     indentSize?: number
 *   }
 * }
 */
router.post('/validate', (req, res) => {
    try {
        const { content, options = {} } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: content must be a non-empty string',
                fixed: '',
                errors: [],
                fixedCount: 0
            });
        }

        const indentSize = options.indentSize || 2;
        const validator = new YAMLValidator(indentSize);

        // 1. Validate first to see what we're dealing with
        const validationResult = validator.validate(content, { indentSize });

        // 2. Attempt to fix
        const fixResult = validator.fix(content, {
            indentSize,
            aggressive: options.aggressive || false
        });

        // 3. If aggressive mode is on, try structural fixes
        let finalContent = fixResult.content;
        let structuralExplanation = '';

        if (options.aggressive) {
            // We need to guess the kind or pass it in. For now, let's default to Deployment if unknown, 
            // but the fixStructural method has a default.
            // Ideally we parse the content to find the kind, but fixStructural does its own parsing.
            const structuralResult = validator.fixStructural(finalContent);
            if (structuralResult.restructuredLines.length > 0 || structuralResult.explanation) {
                finalContent = structuralResult.content;
                structuralExplanation = structuralResult.explanation;
            }
        }

        // 4. Re-validate the fixed content to confirm validity
        const finalValidation = validator.validate(finalContent, { indentSize });

        return res.json({
            success: true,
            originalValid: validationResult.valid,
            fixed: finalContent,
            errors: finalValidation.errors, // Errors remaining after fix
            structuralIssues: finalValidation.structuralIssues,
            fixedCount: fixResult.fixedCount + (structuralExplanation ? 1 : 0),
            changes: fixResult.changes,
            structuralExplanation,
            isValid: finalValidation.valid
        });

    } catch (error) {
        console.error('YAML Validator API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            fixed: '',
            errors: [{
                line: 0,
                message: `Server error: ${error.message}`,
                severity: 'critical',
                code: 'SERVER_ERROR',
                fixable: false
            }]
        });
    }
});

export default router;
