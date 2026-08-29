# cartography.md 0.2 Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the renderer- and data-bound 0.1 contract with a renderer-neutral, prose-first `CARTOGRAPHY.md` 0.2 format whose core package parses, lints, diffs, and documents that one file only.

**Architecture:** Keep the existing YAML-front-matter plus Markdown parser, token resolver, finding model, CLI command set, and diff engine. Replace the root schema and document rules with the approved 0.2 model, generate JSON Schema from Zod 4, move renderer/data fixtures behind the future `data-profile` Skill boundary, and rewrite every public document around the single-file contract.

**Tech Stack:** Node.js 20+, TypeScript 5.8, pnpm 10.34.5, Zod 4.4.3, Color.js 0.7.1, Ajv 8.20.0, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-29-cartography-md-0.2-design.md`

## Global Constraints

- Format and package version is exactly `0.2.0`; 0.1 compatibility and migration code are forbidden.
- `CARTOGRAPHY.md` is the only standardized input and the only artifact validated by the core package.
- Core product files must not contain renderer-specific contracts, types, dependencies, examples, or validation behavior.
- Map/style/data-profile inputs and `--profile` / `--style` options must be removed from the core API and CLI.
- YAML token references occupy an entire YAML scalar; Markdown prose may contain inline `{tokens.path}` references.
- Zod is the executable schema source; `schema/cartography.schema.json` is generated and parity-tested, never hand-maintained.
- Unknown/namespaced extensions are preserved; the linter warns for unknown unnamespaced root keys.
- Core lint remains deterministic, side-effect free, and network independent.
- Normal mode blocks errors; strict mode blocks errors and warnings; exit codes remain 0/1/2.
- Use TDD and commit after every task.

## File Structure

### Core schema and model

- `packages/cli/src/schema/cartography.ts` — 0.2 Zod source of truth and inferred public types.
- `packages/cli/src/schema/index.ts` — exports only 0.2 core schemas/types.
- `packages/cli/src/model/types.ts` — document-only findings, rules, options, and reports.
- `packages/cli/scripts/generate-schema.ts` — deterministic Zod 4 → Draft 2020-12 JSON Schema generator/checker.
- `schema/cartography.schema.json` — generated portable schema.

### Parser and linter

- `packages/cli/src/parser/sections.ts` — 12 canonical sections plus English/Chinese aliases.
- `packages/cli/src/parser/parse.ts` — existing deterministic YAML parser, updated for 0.2 types.
- `packages/cli/src/linter/rules/document.ts` — front matter, sections, unknown keys, YAML and Markdown references.
- `packages/cli/src/linter/rules/cartography.ts` — token, CSS color, contrast, and summary rules only.
- `packages/cli/src/linter/rules/helpers.ts` — normalized `omitted` handling only.
- `packages/cli/src/linter/index.ts` — document-only lint orchestration.
- `packages/cli/src/linter/rule-catalog.ts` — active core rules only.
- `packages/cli/src/utils/color.ts` — renderer-neutral CSS Color 4 parsing and WCAG 2.1 contrast.

### CLI, API, package

- `packages/cli/src/commands/lint.ts` — one input plus format/strict options.
- `packages/cli/src/api.ts` — document-only exports.
- `packages/cli/src/cli.ts`, `packages/cli/src/version.ts` — neutral description and 0.2 version.
- `packages/cli/scripts/copy-assets.mjs`, `packages/cli/scripts/check-package.mjs` — ship one JSON Schema.
- `package.json`, `packages/cli/package.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml` — version, dependencies, scripts, and gates.

### Docs, example, and Skill

- `examples/quiet-atlas/CARTOGRAPHY.md` — sole renderer-neutral core example.
- `.agents/skills/cartography-md/SKILL.md` — renderer-neutral application workflow.
- `.agents/skills/data-profile/fixtures/openfreemap-bright/*` — relocated 0.1 runtime/style assets for the separate Skill plan.
- `docs/spec*.md`, `docs/api*.md`, `README*.md`, `PHILOSOPHY*.md`, `CHANGELOG*.md`, `CONTRIBUTING.md`, `SECURITY.md`, `packages/cli/README.md` — synchronized 0.2 public surface.

### Removed files

- `packages/cli/src/schema/data-profile.ts`
- `packages/cli/src/linter/rules/profile.ts`
- `packages/cli/src/linter/rules/style.ts`
- `schema/data-profile.schema.json`
- `docs/proposal-conformance-levels.zh-CN.md`
- `packages/cli/src/__tests__/profile-style.test.ts`

---

### Task 1: Establish the 0.2 schema and compile-safe document-only boundary

**Files:**
- Modify: `package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/src/version.ts`
- Rewrite: `packages/cli/src/schema/cartography.ts`
- Modify: `packages/cli/src/schema/index.ts`
- Rewrite: `packages/cli/src/model/types.ts`
- Rewrite: `packages/cli/src/linter/index.ts`
- Modify: `packages/cli/src/linter/rules/index.ts`
- Modify: `packages/cli/src/linter/rule-catalog.ts`
- Modify: `packages/cli/src/linter/rules/document.ts`
- Rewrite: `packages/cli/src/linter/rules/helpers.ts`
- Modify: `packages/cli/src/api.ts`
- Modify: `packages/cli/src/utils/io.ts`
- Rewrite: `packages/cli/src/linter/rules/cartography.ts`
- Delete: `packages/cli/src/schema/data-profile.ts`
- Delete: `packages/cli/src/linter/rules/profile.ts`
- Delete: `packages/cli/src/linter/rules/style.ts`
- Delete: `packages/cli/src/__tests__/profile-style.test.ts`
- Modify: `packages/cli/src/__tests__/example.test.ts`
- Create: `packages/cli/src/__tests__/schema.test.ts`
- Create: `packages/cli/src/__tests__/document-only.test.ts`

**Interfaces:**
- Produces: `cartographySchema`, `tokenReferenceSchema`, `contrastPairSchema`, `omittedSectionSchema`.
- Produces: `CartographyConfig = z.infer<typeof cartographySchema>` and associated inferred token types.
- Produces: document-only `LintContext`, `LintRule`, `LintOptions`, `LintFileOptions`, and `LintReport`.
- Consumed by: parser, linter, schema generator, API, example.

- [ ] **Step 1: Write failing 0.2 schema tests**

```ts
import {describe, expect, it} from 'vitest';
import {cartographySchema} from '../schema/cartography.js';

const minimal = {version: '0.2.0', name: 'Quiet Atlas'};

describe('cartographySchema 0.2', () => {
  it('accepts the minimal prose-first document', () => {
    expect(cartographySchema.safeParse(minimal).success).toBe(true);
  });

  it('accepts known token groups and exact references', () => {
    const result = cartographySchema.safeParse({
      ...minimal,
      tokens: {
        colors: {ink: '#25221D', label: '{tokens.colors.ink}'},
        typography: {label: {fontFamily: 'Noto Sans', fontSize: 12, fontWeight: 400}},
        widths: {hairline: 0.5},
        sizes: {symbol: '8px'},
        opacities: {context: 0.55},
      },
    });
    expect(result.success).toBe(true);
  });

  it.each([
    [{...minimal, version: '0.1.0'}, 'version'],
    [{...minimal, tokens: {opacities: {context: 1.1}}}, 'opacities'],
    [{...minimal, name: '   '}, 'name'],
  ])('rejects invalid input %j at %s', (input) => {
    expect(cartographySchema.safeParse(input).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the schema test and confirm it fails against 0.1**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/schema.test.ts`

Expected: FAIL because the current schema requires `target`, `intent`, `data`, `zoom`, `tokens`, `encodings`, and `layerOrder`, and accepts only version 0.1.0.

- [ ] **Step 3: Upgrade Zod and implement the minimal 0.2 schema**

Run: `pnpm --filter @mapseekai/cartography.md add zod@^4.4.3`

Use these exact schema boundaries:

```ts
import * as z from 'zod';

const nonEmptyString = z.string().trim().min(1);
export const tokenReferenceSchema = z.string().regex(/^\{[A-Za-z0-9_.\-[\]]+\}$/);
const dimensionSchema = z.union([
  z.number().finite().nonnegative(),
  z.string().regex(/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|pt|mm|cm|in|em|rem|%)$/),
  tokenReferenceSchema,
]);

const typographyTokenSchema = z.union([
  tokenReferenceSchema,
  z.object({
    fontFamily: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]).optional(),
    fontSize: dimensionSchema.optional(),
    fontWeight: z.union([z.number().finite().min(1).max(1000), nonEmptyString]).optional(),
    lineHeight: z.union([z.number().finite().positive(), dimensionSchema]).optional(),
    letterSpacing: z.union([z.number().finite(), nonEmptyString]).optional(),
  }).passthrough(),
]);

export const cartographySchema = z.object({
  version: z.literal('0.2.0'),
  name: nonEmptyString,
  description: z.string().optional(),
  locale: nonEmptyString.optional(),
  tokens: z.object({
    colors: z.record(z.string(), nonEmptyString).optional(),
    typography: z.record(z.string(), typographyTokenSchema).optional(),
    widths: z.record(z.string(), dimensionSchema).optional(),
    sizes: z.record(z.string(), dimensionSchema).optional(),
    opacities: z.record(z.string(), z.union([z.number().finite().min(0).max(1), tokenReferenceSchema])).optional(),
  }).catchall(z.unknown()).optional(),
  accessibility: z.object({
    contrastPairs: z.array(contrastPairSchema).optional(),
  }).passthrough().optional(),
  omitted: z.array(omittedSectionSchema).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type CartographyConfig = z.infer<typeof cartographySchema>;
```

Keep `contrastPairSchema` and `omittedSectionSchema` behavior from 0.1, but remove all renderer/data/encoding schemas and all hand-written duplicate interfaces.

- [ ] **Step 4: Write failing document-only boundary tests**

```ts
const minimalDocument = `---
version: "0.2.0"
name: Minimal
---

## Overview

Quiet and restrained.
`;

it('returns a document-only report', () => {
  const report = lint(minimalDocument);
  expect(report).not.toHaveProperty('artifacts');
  expect(report.document.version).toBe('0.2.0');
});

it('has only document rules', () => {
  expect(DEFAULT_RULES.every((rule) => rule.scope === 'document')).toBe(true);
  expect(getRuleCatalog().every((rule) => rule.scope === 'document')).toBe(true);
});
```

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/document-only.test.ts`

Expected: FAIL because reports contain artifact flags and default rules include profile/style scopes.

- [ ] **Step 5: Replace the model and linter with a compile-safe document-only core**

Use these exact boundaries:

```ts
export type RuleScope = 'document';
export interface LintContext {
  source: string;
  parsed: ParsedCartography;
  cartography?: CartographyConfig;
  sourcePath?: string;
  maxDocumentBytes: number;
}
export interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
export type LintFileOptions = Omit<LintOptions, 'sourcePath'>;
```

`lint()` parses one source, runs `DOCUMENT_RULES` plus the temporarily empty `CARTOGRAPHY_RULES`, and returns findings/summary/document/sections/resolved without `artifacts`. `lintFile()` only reads the Markdown file and calls `lint()`.

- [ ] **Step 6: Delete cross-artifact code and update exports/catalog**

Delete the listed profile/style/schema/test files. Remove `readJson`, `dataProfileSchema`, `DataProfile`, `validateMapLibreStyle`, and every related API export. Remove profile generics/imports from document rules, and reduce `helpers.ts` to `omittedSectionNames`. Reduce `rules/index.ts` and `RULE_CATALOG` to active document rules plus `rule-execution`. Keep `CARTOGRAPHY_RULES` exported as an empty document-rule array until Task 3 adds token rules.

Replace the old example test temporarily with a single assertion that the 0.1 fixture returns a `schema` finding under 0.2. This removes deleted lint options from TypeScript immediately; Task 7 replaces the transitional assertion with the final Quiet Atlas test.

- [ ] **Step 7: Set every version source to 0.2.0**

Change root/package manifest versions and `packages/cli/src/version.ts` to exactly `0.2.0`. Do not add compatibility unions.

- [ ] **Step 8: Run focused tests and typecheck**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/schema.test.ts src/__tests__/document-only.test.ts`

Expected: PASS.

Run: `pnpm --filter @mapseekai/cartography.md typecheck`

Expected: PASS.

- [ ] **Step 9: Commit the schema and core boundary**

```bash
git add package.json packages/cli/package.json pnpm-lock.yaml packages/cli/src/version.ts packages/cli/src/schema/cartography.ts packages/cli/src/schema/index.ts packages/cli/src/model/types.ts packages/cli/src/linter/index.ts packages/cli/src/linter/rules/index.ts packages/cli/src/linter/rule-catalog.ts packages/cli/src/linter/rules/document.ts packages/cli/src/linter/rules/helpers.ts packages/cli/src/linter/rules/cartography.ts packages/cli/src/api.ts packages/cli/src/utils/io.ts packages/cli/src/__tests__/schema.test.ts packages/cli/src/__tests__/document-only.test.ts packages/cli/src/__tests__/example.test.ts
git add -u packages/cli/src/schema/data-profile.ts packages/cli/src/linter/rules/profile.ts packages/cli/src/linter/rules/style.ts packages/cli/src/__tests__/profile-style.test.ts
git commit -m "refactor: establish cartography 0.2 core boundary"
```

### Task 2: Replace canonical sections and validate prose references

**Files:**
- Modify: `packages/cli/src/parser/sections.ts`
- Modify: `packages/cli/src/linter/rules/document.ts`
- Modify: `packages/cli/src/linter/rules/helpers.ts`
- Modify: `packages/cli/src/utils/object.ts`
- Rewrite: `packages/cli/src/__tests__/document.test.ts`

**Interfaces:**
- Produces: `CANONICAL_SECTIONS` with the approved 12 entries.
- Produces: `normalizeHeading(heading: string): string` with Chinese aliases.
- Produces: document findings `token-reference`, `required-sections`, `section-order`, `unknown-root-key`.

- [ ] **Step 1: Write failing section and Markdown-reference tests**

Use a minimal 0.2 document and assert all of the following:

```ts
const base = `---
version: "0.2.0"
name: Reference test
tokens:
  colors:
    ink: "#25221D"
---

## Overview

Quiet.
`;

it('allows inline references in prose but not YAML scalars', () => {
  const prose = lint(base.replace('Quiet.', 'Use {tokens.colors.ink} for labels.'));
  const yaml = lint(base.replace('ink: "#25221D"', 'ink: "prefix-{tokens.colors.paper}"'));
  expect(prose.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
  expect(yaml.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
});

it('reports a broken inline prose reference', () => {
  const report = lint(base.replace('Quiet.', 'Use {tokens.colors.missing}.'));
  expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'token-reference'}));
});

it('normalizes new Chinese aliases', () => {
  expect(normalizeHeading('比例尺与制图综合')).toBe('Scale & Generalization');
  expect(normalizeHeading('层叠与构图')).toBe('Layering & Composition');
  expect(normalizeHeading('评审原则')).toBe('Review Principles');
});
```

- [ ] **Step 2: Run the document tests and confirm failure**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/document.test.ts`

Expected: FAIL on old sections and because Markdown references are not checked.

- [ ] **Step 3: Replace section constants and aliases**

Set the exact order to:

```ts
export const CANONICAL_SECTIONS = [
  'Overview', 'Intent & Audience', 'Visual Hierarchy', 'Color',
  'Typography & Labels', 'Geometry & Symbols', 'Scale & Generalization',
  'Layering & Composition', 'Interaction States', 'Accessibility',
  'Review Principles', "Do's and Don'ts",
] as const;
```

Remove aliases for Data Semantics, MapLibre Implementation, and old Validation; add `比例尺与制图综合`, `层叠与构图`, and `评审原则`.

- [ ] **Step 4: Update document keys and reference traversal**

Set recognized root keys to exactly `version`, `name`, `description`, `locale`, `tokens`, `accessibility`, `omitted`, `extensions`. Preserve namespaced unknowns. Normalize `omitted` section names through `normalizeHeading`.

Keep exact-scalar validation for YAML by walking `context.cartography`. Separately call `extractTokenReferences(section.body)` for each Markdown section and resolve every inline reference against the front matter root; report broken or cyclic references at `sections.<canonicalHeading>` with `section.line`.

- [ ] **Step 5: Run focused tests**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/document.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the document grammar**

```bash
git add packages/cli/src/parser/sections.ts packages/cli/src/linter/rules/document.ts packages/cli/src/linter/rules/helpers.ts packages/cli/src/utils/object.ts packages/cli/src/__tests__/document.test.ts
git commit -m "refactor: make cartography prose-first"
```

### Task 3: Replace renderer color handling with generic token rules

**Files:**
- Modify: `packages/cli/package.json`
- Rewrite: `packages/cli/src/utils/color.ts`
- Rewrite: `packages/cli/src/linter/rules/cartography.ts`
- Create: `packages/cli/src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: `parseCssColor(value: unknown): Color | undefined`.
- Produces: `contrastRatio(foreground: Color, background: Color): number` using WCAG 2.1.
- Produces rules: `color-token`, `contrast-pairs`, `contract-summary`.

- [ ] **Step 1: Write failing CSS Color 4 and contrast tests**

```ts
function docWithColors(colors: Record<string, string>): string {
  const lines = Object.entries(colors).map(([name, value]) => `    ${name}: ${JSON.stringify(value)}`).join('\n');
  return `---\nversion: "0.2.0"\nname: Color test\ntokens:\n  colors:\n${lines}\n---\n\n## Overview\n\nColor test.\n`;
}

function docWithContrast(foreground: string, background: string, minimum: number): string {
  return `---
version: "0.2.0"
name: Contrast test
tokens:
  colors:
    foreground: ${JSON.stringify(foreground)}
    background: ${JSON.stringify(background)}
accessibility:
  contrastPairs:
    - id: declared-pair
      foreground: "{tokens.colors.foreground}"
      background: "{tokens.colors.background}"
      minimum: ${minimum}
      kind: text
---

## Overview

Contrast test.
`;
}

it('accepts CSS Color 4 independently of any renderer', () => {
  const report = lint(docWithColors({accent: 'oklch(62% 0.18 250)'}));
  expect(report.findings.some((finding) => finding.ruleId === 'color-token')).toBe(false);
});

it('rejects an invalid CSS color', () => {
  const report = lint(docWithColors({accent: 'definitely-not-a-color'}));
  expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'color-token', severity: 'error'}));
});

it('checks declared WCAG 2.1 pairs', () => {
  const report = lint(docWithContrast('#777777', '#777777', 4.5));
  expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'contrast-pairs'}));
});
```

- [ ] **Step 2: Run tests and confirm the renderer parser limitation**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/tokens.test.ts`

Expected: FAIL because `utils/color.ts` imports the renderer package and does not provide `parseCssColor`.

- [ ] **Step 3: Install Color.js and rewrite color utilities**

Run: `pnpm --filter @mapseekai/cartography.md add colorjs.io@^0.7.1`

```ts
import Color from 'colorjs.io';

export function parseCssColor(value: unknown): Color | undefined {
  if (typeof value !== 'string') return undefined;
  try { return new Color(value); } catch { return undefined; }
}

export function contrastRatio(foreground: Color, background: Color): number {
  return foreground.contrastWCAG21(background);
}
```

Retain `resolveColor`, but make it return Color.js objects and rename all messages from renderer color to CSS color.

- [ ] **Step 4: Reduce cartography rules to tokens, contrast, and summary**

Delete zoom, layer-order, scale, encoding, critical-channel, and fixture rules. Make every rule tolerate absent `tokens` and `accessibility`. Summary text must be exactly of the form `Loaded N token leaves across M token groups and S prose sections.`

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/tokens.test.ts`

Expected: PASS.

Run: `pnpm --filter @mapseekai/cartography.md typecheck`

Expected: PASS.

- [ ] **Step 6: Commit generic token validation**

```bash
git add packages/cli/package.json pnpm-lock.yaml packages/cli/src/utils/color.ts packages/cli/src/linter/rules/cartography.ts packages/cli/src/__tests__/tokens.test.ts
git commit -m "refactor: validate renderer-neutral design tokens"
```

### Task 4: Harden the document-only report and public API

**Files:**
- Modify: `packages/cli/src/api.ts`
- Modify: `packages/cli/src/linter/index.ts`
- Modify: `packages/cli/src/model/types.ts`
- Modify: `packages/cli/src/__tests__/document-only.test.ts`

**Interfaces:**
- Public exports are exactly parser/schema, document linter, diff, spec/rules, models, and `VERSION`.
- Custom rules with a matching ID replace a default rule.
- `lintFile()` reports `document.path` and never discovers companion files.

- [ ] **Step 1: Extend boundary tests with exact API/report behavior**

```ts
it('does not export removed APIs', async () => {
  const api = await import('../api.js');
  expect(api).not.toHaveProperty('dataProfileSchema');
  expect(api).not.toHaveProperty(['validate', 'Map', 'LibreStyle'].join(''));
});

it('lets a custom rule replace a default rule by id', () => {
  const report = lint(minimalDocument, {rules: [{
    id: 'document-size', severity: 'info', scope: 'document', description: 'override', run: () => [],
  }]});
  expect(report.findings.some((finding) => finding.ruleId === 'rule-execution')).toBe(false);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/document-only.test.ts`

Expected: FAIL until exports and report behavior are reduced to the exact 0.2 surface.

- [ ] **Step 3: Make exports and report keys exact**

Export `parseCartography`, `cartographySchema`, `DEFAULT_RULES`, `lint`, `lintCartography`, `lintFile`, `resolveReferences`, `diffCartography`, `getRuleCatalog`, `getSpecification`, model/schema types, and `VERSION`. Ensure `LintReport` contains only `valid`, `strict`, `findings`, `summary`, optional `cartography`/`resolved`, `sections`, and `document`.

- [ ] **Step 4: Verify file-only behavior and custom-rule replacement**

Add a temporary-file test for `lintFile()` that asserts `document.path` equals the supplied file and no sibling file is read. Keep the existing `Map`-by-rule-ID merge behavior for custom overrides.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/document-only.test.ts`

Run: `pnpm --filter @mapseekai/cartography.md typecheck`

Expected: both PASS.

- [ ] **Step 6: Commit the core boundary**

```bash
git add packages/cli/src/api.ts packages/cli/src/linter/index.ts packages/cli/src/model/types.ts packages/cli/src/__tests__/document-only.test.ts
git commit -m "refactor: harden document-only public API"
```

### Task 5: Remove CLI profile/style inputs

**Files:**
- Modify: `packages/cli/src/commands/lint.ts`
- Modify: `packages/cli/src/cli.ts`
- Rewrite: `packages/cli/src/__tests__/cli.test.ts`

**Interfaces:**
- CLI: `lint <file> [--format json|text] [--strict]` only.
- Unknown removed flags cause usage failure and exit code 2.

- [ ] **Step 1: Write failing CLI integration tests**

Spawn `node --import tsx packages/cli/src/cli.ts` against a temporary 0.2 file. Assert a normal lint exits 0 and returns JSON. Assert `lint file --profile profile.json` and `lint file --style style.json` exit 2 and never emit a lint report.

```ts
import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterAll} from 'vitest';

const cli = fileURLToPath(new URL('../cli.ts', import.meta.url));
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'cartography-cli-'));
const file = join(temporaryDirectory, 'CARTOGRAPHY.md');
writeFileSync(file, '---\nversion: "0.2.0"\nname: CLI test\n---\n\n## Overview\n\nTest.\n');
function runCli(args: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {encoding: 'utf8'});
}

expect(runCli(['lint', file]).status).toBe(0);
expect(runCli(['lint', file, '--profile', 'profile.json']).status).toBe(2);
expect(runCli(['lint', file, '--style', ['style', '.json'].join('')]).status).toBe(2);
afterAll(() => rmSync(temporaryDirectory, {recursive: true, force: true}));
```

- [ ] **Step 2: Run the CLI test and confirm removed flags are still accepted**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/cli.test.ts`

Expected: FAIL because current `lint` declares both options.

- [ ] **Step 3: Rewrite the command arguments and copy**

Remove `profile`, `style`, and `readJson`. Set the description to `Validate one CARTOGRAPHY.md design-system document.` Keep stdin, text/json output, strict behavior, and friendly file errors.

- [ ] **Step 4: Run CLI tests**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/cli.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit CLI scope**

```bash
git add packages/cli/src/commands/lint.ts packages/cli/src/cli.ts packages/cli/src/__tests__/cli.test.ts
git commit -m "refactor: simplify cartography lint CLI"
```

### Task 6: Generate JSON Schema and prove parity

**Files:**
- Create: `packages/cli/scripts/generate-schema.ts`
- Create: `packages/cli/src/__tests__/schema-parity.test.ts`
- Modify: `package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/scripts/copy-assets.mjs`
- Modify: `packages/cli/scripts/check-package.mjs`
- Regenerate: `schema/cartography.schema.json`
- Delete: `schema/data-profile.schema.json`

**Interfaces:**
- CLI script: `tsx scripts/generate-schema.ts` writes; `tsx scripts/generate-schema.ts --check` compares without writing.
- JSON Schema target: Draft 2020-12 with `$id` `https://mapseek.ai/cartography.md/schema/0.2.0`.

- [ ] **Step 1: Install Ajv and write failing parity cases**

Run: `pnpm --filter @mapseekai/cartography.md add -D ajv@^8.20.0`

```ts
import Ajv2020 from 'ajv/dist/2020.js';
import portableSchema from '../../../../schema/cartography.schema.json' with {type: 'json'};

const ajv = new Ajv2020({strict: false});
const validate = ajv.compile(portableSchema);

const cases = [
  {input: {version: '0.2.0', name: 'Minimal'}, valid: true},
  {input: {version: '0.2.0', name: 'Tokens', tokens: {colors: {ink: '#111'}}}, valid: true},
  {input: {version: '0.1.0', name: 'Old'}, valid: false},
  {input: {version: '0.2.0', name: 'Bad opacity', tokens: {opacities: {muted: 2}}}, valid: false},
];

for (const sample of cases) {
  expect(cartographySchema.safeParse(sample.input).success).toBe(sample.valid);
  expect(validate(sample.input)).toBe(sample.valid);
}
```

- [ ] **Step 2: Run parity test and confirm the checked-in schema is stale**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/schema-parity.test.ts`

Expected: FAIL because the JSON Schema still describes 0.1.

- [ ] **Step 3: Implement deterministic generation**

Use Zod 4 first-party conversion:

```ts
const generated = z.toJSONSchema(cartographySchema, {
  target: 'draft-2020-12',
  reused: 'ref',
  cycles: 'ref',
});
const output = `${JSON.stringify({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://mapseek.ai/cartography.md/schema/0.2.0',
  ...generated,
}, null, 2)}\n`;
```

`--check` must exit nonzero with `schema/cartography.schema.json is stale; run pnpm schema:generate.` when bytes differ.

- [ ] **Step 4: Wire scripts and package assets**

Add root/package scripts `schema:generate` and `schema:check`; include `schema:check` in `check`. Copy and require only `cartography.schema.json`. Remove the data-profile schema from package assets.

- [ ] **Step 5: Generate and test**

Run: `pnpm schema:generate`

Run: `pnpm schema:check`

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/schema-parity.test.ts`

Expected: all PASS.

- [ ] **Step 6: Commit generated schema infrastructure**

```bash
git add package.json packages/cli/package.json pnpm-lock.yaml packages/cli/scripts/generate-schema.ts packages/cli/scripts/copy-assets.mjs packages/cli/scripts/check-package.mjs schema/cartography.schema.json packages/cli/src/__tests__/schema-parity.test.ts
git add -u schema/data-profile.schema.json
git commit -m "build: generate cartography JSON Schema from Zod"
```

### Task 7: Replace the bound example and relocate runtime fixtures

**Files:**
- Create: `examples/quiet-atlas/CARTOGRAPHY.md`
- Create directories: `.agents/skills/data-profile/fixtures/openfreemap-bright/`
- Move: `examples/openfreemap-bright/style.json` and associated profile/readmes/licenses into the fixture directory.
- Delete: `examples/openfreemap-bright/`
- Rewrite: `packages/cli/src/__tests__/example.test.ts`
- Modify: `package.json`

**Interfaces:**
- Example is a standalone 0.2 document and requires no companion file.
- Relocated assets are not imported by the core package.

- [ ] **Step 1: Write a failing standalone example test**

```ts
const contractUrl = new URL('../../../../examples/quiet-atlas/CARTOGRAPHY.md', import.meta.url);

it('lints the renderer-neutral example by itself', async () => {
  const report = await lintFile(fileURLToPath(contractUrl));
  expect(report.summary.errors).toBe(0);
  expect(report.valid).toBe(true);
  expect(report.document.version).toBe('0.2.0');
});
```

- [ ] **Step 2: Run the example test and confirm the file is missing**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/example.test.ts`

Expected: FAIL with an unable-to-read error.

- [ ] **Step 3: Create the complete Quiet Atlas example**

Use the approved root fields, preserve the current warm paper/water/road/label palette where useful, and include all 12 prose sections. The prose must describe a restrained editorial atlas family without field names, sources, layer IDs, numeric zoom bands, target style properties, or runtime outputs. Declare contrast pairs for ink-on-paper and water-on-paper.

- [ ] **Step 4: Relocate existing runtime assets**

Move the current style, profile, localized readmes, and third-party notices into `.agents/skills/data-profile/fixtures/openfreemap-bright/`. Preserve license files verbatim. Remove the old example directory after the move.

- [ ] **Step 5: Point the example command at the standalone file**

Set root `lint:example` to:

```json
"lint:example": "pnpm --filter @mapseekai/cartography.md run dev lint ../../examples/quiet-atlas/CARTOGRAPHY.md --format text"
```

- [ ] **Step 6: Run the standalone example test**

Run: `pnpm lint:example`

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/example.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the example boundary**

```bash
git add examples/quiet-atlas/CARTOGRAPHY.md .agents/skills/data-profile/fixtures/openfreemap-bright packages/cli/src/__tests__/example.test.ts package.json
git add -u examples/openfreemap-bright
git commit -m "docs: add renderer-neutral cartography example"
```

### Task 8: Rewrite the normative specification and API docs

**Files:**
- Rewrite: `docs/spec.md`
- Rewrite: `docs/spec.zh-CN.md`
- Rewrite: `docs/api.md`
- Rewrite: `docs/api.zh-CN.md`
- Modify: `packages/cli/src/__tests__/diff-spec.test.ts`
- Delete: `docs/proposal-conformance-levels.zh-CN.md`

**Interfaces:**
- `getSpecification()` continues bundling the English normative spec.
- Both specs use the 12 approved sections and one identical root-schema table.

- [ ] **Step 1: Replace metadata tests with 0.2 assertions**

```ts
expect(getSpecification()).toContain('**Status:** Draft 0.2.0');
expect(getSpecification()).toContain('## Markdown sections');
expect(getRuleCatalog().every((rule) => rule.scope === 'document')).toBe(true);
```

- [ ] **Step 2: Run the test and confirm the bundled spec is still 0.1**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/diff-spec.test.ts`

Expected: FAIL on version and removed rules.

- [ ] **Step 3: Rewrite both normative specs from the approved design**

Use this exact top-level outline in both languages: Purpose; Normative language; Design goals; Discovery; Document structure; Deterministic YAML; Root schema; Token types; Token references; Accessibility; Markdown sections; Omitted sections and extensions; Precedence; Agent use; Validator model; Rule catalog; Versioning; Minimal example; Final principle.

State explicitly that lint proves only document-internal validity. Do not describe companion artifacts, style validation, adapters, conformance levels, or renderer behavior.

- [ ] **Step 4: Rewrite both API docs**

Document only `parseCartography`, `cartographySchema`, `lint`, `lintFile`, `lintCartography`, `resolveReferences`, `diffCartography`, `getSpecification`, `getRuleCatalog`, and exported model/schema types. Show the simplified `LintOptions` and `LintReport` exactly as implemented.

- [ ] **Step 5: Delete the obsolete proposal and run tests**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/diff-spec.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit normative docs**

```bash
git add docs/spec.md docs/spec.zh-CN.md docs/api.md docs/api.zh-CN.md packages/cli/src/__tests__/diff-spec.test.ts
git add -u docs/proposal-conformance-levels.zh-CN.md
git commit -m "docs: publish cartography 0.2 specification"
```

### Task 9: Rewrite public positioning and package documentation

**Files:**
- Rewrite: `README.md`, `README.zh-CN.md`
- Rewrite: `PHILOSOPHY.md`, `PHILOSOPHY.zh-CN.md`
- Rewrite: `CHANGELOG.md`, `CHANGELOG.zh-CN.md`
- Modify: `CONTRIBUTING.md`, `SECURITY.md`
- Rewrite: `packages/cli/README.md`
- Modify: `package.json`, `packages/cli/package.json`
- Create: `packages/cli/src/__tests__/boundary.test.ts`

**Interfaces:**
- Public positioning: persistent cartographic visual identity for agents.
- Product-surface boundary test scans core docs/code/schema/examples and rejects renderer-bound vocabulary.

- [ ] **Step 1: Write a failing product-boundary test**

Scan these paths: `README*`, `PHILOSOPHY*`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/spec*`, `docs/api*`, `packages/cli/src`, `packages/cli/README.md`, `schema`, `examples`, and `.agents/skills/cartography-md`. Exclude `docs/superpowers`, `.agents/skills/data-profile`, and the boundary test file itself.

```ts
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));
function walk(directory: string): string[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const productFiles = [
  'README.md', 'README.zh-CN.md', 'PHILOSOPHY.md', 'PHILOSOPHY.zh-CN.md',
  'CONTRIBUTING.md', 'SECURITY.md', 'packages/cli/README.md',
].map((path) => join(repositoryRoot, path));
productFiles.push(...walk(join(repositoryRoot, 'docs')).filter((path) => /(?:spec|api)(?:\.zh-CN)?\.md$/.test(path)));
productFiles.push(...walk(join(repositoryRoot, 'packages/cli/src')));
productFiles.push(...walk(join(repositoryRoot, 'schema')));
productFiles.push(...walk(join(repositoryRoot, 'examples')));
productFiles.push(join(repositoryRoot, '.agents/skills/cartography-md/SKILL.md'));
const packageManifest = JSON.parse(readFileSync(join(repositoryRoot, 'packages/cli/package.json'), 'utf8')) as {dependencies?: Record<string, string>};

const forbidden = [new RegExp(['map', 'libre'].join(''), 'i'), /source-layer/i, /style\.json/i];
for (const file of productFiles.filter((candidate) => !candidate.endsWith('boundary.test.ts'))) {
  for (const pattern of forbidden) expect(readFileSync(file, 'utf8'), `${file}: ${pattern}`).not.toMatch(pattern);
}
expect(packageManifest.dependencies).not.toHaveProperty(['@', 'map', 'libre/maplibre-gl-style-spec'].join(''));
```

- [ ] **Step 2: Run the boundary test and capture all stale public files**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/boundary.test.ts`

Expected: FAIL with current descriptions, philosophy, security, contributing, and package dependency.

- [ ] **Step 3: Rewrite the public narrative in both languages**

README must show the two-layer format, standalone lint/diff/spec commands, the Quiet Atlas example, and the statement that external runtime work is outside core validation. Philosophy must center prose, visual identity, token context, hierarchy, scale, states, accessibility, and unknown-content preservation. Changelog starts at 0.2.0 because 0.1 was never released. Contributing defines only document-scoped deterministic rules. Security covers untrusted YAML/Markdown and explicitly forbids secrets in `CARTOGRAPHY.md`.

- [ ] **Step 4: Remove the renderer dependency and neutralize package copy**

Run: `pnpm --filter @mapseekai/cartography.md remove @maplibre/maplibre-gl-style-spec`

Set package descriptions to `Agent-first format and validator for persistent cartographic design systems.`

- [ ] **Step 5: Run boundary and package tests**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/boundary.test.ts`

Run: `pnpm --filter @mapseekai/cartography.md build`

Run: `pnpm --filter @mapseekai/cartography.md check-package`

Expected: PASS.

- [ ] **Step 6: Commit public docs and dependency removal**

```bash
git add README.md README.zh-CN.md PHILOSOPHY.md PHILOSOPHY.zh-CN.md CHANGELOG.md CHANGELOG.zh-CN.md CONTRIBUTING.md SECURITY.md package.json packages/cli/package.json packages/cli/README.md pnpm-lock.yaml packages/cli/src/__tests__/boundary.test.ts
git commit -m "docs: reposition cartography.md as a universal design format"
```

### Task 10: Rewrite the universal application Skill

**Files:**
- Rewrite: `.agents/skills/cartography-md/SKILL.md`

**Interfaces:**
- Skill consumes the complete `CARTOGRAPHY.md` plus the user's runtime context.
- Skill calls only core document lint and never claims external artifacts were validated.

- [ ] **Step 1: Write the complete renderer-neutral Skill workflow**

Before editing `SKILL.md`, read and follow the available `skill-creator` Skill so the updated package remains a valid host Skill.

The new `SKILL.md` must contain this required sequence:

```markdown
1. Locate and read the complete CARTOGRAPHY.md, including YAML and Markdown.
2. Run `cartographymd lint CARTOGRAPHY.md` and resolve blocking document findings.
3. Identify the stable visual identity, token vocabulary, hierarchy, scale behavior, states, accessibility rules, and Do's/Don'ts.
4. Read the user's current task and any runtime data context without writing those facts back into CARTOGRAPHY.md.
5. Resolve every `{tokens.*}` reference before applying a value.
6. Preserve the underlying semantic meaning when adding selection, hover, alert, invalid, or quality emphasis.
7. Use target-specific tools only outside the core contract and verify their outputs with the tools appropriate to that target.
8. Report unresolved runtime facts separately from CARTOGRAPHY.md lint findings.
```

The Skill must state that document lint is not data, target-format, render, or task validation. Remove renderer-specific commands and provenance requirements.

- [ ] **Step 2: Run the product-boundary test**

Run: `pnpm --filter @mapseekai/cartography.md test -- src/__tests__/boundary.test.ts`

Expected: PASS.

- [ ] **Step 3: Manually exercise the Skill instructions against Quiet Atlas**

Run: `pnpm lint:example`

Read all 12 sections and verify the Skill can describe the identity and token rules without loading any companion file.

- [ ] **Step 4: Commit the Skill**

```bash
git add .agents/skills/cartography-md/SKILL.md
git commit -m "docs: make cartography Skill renderer-neutral"
```

### Task 11: Final integration and release gates

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- CI runs schema parity, typecheck, tests, build/package check, and the standalone example on Node 20 and 22.

- [ ] **Step 1: Update CI to run the new gates**

Keep the Node matrix. After frozen install, run `pnpm schema:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, package check, and `pnpm lint:example`. Do not reference a companion profile or style.

- [ ] **Step 2: Run the full verification suite**

Run: `pnpm install --frozen-lockfile`

Run: `pnpm schema:check`

Run: `pnpm check`

Run: `pnpm lint:example`

Expected: all commands exit 0.

- [ ] **Step 3: Verify the shipped API and forbidden surface**

Run: `pnpm --filter @mapseekai/cartography.md check-package`

Run the same product-path scan as `boundary.test.ts`; expect zero renderer-specific matches and no data-profile schema artifact.

- [ ] **Step 4: Review the final diff against every acceptance criterion**

Confirm versions are 0.2.0, only one portable schema ships, the example is standalone, all public APIs are document-only, both specs have the same structure, and only the future `data-profile` Skill directory contains relocated runtime assets.

- [ ] **Step 5: Commit integration gates**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: enforce cartography 0.2 boundaries"
```
