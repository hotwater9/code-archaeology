import { readFileSync, writeFileSync } from 'node:fs';
import { ArchaeologyResult, AnnotationOptions } from '../types.js';
import { getLanguageConfig, wrapComment } from './comment-style.js';
import { generateAnnotation } from './templates.js';

export function insertAnnotation(
  filePath: string,
  result: ArchaeologyResult,
  options: AnnotationOptions,
): { success: boolean; message: string } {
  const langConfig = getLanguageConfig(filePath);
  if (!langConfig) {
    return { success: false, message: `Unsupported file type: ${filePath}` };
  }

  const annotationLines = generateAnnotation(result, options);
  const comment = wrapComment(annotationLines, langConfig);

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const insertAt = result.startLine - 1;

  if (insertAt < 0 || insertAt > lines.length) {
    return { success: false, message: `Invalid line range: ${result.startLine}` };
  }

  const indent = getIndentation(lines[insertAt] || '');
  const indentedComment = comment
    .split('\n')
    .map(line => indent + line)
    .join('\n');

  lines.splice(insertAt, 0, indentedComment);
  writeFileSync(filePath, lines.join('\n'), 'utf-8');

  return {
    success: true,
    message: `Annotation inserted at line ${result.startLine} of ${filePath}`,
  };
}

export function insertRawComment(
  filePath: string,
  line: number,
  commentText: string,
): { success: boolean; message: string } {
  const langConfig = getLanguageConfig(filePath);
  if (!langConfig) {
    return { success: false, message: `Unsupported file type: ${filePath}` };
  }

  const commentLines = commentText.split('\n');
  const comment = wrapComment(commentLines, langConfig);

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const insertAt = line - 1;

  if (insertAt < 0 || insertAt > lines.length) {
    return { success: false, message: `Invalid line: ${line}` };
  }

  const indent = getIndentation(lines[insertAt] || '');
  const indentedComment = comment
    .split('\n')
    .map(l => indent + l)
    .join('\n');

  lines.splice(insertAt, 0, indentedComment);
  writeFileSync(filePath, lines.join('\n'), 'utf-8');

  return { success: true, message: `Comment inserted at line ${line} of ${filePath}` };
}

function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}
