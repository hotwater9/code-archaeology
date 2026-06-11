import { PullRequestRef, IssueRef } from '../types.js';

const PR_PATTERNS = [
  /\(#(\d+)\)/,
  /pull request #(\d+)/i,
  /merge pull request #(\d+)/i,
  /!(\d+)/,
];

const ISSUE_PATTERNS = [
  /(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi,
  /(?:issue|bug)\s+#(\d+)/gi,
  /\bGH-(\d+)\b/g,
];

export function extractPullRequest(message: string): PullRequestRef | undefined {
  for (const pattern of PR_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const platform = message.includes('!') && !message.includes('#')
        ? 'gitlab'
        : 'github';
      return { number: parseInt(match[1]), platform };
    }
  }
  return undefined;
}

export function extractIssues(message: string): IssueRef[] {
  const issues: IssueRef[] = [];
  const seen = new Set<number>();

  for (const pattern of ISSUE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(message)) !== null) {
      const num = parseInt(match[1]);
      if (!seen.has(num)) {
        seen.add(num);
        issues.push({ number: num, platform: 'github' });
      }
    }
  }

  return issues;
}
