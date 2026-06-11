import simpleGit, { SimpleGit } from 'simple-git';
import { CommitInfo, BlameEntry } from '../types.js';

export class GitAnalyzer {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async getBlame(file: string, startLine: number, endLine: number): Promise<BlameEntry[]> {
    const raw = await this.git.raw([
      'blame',
      '-L', `${startLine},${endLine}`,
      '--porcelain',
      file,
    ]);
    return this.parsePorcelainBlame(raw);
  }

  async getLineHistory(file: string, startLine: number, endLine: number): Promise<CommitInfo[]> {
    const raw = await this.git.raw([
      'log',
      `--pretty=format:%H|%h|%an|%aI|%s`,
      '-L', `${startLine},${endLine}:${file}`,
    ]);

    const commits: CommitInfo[] = [];
    const seen = new Set<string>();

    for (const line of raw.split('\n')) {
      if (!line.includes('|')) continue;
      const [hash, shortHash, author, dateStr, message] = line.split('|');
      if (seen.has(hash)) continue;
      seen.add(hash);

      const stats = await this.getCommitStats(hash);
      commits.push({
        hash,
        shortHash,
        author,
        date: new Date(dateStr),
        message,
        ...stats,
      });
    }

    return commits.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getCommitStats(hash: string): Promise<{ filesChanged: number; insertions: number; deletions: number }> {
    const raw = await this.git.raw(['diff-tree', '--shortstat', '--no-commit-id', hash]);
    const match = raw.match(/(\d+) files? changed(?:, (\d+) insertions?)?(?:, (\d+) deletions?)?/);
    if (!match) return { filesChanged: 0, insertions: 0, deletions: 0 };
    return {
      filesChanged: parseInt(match[1]) || 0,
      insertions: parseInt(match[2]) || 0,
      deletions: parseInt(match[3]) || 0,
    };
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async getRepoRoot(): Promise<string> {
    return (await this.git.revparse(['--show-toplevel'])).trim();
  }

  private parsePorcelainBlame(raw: string): BlameEntry[] {
    const entries: BlameEntry[] = [];
    const lines = raw.split('\n');
    let i = 0;

    while (i < lines.length) {
      const headerMatch = lines[i]?.match(/^([a-f0-9]{40}) \d+ (\d+)/);
      if (!headerMatch) { i++; continue; }

      const hash = headerMatch[1];
      const line = parseInt(headerMatch[2]);
      let author = '';
      let timestamp = 0;
      i++;

      while (i < lines.length && !lines[i].startsWith('\t')) {
        if (lines[i].startsWith('author ')) author = lines[i].slice(7);
        if (lines[i].startsWith('author-time ')) timestamp = parseInt(lines[i].slice(12));
        i++;
      }

      const content = lines[i]?.slice(1) || '';
      entries.push({ line, hash, author, date: new Date(timestamp * 1000), content });
      i++;
    }

    return entries;
  }
}
