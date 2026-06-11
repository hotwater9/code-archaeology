import os

import click
from rich.console import Console

from ..core.git_analyzer import GitAnalyzer
from ..core.timeline import build_result
from ..core.reporter import format_timeline
from ..annotator.inserter import insert_annotation

console = Console()


@click.command()
@click.argument("file")
@click.argument("line_range")
@click.option("--format", "fmt", type=click.Choice(["text", "json"]), default="text", help="Output format")
@click.option("--annotate", "do_annotate", is_flag=True, help="Prompt to insert a history annotation")
def dig(file: str, line_range: str, fmt: str, do_annotate: bool):
    """Analyze the git history of a code segment."""
    parts = line_range.split("-")
    start_line = int(parts[0])
    end_line = int(parts[1]) if len(parts) > 1 else start_line

    analyzer = GitAnalyzer(os.getcwd())

    if not analyzer.is_git_repo():
        console.print("[red]Not a git repository. Run this command inside a git project.[/]")
        raise SystemExit(1)

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
