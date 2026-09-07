---
name: gitnexus-area-cluster-18
description: "Skill for the Cluster_18 area of cartography.md. 5 symbols across 1 files."
---

# Cluster_18

5 symbols | 1 files | Cohesion: 67%

## When to Use

- Working with code in `packages/`
- Understanding how extractTokenReferenceMatches, getAtPath, parseReferencePath work
- Modifying cluster_18-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/cli/src/utils/object.ts` | extractTokenReferenceMatches, getAtPath, parseReferencePath, validReferencePath, valueAtRelativePath |

## Entry Points

Start here when exploring this area:

- **`extractTokenReferenceMatches`** (Function) — `packages/cli/src/utils/object.ts:29`
- **`getAtPath`** (Function) — `packages/cli/src/utils/object.ts:36`
- **`parseReferencePath`** (Function) — `packages/cli/src/utils/object.ts:16`
- **`validReferencePath`** (Function) — `packages/cli/src/utils/object.ts:15`
- **`valueAtRelativePath`** (Function) — `packages/cli/src/utils/object.ts:70`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `extractTokenReferenceMatches` | Function | `packages/cli/src/utils/object.ts` | 29 |
| `getAtPath` | Function | `packages/cli/src/utils/object.ts` | 36 |
| `parseReferencePath` | Function | `packages/cli/src/utils/object.ts` | 16 |
| `validReferencePath` | Function | `packages/cli/src/utils/object.ts` | 15 |
| `valueAtRelativePath` | Function | `packages/cli/src/utils/object.ts` | 70 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Run → ValidReferencePath` | cross_community | 8 |
| `Run → ValidReferencePath` | cross_community | 8 |
| `Run → ValidReferencePath` | cross_community | 7 |
| `ResolveReferences → ValidReferencePath` | cross_community | 6 |
| `ResolveColor → ValidReferencePath` | cross_community | 6 |
| `Run → ValidReferencePath` | cross_community | 5 |
| `ValueAtRelativePath → ValidReferencePath` | intra_community | 4 |
| `ValueAtRelativePath → IsRecord` | cross_community | 3 |

## How to Explore

1. `context({name: "extractTokenReferenceMatches"})` — see callers and callees
2. `query({search_query: "cluster_18"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
