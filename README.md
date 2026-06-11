# Code Archaeology

Trace the evolution of any code segment — who changed it, why, and when.

Two layers:
- **CLI** (Node.js + Python): data collection via git, terminal timeline display, optional annotation
- **Skill** (Claude Code): AI-powered narrative, design decision inference, enhanced annotations

## Quick Start (Node.js)

```bash
cd cli-node
npm install
npm run build
npx code-dig dig src/auth.ts 10-50
npx code-dig dig src/auth.ts 10-50 --annotate
```

## Quick Start (Python)

```bash
cd cli-python
pip install -e .
code-dig dig src/auth.ts 10-50
code-dig dig src/auth.ts 10-50 --annotate
```

## Commands

### `dig <file> <line-range>`

Analyze the git history of a specific code segment.

Options:
- `--annotate` — interactively insert a history comment above the code
- `--format json` — output raw JSON instead of formatted timeline

### `annotate <file> <line-range>`

Insert a history annotation comment directly (skips the interactive prompt).

Options:
- `--style brief|detailed` — annotation verbosity

## Supported Languages (for annotations)

| Language | Comment Style |
|----------|--------------|
| JS/TS/Java/Go/C/C++ | `/* */` block |
| Python/Ruby/Shell | `#` line |
| Rust | `//` line |

## Claude Code Skill

The `/code-archaeology` skill provides AI-enhanced analysis:
- Natural language evolution narrative
- Design decision inference
- Risk annotations for high-churn zones
- AI-generated comments with deeper insights than CLI annotations
