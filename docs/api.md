# Cartography.md CLI and TypeScript API
中文版：[api.zh-CN.md](api.zh-CN.md)

The npm package `@mapseekai/cartography.md` exposes a command-line interface and a typed API over the same parser, schemas, and deterministic rule set.

## Installation

```bash
pnpm add -D @mapseekai/cartography.md
```

Node.js 20 or newer is required.

## CLI

The package installs two equivalent binaries:

- `cartography.md` — canonical name;
- `cartographymd` — cross-platform alias recommended on Windows.

### `lint`

```bash
cartographymd lint <CARTOGRAPHY.md> \
  [--profile DATA_PROFILE.json] \
  [--style style.json] \
  [--format json|text] \
  [--strict]
```

Examples:

```bash
cartographymd lint CARTOGRAPHY.md
cartographymd lint CARTOGRAPHY.md --profile DATA_PROFILE.json --style style.json
cartographymd lint CARTOGRAPHY.md --strict --format text
cat CARTOGRAPHY.md | cartographymd lint - --profile DATA_PROFILE.json
```

`--strict` makes warnings blocking for `report.valid` and the exit code. It does not rewrite finding severities.

For a normal file input, the CLI automatically resolves `data.profile` relative to the directory containing `CARTOGRAPHY.md` unless `--profile` is supplied explicitly.

### `parse`

```bash
cartographymd parse CARTOGRAPHY.md
```

Parses YAML front matter and canonical Markdown sections without running semantic, profile, or style rules.

### `diff`

```bash
cartographymd diff CARTOGRAPHY.md CARTOGRAPHY.next.md
```

Compares contract leaf values and Markdown section bodies. The command exits with `1` when the changed document introduces a validation regression.

### `rules`

```bash
cartographymd rules
```

Prints the built-in rule catalog as JSON.

### `spec`

```bash
cartographymd spec
cartographymd spec --output CARTOGRAPHY-SPEC.md
```

Prints or copies the bundled `docs/spec.md`.

### Exit codes

| Code | Meaning |
|---:|---|
| `0` | The command completed and passed under the selected strictness. |
| `1` | Validation or diff completed with a blocking result. |
| `2` | Usage, file access, JSON parsing, or execution failed. |

## Public API

```ts
import {
  DEFAULT_RULES,
  cartographySchema,
  dataProfileSchema,
  diffCartography,
  getRuleCatalog,
  getSpecification,
  lint,
  lintFile,
  parseCartography,
  resolveReferences,
  validateMapLibreStyle,
} from '@mapseekai/cartography.md';
```

## `lint(source, options?)`

Synchronously parses and validates a raw `CARTOGRAPHY.md` string.

```ts
import {lint} from '@mapseekai/cartography.md';

const report = lint(content, {
  sourcePath: '/project/CARTOGRAPHY.md',
  dataProfile,
  style,
  strict: false,
});
```

```ts
interface LintOptions {
  style?: unknown;
  dataProfile?: unknown;
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

`lintCartography` is an alias of `lint`.

## `lintFile(file, options?)`

Asynchronously reads a document and optional companion files.

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {
  dataProfilePath: 'DATA_PROFILE.json',
  stylePath: 'style.json',
  strict: true,
});
```

```ts
interface LintFileOptions {
  style?: unknown;
  dataProfile?: unknown;
  stylePath?: string;
  dataProfilePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

Pre-parsed `style` and `dataProfile` values take precedence over paths. When `dataProfilePath` and `dataProfile` are omitted, `lintFile` resolves `data.profile` relative to the document.

## `parseCartography(source)`

Returns the parsed front matter, validated config when available, body, canonical sections, and parser findings.

```ts
const parsed = parseCartography(content);

if (parsed.config) {
  console.log(parsed.config.intent.primaryTask);
}

for (const finding of parsed.findings) {
  console.log(finding.ruleId, finding.message);
}
```

```ts
interface ParsedCartography<TConfig = CartographyConfig> {
  source: string;
  rawFrontmatter: unknown;
  config?: TConfig;
  body: string;
  sections: MarkdownSection[];
  findings: Finding[];
}
```

Parsing is recovery-oriented: structural findings are returned whenever possible instead of throwing. File I/O and JSON parsing are handled by `lintFile` and the CLI.

## `resolveReferences(frontmatter)`

Returns a deep copy with valid exact `{path.to.value}` references resolved. Broken references and cycles remain unchanged; call `lint` when findings are required.

```ts
const resolved = resolveReferences(parsed.rawFrontmatter);
```

## `validateMapLibreStyle(style, cartography, dataProfile?)`

Runs all built-in style-scope rules against an already parsed contract:

- official MapLibre Style Specification validation;
- Cartography.md provenance metadata;
- encoding/source/source-layer consistency;
- token reference and token-binding drift;
- governed layer-group order;
- stable feature IDs;
- portable resource protocols;
- legacy filter warnings;
- paint-only `feature-state` constraints.

```ts
const findings = validateMapLibreStyle(style, cartography, dataProfile);
```

## `diffCartography(before, after, options?)`

```ts
const diff = diffCartography(beforeContent, afterContent);

if (diff.regression) {
  console.error(diff.findings.delta);
}
```

An optional third argument `{before?: LintOptions; after?: LintOptions}` supplies a data profile or style for either side, so the findings delta reflects artifact-aware validation.

The report separates added, removed, and modified resolved paths from added, removed, and modified canonical Markdown sections.

## Schemas

The package exports Zod schemas:

```ts
const contractResult = cartographySchema.safeParse(frontmatter);
const profileResult = dataProfileSchema.safeParse(profileJson);
```

Portable JSON Schemas are also maintained in the repository:

- `schema/cartography.schema.json`;
- `schema/data-profile.schema.json`.

## Specification and rules

```ts
const markdown = getSpecification();
const catalog = getRuleCatalog();
```

`getSpecification()` reads the bundled normative specification. `getRuleCatalog()` returns a copy of the public rule descriptors.

## Custom rules

```ts
import {
  DEFAULT_RULES,
  lint,
  type LintRule,
} from '@mapseekai/cartography.md';

const reservedDangerColor: LintRule = {
  id: 'acme-danger-color-reserved',
  severity: 'error',
  scope: 'document',
  description: 'Reserve the organizational danger color for operational faults.',
  run(context) {
    if (!context.cartography) return [];

    const danger = context.cartography.tokens.colors;
    // Evaluate a deterministic organization-specific condition.
    return [];
  },
};

const report = lint(content, {
  rules: [...DEFAULT_RULES, reservedDangerColor],
});
```

Custom rules are merged by ID. A custom rule with the same ID replaces the built-in rule for that invocation. Rules should be deterministic, side-effect free, and network independent.

## Report types

```ts
type Severity = 'error' | 'warning' | 'info';
type RuleScope = 'document' | 'profile' | 'style';

interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
  evidence?: unknown;
}

interface LintReport<TConfig = CartographyConfig> {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  cartography?: TConfig;
  resolved?: unknown;
  sections: string[];
  document: {
    path?: string;
    name?: string;
    version?: string;
  };
  artifacts: {
    dataProfileChecked: boolean;
    styleChecked: boolean;
    officialMapLibreValidation: boolean;
  };
}
```

`officialMapLibreValidation` means the official validator was invoked because a style value was supplied. Validation errors are represented as normal findings.

## API stability

The format and package are draft `0.1.0`. Finding IDs and report shapes are intended to remain stable within the `0.1.x` line. New warnings may be added in patch releases; strict-mode consumers should pin package versions in CI.
