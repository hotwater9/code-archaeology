from __future__ import annotations

from datetime import datetime
from typing import Optional

from rich.console import Console

from ..types import ArchaeologyResult, TimelineEntry

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
