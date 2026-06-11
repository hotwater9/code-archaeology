from __future__ import annotations

import re
from typing import Optional

from ..types import PullRequestRef, IssueRef

_PR_PATTERNS = [
    re.compile(r"\(#(\d+)\)"),
    re.compile(r"pull request #(\d+)", re.IGNORECASE),
    re.compile(r"merge pull request #(\d+)", re.IGNORECASE),
    re.compile(r"!(\d+)"),
]

_ISSUE_PATTERNS = [
    re.compile(r"(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+#(\d+)", re.IGNORECASE),
    re.compile(r"(?:issue|bug)\s+#(\d+)", re.IGNORECASE),
    re.compile(r"\bGH-(\d+)\b"),
]


def extract_pull_request(message: str) -> Optional[PullRequestRef]:
    for pattern in _PR_PATTERNS:
        match = pattern.search(message)
        if match:
            platform = "gitlab" if "!" in message and "#" not in message else "github"
            return PullRequestRef(number=int(match.group(1)), platform=platform)
    return None


def extract_issues(message: str) -> list[IssueRef]:
    issues: list[IssueRef] = []
    seen: set[int] = set()

    for pattern in _ISSUE_PATTERNS:
        for match in pattern.finditer(message):
            num = int(match.group(1))
            if num not in seen:
                seen.add(num)
                issues.append(IssueRef(number=num, platform="github"))

    return issues
