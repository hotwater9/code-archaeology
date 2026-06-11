from __future__ import annotations

import os
from pathlib import Path

import click
from rich.console import Console

from ..core.git_analyzer import GitAnalyzer
from ..core.timeline import build_result
from ..core.reporter import format_timeline, format_hotspots
from ..annotator.inserter import insert_annotation

console = Console()


@click.command()
@click.argument("target")
@click.argument("line_range", required=False, default=None)
@click.option("--format", "fmt", type=click.Choice(["text", "json"]), default="text", help="Output format")
@click.option("--annotate", "do_annotate", is_flag=True, help="Prompt to insert a history annotation")
def dig(target: str, line_range: str, fmt: str, do_annotate: bool):
    """Analyze git history of a file, directory, or code segment."""
    analyzer = GitAnalyzer(os.getcwd())

    if not analyzer.is_git_repo():
        console.print("[red]Not a git repository. Run this command inside a git project.[/]")
        raise SystemExit(1)

    target_path = Path(target)
    is_dir = target_path.is_dir()

    if is_dir:
        _dig_directory(target, analyzer, fmt)
    elif line_range is None:
        _dig_whole_file(target, analyzer, fmt, do_annotate)
    else:
        _dig_line_range(target, line_range, analyzer, fmt, do_annotate)


def _dig_directory(dir_path: str, analyzer: GitAnalyzer, fmt: str) -> None:
    hotspots = analyzer.get_directory_hotspots(dir_path)

    if not hotspots:
        console.print("No git history found for this directory.")
        return

    if fmt == "json":
        import json
        data = [{"file": h.file, "commit_count": h.commit_count,
                 "contributors": h.contributors, "top_message": h.top_message}
                for h in hotspots]
        console.print_json(json.dumps(data, default=str))
    else:
        format_hotspots(dir_path, hotspots)


def _dig_whole_file(file: str, analyzer: GitAnalyzer, fmt: str, do_annotate: bool) -> None:
    commits = analyzer.get_file_history(file)

    if not commits:
        console.print("No git history found for this file.")
        return

    line_count = analyzer.get_file_line_count(file)
    result = build_result(file, 1, line_count, commits)

    if fmt == "json":
        import json
        from dataclasses import asdict
        console.print_json(json.dumps(asdict(result), default=str))
    else:
        format_timeline(result)

    if do_annotate:
        _prompt_annotation(os.path.abspath(file), result)


def _dig_line_range(file: str, line_range: str, analyzer: GitAnalyzer, fmt: str, do_annotate: bool) -> None:
    parts = line_range.split("-")
    start_line = int(parts[0])
    end_line = int(parts[1]) if len(parts) > 1 else start_line

    commits = analyzer.get_line_history(file, start_line, end_line)

    if not commits:
        console.print("No git history found for this code segment.")
        return

    result = build_result(file, start_line, end_line, commits)

    if fmt == "json":
        import json
        from dataclasses import asdict
        console.print_json(json.dumps(asdict(result), default=str))
    else:
        format_timeline(result)

    if do_annotate:
        _prompt_annotation(os.path.abspath(file), result)


def _prompt_annotation(file_path: str, result):
    if not click.confirm("\nInsert a history annotation above this code?", default=True):
        return

    style = click.prompt(
        "Annotation style",
        type=click.Choice(["brief", "detailed"]),
        default="detailed",
    )

    success, message = insert_annotation(file_path, result, style)
    if success:
        console.print(f"\n[green]✅ {message}[/]")
    else:
        console.print(f"\n[red]❌ {message}[/]")
