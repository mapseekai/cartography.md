---
name: gitnexus-area-parser
description: "Skill for the Parser area of cartography.md. 17 symbols across 4 files."
---

# Parser

17 symbols | 4 files | Cohesion: 74%

## When to Use

- Working with code in `packages/`
- Understanding how diffCartography, parseCartography, flattenLeaves work
- Modifying parser-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/cli/src/parser/parse.ts` | checkYamlKeys, checkYamlLines, errorFinding, parseCartography, Node (+1) |
| `packages/cli/src/parser/markdown.ts` | blank, htmlBlockEnds, htmlBlockStart, maskHtmlComments, maskMarkdownReferenceLiterals (+1) |
| `packages/cli/src/linter/diff.ts` | compareRecords, diffCartography, sectionRecord |
| `packages/cli/src/utils/object.ts` | flattenLeaves, stableStringify |

## Entry Points

Start here when exploring this area:

- **`diffCartography`** (Function) — `packages/cli/src/linter/diff.ts:22`
- **`parseCartography`** (Function) — `packages/cli/src/parser/parse.ts:70`
- **`flattenLeaves`** (Function) — `packages/cli/src/utils/object.ts:69`
- **`stableStringify`** (Function) — `packages/cli/src/utils/object.ts:72`
- **`blank`** (Function) — `packages/cli/src/parser/markdown.ts:26`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `diffCartography` | Function | `packages/cli/src/linter/diff.ts` | 22 |
| `parseCartography` | Function | `packages/cli/src/parser/parse.ts` | 70 |
| `flattenLeaves` | Function | `packages/cli/src/utils/object.ts` | 69 |
| `stableStringify` | Function | `packages/cli/src/utils/object.ts` | 72 |
| `blank` | Function | `packages/cli/src/parser/markdown.ts` | 26 |
| `htmlBlockEnds` | Function | `packages/cli/src/parser/markdown.ts` | 55 |
| `htmlBlockStart` | Function | `packages/cli/src/parser/markdown.ts` | 41 |
| `maskHtmlComments` | Function | `packages/cli/src/parser/markdown.ts` | 5 |
| `maskMarkdownReferenceLiterals` | Function | `packages/cli/src/parser/markdown.ts` | 70 |
| `scanTopLevelSections` | Function | `packages/cli/src/parser/markdown.ts` | 143 |
| `compareRecords` | Function | `packages/cli/src/linter/diff.ts` | 5 |
| `sectionRecord` | Function | `packages/cli/src/linter/diff.ts` | 17 |
| `checkYamlKeys` | Function | `packages/cli/src/parser/parse.ts` | 44 |
| `checkYamlLines` | Function | `packages/cli/src/parser/parse.ts` | 16 |
| `errorFinding` | Function | `packages/cli/src/parser/parse.ts` | 11 |
| `Node` | Method | `packages/cli/src/parser/parse.ts` | 60 |
| `Pair` | Method | `packages/cli/src/parser/parse.ts` | 46 |

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
| `SectionRecord → ErrorFinding` | intra_community | 4 |
| `Run → ErrorFinding` | cross_community | 4 |

## How to Explore

1. `context({name: "diffCartography"})` — see callers and callees
2. `query({search_query: "parser"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
