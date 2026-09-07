---
name: gitnexus-area-commands
description: "Skill for the Commands area of cartography.md. 6 symbols across 4 files."
---

# Commands

6 symbols | 4 files | Cohesion: 73%

## When to Use

- Working with code in `packages/`
- Understanding how readInput, FileReadError, run work
- Modifying commands-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/cli/src/utils/io.ts` | FileReadError, readInput |
| `packages/cli/src/commands/spec.ts` | loadSpec, run |
| `packages/cli/src/commands/diff.ts` | run |
| `packages/cli/src/commands/parse.ts` | run |

## Entry Points

Start here when exploring this area:

- **`readInput`** (Function) — `packages/cli/src/utils/io.ts:13`
- **`FileReadError`** (Class) — `packages/cli/src/utils/io.ts:3`
- **`run`** (Method) — `packages/cli/src/commands/diff.ts:10`
- **`run`** (Method) — `packages/cli/src/commands/parse.ts:9`
- **`run`** (Method) — `packages/cli/src/commands/spec.ts:27`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FileReadError` | Class | `packages/cli/src/utils/io.ts` | 3 |
| `readInput` | Function | `packages/cli/src/utils/io.ts` | 13 |
| `run` | Method | `packages/cli/src/commands/diff.ts` | 10 |
| `run` | Method | `packages/cli/src/commands/parse.ts` | 9 |
| `run` | Method | `packages/cli/src/commands/spec.ts` | 27 |
| `loadSpec` | Function | `packages/cli/src/commands/spec.ts` | 5 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Run → ErrorFinding` | cross_community | 6 |
| `Run → CheckYamlKeys` | cross_community | 5 |
| `Run → IsRecord` | cross_community | 5 |
| `Run → MergeRules` | cross_community | 4 |
| `Run → SortFindings` | cross_community | 4 |
| `Run → Run` | cross_community | 4 |
| `Run → ErrorFinding` | cross_community | 4 |
| `LintFile → FileReadError` | cross_community | 3 |
| `Run → FileReadError` | cross_community | 3 |
| `Run → FileReadError` | intra_community | 3 |

## How to Explore

1. `context({name: "readInput"})` — see callers and callees
2. `query({search_query: "commands"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
