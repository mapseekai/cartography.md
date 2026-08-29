# data-profile Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated Agent Skill that inspects user-provided style, TileJSON, and MVT inputs and writes an evidence-carrying runtime `DATA_PROFILE.json` without adding any profile contract or validation back to the cartography.md core package.

**Architecture:** Implement the Skill as a private pnpm workspace under `.agents/skills/data-profile`. Separate style discovery, TileJSON discovery, bounded tile sampling, MVT decoding, fact merging, and CLI orchestration into focused modules; keep its types and dependencies private, treat output as a Skill-owned runtime artifact, and reuse the relocated OpenFreeMap fixture only inside this directory.

**Tech Stack:** Node.js 20+, TypeScript 5.8, pnpm 10.34.5, Vitest 4, `@mapbox/vector-tile` 3.0.0, `pbf` 5.1.2, `@mapbox/mvt-fixtures` 4.0.0 for tests.

**Spec:** `docs/superpowers/specs/2026-08-29-cartography-md-0.2-design.md`

## Global Constraints

- Execute this plan after `2026-08-29-cartography-md-0.2-core.md`.
- The package is private and must never be exported by `@mapseekai/cartography.md` or copied into its `dist` directory.
- `DATA_PROFILE.json` is a runtime artifact owned by this Skill; no public JSON Schema, validator, or core format version is added.
- MapLibre-specific parsing is allowed only inside `.agents/skills/data-profile`.
- Never invent fields, geometry, units, categories, ordering, missing-value meaning, or stable IDs.
- Every fact carries evidence: `style-inferred`, `tilejson-declared`, or `tile-sampled`.
- Conflicting facts are retained and added to `unresolved`; they are never silently overwritten.
- Network work has explicit concurrency, timeout, retry, response-size, total-byte, and request-count budgets.
- Credentials, cookies, authorization headers, and raw sensitive feature values are never written to the profile.
- Equivalent inputs, options, and injected run metadata produce byte-identical JSON.
- Use TDD and commit after every task.

## File Structure

- `.agents/skills/data-profile/SKILL.md` — user-facing Agent workflow and safety boundary.
- `.agents/skills/data-profile/package.json` — private workspace and scripts.
- `.agents/skills/data-profile/tsconfig.json` — isolated TypeScript configuration.
- `.agents/skills/data-profile/src/types.ts` — private runtime profile and evidence types.
- `.agents/skills/data-profile/src/stable-json.ts` — deterministic key/category ordering and JSON output.
- `.agents/skills/data-profile/src/style.ts` — MapLibre-style source/layer/field discovery.
- `.agents/skills/data-profile/src/tilejson.ts` — TileJSON vector-layer discovery.
- `.agents/skills/data-profile/src/mvt.ts` — PBF/MVT decoding and tile observation.
- `.agents/skills/data-profile/src/sampling.ts` — tile coordinates, budgets, fetch, retry, and stop rules.
- `.agents/skills/data-profile/src/merge.ts` — evidence-preserving fact aggregation and conflict reporting.
- `.agents/skills/data-profile/src/generate.ts` — orchestration over all supplied inputs.
- `.agents/skills/data-profile/scripts/generate-profile.ts` — CLI using `node:util.parseArgs`.
- `.agents/skills/data-profile/tests/*.test.ts` — unit and integration tests.
- `.agents/skills/data-profile/fixtures/openfreemap-bright/*` — relocated real-world style/profile/license assets.

---

### Task 1: Scaffold the private Skill package and runtime model

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `.agents/skills/data-profile/package.json`
- Create: `.agents/skills/data-profile/tsconfig.json`
- Create: `.agents/skills/data-profile/src/types.ts`
- Create: `.agents/skills/data-profile/src/stable-json.ts`
- Create: `.agents/skills/data-profile/tests/stable-json.test.ts`

**Interfaces:**
- Produces: `Evidence`, `FieldFact`, `LayerFact`, `SourceFact`, `SamplingSummary`, `GeneratedProfile`, `UnresolvedItem`.
- Produces: `stableJson(value: unknown): string`.

- [ ] **Step 1: Add the private workspace and dependencies**

