from __future__ import annotations

from ..types import ArchaeologyResult


def generate_brief(result: ArchaeologyResult) -> list[str]:
    span = _get_span_text(result)
    lines = [
        "[Code Archaeology]",
        f"History: {result.total_changes} changes over {span} ({len(result.contributors)} contributors)",
    ]
    if result.timeline:
        latest = result.timeline[0]
        date = latest.commit.date.strftime("%Y-%m-%d")
        pr = f" (#{latest.pull_request.number})" if latest.pull_request else ""
        lines.append(f"Last major change: {latest.commit.message}{pr} - {date}")
    return lines


def generate_detailed(result: ArchaeologyResult) -> list[str]:
    span = _get_span_text(result)
    lines = [
        "[Code Archaeology]",
        f"History: {result.total_changes} changes over {span} ({len(result.contributors)} contributors)",
    ]
    if result.timeline:
        latest = result.timeline[0]
        date = latest.commit.date.strftime("%Y-%m-%d")
        pr = f" (#{latest.pull_request.number})" if latest.pull_request else ""
        lines.append(f"Last major change: {latest.commit.message}{pr} - {date}")

    lines.append("Key decisions:")
    for entry in result.timeline[:5]:
        date = entry.commit.date.strftime("%Y-%m-%d")
        pr = f" (#{entry.pull_request.number})" if entry.pull_request else ""
        lines.append(f"  - {entry.commit.message}{pr} ({date})")

    if len(result.contributors) > 1:
        lines.append(f"Contributors: {', '.join(result.contributors)}")

    return lines


def generate_annotation(result: ArchaeologyResult, style: str = "detailed") -> list[str]:
    if style == "brief":
        return generate_brief(result)
    return generate_detailed(result)


def _get_span_text(result: ArchaeologyResult) -> str:
    if not result.time_span_first or not result.time_span_last:
        return "unknown"
    days = (result.time_span_last - result.time_span_first).days
    if days < 1:
        return "less than a day"
    if days < 30:
        return f"{days} days"
    months = days // 30
    if months < 12:
        return f"{months} months"
    years = months // 12
    rem = months % 12
    return f"{years}y {rem}m" if rem else f"{years} years"
