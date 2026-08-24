# Ralph Agent Instructions

## Overview

Ralph is an autonomous AI agent loop that runs AI coding tools (Amp or Claude Code) repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context.

## Cursor + Superpowers (este projeto)

Sem Claude Code/Amp pagos, use o subagente do projeto:

- Arquivo: `.cursor/agents/ralph-superpowers.md`
- Disparo: “Use o subagente ralph-superpowers e rode o loop”
- Estado: `scripts/ralph/prd.json` + `scripts/ralph/progress.txt`
- Fluxo: Superpowers (brainstorming → prd → writing-plans → subagent-driven-development) + uma story por iteração

## Commands

```bash
# Run the flowchart dev server
cd flowchart && npm run dev

# Build the flowchart
cd flowchart && npm run build

# Run Ralph with Amp (default)
./ralph.sh [max_iterations]

# Run Ralph with Claude Code
./ralph.sh --tool claude [max_iterations]
```

## Key Files

- `ralph.sh` - The bash loop that spawns fresh AI instances (supports `--tool amp` or `--tool claude`)
- `prompt.md` - Instructions given to each AMP instance
-  `CLAUDE.md` - Instructions given to each Claude Code instance
- `prd.json.example` - Example PRD format
- `flowchart/` - Interactive React Flow diagram explaining how Ralph works

## Flowchart

The `flowchart/` directory contains an interactive visualization built with React Flow. It's designed for presentations - click through to reveal each step with animations.

To run locally:
```bash
cd flowchart
npm install
npm run dev
```

## Patterns

- Each iteration spawns a fresh AI instance (Amp or Claude Code) with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Always update AGENTS.md with discovered patterns for future iterations
