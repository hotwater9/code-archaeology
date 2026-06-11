from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

from ..types import CommitInfo, BlameEntry


@dataclass
class FileHotspot:
    file: str
    commit_count: int
    contributors: list
    last_modified: Optional[datetime] = None
    top_message: str = ""


class GitAnalyzer:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()

    def is_git_repo(self) -> bool:
        try:
            subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=self.repo_path, capture_output=True, check=True,
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def get_line_history(self, file: str, start_line: int, end_line: int) -> list:
        result = subprocess.run(
            ["git", "log", f"--pretty=format:%H|%h|%an|%aI|%s",
             "-L", f"{start_line},{end_line}:{file}"],
            cwd=self.repo_path, capture_output=True, text=True,
        )
        if result.returncode != 0:
            return []
        return self._parse_log_output(result.stdout)

    def get_file_history(self, file: str) -> list:
        result = subprocess.run(
            ["git", "log", "--pretty=format:%H|%h|%an|%aI|%s",
             "--follow", "--", file],
            cwd=self.repo_path, capture_output=True, text=True,
        )
        if result.returncode != 0:
            return []
        return self._parse_log_output(result.stdout)

    def get_directory_hotspots(self, dir_path: str) -> list:
        result = subprocess.run(
            ["git", "log", "--pretty=format:%H|%h|%an|%aI|%s",
             "--name-only", "--", dir_path],
            cwd=self.repo_path, capture_output=True, text=True,
        )
        if result.returncode != 0:
            return []

        file_map: dict = {}
        current_commit = None
        dir_normalized = dir_path.replace("\\", "/")

        for line in result.stdout.split("\n"):
            if "|" in line:
                parts = line.split("|", 4)
                if len(parts) >= 5:
                    current_commit = {
                        "author": parts[2],
                        "date": datetime.fromisoformat(parts[3]),
                        "message": parts[4],
                    }
            elif line.strip() and current_commit:
                file = line.strip()
                if not file.startswith(dir_normalized):
                    continue
                if file not in file_map:
                    file_map[file] = {
                        "commits": set(),
                        "authors": set(),
                        "last_date": current_commit["date"],
                        "last_message": current_commit["message"],
                    }
                entry = file_map[file]
                entry["commits"].add(current_commit["message"])
                entry["authors"].add(current_commit["author"])
                if current_commit["date"] > entry["last_date"]:
                    entry["last_date"] = current_commit["date"]
                    entry["last_message"] = current_commit["message"]

        hotspots = []
        for file, data in file_map.items():
            hotspots.append(FileHotspot(
                file=file,
                commit_count=len(data["commits"]),
                contributors=list(data["authors"]),
                last_modified=data["last_date"],
                top_message=data["last_message"],
            ))

        hotspots.sort(key=lambda h: h.commit_count, reverse=True)
        return hotspots

    def get_file_line_count(self, file: str) -> int:
        path = Path(file)
        if not path.is_absolute():
            path = self.repo_path / path
        return len(path.read_text(encoding="utf-8").split("\n"))

    def get_blame(self, file: str, start_line: int, end_line: int) -> list:
        result = subprocess.run(
            ["git", "blame", "-L", f"{start_line},{end_line}", "--porcelain", file],
            cwd=self.repo_path, capture_output=True, text=True,
        )
        if result.returncode != 0:
            return []
        return self._parse_porcelain_blame(result.stdout)

    def _parse_log_output(self, stdout: str) -> list:
        commits = []
        seen: set = set()

        for line in stdout.split("\n"):
            if "|" not in line:
                continue
            parts = line.split("|", 4)
            if len(parts) < 5:
                continue
            hash_, short_hash, author, date_str, message = parts
            if hash_ in seen:
                continue
            seen.add(hash_)

            stats = self._get_commit_stats(hash_)
            commits.append(CommitInfo(
                hash=hash_,
                short_hash=short_hash,
                author=author,
                date=datetime.fromisoformat(date_str),
                message=message,
                **stats,
            ))

        commits.sort(key=lambda c: c.date, reverse=True)
        return commits

    def _get_commit_stats(self, hash_: str) -> dict:
        result = subprocess.run(
            ["git", "diff-tree", "--shortstat", "--no-commit-id", hash_],
            cwd=self.repo_path, capture_output=True, text=True,
        )
        match = re.search(
            r"(\d+) files? changed(?:, (\d+) insertions?)?(?:, (\d+) deletions?)?",
            result.stdout,
        )
        if not match:
            return {"files_changed": 0, "insertions": 0, "deletions": 0}
        return {
            "files_changed": int(match.group(1) or 0),
            "insertions": int(match.group(2) or 0),
            "deletions": int(match.group(3) or 0),
        }

    def _parse_porcelain_blame(self, raw: str) -> list:
        entries = []
        lines = raw.split("\n")
        i = 0

        while i < len(lines):
            header = re.match(r"^([a-f0-9]{40}) \d+ (\d+)", lines[i])
            if not header:
                i += 1
                continue

            hash_ = header.group(1)
            line_num = int(header.group(2))
            author = ""
            timestamp = 0
            i += 1

            while i < len(lines) and not lines[i].startswith("\t"):
                if lines[i].startswith("author "):
                    author = lines[i][7:]
                if lines[i].startswith("author-time "):
                    timestamp = int(lines[i][12:])
                i += 1

            content = lines[i][1:] if i < len(lines) else ""
            entries.append(BlameEntry(
                line=line_num, hash=hash_, author=author,
                date=datetime.fromtimestamp(timestamp), content=content,
            ))
            i += 1

        return entries
