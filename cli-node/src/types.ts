export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  date: Date;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface BlameEntry {
  line: number;
  hash: string;
  author: string;
  date: Date;
  content: string;
}

export interface PullRequestRef {
  number: number;
  platform: 'github' | 'gitlab' | 'unknown';
}

export interface IssueRef {
  number: number;
  platform: 'github' | 'gitlab' | 'unknown';
}

export interface TimelineEntry {
  commit: CommitInfo;
  pullRequest?: PullRequestRef;
  issues: IssueRef[];
  summary: string;
}

export interface ArchaeologyResult {
  file: string;
  startLine: number;
  endLine: number;
  timeline: TimelineEntry[];
  contributors: string[];
  totalChanges: number;
  timeSpan: { first: Date; last: Date };
}

export type CommentStyle = 'block' | 'line';

export interface LanguageConfig {
  extensions: string[];
  commentStyle: CommentStyle;
  blockStart?: string;
  blockEnd?: string;
  blockMiddle?: string;
  linePrefix?: string;
}

export interface AnnotationOptions {
  style: 'brief' | 'detailed';
  includeAuthors: boolean;
  includeIssues: boolean;
}
