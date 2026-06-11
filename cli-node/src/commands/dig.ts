import { resolve } from 'node:path';
import { statSync } from 'node:fs';
import inquirer from 'inquirer';
import { GitAnalyzer } from '../core/git-analyzer.js';
import { buildResult } from '../core/timeline.js';
import { formatTimeline, formatHotspots, formatJson } from '../core/reporter.js';
import { insertAnnotation } from '../annotator/inserter.js';
import { AnnotationOptions } from '../types.js';

export interface DigOptions {
  format?: 'text' | 'json';
  annotate?: boolean;
}

export async function dig(file: string, lineRange: string | undefined, options: DigOptions): Promise<void> {
  const target = resolve(file);
  const analyzer = new GitAnalyzer(process.cwd());

  if (!(await analyzer.isGitRepo())) {
    console.error('Not a git repository. Run this command inside a git project.');
    process.exit(1);
  }

  let isDir = false;
  try {
    isDir = statSync(target).isDirectory();
  } catch {}

  if (isDir) {
    await digDirectory(file, analyzer, options);
  } else if (!lineRange) {
    await digWholeFile(file, analyzer, options);
  } else {
    await digLineRange(file, lineRange, analyzer, options);
  }
}

async function digDirectory(dir: string, analyzer: GitAnalyzer, options: DigOptions): Promise<void> {
  const hotspots = await analyzer.getDirectoryHotspots(dir);

  if (hotspots.length === 0) {
    console.log('No git history found for this directory.');
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(hotspots, null, 2));
  } else {
    console.log(formatHotspots(dir, hotspots));
  }
}

async function digWholeFile(file: string, analyzer: GitAnalyzer, options: DigOptions): Promise<void> {
  const commits = await analyzer.getFileHistory(file);

  if (commits.length === 0) {
    console.log('No git history found for this file.');
    return;
  }

  const lineCount = await analyzer.getFileLineCount(resolve(file));
  const result = buildResult(file, 1, lineCount, commits);

  if (options.format === 'json') {
    console.log(formatJson(result));
  } else {
    console.log(formatTimeline(result));
  }

  if (options.annotate) {
    await promptAnnotation(resolve(file), result);
  }
}

async function digLineRange(file: string, lineRange: string, analyzer: GitAnalyzer, options: DigOptions): Promise<void> {
  const [startStr, endStr] = lineRange.split('-');
  const startLine = parseInt(startStr);
  const endLine = endStr ? parseInt(endStr) : startLine;

  if (isNaN(startLine) || isNaN(endLine)) {
    console.error('Invalid line range. Use format: 10-50 or single line: 10');
    process.exit(1);
  }

  const commits = await analyzer.getLineHistory(file, startLine, endLine);

  if (commits.length === 0) {
    console.log('No git history found for this code segment.');
    return;
  }

  const result = buildResult(file, startLine, endLine, commits);

  if (options.format === 'json') {
    console.log(formatJson(result));
  } else {
    console.log(formatTimeline(result));
  }

  if (options.annotate) {
    await promptAnnotation(resolve(file), result);
  }
}

async function promptAnnotation(filePath: string, result: import('../types.js').ArchaeologyResult): Promise<void> {
  const { shouldAnnotate } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldAnnotate',
    message: 'Insert a history annotation above this code?',
    default: true,
  }]);

  if (!shouldAnnotate) return;

  const { style } = await inquirer.prompt([{
    type: 'list',
    name: 'style',
    message: 'Annotation style:',
    choices: [
      { name: 'Brief (summary only)', value: 'brief' },
      { name: 'Detailed (with key decisions)', value: 'detailed' },
    ],
  }]);

  const options: AnnotationOptions = {
    style,
    includeAuthors: true,
    includeIssues: true,
  };

  const { success, message } = insertAnnotation(filePath, result, options);
  if (success) {
    console.log(`\n✅ ${message}`);
  } else {
    console.error(`\n❌ ${message}`);
  }
}
