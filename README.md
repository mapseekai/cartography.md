# cartography.md

**Define map design systems in Markdown for people and agents.**

`CARTOGRAPHY.md` keeps a map's visual identity, design principles, reusable tokens, and map-element styles in one document. YAML front matter records exact values. Markdown explains visual hierarchy, labeling, scale behavior, and state expression so the same design decisions can guide different cartographic tasks.

This repository provides the format specification, a CLI, a TypeScript API, design examples, and agent workflows for authoring, parsing, validating, comparing, and applying cartographic design systems.

[中文](README.zh-CN.md) · [Specification](docs/spec.md) · [Authoring guide](docs/authoring.md) · [API reference](docs/api.md)

## Key capabilities

| Capability | Description |
| --- | --- |
| Design-system expression | Organize colors, typography, widths, sizes, opacities, spacing, dashes, and map elements, with prose explaining their purpose and relationships. |
| Document validation | Check YAML representation, front-matter structure, sections, token types, references, and map-element properties; return diagnostics by severity. |
| Reference resolution | Resolve token aliases, nested paths, array indices, and references inside objects and arrays into deeply resolved values. |
| Semantic comparison | Report added, removed, and modified front-matter leaf paths and Markdown sections, together with changes in diagnostic counts. |
| Tool integration | Use the CLI, ES-module TypeScript API, runtime schema, JSON Schema, and custom validation-rule interface. |

## Quickstart

Use **Node.js 20 or newer** and pnpm. Copy a `CARTOGRAPHY.md` from the [design examples](#design-examples) into your working directory, then install and run the validator:

```bash
pnpm add -D @mapseekai/cartography.md
pnpm exec cartographymd lint CARTOGRAPHY.md --format text
```

For a one-off invocation:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md --format text
```

The current package version is `0.4.1`. Documents use format version `0.4.0`:

```yaml
version: "0.4.0"
```

## Document format

### Exact values and design guidance

YAML front matter holds the design-system name, format version, and tokens. Markdown explains how those values form a visual family and how to apply them in different contexts.

This technical-network excerpt shows references between colors, widths, and a map element:

```markdown
---
version: "0.4.0"
name: Technical Network
colors:
  canvas: "#F4F6F8"
  primary: "#236A85"
widths:
  primary: 4px
  casing: 1px
elements:
  pipeline-primary:
    geometry: line
    family: pipeline
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.primary}"
    strokeWidth: "{widths.primary}"
    casingColor: "{colors.canvas}"
    casingWidth: "{widths.casing}"
---

## Overview

Organize the technical network around continuous structure, clear junctions,
and a distinct visual hierarchy.

## Colors

Use {colors.primary} for the subject network and {colors.canvas} for the
pale background and casing.
```

`{colors.primary}` references a color, and `{widths.primary}` references a width. References can also address complete typography objects, dash arrays, and individual array items. See [Technical Network](examples/technical-network/CARTOGRAPHY.md) for the complete example.

### Tokens and map elements

| Root group | Contents |
| --- | --- |
| `colors` | Color values and aliases. |
| `typography` | Font families, sizes, weights, line heights, and letter spacing. |
| `widths` | Stroke, casing, outline, and halo widths. |
| `sizes` | Dimensions for point symbols, icons, and other visual objects. |
| `opacities` | Opacity values. |
| `spacing` | Gaps and spacing for labels, symbols, and map composition. |
| `dashes` | Alternating dash and gap lengths. |
| `elements` | Map-element styles composed from tokens. |

Map elements use `geometry` for their visual type and `family`, `role`, `state`, and `layerRole` for their family, purpose, state, and conceptual hierarchy. The format also accommodates persistent metadata, custom token groups, and extension properties.

### Standard sections

The body is organized around nine topics: Overview; Colors; Typography & Labels; Composition & Density; Layering & Depth; Geometry & Symbols; Scale & Generalization; Map Elements; and Do's and Don'ts.

Sections accept the English and Chinese heading aliases defined in the specification. Authors can record intentional omissions in `omitted` and add custom sections. See the [authoring guide](docs/authoring.md) for writing guidance.

## CLI usage

After installing the package, invoke these commands with `pnpm exec cartographymd`:

| Command | Purpose |
| --- | --- |
| `lint CARTOGRAPHY.md` | Validate a document and return a JSON report by default. |
| `lint CARTOGRAPHY.md --format text` | Return a readable text report. |
| `lint CARTOGRAPHY.md --strict` | Include warnings in the acceptance criteria. |
| `parse CARTOGRAPHY.md` | Return front matter, sections, and parser diagnostics. |
| `diff before.md after.md` | Compare document values, sections, and diagnostics. |
| `rules` | Print the built-in rule catalog. |
| `spec` | Print the bundled format specification. |
| `spec --output cartography-spec.md` | Save the format specification to a file. |

`lint` and `parse` accept `-` for standard input:

```bash
cat CARTOGRAPHY.md | pnpm exec cartographymd lint - --format text
```

### Validation reports

Reports contain `valid`, `summary`, `findings`, `sections`, and document information. When parsing produces a configuration, reports also include `cartography` and the reference-resolution result `resolved`. Diagnostics use `error`, `warning`, and `info`, with a rule ID, message, and applicable location, suggestion, or evidence.

Normal mode passes with zero errors; strict mode also requires zero warnings. `diff` sets `regression` to `true` when the error or warning count increases, allowing design-change workflows to check diagnostic changes.

## TypeScript API

Install the package in an application:

```bash
pnpm add @mapseekai/cartography.md
```

Read a file and inspect its validation report:

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {strict: true});

console.log(report.valid);
console.log(report.summary);

for (const finding of report.findings) {
  console.log(finding.severity, finding.ruleId, finding.message);
}
```

