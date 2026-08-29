# TypeScript API

**Version:** 0.2.0  
**Package:** `@mapseekai/cartography.md`  
**中文版:** [api.zh-CN.md](api.zh-CN.md)

The public API parses, validates, resolves, and compares one CARTOGRAPHY.md document. Ordinary document invalidity is returned as structured findings.

## Import

```ts
import {
  DEFAULT_RULES,
  VERSION,
  cartographySchema,
  diffCartography,
  getRuleCatalog,
  getSpecification,
  lint,
  lintCartography,
  lintFile,
  parseCartography,
  resolveReferences,
  type CartographyConfig,
  type LintOptions,
  type LintReport,
} from '@mapseekai/cartography.md';
```

## Public values and functions

| Export | Signature | Purpose |
|---|---|---|
| `DEFAULT_RULES` | `LintRule[]` | Built-in document rules used by `lint` when no same-ID custom override is supplied. |
| `VERSION` | `"0.2.0"` | Package and supported CARTOGRAPHY.md format version. |
| `parseCartography` | `(source: string) => ParsedCartography<CartographyConfig>` | Parse front matter and Markdown sections and return parser findings. |
| `cartographySchema` | Zod schema | Validate the version 0.2.0 front-matter value. |
| `lint` | `(source: string, options?: LintOptions) => LintReport` | Run parser checks and document rules against a source string. |
| `lintCartography` | alias of `lint` | Compatibility name for `lint`. |
| `lintFile` | `(file: string, options?: LintFileOptions) => Promise<LintReport>` | Read and lint a file, recording its path in the report. |
| `resolveReferences` | `(frontmatter: unknown) => unknown` | Return a deep value with exact references resolved where possible. |
| `diffCartography` | `(beforeSource: string, afterSource: string, options?) => CartographyDiffReport` | Compare parsed leaf values, prose sections, and finding counts. |
| `getSpecification` | `() => string` | Return the bundled English normative specification. |
| `getRuleCatalog` | `() => RuleDescriptor[]` | Return a copy of the built-in document-rule catalog. |

## `parseCartography(source)`

`parseCartography` normalizes a byte-order mark and line endings, parses the required YAML front matter, validates it with `cartographySchema`, extracts `##` sections, normalizes recognized headings, and reports duplicate canonical sections.

```ts
const parsed = parseCartography(`---
version: "0.2.0"
name: Quiet atlas
---

## Overview

Warm paper and restrained ink.
`);

if (parsed.config) {
  console.log(parsed.config.name);
}
console.log(parsed.sections[0]?.canonicalHeading); // Overview
```

Parser and schema errors appear in `parsed.findings`; ordinary invalid input does not throw.

## `cartographySchema`

`cartographySchema` is the Zod source of truth for front matter.

```ts
const result = cartographySchema.safeParse({
  version: '0.2.0',
  name: 'Quiet atlas',
});

if (result.success) {
  const config: CartographyConfig = result.data;
}
```

The object is pass-through: unknown root keys are preserved. The linter separately reports custom root keys through `unknown-root-key`.

## `lint(source, options?)`

`lint` runs parser findings and the merged rule set, sorts findings, summarizes severities, resolves exact references in a valid configuration, and computes `valid`.

```ts
const report = lint(source, {
  sourcePath: 'CARTOGRAPHY.md',
  strict: true,
  maxDocumentBytes: 256_000,
});

if (!report.valid) {
  for (const finding of report.findings) {
    console.error(finding.ruleId, finding.message);
  }
}
```

`lintCartography` is the same function object as `lint`.

### `LintOptions`

```ts
interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

- `sourcePath` is copied into `report.document.path` and supplied to rules.
- `strict` defaults to `false`. When true, warnings block validity.
- `rules` adds custom rules by ID. A custom rule with an existing ID replaces the built-in rule with that ID.
- `maxDocumentBytes` defaults to `512_000`.

The built-in `maxDocumentBytes` check is advisory and runs only after the complete input has been read and parsed; callers must enforce byte or stream limits before passing untrusted input to `lint`, `lintFile`, or standard input.

### `LintReport`

```ts
interface LintReport {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: FindingSummary;
  cartography?: CartographyConfig;
  resolved?: unknown;
  sections: string[];
  document: {
    path?: string;
    name?: string;
    version?: string;
  };
}
```

`cartography` and `resolved` are present only when front matter passes `cartographySchema`. `sections` contains normalized headings in source order. `document.name` and `document.version` come from the parsed configuration.

`valid` is true when there are no errors and, in strict mode, no warnings. Informational findings do not block validity. This result establishes only the validity of the CARTOGRAPHY.md document and its deterministic internal relationships.

## `lintFile(file, options?)`

```ts
type LintFileOptions = Omit<LintOptions, 'sourcePath'>;

