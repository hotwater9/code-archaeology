import { Command } from 'commander';
import { dig } from './commands/dig.js';
import { annotate } from './commands/annotate.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('code-dig')
    .description('Trace the evolution of any code segment')
    .version('0.1.0');

  program
    .command('dig')
    .description('Analyze the git history of a code segment')
    .argument('<file>', 'File path to analyze')
    .argument('<line-range>', 'Line range (e.g. 10-50 or single line 10)')
    .option('--format <format>', 'Output format: text or json', 'text')
    .option('--annotate', 'Prompt to insert a history annotation')
    .action(async (file, lineRange, options) => {
      await dig(file, lineRange, options);
    });

  program
    .command('annotate')
    .description('Insert a history annotation directly')
    .argument('<file>', 'File path to annotate')
    .argument('<line-range>', 'Line range (e.g. 10-50)')
    .option('--style <style>', 'Annotation style: brief or detailed', 'detailed')
    .action(async (file, lineRange, options) => {
      await annotate(file, lineRange, options);
    });

  return program;
}
