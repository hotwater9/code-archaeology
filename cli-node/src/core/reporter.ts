import chalk from 'chalk';
import { ArchaeologyResult, TimelineEntry } from '../types.js';
import { FileHotspot } from './git-analyzer.js';

export function formatTimeline(result: ArchaeologyResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan(`📜 ${result.file}:${result.startLine}-${result.endLine} — 变更时间线`));
  lines.push('');

  for (const entry of result.timeline) {
    lines.push(formatEntry(entry));
    lines.push('');
  }

  lines.push(formatStats(result));
  lines.push('');

  return lines.join('\n');
}

export function formatHotspots(dir: string, hotspots: FileHotspot[]): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan(`🔥 ${dir} — 热点文件地图`));
  lines.push('');

  if (hotspots.length === 0) {
    lines.push(chalk.gray('  No git history found for this directory.'));
    return lines.join('\n');
  }

  const maxFileLen = Math.min(50, Math.max(...hotspots.slice(0, 20).map(h => h.file.length)));

  for (const hotspot of hotspots.slice(0, 20)) {
    const bar = '█'.repeat(Math.min(20, hotspot.commitCount));
    const file = hotspot.file.length > maxFileLen
      ? '...' + hotspot.file.slice(-maxFileLen + 3)
      : hotspot.file.padEnd(maxFileLen);

    lines.push(
      chalk.white(file) + ' ' +
      chalk.yellow(bar) + ' ' +
      chalk.gray(`${hotspot.commitCount} commits, ${hotspot.contributors.length} contributors`)
    );
  }

  lines.push('');
  lines.push(chalk.bold.green(
    `📊 总计：${hotspots.length} 个文件, 最高 ${hotspots[0]?.commitCount || 0} 次修改`
  ));
  lines.push('');

  return lines.join('\n');
}

function formatEntry(entry: TimelineEntry): string {
  const { commit, pullRequest, issues } = entry;
  const date = commit.date.toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push(chalk.yellow(`[${date}]`) + ' ' + chalk.white(commit.message));
  lines.push(chalk.gray(`  Author: ${commit.author}`));

  const statsStr = `Files changed: ${commit.filesChanged} | +${commit.insertions} -${commit.deletions}`;
  lines.push(chalk.gray(`  ${statsStr}`));

  const refs: string[] = [];
  if (pullRequest) refs.push(`PR: #${pullRequest.number}`);
  if (issues.length > 0) refs.push(`Issue: ${issues.map(i => `#${i.number}`).join(', ')}`);
  if (refs.length > 0) lines.push(chalk.blue(`  ${refs.join(' | ')}`));

  return lines.join('\n');
}

function formatStats(result: ArchaeologyResult): string {
  const span = getTimeSpanString(result.timeSpan.first, result.timeSpan.last);
  return chalk.bold.green(
    `📊 统计：${result.totalChanges} 次修改, ${result.contributors.length} 位贡献者, 跨越 ${span}`,
  );
}

function getTimeSpanString(first: Date, last: Date): string {
  const diffMs = last.getTime() - first.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return '不到一天';
  if (days < 30) return `${days} 天`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return remainMonths > 0 ? `${years} 年 ${remainMonths} 个月` : `${years} 年`;
}

export function formatJson(result: ArchaeologyResult): string {
  return JSON.stringify(result, null, 2);
}