Add `.agents/skills/data-profile` to `pnpm-workspace.yaml`. Create a private package named `@cartographymd/data-profile-skill` with scripts `test`, `typecheck`, and `profile`; depend on `@mapbox/vector-tile@^3.0.0` and `pbf@^5.1.2`; use `@mapbox/mvt-fixtures@^4.0.0`, `tsx`, `typescript`, and `vitest` as dev dependencies.

- [ ] **Step 2: Write a failing deterministic serialization test**

```ts
it('sorts object keys and observed categories deterministically', () => {
  const profile = {
    sources: {z: {layers: {}}, a: {layers: {}}},
    categories: ['z', 2, 'a', null],
  };
  expect(stableJson(profile)).toBe(
    '{\n  "categories": [\n    null,\n    2,\n    "a",\n    "z"\n  ],\n  "sources": {\n    "a": {\n      "layers": {}\n    },\n    "z": {\n      "layers": {}\n    }\n  }\n}\n',
  );
});
```

- [ ] **Step 3: Run the test and confirm the package has no implementation**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/stable-json.test.ts`

Expected: FAIL because `stableJson` does not exist.

- [ ] **Step 4: Define the private output model**

```ts
export type EvidenceKind = 'style-inferred' | 'tilejson-declared' | 'tile-sampled';
export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'json' | 'unknown';
export type GeometryType = 'point' | 'line' | 'polygon' | 'unknown';

export interface Evidence {
  kind: EvidenceKind;
  input: string;
  location: string;
  observedAt?: string;
}

export interface FieldFact {
  types: FieldType[];
  categories: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  missingObserved: boolean;
  nullObserved: boolean;
  evidence: Evidence[];
}

export interface LayerFact {
  geometries: GeometryType[];
  minzoom?: number;
  maxzoom?: number;
  stableIdObserved: boolean;
  fields: Record<string, FieldFact>;
  evidence: Evidence[];
}

export interface SourceFact {
  type: string;
  tileTemplates: string[];
  layers: Record<string, LayerFact>;
  evidence: Evidence[];
}

export interface GeneratedProfile {
  format: 'cartography-data-profile/1';
  generatedAt: string;
  inputs: string[];
  sources: Record<string, SourceFact>;
  sampling?: SamplingSummary;
  unresolved: UnresolvedItem[];
}

export interface SamplingSummary {
  requested: number;
  decoded: number;
  empty: number;
  failed: number;
  bytes: number;
  coordinates: Array<{z: number; x: number; y: number}>;
  stopReason: 'budget-exhausted' | 'non-empty-limit' | 'structure-stable' | 'candidates-exhausted';
}

export interface UnresolvedItem {
  code: string;
  location: string;
  message: string;
  evidence: Evidence[];
}

export interface ProfileFragment {
  inputs: string[];
  sources: Record<string, SourceFact>;
  sampling?: SamplingSummary;
  unresolved: UnresolvedItem[];
}
```

This is an internal TypeScript model, not a public schema.

- [ ] **Step 5: Implement recursive stable serialization**

Sort object keys lexicographically. Sort scalar category arrays by `JSON.stringify(value)` while preserving order for evidence and unresolved arrays. Serialize with two spaces and one trailing newline.

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/stable-json.test.ts`

Run: `pnpm --filter @cartographymd/data-profile-skill typecheck`

Expected: PASS.

