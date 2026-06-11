from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List


@dataclass
class CommitInfo:
    hash: str
    short_hash: str
    author: str
    date: datetime
    message: str
    files_changed: int = 0
    insertions: int = 0
    deletions: int = 0


@dataclass
class BlameEntry:
    line: int
    hash: str
    author: str
    date: datetime
    content: str


@dataclass
class PullRequestRef:
    number: int
    platform: str = "github"


@dataclass
class IssueRef:
    number: int
    platform: str = "github"


@dataclass
class TimelineEntry:
    commit: CommitInfo
    pull_request: Optional[PullRequestRef] = None
    issues: list[IssueRef] = field(default_factory=list)
    summary: str = ""


@dataclass
class ArchaeologyResult:
    file: str
    start_line: int
    end_line: int
    timeline: list[TimelineEntry] = field(default_factory=list)
    contributors: list[str] = field(default_factory=list)
    total_changes: int = 0
    time_span_first: Optional[datetime] = None
    time_span_last: Optional[datetime] = None
