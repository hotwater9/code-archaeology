from __future__ import annotations

from ..types import CommitInfo, TimelineEntry, ArchaeologyResult
from .pr_extractor import extract_pull_request, extract_issues


def build_timeline(commits: list[CommitInfo]) -> list[TimelineEntry]:
    return [
        TimelineEntry(
            commit=c,
            pull_request=extract_pull_request(c.message),
            issues=extract_issues(c.message),
            summary=c.message.strip(),
        )
        for c in commits
    ]


def build_result(
    file: str, start_line: int, end_line: int, commits: list[CommitInfo]
) -> ArchaeologyResult:
    timeline = build_timeline(commits)
    contributors = list(dict.fromkeys(c.author for c in commits))
    dates = sorted(c.date for c in commits)

    return ArchaeologyResult(
        file=file,
        start_line=start_line,
        end_line=end_line,
        timeline=timeline,
        contributors=contributors,
        total_changes=len(commits),
        time_span_first=dates[0] if dates else None,
        time_span_last=dates[-1] if dates else None,
    )