- [ ] **Step 7: Commit the private model**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml .agents/skills/data-profile/package.json .agents/skills/data-profile/tsconfig.json .agents/skills/data-profile/src/types.ts .agents/skills/data-profile/src/stable-json.ts .agents/skills/data-profile/tests/stable-json.test.ts
git commit -m "feat: scaffold data profile Skill runtime"
```

### Task 2: Discover facts from an existing MapLibre style

**Files:**
- Create: `.agents/skills/data-profile/src/style.ts`
- Create: `.agents/skills/data-profile/tests/style.test.ts`

**Interfaces:**
- `discoverStyle(style: unknown, input: string): ProfileFragment`.
- `collectReferencedFields(value: unknown): string[]`.
- Consumes/produces private types from Task 1.

- [ ] **Step 1: Write failing discovery tests**

Use a style with one vector source, `source-layer: roads`, `minzoom`, `maxzoom`, a modern `['get', 'status']` expression, a `['has', 'name']` filter, and a legacy `['==', 'class', 'primary']` filter. Assert one source/layer, zoom availability, and fields `status`, `name`, and `class`, all with `style-inferred` evidence and `unknown` type.

```ts
expect(fragment.sources.roads.layers.transportation.fields.status.types).toEqual(['unknown']);
expect(fragment.sources.roads.layers.transportation.evidence[0]?.kind).toBe('style-inferred');
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/style.test.ts`

Expected: FAIL because `discoverStyle` does not exist.

- [ ] **Step 3: Implement defensive style traversal**

Accept only plain objects and arrays. Discover source `type`, `url`, and `tiles` without fetching. For each layer with string `source`, group by string `source-layer` or `default`; merge min/max zoom. Recursively recognize fields only from `['get', field]`, `['has', field]`, legacy comparison/filter positions, and text-field expressions. Do not treat arbitrary string literals as fields.

- [ ] **Step 4: Record unsupported or ambiguous style facts**

Add unresolved items for vector layers with no source-layer, non-HTTP custom source URLs that cannot be inspected, and expressions whose field position is dynamic. Never infer field types or categories from literals in styling expressions.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/style.test.ts`

Expected: PASS.

```bash
git add .agents/skills/data-profile/src/style.ts .agents/skills/data-profile/tests/style.test.ts
git commit -m "feat: discover profile facts from MapLibre styles"
```

### Task 3: Discover declared facts from TileJSON

**Files:**
- Create: `.agents/skills/data-profile/src/tilejson.ts`
- Create: `.agents/skills/data-profile/tests/tilejson.test.ts`

**Interfaces:**
- `discoverTileJson(tileJson: unknown, sourceId: string, input: string): ProfileFragment`.
- Produces tile templates, bounds/center hints, vector layers, declared fields, and zooms.

- [ ] **Step 1: Write failing TileJSON tests**

```ts
const tileJson = {
  tilejson: '3.0.0',
  tiles: ['https://tiles.example/{z}/{x}/{y}.pbf'],
  bounds: [100, 20, 110, 30],
  minzoom: 4,
  maxzoom: 14,
  vector_layers: [{id: 'habitat', fields: {class: 'String', score: 'Number'}, minzoom: 6, maxzoom: 14}],
};
const result = discoverTileJson(tileJson, 'ecology', 'tilejson.json');
expect(result.sources.ecology.layers.habitat.fields.score.types).toEqual(['number']);
expect(result.sources.ecology.evidence[0]?.kind).toBe('tilejson-declared');
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/tilejson.test.ts`

Expected: FAIL because `discoverTileJson` does not exist.

- [ ] **Step 3: Implement declared-field normalization**

Map case-insensitive declarations containing `string`, `number`, `integer`, `boolean`, or `json` to the private types; preserve unknown declarations as `unknown` plus an unresolved item. Record all declarations as `tilejson-declared`; do not claim that declared fields or categories were observed in tiles.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/tilejson.test.ts`

Expected: PASS.

```bash
git add .agents/skills/data-profile/src/tilejson.ts .agents/skills/data-profile/tests/tilejson.test.ts
git commit -m "feat: discover declared TileJSON facts"
```

### Task 4: Decode MVT observations

**Files:**
- Create: `.agents/skills/data-profile/src/mvt.ts`
- Create: `.agents/skills/data-profile/tests/mvt.test.ts`
- Create: `.agents/skills/data-profile/tests/mvt-fixtures.d.ts`

**Interfaces:**
- `decodeMvt(bytes: Uint8Array, evidence: Evidence): TileObservation`.
- `observeValue(value: unknown): FieldObservation`.

```ts
export interface FieldObservation {
  types: FieldType[];
  categories: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  presentCount: number;
  missingCount: number;
  nullObserved: boolean;
}
export interface TileObservation {
  layers: Record<string, {
    geometries: GeometryType[];
    featureCount: number;
    stableIdObserved: boolean;
    fields: Record<string, FieldObservation>;
  }>;
}
```

- [ ] **Step 1: Build an inline test tile and write failing decoder tests**

Use `@mapbox/mvt-fixtures.create()` to create a version-2 layer named `habitat` with point features containing `name`, integer `score`, boolean `protected`, one feature where `score` is absent, and stable IDs. Assert geometry `point`, observed field types, min/max score, categories, missing-field observation, and stable ID. MVT has no explicit null scalar, so the decoder must not report `nullObserved` from absence.

Add this narrow local declaration instead of exporting fixture-library types from the Skill:

```ts
declare module '@mapbox/mvt-fixtures' {
  export function create(input: unknown): {buffer: Uint8Array};
}
```

```ts
const observation = decodeMvt(buffer, evidence);
expect(observation.layers.habitat.geometries).toEqual(['point']);
expect(observation.layers.habitat.fields.score).toMatchObject({types: ['integer'], minimum: 0, maximum: 80});
expect(observation.layers.habitat.fields.score.missingObserved).toBe(true);
expect(observation.layers.habitat.fields.score.nullObserved).toBe(false);
expect(observation.layers.habitat.stableIdObserved).toBe(true);
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/mvt.test.ts`

Expected: FAIL because no MVT decoder exists.

- [ ] **Step 3: Implement decoding with current library APIs**

```ts
import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';

