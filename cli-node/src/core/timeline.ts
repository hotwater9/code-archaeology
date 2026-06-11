import { CommitInfo, TimelineEntry, ArchaeologyResult } from '../types.js';
import { extractPullRequest, extractIssues } from './pr-extractor.js';

export function buildTimeline(commits: CommitInfo[]): TimelineEntry[] {
  return commits.map(commit => ({
    commit,
    pullRequest: extractPullRequest(commit.message),
    issues: extractIssues(commit.message),
    summary: commit.message.replace(/\(#\d+\)/, '').trim(),
  }));
}

export function buildResult(
  file: string,
  startLine: number,
  endLine: number,
  commits: CommitInfo[],
): ArchaeologyResult {
  const timeline = buildTimeline(commits);
  const contributors = [...new Set(commits.map(c => c.author))];
  const dates = commits.map(c => c.date).sort((a, b) => a.getTime() - b.getTime());

  return {
    file,
    startLine,
    endLine,
    timeline,
    contributors,
    totalChanges: commits.length,
    timeSpan: {
      first: dates[0] || new Date(),
      last: dates[dates.length - 1] || new Date(),
    },
  };
}
