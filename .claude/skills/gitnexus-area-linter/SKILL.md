---
name: gitnexus-area-linter
description: "Skill for the Linter area of cartography.md. 9 symbols across 5 files."
---

# Linter

9 symbols | 5 files | Cohesion: 61%

## When to Use

- Working with code in `packages/`
- Understanding how lint, sortFindings, summarizeFindings work
- Modifying linter-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/cli/src/linter/index.ts` | lint, mergeRules, lintFile |
| `packages/cli/src/utils/findings.ts` | sortFindings, summarizeFindings |
| `packages/cli/src/utils/io.ts` | formatOutput, formatReportText |
| `packages/cli/src/model/types.ts` | run |
| `packages/cli/src/commands/lint.ts` | run |

## Entry Points

Start here when exploring this area:

- **`lint`** (Function) — `packages/cli/src/linter/index.ts:29`
- **`sortFindings`** (Function) — `packages/cli/src/utils/findings.ts:16`
- **`summarizeFindings`** (Function) — `packages/cli/src/utils/findings.ts:4`
- **`lintFile`** (Function) — `packages/cli/src/linter/index.ts:75`
- **`formatOutput`** (Function) — `packages/cli/src/utils/io.ts:45`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `lint` | Function | `packages/cli/src/linter/index.ts` | 29 |
| `sortFindings` | Function | `packages/cli/src/utils/findings.ts` | 16 |
| `summarizeFindings` | Function | `packages/cli/src/utils/findings.ts` | 4 |
| `lintFile` | Function | `packages/cli/src/linter/index.ts` | 75 |
| `formatOutput` | Function | `packages/cli/src/utils/io.ts` | 45 |
| `formatReportText` | Function | `packages/cli/src/utils/io.ts` | 34 |
| `run` | Method | `packages/cli/src/model/types.ts` | 53 |
| `run` | Method | `packages/cli/src/commands/lint.ts` | 26 |
| `mergeRules` | Function | `packages/cli/src/linter/index.ts` | 23 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Run → ErrorFinding` | cross_community | 6 |
| `Run → ErrorFinding` | cross_community | 6 |
| `Run → CheckYamlKeys` | cross_community | 5 |
| `Run → CheckYamlKeys` | cross_community | 5 |
| `Run → IsRecord` | cross_community | 5 |
| `Run → MergeRules` | cross_community | 4 |
| `Run → SortFindings` | cross_community | 4 |
| `Run → Run` | cross_community | 4 |
| `Run → Run` | cross_community | 4 |
| `LintFile → IsRecord` | cross_community | 4 |

## How to Explore

1. `context({name: "lint"})` — see callers and callees
2. `query({search_query: "linter"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
