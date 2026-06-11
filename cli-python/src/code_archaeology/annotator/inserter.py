from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from ..types import ArchaeologyResult
from .comment_style import get_language_config, wrap_comment
from .templates import generate_annotation


def insert_annotation(
    file_path: str,
    result: ArchaeologyResult,
    style: str = "detailed",
) -> tuple[bool, str]:
    config = get_language_config(file_path)
    if not config:
        return False, f"Unsupported file type: {file_path}"

    annotation_lines = generate_annotation(result, style)
    comment = wrap_comment(annotation_lines, config)

    path = Path(file_path)
    content = path.read_text(encoding="utf-8")
    lines = content.split("\n")
    insert_at = result.start_line - 1

    if insert_at < 0 or insert_at > len(lines):
        return False, f"Invalid line range: {result.start_line}"

    indent = _get_indentation(lines[insert_at] if insert_at < len(lines) else "")
    indented_comment = "\n".join(indent + l for l in comment.split("\n"))

    lines.insert(insert_at, indented_comment)
    path.write_text("\n".join(lines), encoding="utf-8")

    return True, f"Annotation inserted at line {result.start_line} of {file_path}"


def insert_raw_comment(
    file_path: str,
    line: int,
    comment_text: str,
) -> tuple[bool, str]:
    config = get_language_config(file_path)
    if not config:
        return False, f"Unsupported file type: {file_path}"

    comment_lines = comment_text.split("\n")
    comment = wrap_comment(comment_lines, config)

    path = Path(file_path)
    content = path.read_text(encoding="utf-8")
    lines = content.split("\n")
    insert_at = line - 1

    if insert_at < 0 or insert_at > len(lines):
        return False, f"Invalid line: {line}"

    indent = _get_indentation(lines[insert_at] if insert_at < len(lines) else "")
    indented_comment = "\n".join(indent + l for l in comment.split("\n"))

    lines.insert(insert_at, indented_comment)
    path.write_text("\n".join(lines), encoding="utf-8")

    return True, f"Comment inserted at line {line} of {file_path}"


def _get_indentation(line: str) -> str:
    match = re.match(r"^(\s*)", line)
    return match.group(1) if match else ""