| Export | Purpose |
| --- | --- |
| `parseCartography(source)` | Parse document source. |
| `lint(source, options)` / `lintFile(file, options)` | Validate a string or file. |
| `resolveReferences(frontmatter)` | Return a deeply copied value with references resolved. |
| `diffCartography(beforeSource, afterSource)` | Compare two document sources. |
| `cartographySchema` | Validate the front-matter data structure. |
| `getRuleCatalog()` / `getSpecification()` | Read the rule catalog and format specification. |

Use `LintOptions.rules` to add rules or replace default implementations by rule ID. See the [TypeScript API reference](docs/api.md) for exported types and complete signatures.

## Agent workflows

The repository includes three cartographic workflows under `.agents/skills`. Design rules reside in `CARTOGRAPHY.md`; data context is organized in `DATA_PROFILE.json`. Agents combine both with the current task.

| Skill | Capabilities and outputs |
| --- | --- |
| [cartography-md](.agents/skills/cartography-md/SKILL.md) | Guides agents through reading a design system, selecting components, resolving tokens, applying scale and state rules, and separately performing format validation, design review, target validation, and visual review. |
| [cartography-init](.agents/skills/cartography-init/SKILL.md) | Extracts style information from `style.json`, QGIS `.qgs` / `.qgz`, ArcGIS `.lyrx` / `.stylx`, and SLD `.sld`; produces an editable `CARTOGRAPHY.md` draft and initialization reports in Markdown and JSON. |
| [data-profile](.agents/skills/data-profile/SKILL.md) | Generates `DATA_PROFILE.json` from style references, TileJSON metadata, and MVT sampling, retaining declared, sampled, and style-inferred evidence separately. |

Run initialization and data-profile scripts through the repository workspace. Each skill document describes its commands and outputs.

## Design examples

| Example | Focus |
| --- | --- |
| [Quiet Atlas](examples/quiet-atlas/CARTOGRAPHY.md) | Warm paper, pale water, road hierarchy, and restrained labeling. |
| [Technical Network](examples/technical-network/CARTOGRAPHY.md) | Pipelines, valves, facilities, and technical labels, with scale behavior and combined selection and critical states. |
| [Thematic Evidence](examples/thematic-map/CARTOGRAPHY.md) | Qualitative, sequential, and diverging colors, plus distinct missing, unknown, zero, and not-applicable states. |

## Development and verification

The repository uses a pnpm workspace with `packageManager` pinned to `pnpm@10.34.5`.

```bash
git clone https://github.com/mapseekai/cartography.md.git
cd cartography.md
pnpm install --frozen-lockfile
pnpm check
pnpm lint:example
```

`pnpm check` runs schema parity checks, type checks, the build, core tests, data-profile and initialization workflow tests, release-metadata tests, and package-artifact checks. `pnpm lint:example` validates the Quiet Atlas example.

```text
cartography.md/
├── docs/           Specification, API, authoring, and migration guides
├── schema/         Front-matter JSON Schema
├── packages/cli/   CLI and TypeScript API
├── examples/       Three cartographic design-system examples
├── .agents/skills/ Cartographic application, initialization, and profiling workflows
└── scripts/        Release-metadata validation scripts and tests
```

## Documentation and contributing

Read the [philosophy](docs/PHILOSOPHY.md) for the design approach and [visual semantics](docs/visual-semantics.md) for properties such as size, casing, and opacity. Version changes are recorded in the [changelog](CHANGELOG.md); format upgrades are covered in the [0.3 → 0.4 migration guide](docs/migrations/0.3-to-0.4.md).

See the [contribution guide](CONTRIBUTING.md) for work on the format, rules, tools, examples, and documentation.

## License

[Apache-2.0](LICENSE).
