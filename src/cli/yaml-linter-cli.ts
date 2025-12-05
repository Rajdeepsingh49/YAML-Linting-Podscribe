import { Command } from 'commander';
import * as fs from 'fs';

import { YAMLValidator } from '../core/yaml-validator-complete.js';
import chalk from 'chalk';

const program = new Command();
const validator = new YAMLValidator();

program
    .name('k8s-lint')
    .description('Production-grade Kubernetes YAML validator and fixer')
    .version('2.0.0');

// VALIDATE COMMAND
program
    .command('validate <file>')
    .description('Validate a YAML file')
    .action((file) => {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const result = validator.validate(content);

            if (result.valid) {
                console.log(chalk.green('✓ Valid YAML'));
                process.exit(0);
            } else {
                console.log(chalk.red(`Found ${result.errors.length} errors and ${result.structuralIssues.length} structural issues:`));

                result.errors.forEach(err => {
                    console.log(chalk.red(`[Line ${err.line}] ${err.message}`));
                });

                result.structuralIssues.forEach(issue => {
                    console.log(chalk.yellow(`[Line ${issue.line}] ${issue.message} -> ${issue.suggestion}`));
                });

                process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red('Error reading file:'), error);
            process.exit(3);
        }
    });

// FIX COMMAND
program
    .command('fix <file>')
    .description('Fix a YAML file')
    .option('-i, --in-place', 'Modify the file in place')
    .option('-d, --dry-run', 'Show changes without saving')
    .option('-a, --aggressive', 'Apply aggressive structural fixes')
    .option('-k, --kind <kind>', 'Specify Kubernetes kind for structural validation')
    .action((file, options) => {
        try {
            const content = fs.readFileSync(file, 'utf-8');

            // 1. Standard Fix
            let result = validator.fix(content, { aggressive: options.aggressive });
            let finalContent = result.content;

            // 2. Structural Fix (if requested)
            if (options.aggressive || options.kind) {
                const structResult = validator.fixStructural(finalContent, options.kind || 'Deployment');
                finalContent = structResult.content;
                if (structResult.restructuredLines.length > 0) {
                    console.log(chalk.yellow(`Applied ${structResult.restructuredLines.length} structural reorganizations.`));
                    console.log(chalk.dim(structResult.explanation));
                }
            }

            // Report Changes
            if (result.changes.length > 0) {
                console.log(chalk.green(`Fixed ${result.fixedCount} issues:`));
                result.changes.forEach(change => {
                    console.log(chalk.blue(`[Line ${change.line}] ${change.reason}`));
                    console.log(chalk.dim(`  - ${change.original.trim()}`));
                    console.log(chalk.green(`  + ${change.fixed.trim()}`));
                });
            } else {
                console.log(chalk.green('No syntax issues found.'));
            }

            // Output
            if (options.inPlace) {
                fs.writeFileSync(file, finalContent);
                console.log(chalk.green(`\nFixed file saved to ${file}`));
            } else if (options.dryRun) {
                console.log(chalk.yellow('\n--- Dry Run Output ---'));
                console.log(finalContent);
            } else {
                // Default: Print to stdout
                console.log(finalContent);
            }

        } catch (error) {
            console.error(chalk.red('Error processing file:'), error);
            process.exit(3);
        }
    });

program.parse(process.argv);
