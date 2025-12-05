import express from 'express';
import { MultiPassFixer } from '../../src/semantic/intelligent-fixer.ts';

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
router.post('/validate', async (req, res) => {
    const startTime = process.hrtime.bigint();

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

        // Use the advanced MultiPassFixer
        const fixer = new MultiPassFixer({
            indentSize: options.indentSize || 2,
            aggressive: options.aggressive || false,
            confidenceThreshold: 0.6 // Lower threshold to catch more issues as requested
        });

        // Run the fix pipeline
        const fixResult = await fixer.fix(content);

        // Calculate timing
        const endTime = process.hrtime.bigint();
        const timeNanoseconds = endTime - startTime;
        const timeMilliseconds = Number(timeNanoseconds) / 1_000_000;
        const processingTime = Math.round(timeMilliseconds * 10) / 10;

        // Calculate statistics
        const totalIssues = fixResult.changes.length + fixResult.errors.length;
        const fixesApplied = fixResult.changes.length;
        const successRate = totalIssues > 0 ? Math.round((fixesApplied / totalIssues) * 100) : 100;

        const statistics = {
            totalIssues: totalIssues,
            fixesApplied: fixesApplied,
            averageConfidence: fixResult.confidence,
            confidencePercent: Math.round(fixResult.confidence * 100),
            processingTime: processingTime,
            successRate: successRate
        };

        // Console logging for verification
        console.log('=== VALIDATION COMPLETE ===');
        console.log('Total issues:', statistics.totalIssues);
        console.log('Fixed issues:', statistics.fixesApplied);
        console.log('Success rate:', statistics.successRate + '%');
        console.log('Avg confidence:', (statistics.averageConfidence * 100).toFixed(1) + '%');
        console.log('Processing time:', statistics.processingTime + 'ms');

        return res.json({
            success: true,
            originalValid: fixResult.changes.length === 0 && fixResult.errors.length === 0,
            fixed: fixResult.content,
            errors: fixResult.errors.map(e => ({ message: e, severity: 'error', line: 0 })), // Map string errors to objects
            fixedCount: fixResult.changes.length,
            changes: fixResult.changes,
            isValid: fixResult.isValid,
            statistics: statistics,
            confidence: fixResult.confidence
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
