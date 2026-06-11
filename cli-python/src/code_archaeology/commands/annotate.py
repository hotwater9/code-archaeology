import os

import click
from rich.console import Console

from ..core.git_analyzer import GitAnalyzer
from ..core.timeline import build_result
from ..annotator.inserter import insert_annotation

console = Console()


@click.command()
@click.argument("file")
@click.argument("line_range")
@click.option("--style", type=click.Choice(["brief", "detailed"]), default="detailed", help="Annotation style")
def annotate(file: str, line_range: str, style: str):
    """Insert a history annotation directly."""
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
    file_path = os.path.abspath(file)

    success, message = insert_annotation(file_path, result, style)
    if success:
        console.print(f"[green]✅ {message}[/]")
    else:
        console.print(f"[red]❌ {message}[/]")
        raise SystemExit(1)
