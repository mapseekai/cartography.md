---
name: gitnexus-area-rules
description: "Skill for the Rules area of cartography.md. 37 symbols across 8 files."
---

# Rules

37 symbols | 8 files | Cohesion: 70%

## When to Use

- Working with code in `packages/`
- Understanding how resolveReferences, resolveColor, exactTokenReference work
- Modifying rules-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/cli/src/utils/object.ts` | exactTokenReference, resolvePath, resolveReferencesDeep, resolveTokenReference, resolveTokenValue (+6) |
| `packages/cli/src/linter/rules/cartography.ts` | run, run, check, report, resolveFinal (+5) |
| `packages/cli/src/linter/rules/document.ts` | errorFinding, run, run, run, run (+1) |
| `packages/cli/src/utils/color.ts` | resolveColor, isCoreColor, parseCssColor |
| `packages/cli/src/linter/rules/boundary.ts` | normalizeReservedName, run, run |
| `packages/cli/src/parser/sections.ts` | canonicalSectionName, normalizeSectionText |
| `packages/cli/src/linter/index.ts` | resolveReferences |
| `packages/cli/src/linter/rules/helpers.ts` | omittedSectionNames |

## Entry Points

Start here when exploring this area:

- **`resolveReferences`** (Function) — `packages/cli/src/linter/index.ts:82`
- **`resolveColor`** (Function) — `packages/cli/src/utils/color.ts:5`
- **`exactTokenReference`** (Function) — `packages/cli/src/utils/object.ts:24`
- **`resolvePath`** (Function) — `packages/cli/src/utils/object.ts:44`
- **`resolveReferencesDeep`** (Function) — `packages/cli/src/utils/object.ts:63`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `resolveReferences` | Function | `packages/cli/src/linter/index.ts` | 82 |
| `resolveColor` | Function | `packages/cli/src/utils/color.ts` | 5 |
| `exactTokenReference` | Function | `packages/cli/src/utils/object.ts` | 24 |
| `resolvePath` | Function | `packages/cli/src/utils/object.ts` | 44 |
| `resolveReferencesDeep` | Function | `packages/cli/src/utils/object.ts` | 63 |
| `resolveTokenReference` | Function | `packages/cli/src/utils/object.ts` | 43 |
| `resolveTokenValue` | Function | `packages/cli/src/utils/object.ts` | 62 |
| `containsValue` | Function | `packages/cli/src/utils/object.ts` | 71 |
| `isRecord` | Function | `packages/cli/src/utils/object.ts` | 0 |
| `walkObject` | Function | `packages/cli/src/utils/object.ts` | 2 |
| `omittedSectionNames` | Function | `packages/cli/src/linter/rules/helpers.ts` | 3 |
| `canonicalSectionName` | Function | `packages/cli/src/parser/sections.ts` | 51 |
| `normalizeSectionText` | Function | `packages/cli/src/parser/sections.ts` | 31 |
| `check` | Function | `packages/cli/src/linter/rules/cartography.ts` | 129 |
| `report` | Function | `packages/cli/src/linter/rules/cartography.ts` | 85 |
| `examine` | Function | `packages/cli/src/linter/rules/cartography.ts` | 54 |
| `isCoreColor` | Function | `packages/cli/src/utils/color.ts` | 4 |
| `parseCssColor` | Function | `packages/cli/src/utils/color.ts` | 3 |
| `extractInvalidTokenReferences` | Function | `packages/cli/src/utils/object.ts` | 35 |
| `extractTokenReferenceCandidates` | Function | `packages/cli/src/utils/object.ts` | 25 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Run → ValidReferencePath` | cross_community | 8 |
| `Run → ValidReferencePath` | cross_community | 8 |
| `Run → ExactTokenReference` | cross_community | 7 |
| `Run → IsRecord` | cross_community | 7 |
| `Run → ExactTokenReference` | cross_community | 7 |
| `Run → IsRecord` | cross_community | 7 |
| `Run → ValidReferencePath` | cross_community | 7 |
| `Run → ExactTokenReference` | cross_community | 6 |
| `Run → IsRecord` | cross_community | 6 |
| `ResolveReferences → ValidReferencePath` | cross_community | 6 |

## How to Explore

1. `context({name: "resolveReferences"})` — see callers and callees
2. `query({search_query: "rules"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
