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
    .description('Analyze git history of a file, directory, or code segment')
    .argument('<target>', 'File path or directory to analyze')
    .argument('[line-range]', 'Line range (e.g. 10-50). Omit for whole file; use directory path for hotspot map')
    .option('--format <format>', 'Output format: text or json', 'text')
    .option('--annotate', 'Prompt to insert a history annotation')
    .action(async (target, lineRange, options) => {
      await dig(target, lineRange, options);
    });

  program
    .command('annotate')
    .description('Insert a history annotation directly')
    .argument('<file>', 'File path to annotate')
    .argument('[line-range]', 'Line range (e.g. 10-50). Omit for top of file')
    .option('--style <style>', 'Annotation style: brief or detailed', 'detailed')
    .action(async (file, lineRange, options) => {
      await annotate(file, lineRange || '1-1', options);
    });

  return program;
}