const tile = new VectorTile(new PbfReader(bytes));
for (const [layerName, layer] of Object.entries(tile.layers)) {
  for (let index = 0; index < layer.length; index += 1) {
    const feature = layer.feature(index);
    // feature.type: 1 point, 2 line, 3 polygon
    // feature.properties: observed attributes
  }
}
```

Detect gzip magic bytes `0x1f, 0x8b` and use `gunzipSync` before decoding. Cap stored categories at 256 unique scalar values per field and add an unresolved/truncation note when exceeded. Never copy object-valued properties into categories.

- [ ] **Step 4: Add damaged-tile and mixed-type tests**

Assert invalid PBF throws a typed `TileDecodeError`; mixed observed types are retained rather than coerced; absence and explicit null remain distinguishable.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/mvt.test.ts`

Expected: PASS.

```bash
git add .agents/skills/data-profile/src/mvt.ts .agents/skills/data-profile/tests/mvt.test.ts .agents/skills/data-profile/tests/mvt-fixtures.d.ts
git commit -m "feat: decode MVT profile observations"
```

### Task 5: Add bounded sampling and safe fetching

**Files:**
- Create: `.agents/skills/data-profile/src/sampling.ts`
- Create: `.agents/skills/data-profile/tests/sampling.test.ts`

**Interfaces:**
- `sampleTiles(options: SamplerOptions, fetcher?: TileFetcher): Promise<SamplingResult>`.
- `tileCandidates(bounds, zooms): TileCoordinate[]`.
- Defaults: concurrency 4, max requests 40, max non-empty 30, stable-stop 8, timeout 10s, retries 2, max response 5 MiB, max total 50 MiB.

```ts
export interface SamplerOptions {
  template: string;
  bounds: [number, number, number, number];
  zooms: number[];
  concurrency: number;
  maxRequests: number;
  maxNonEmpty: number;
  stableStop: number;
  timeoutMs: number;
  retries: number;
  maxResponseBytes: number;
  maxTotalBytes: number;
  allowPrivateNetwork: boolean;
}
export interface TileCoordinate {z: number; x: number; y: number}
export type TileFetcher = (coordinate: TileCoordinate, signal: AbortSignal) => Promise<Uint8Array>;
export interface SamplingResult {
  observations: Array<{coordinate: TileCoordinate; observation: TileObservation}>;
  summary: SamplingSummary;
  unresolved: UnresolvedItem[];
}
```

- [ ] **Step 1: Write failing coordinate and budget tests**

