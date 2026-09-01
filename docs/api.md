# TypeScript API

**Version:** 0.3.0  
**Package:** `@mapseekai/cartography.md`  
**中文版:** [api.zh-CN.md](api.zh-CN.md)

The public API parses, validates, resolves, and compares one `CARTOGRAPHY.md` document. Ordinary document invalidity is returned as structured findings.

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
| `VERSION` | `"0.3.0"` | Package and supported CARTOGRAPHY.md format version. |
| `parseCartography` | `(source: string) => ParsedCartography<CartographyConfig>` | Parse front matter and Markdown sections and return parser findings. |
| `cartographySchema` | Zod schema | Validate the 0.3.0 front-matter value. |
| `lint` | `(source: string, options?: LintOptions) => LintReport` | Run parser checks and document rules against a source string. |
| `lintCartography` | alias of `lint` | Alias of `lint`. |
| `lintFile` | `(file: string, options?: LintFileOptions) => Promise<LintReport>` | Read and lint a file, recording its path in the report. |
| `resolveReferences` | `(frontmatter: unknown) => unknown` | Return a deep value with exact references resolved where possible. |
| `diffCartography` | `(beforeSource: string, afterSource: string, options?) => CartographyDiffReport` | Compare parsed leaf values, prose sections, and finding counts. |
| `getSpecification` | `() => string` | Return the bundled normative specification. |
| `getRuleCatalog` | `() => RuleDescriptor[]` | Return a copy of the built-in rule catalog. |

## `parseCartography(source)`

`parseCartography` rejects prohibited YAML representation features, parses the required front matter with `cartographySchema`, extracts top-level `##` sections, normalizes recognized headings, and reports duplicate canonical sections.

```ts
const parsed = parseCartography(`---
version: "0.3.0"
name: Quiet Atlas
colors:
  ink: "#24303A"
---

## Overview

Warm paper and restrained ink.
`);

console.log(parsed.config?.name); // Quiet Atlas
console.log(parsed.sections[0]?.canonicalHeading); // Overview
```

Parser and schema errors appear in `parsed.findings`; ordinary invalid input does not throw.

## `cartographySchema`

`cartographySchema` is the Zod structural model for the 0.3.0 front matter. It is aligned with the published informational schema at `schema/cartography-front-matter.schema.json` (`$id`: `urn:cartography-md:schema:front-matter:0.3.0`).

```ts
const result = cartographySchema.safeParse({
  version: '0.3.0',
  name: 'Quiet Atlas',
  colors: {ink: '#24303A'},
});
```

The object is pass-through: unknown root keys are preserved. The linter separately reports custom root keys through `unknown-root-key` and likely case-only misspellings through `root-key-case-conflict`.

## `lint(source, options?)`

`lint` runs parser findings and the merged rule set, sorts findings, summarizes severities, resolves exact references in a valid configuration, and computes `valid`.

```ts
const report = lint(source, {
  sourcePath: 'CARTOGRAPHY.md',
  strict: true,
  maxDocumentBytes: 256_000,
});
```

### `LintOptions`

```ts
interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

`strict` defaults to `false`; when true, warnings block validity. `maxDocumentBytes` defaults to `512_000`. The size check is advisory and occurs after complete input has been read; callers must enforce input limits before accepting untrusted streams.

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
  document: {path?: string; name?: string; version?: string};
}
```

`valid` is true when there are no errors and, in strict mode, no warnings. Informational findings do not block validity.

## `resolveReferences(frontmatter)`

`resolveReferences` recursively resolves exact root-based references and returns a new deep value without mutating its input.

```ts
const resolved = resolveReferences({
  colors: {ink: '#24303A', label: '{colors.ink}'},
  symbols: {facility: {fallbacks: ['circle', 'square']}},
  choice: '{symbols.facility.fallbacks[0]}',
});
```

Reference paths require a root segment followed by one or more exact property or numeric index steps. Metadata roots (`version`, `name`, `description`, and `omitted`) are not referenceable. Missing paths, illegal indexes, intermediate references, malformed paths, and cycles remain unresolved here; `lint` reports them as findings.

## Rule catalog

`getRuleCatalog()` reports these built-in IDs and severities:

- **Errors:** `frontmatter-required`, `frontmatter-unclosed`, `yaml-syntax`, `yaml-bom-prohibited`, `yaml-alias-prohibited`, `yaml-custom-tag-prohibited`, `yaml-merge-key-prohibited`, `yaml-tab-indentation-prohibited`, `yaml-directive-prohibited`, `yaml-document-end-prohibited`, `yaml-non-finite-number-prohibited`, `yaml-non-string-key`, `yaml-reference-unquoted`, `yaml-hex-color-unquoted`, `reference-as-mapping-key`, `schema`, `duplicate-section`, `omitted-sections`, `token-reference`, `color-token`, `known-token-type`, `dash-pattern`, `element-reserved-property`, `resource-limit`, `rule-execution`.
- **Warnings:** `document-size`, `empty-section`, `section-order`, `root-key-case-conflict`, `data-binding-suspicion`.
- **Info:** `missing-sections`, `unknown-root-key`, `empty-token-group`, `unused-token`, `undocumented-element`, `contract-summary`.

## Schema-derived types

```ts
type TokenReference = string;
type OmittedSection = string | {section: string; reason?: string};
type TypographyToken = TokenReference | {
  fontFamily: string | string[] | TokenReference;
  fontSize: string | TokenReference;
  fontWeight?: number | 'normal' | 'bold' | TokenReference;
  lineHeight?: number | string | TokenReference;
  letterSpacing?: string | TokenReference;
  fontStyle?: string | TokenReference;
  textTransform?: string | TokenReference;
  fontFeature?: string | TokenReference;
  fontVariation?: string | TokenReference;
  [key: string]: unknown;
};
type MapElement = {geometry: string; [key: string]: unknown};
interface CartographyConfig {
  version: '0.3.0';
  name: string;
  description?: string;
  omitted?: OmittedSection[];
  colors?: Record<string, string>;
  typography?: Record<string, TypographyToken>;
  widths?: Record<string, string>;
  sizes?: Record<string, string>;
  opacities?: Record<string, number | TokenReference>;
  spacing?: Record<string, string>;
  dashes?: Record<string, string[] | TokenReference>;
  elements?: Record<string, MapElement>;
  [key: string]: unknown;
}
```

The aliases are inferred from Zod; this overview does not replace runtime schema validation.

## Other API behavior

`lintFile` reads UTF-8 text and sets `document.path`; passing `-` reads standard input. `diffCartography` separates added, removed, and modified parsed leaf paths from added, removed, and modified normalized prose sections. `getSpecification` returns the bundled specification, and `DEFAULT_RULES` contains the executable default rule order.
