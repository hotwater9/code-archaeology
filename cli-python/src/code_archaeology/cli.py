import click

from .commands.dig import dig
from .commands.annotate import annotate


@click.group()
@click.version_option(version="0.1.0")
def main():
    """Trace the evolution of any code segment."""
    pass


main.add_command(dig)
main.add_command(annotate)

if __name__ == "__main__":
    main()
