import { resolve } from 'node:path';
import { GitAnalyzer } from '../core/git-analyzer.js';
import { buildResult } from '../core/timeline.js';
import { insertAnnotation } from '../annotator/inserter.js';
import { AnnotationOptions } from '../types.js';

export interface AnnotateOptions {
  style: 'brief' | 'detailed';
}

export async function annotate(file: string, lineRange: string, options: AnnotateOptions): Promise<void> {
  const [startStr, endStr] = lineRange.split('-');
  const startLine = parseInt(startStr);
  const endLine = endStr ? parseInt(endStr) : startLine;

  if (isNaN(startLine) || isNaN(endLine)) {
    console.error('Invalid line range. Use format: 10-50 or single line: 10');
    process.exit(1);
  }

  const filePath = resolve(file);
  const analyzer = new GitAnalyzer(process.cwd());

  if (!(await analyzer.isGitRepo())) {
    console.error('Not a git repository. Run this command inside a git project.');
    process.exit(1);
  }

  const commits = await analyzer.getLineHistory(file, startLine, endLine);

  if (commits.length === 0) {
    console.log('No git history found for this code segment.');
    return;
  }

  const result = buildResult(file, startLine, endLine, commits);
  const annotationOptions: AnnotationOptions = {
    style: options.style,
    includeAuthors: true,
    includeIssues: true,
  };

  const { success, message } = insertAnnotation(filePath, result, annotationOptions);
  if (success) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}
