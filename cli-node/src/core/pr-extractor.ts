import { PullRequestRef, IssueRef } from '../types.js';

// 匹配 commit message 中的 PR 引用，覆盖 GitHub (#N) 和 GitLab (!N) 风格
const PR_PATTERNS = [
  /\(#(\d+)\)/,                       // GitHub: feat: add X (#123)
  /pull request #(\d+)/i,             // GitHub: Merge pull request #123
  /merge pull request #(\d+)/i,       // GitHub: Merge pull request #123 from ...
  /!(\d+)/,                           // GitLab: See merge request !45
];

// 匹配关闭 issue 的关键字，遵循 GitHub/GitLab 自动关联语法
const ISSUE_PATTERNS = [
  /(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)/gi,
  /(?:issue|bug)\s+#(\d+)/gi,
  /\bGH-(\d+)\b/g,
];

/**
 * 从 commit message 中提取 PR 引用。
 * 优先匹配 (#N) 格式，因为这是最常见的约定。
 */
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

/**
 * 从 commit message 中提取关联的 issue 编号。
 * 支持 fix/close/resolve 等关键字前缀，去重后返回。
 */
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