const report = await lintFile('CARTOGRAPHY.md', {strict: true});
```

`lintFile` reads UTF-8 text, calls `lint`, and sets `document.path` to the supplied path. Passing `-` reads standard input. File-read failures reject the promise.

## `resolveReferences(frontmatter)`

`resolveReferences` recursively replaces exact `{path.to.value}` strings using the supplied value as the root.

```ts
const resolved = resolveReferences({
  tokens: {
    colors: {
      ink: '#24303A',
      label: '{tokens.colors.ink}',
    },
  },
});
```

Arrays and objects are copied recursively. Missing references and cycles remain as their unresolved strings; call `lint` when those conditions must be reported as findings.

## `diffCartography(beforeSource, afterSource, options?)`

```ts
const report = diffCartography(before, after, {
  before: {strict: false},
  after: {strict: true},
});
```

The optional third argument is:

```ts
{
  before?: LintOptions;
  after?: LintOptions;
}
```

The result separates added, removed, and modified parsed leaf paths from added, removed, and modified normalized prose sections. `regression` is true when the new report has more errors or warnings than the old report.

## `getSpecification()` and `getRuleCatalog()`

```ts
const specification: string = getSpecification();
const rules: RuleDescriptor[] = getRuleCatalog();
```

`getSpecification` returns the bundled `docs/spec.md`. `getRuleCatalog` returns a new array containing the built-in descriptors; every descriptor currently has `scope: 'document'`.

## `DEFAULT_RULES` and `VERSION`

```ts
console.log(VERSION); // 0.2.0
const activeRuleIds = DEFAULT_RULES.map((rule) => rule.id);
```

`DEFAULT_RULES` contains the executable built-in document rules in their default order. Supply `LintOptions.rules` to override a rule by ID instead of mutating this export. `VERSION` is the exact package and format version supported by this release.

## Exported schema types

The package exports these schema-derived types:

```ts
type TokenReference = string;

type DimensionToken =
  | number
  | string; // validated dimension string or exact reference

type TypographyToken =
  | TokenReference
  | {
      fontFamily?: string | string[];
      fontSize?: DimensionToken;
      fontWeight?: number | string;
      lineHeight?: number | DimensionToken;
      letterSpacing?: number | string;
      [key: string]: unknown;
    };

interface ContrastPair {
  id: string;
  foreground: string;
  background: string;
  minimum: number;
  kind?: 'text' | 'large-text' | 'graphic';
  [key: string]: unknown;
}

type OmittedSection =
  | string
  | {
      section: string;
      reason?: string;
      [key: string]: unknown;
    };

interface CartographyConfig {
  version: '0.2.0';
  name: string;
  description?: string;
  locale?: string;
  tokens?: {
    colors?: Record<string, string>;
    typography?: Record<string, TypographyToken>;
    widths?: Record<string, DimensionToken>;
    sizes?: Record<string, DimensionToken>;
    opacities?: Record<string, number | TokenReference>;
    [group: string]: unknown;
  };
  accessibility?: {
    contrastPairs?: ContrastPair[];
    [key: string]: unknown;
  };
  omitted?: OmittedSection[];
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}
```

The aliases are inferred from Zod; the comments above summarize their runtime constraints rather than replacing schema validation.

## Exported model types

### Findings and parsed documents

```ts
type Severity = 'error' | 'warning' | 'info';
type RuleScope = 'document';

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

interface FindingSummary {
  errors: number;
  warnings: number;
  infos: number;
}

interface MarkdownSection {
  heading: string;
  canonicalHeading: string;
  line: number;
  body: string;
}

interface ParsedCartography<TConfig = CartographyConfig> {
  source: string;
  rawFrontmatter: unknown;
  config?: TConfig;
  body: string;
  sections: MarkdownSection[];
  findings: Finding[];
}
```

### Rules

```ts
interface LintContext {
  source: string;
  parsed: ParsedCartography;
  cartography?: CartographyConfig;
  sourcePath?: string;
  maxDocumentBytes: number;
}

interface LintRule {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
  run(context: LintContext): Finding[];
}

interface RuleDescriptor {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
}
```

### Diff report

```ts
interface DiffBucket {
  added: string[];
  removed: string[];
  modified: string[];
}

interface CartographyDiffReport {
  values: DiffBucket;
  sections: DiffBucket;
  findings: {
    before: FindingSummary;
    after: FindingSummary;
    delta: {errors: number; warnings: number; infos: number};
  };
  regression: boolean;
}
```

`LintOptions`, `LintFileOptions`, and `LintReport` are also exported exactly as shown above.