Assert longitude/latitude bounds produce deterministic center/corner candidates at sorted zooms; duplicates are removed. With an injected fake fetcher, assert no more than 4 concurrent requests, retries stop after 2, maxRequests is honored, and 8 consecutive non-empty tiles with no new structure produce stop reason `structure-stable`.

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/sampling.test.ts`

Expected: FAIL because sampling is absent.

- [ ] **Step 3: Implement Web Mercator candidate math**

```ts
const scale = 2 ** zoom;
const x = Math.floor(((longitude + 180) / 360) * scale);
const latitude = Math.max(-85.05112878, Math.min(85.05112878, inputLatitude));
const y = Math.floor((1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * scale);
```

Use center, four corners inset by one floating-point epsilon, and quarter points. Sort by zoom, then x, then y.

- [ ] **Step 4: Implement guarded HTTP/local fetching**

Allow explicit local file templates and HTTP(S) URLs only. Resolve hostnames and reject loopback, link-local, and private address ranges by default; expose `allowPrivateNetwork` only through the explicit CLI flag `--allow-private-network`. Use manual redirects, revalidate every redirect target, and stop after three redirects. Use `AbortSignal.timeout`, validate `content-length` when present, stream bytes while enforcing the response and total limits, and never persist request headers. Reject other protocols with a structured unresolved item. Keep fetcher injection for deterministic tests.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/sampling.test.ts`

Expected: PASS.

```bash
git add .agents/skills/data-profile/src/sampling.ts .agents/skills/data-profile/tests/sampling.test.ts
git commit -m "feat: add bounded MVT sampling"
```

### Task 6: Merge evidence and orchestrate generation

**Files:**
- Create: `.agents/skills/data-profile/src/merge.ts`
- Create: `.agents/skills/data-profile/src/generate.ts`
- Create: `.agents/skills/data-profile/scripts/generate-profile.ts`
- Create: `.agents/skills/data-profile/tests/generate.test.ts`

**Interfaces:**
- `mergeFragments(fragments: ProfileFragment[]): MergeResult`, where `MergeResult = {inputs: string[]; sources: Record<string, SourceFact>; sampling?: SamplingSummary; unresolved: UnresolvedItem[]}`.
- `generateProfile(options: GenerateOptions, dependencies?: GenerateDependencies): Promise<GeneratedProfile>`.
- CLI flags: `--style`, `--tilejson`, `--source-id`, `--tile-template`, `--bbox`, `--zooms`, `--max-requests`, `--allow-private-network`, `--observed-at`, `--output`.

```ts
export interface GenerateOptions {
  stylePath?: string;
  tileJsonPath?: string;
  sourceId?: string;
  tileTemplate?: string;
  bounds?: [number, number, number, number];
  zooms?: number[];
  maxRequests?: number;
  allowPrivateNetwork?: boolean;
  observedAt: string;
}
export interface GenerateDependencies {
  readText(path: string): Promise<string>;
  fetchTile?: TileFetcher;
  now(): Date;
}
```

- [ ] **Step 1: Write failing merge/conflict tests**

Create fragments where metadata declares a numeric field but a sampled tile observes a string. Assert both evidence records survive, field types contain both values, and `unresolved` records `field-type-conflict` with source/layer/field location.

- [ ] **Step 2: Write a failing end-to-end generation test**

Inject file readers and a fake tile fetcher. Supply style + TileJSON + two MVT buffers and explicit `observedAt`. Assert sources/layers are merged, sampling counters are correct, unresolved is always an array, and two identical runs serialize byte-for-byte identically.

- [ ] **Step 3: Implement evidence-preserving merge precedence**

Merge does not choose a winner. De-duplicate identical facts/evidence, union geometry/types/categories, expand numeric ranges, and record conflicts. Sort evidence by kind/input/location/observedAt. Empty unresolved must serialize as `[]`.

- [ ] **Step 4: Implement orchestration and CLI**

Use `node:util.parseArgs`. Require at least one discovery input. `--observed-at` must be a supplied ISO timestamp for reproducible automation; when omitted interactively, use the current time and write it only to runtime metadata. Default output is `DATA_PROFILE.json`. Write only after successful stable serialization; use a temporary sibling file followed by rename to avoid partial output.

- [ ] **Step 5: Run tests and a local CLI smoke test**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/generate.test.ts`

Run: `pnpm --filter @cartographymd/data-profile-skill profile -- --style fixtures/openfreemap-bright/style.json --observed-at 2026-08-29T00:00:00Z --output /tmp/cartography-data-profile.json`

Expected: tests PASS; CLI writes a partial, style-inferred profile and reports unresolved data facts without network sampling.

- [ ] **Step 6: Commit orchestration**

```bash
git add .agents/skills/data-profile/src/merge.ts .agents/skills/data-profile/src/generate.ts .agents/skills/data-profile/scripts/generate-profile.ts .agents/skills/data-profile/tests/generate.test.ts
git commit -m "feat: generate evidence-carrying data profiles"
```

### Task 7: Complete Skill instructions and real fixture integration

**Files:**
- Create: `.agents/skills/data-profile/SKILL.md`
- Update: `.agents/skills/data-profile/fixtures/openfreemap-bright/README.md`
- Update: `.agents/skills/data-profile/fixtures/openfreemap-bright/README.zh-CN.md`
- Replace: `.agents/skills/data-profile/fixtures/openfreemap-bright/DATA_PROFILE.json` with the deterministic fixed-timestamp style-discovery output used by the integration test.
- Create: `.agents/skills/data-profile/tests/openfreemap.test.ts`

**Interfaces:**
- Skill tells agents when to reuse, refresh, or generate a profile and how to report partial evidence.
- Fixture integration never runs live network access in CI.

- [ ] **Step 1: Add a failing real-style integration test**

Run `generateProfile` with the relocated style, no TileJSON/MVT fetch, and fixed timestamp. Assert the profile contains the style-declared source and representative source-layer references, marks all such evidence `style-inferred`, and includes unresolved items explaining that field domains and actual tile contents were not observed.

- [ ] **Step 2: Run and fix the integration test**

Run: `pnpm --filter @cartographymd/data-profile-skill test -- tests/openfreemap.test.ts`

Expected: PASS with style evidence marked `style-inferred`, field domains unresolved, and no core files read.

- [ ] **Step 3: Write the complete Skill workflow**

Before editing `SKILL.md`, read and follow the available `skill-creator` Skill so the new package follows the host's required Skill structure.

The Skill must require this sequence:

```markdown
1. Read the user's actual inputs and decide whether an existing profile can be reused.
2. Prefer explicit TileJSON/metadata, then sample actual MVT when declarations are missing or insufficient.
3. Use multiple spatial candidates and relevant zooms within the configured budget; never infer a complete domain from one tile.
4. Keep declared, sampled, and style-inferred evidence separate and retain conflicts.
5. Never copy credentials or unnecessary raw feature values into DATA_PROFILE.json.
6. Write partial results with unresolved items when safe completion is impossible.
7. Treat the output as user/runtime context; do not run or claim cartography.md core validation on it.
8. Never modify CARTOGRAPHY.md to fit the discovered dataset.
```

Document exact CLI invocations for style-only, TileJSON, local MVT template, and bounded remote MVT workflows.

- [ ] **Step 4: Preserve fixture licensing**

Keep both third-party license files alongside the style. State that the fixture is non-normative test data for this Skill and is not a core cartography.md example.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @cartographymd/data-profile-skill test`

Expected: PASS with no live network.

```bash
git add .agents/skills/data-profile
git commit -m "docs: add data profile generation Skill"
```

### Task 8: Add isolated CI gates and final verification

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Root scripts: `test:data-profile` and `typecheck:data-profile` target only the private Skill package.
- Core package remains independent and does not import the Skill.

- [ ] **Step 1: Add Skill-only root scripts and CI steps**

Add:

```json
"test:data-profile": "pnpm --filter @cartographymd/data-profile-skill test",
"typecheck:data-profile": "pnpm --filter @cartographymd/data-profile-skill typecheck"
```

Run them as separate CI steps after the core checks so failures identify the owning subsystem.

- [ ] **Step 2: Run both subsystem suites**

Run: `pnpm check`

Run: `pnpm lint:example`

Run: `pnpm typecheck:data-profile`

Run: `pnpm test:data-profile`

Expected: all exit 0.

- [ ] **Step 3: Verify dependency and source boundaries**

Confirm `packages/cli/package.json` has no MapLibre/MVT dependencies; `.agents/skills/data-profile/package.json` owns all vector-tile dependencies; no core API imports `.agents`; no profile schema is created; and the core product-boundary test still passes.

- [ ] **Step 4: Verify deterministic output and safety limits**

Run the style-only CLI twice with the same `--observed-at` and compare bytes; expect no difference. Run tests that exceed request, response, and total-byte budgets; expect structured termination and no partial destination file.

- [ ] **Step 5: Commit Skill integration gates**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: verify isolated data profile Skill"
```
