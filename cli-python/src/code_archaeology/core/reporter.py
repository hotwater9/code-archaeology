from __future__ import annotations

from datetime import datetime
from typing import Optional

import sys
import io

from rich.console import Console

from ..types import ArchaeologyResult, TimelineEntry

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

console = Console()


def format_timeline(result: ArchaeologyResult) -> None:
    console.print()
    console.print(
        f"[bold cyan]📜 {result.file}:{result.start_line}-{result.end_line} — 变更时间线[/]"
    )
    console.print()

    for entry in result.timeline:
        _print_entry(entry)
        console.print()

    _print_stats(result)
    console.print()


def _print_entry(entry: TimelineEntry) -> None:
    commit = entry.commit
    date = commit.date.strftime("%Y-%m-%d")

    console.print(f"[yellow][{date}][/] [white]{commit.message}[/]")
    console.print(f"  [dim]Author: {commit.author}[/]")
    console.print(
        f"  [dim]Files changed: {commit.files_changed} | "
        f"+{commit.insertions} -{commit.deletions}[/]"
    )

    refs = []
    if entry.pull_request:
        refs.append(f"PR: #{entry.pull_request.number}")
    if entry.issues:
        refs.append(f"Issue: {', '.join(f'#{i.number}' for i in entry.issues)}")
    if refs:
        console.print(f"  [blue]{' | '.join(refs)}[/]")


def _print_stats(result: ArchaeologyResult) -> None:
    span = _get_time_span(result.time_span_first, result.time_span_last)
    console.print(
        f"[bold green]📊 统计：{result.total_changes} 次修改, "
        f"{len(result.contributors)} 位贡献者, 跨越 {span}[/]"
    )


def _get_time_span(first: Optional[datetime], last: Optional[datetime]) -> str:
    if not first or not last:
        return "未知"
    days = (last - first).days
    if days < 1:
        return "不到一天"
    if days < 30:
        return f"{days} 天"
    months = days // 30
    if months < 12:
        return f"{months} 个月"
    years = months // 12
    rem = months % 12
    return f"{years} 年 {rem} 个月" if rem else f"{years} 年"


def format_hotspots(dir_path: str, hotspots) -> None:
    console.print()
    console.print(f"[bold cyan]🔥 {dir_path} — 热点文件地图[/]")
    console.print()

    if not hotspots:
        console.print("  [dim]No git history found for this directory.[/]")
        return

    for hotspot in hotspots[:20]:
        bar = "█" * min(20, hotspot.commit_count)
        console.print(
            f"[white]{hotspot.file:<50}[/] "
            f"[yellow]{bar}[/] "
            f"[dim]{hotspot.commit_count} commits, {len(hotspot.contributors)} contributors[/]"
        )

    console.print()
    console.print(
        f"[bold green]📊 总计：{len(hotspots)} 个文件, "
        f"最高 {hotspots[0].commit_count if hotspots else 0} 次修改[/]"
    )
    console.print()
