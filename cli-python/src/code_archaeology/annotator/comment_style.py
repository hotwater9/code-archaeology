from __future__ import annotations

from pathlib import Path
from typing import Optional


LANGUAGES = [
    {
        "extensions": [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
        "style": "block",
        "block_start": "/**",
        "block_end": " */",
        "block_middle": " * ",
    },
    {
        "extensions": [".java", ".kt", ".scala", ".groovy"],
        "style": "block",
        "block_start": "/**",
        "block_end": " */",
        "block_middle": " * ",
    },
    {
        "extensions": [".go"],
        "style": "block",
        "block_start": "/*",
        "block_end": " */",
        "block_middle": " * ",
    },
    {
        "extensions": [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"],
        "style": "block",
        "block_start": "/*",
        "block_end": " */",
        "block_middle": " * ",
    },
    {
        "extensions": [".py", ".pyx", ".pyi"],
        "style": "line",
        "line_prefix": "# ",
    },
    {
        "extensions": [".rb", ".rake"],
        "style": "line",
        "line_prefix": "# ",
    },
    {
        "extensions": [".sh", ".bash", ".zsh", ".fish"],
        "style": "line",
        "line_prefix": "# ",
    },
    {
        "extensions": [".rs", ".swift"],
        "style": "line",
        "line_prefix": "// ",
    },
]


def get_language_config(file_path: str) -> Optional[dict]:
    ext = Path(file_path).suffix.lower()
    for lang in LANGUAGES:
        if ext in lang["extensions"]:
            return lang
    return None


def wrap_comment(lines: list[str], config: dict) -> str:
    if config["style"] == "block":
        result = [config["block_start"]]
        for line in lines:
            result.append(config["block_middle"] + line)
        result.append(config["block_end"])
        return "\n".join(result)

    return "\n".join(config["line_prefix"] + line for line in lines)
