import simpleGit, { SimpleGit } from 'simple-git';
import { CommitInfo, BlameEntry } from '../types.js';

export interface FileHotspot {
  file: string;
  commitCount: number;
  contributors: string[];
  lastModified: Date;
  topMessage: string;
}

/**
 * Git 数据采集器，封装 blame / log / diff-tree 等底层命令，
 * 提供面向"代码段"的历史查询能力。
 */
export class GitAnalyzer {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  /**
   * 获取指定行范围的 porcelain blame 信息。
   * porcelain 格式便于机器解析，每条记录包含 hash、作者、时间戳。
   */
  async getBlame(file: string, startLine: number, endLine: number): Promise<BlameEntry[]> {
    const raw = await this.git.raw([
      'blame',
      '-L', `${startLine},${endLine}`,
      '--porcelain',
      file,
    ]);
    return this.parsePorcelainBlame(raw);
  }

  /**
   * 使用 git log -L 追踪指定行范围的变更历史。
   * -L 参数让 git 自动处理行号漂移，比逐 commit diff 更准确。
   */
  async getLineHistory(file: string, startLine: number, endLine: number): Promise<CommitInfo[]> {
    const raw = await this.git.raw([
      'log',
      '--pretty=format:%H|%h|%an|%aI|%s',
      '-L', `${startLine},${endLine}:${file}`,
    ]);
    return await this.parseLogOutput(raw);
  }

  /**
   * 获取整个文件的变更历史。
   * --follow 确保文件重命名后仍能追踪到旧路径的 commit。
   */
  async getFileHistory(file: string): Promise<CommitInfo[]> {
    const raw = await this.git.raw([
      'log',
      '--pretty=format:%H|%h|%an|%aI|%s',
      '--follow',
      '--', file,
    ]);
    return await this.parseLogOutput(raw);
  }

  /**
   * 扫描目录下所有文件的修改频率，生成热点排名。
   * 解析 --name-only 输出，按文件聚合 commit 数和贡献者。
   */
  async getDirectoryHotspots(dir: string): Promise<FileHotspot[]> {
    const raw = await this.git.raw([
      'log',
      '--pretty=format:%H|%h|%an|%aI|%s',
      '--name-only',
      '--', dir,
    ]);

    const fileMap = new Map<string, {
      commits: Set<string>;
      authors: Set<string>;
      lastDate: Date;
      lastMessage: string;
    }>();

    let currentCommit: { author: string; date: Date; message: string } | null = null;

    for (const line of raw.split('\n')) {
      if (line.includes('|')) {
        const [, , author, dateStr, message] = line.split('|');
        currentCommit = { author, date: new Date(dateStr), message };
      } else if (line.trim() && currentCommit) {
        const file = line.trim();
        if (!file.startsWith(dir.replace(/\\/g, '/'))) continue;

        if (!fileMap.has(file)) {
          fileMap.set(file, {
            commits: new Set(),
            authors: new Set(),
            lastDate: currentCommit.date,
            lastMessage: currentCommit.message,
          });
        }

        const entry = fileMap.get(file)!;
        entry.commits.add(currentCommit.message);
        entry.authors.add(currentCommit.author);
        if (currentCommit.date > entry.lastDate) {
          entry.lastDate = currentCommit.date;
          entry.lastMessage = currentCommit.message;
        }
      }
    }

    const hotspots: FileHotspot[] = [];
    for (const [file, data] of fileMap) {
      hotspots.push({
        file,
        commitCount: data.commits.size,
        contributors: [...data.authors],
        lastModified: data.lastDate,
        topMessage: data.lastMessage,
      });
    }

    return hotspots.sort((a, b) => b.commitCount - a.commitCount);
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

  async getFileLineCount(file: string): Promise<number> {
    const { readFileSync } = await import('node:fs');
    const content = readFileSync(file, 'utf-8');
    return content.split('\n').length;
  }

  // --- private helpers ---

  private async parseLogOutput(raw: string): Promise<CommitInfo[]> {
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

  /**
   * 解析 git blame --porcelain 输出。
   * 格式: 40字符hash + 原始行号 + 最终行号，随后若干 header 行，
   * 以 TAB 开头的行为实际代码内容。
   */
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
