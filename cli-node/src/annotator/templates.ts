import { ArchaeologyResult, AnnotationOptions } from '../types.js';

export function generateBriefAnnotation(result: ArchaeologyResult): string[] {
  const span = getSpanText(result.timeSpan.first, result.timeSpan.last);
  const latest = result.timeline[0];
  const lines: string[] = [
    '[Code Archaeology]',
    `History: ${result.totalChanges} changes over ${span} (${result.contributors.length} contributors)`,
  ];

  if (latest) {
    const date = latest.commit.date.toISOString().slice(0, 10);
    const pr = latest.pullRequest ? ` (#${latest.pullRequest.number})` : '';
    lines.push(`Last major change: ${latest.commit.message}${pr} - ${date}`);
  }

  return lines;
}

export function generateDetailedAnnotation(result: ArchaeologyResult): string[] {
  const span = getSpanText(result.timeSpan.first, result.timeSpan.last);
  const lines: string[] = [
    '[Code Archaeology]',
    `History: ${result.totalChanges} changes over ${span} (${result.contributors.length} contributors)`,
  ];

  if (result.timeline.length > 0) {
    const latest = result.timeline[0];
    const date = latest.commit.date.toISOString().slice(0, 10);
    const pr = latest.pullRequest ? ` (#${latest.pullRequest.number})` : '';
    lines.push(`Last major change: ${latest.commit.message}${pr} - ${date}`);
  }

  lines.push('Key decisions:');
  for (const entry of result.timeline.slice(0, 5)) {
    const date = entry.commit.date.toISOString().slice(0, 10);
    const pr = entry.pullRequest ? ` (#${entry.pullRequest.number})` : '';
    lines.push(`  - ${entry.commit.message}${pr} (${date})`);
  }

  if (result.contributors.length > 1) {
    lines.push(`Contributors: ${result.contributors.join(', ')}`);
  }

  return lines;
}

export function generateAnnotation(result: ArchaeologyResult, options: AnnotationOptions): string[] {
  if (options.style === 'brief') {
    return generateBriefAnnotation(result);
  }
  return generateDetailedAnnotation(result);
}

function getSpanText(first: Date, last: Date): string {
  const diffMs = last.getTime() - first.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'less than a day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years} years`;
}
