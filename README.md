# cartography.md

A format specification for describing cartographic intent to coding agents.

`CARTOGRAPHY.md` gives an agent a persistent, structured understanding of how an electronic map should communicate: its purpose, audience, data semantics, visual hierarchy, zoom behavior, labels, interaction states, accessibility constraints, and MapLibre implementation contract.

It follows the same core idea as [`DESIGN.md`](https://github.com/google-labs-code/design.md): machine-readable values in YAML front matter, human-readable rationale in Markdown, and deterministic tooling that agents can call from a CLI or TypeScript API.

> Status: draft `0.1.0`. The current reference implementation targets MapLibre Style Specification v8.

[中文说明](README.zh-CN.md) · [Format specification](docs/spec.md) · [API reference](docs/api.md) · [Example](examples/openfreemap-bright/CARTOGRAPHY.md)

## Why

A valid `style.json` can still be visually noisy, semantically misleading, inconsistent across zoom levels, inaccessible, or detached from the source data. MapLibre defines how a renderer draws layers; it does not capture why one feature must dominate another, which field owns a visual channel, or how an agent should preserve business meaning while editing the style.

cartography.md adds that upstream contract:

```text
CARTOGRAPHY.md + DATA_PROFILE.json + existing style.json
                         ↓
                 coding / styling agent
                         ↓
              validated MapLibre style.json
                         ↓
              render fixtures and review evidence
```

## The format

A `CARTOGRAPHY.md` file has two coordinated layers:

1. **YAML front matter** — normative, machine-readable cartographic decisions.
2. **Markdown body** — rationale, exceptions, priorities, and review guidance.

```md
---
version: "0.1.0"
name: Gas network operations map
target:
  renderer: maplibre
  styleSpecVersion: 8
  modes: [light, dark]
intent:
  mapType: operational
  primaryTask: locate abnormal network assets
  audience: [dispatcher]
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    status: operating_status
    importance: pressure_level
zoom:
  bands:
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
tokens:
  colors:
    normal: "#2F7D5B"
    danger: "#C63D45"
    unknown: "#7F8A99"
scales:
  status:
    type: nominal
    field: "{data.bindings.status}"
    values:
      active: "{tokens.colors.normal}"
      fault: "{tokens.colors.danger}"
    fallback: "{tokens.colors.unknown}"
encodings:
  pipelines:
    source: gas-network
    geometry: line
    role: primary
    layerGroup: subject-line
    rules:
      - id: status-color
        field: "{data.bindings.status}"
        channel: line-color
        scale: status
        critical: true
        secondaryChannel: line-width
layerOrder:
  - id: background
    order: 0
  - id: subject-line
    order: 50
---

## Overview

A calm operational map in which network faults dominate neutral context.
```

The complete normative definition is in [`docs/spec.md`](docs/spec.md).

## Getting started

Install the package:

```bash
pnpm add -D @mapseekai/cartography.md
```

Validate a contract, its data profile, and its MapLibre style:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json
```

Output defaults to structured JSON so agents and CI systems can consume it. Use `--format text` for a readable terminal report.

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json \
  --format text
```

The dot-free `cartographymd` binary is the cross-platform alias. The package also exposes `cartography.md`; on Windows, the `.md` suffix may collide with Markdown file associations, so `cartographymd` is recommended.

## Validation model

The reference validator separates four different questions:

| Layer | What it checks |
|---|---|
| Document | front matter, deterministic YAML profile, schema, sections, token references |
| Data contract | source/source-layer, geometry, fields, categories, units, zoom availability, stable IDs |
| MapLibre style | official Style Specification validation and portable resource checks |
| Cartographic contract | layer provenance, semantic source rules, token drift, layer order, feature-state constraints |

Render fixtures remain a declared evidence requirement rather than a fake automatic “beauty score.” The validator checks that representative scenarios are specified; a consuming project is responsible for rendering and reviewing them.

## CLI

```text
cartographymd lint  <file> [--profile file] [--style file] [--strict]
cartographymd parse <file>
cartographymd diff  <before> <after>
cartographymd rules
cartographymd spec  [--output file]
```

### `lint`

Validates the contract and optional companion artifacts. Exit code `0` means the selected strictness passed, `1` means validation completed with blocking findings, and `2` means input or execution failed.

```bash
cartographymd lint CARTOGRAPHY.md --format json
cartographymd lint CARTOGRAPHY.md --strict --format text
cat CARTOGRAPHY.md | cartographymd lint - --profile DATA_PROFILE.json
```

When `lintFile()` or the file-based CLI is used, the validator can resolve `data.profile` relative to `CARTOGRAPHY.md`.

### `parse`

Parses front matter and canonical Markdown sections without semantic validation.

```bash
cartographymd parse CARTOGRAPHY.md
```

### `diff`

Compares contract leaf values and Markdown section bodies. It reports added, removed, and modified paths and marks increases in blocking errors or warnings as a regression.

```bash
cartographymd diff CARTOGRAPHY.md CARTOGRAPHY.next.md
```

### `rules` and `spec`

```bash
cartographymd rules
cartographymd spec --output CARTOGRAPHY-SPEC.md
```

## TypeScript API

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {
  dataProfilePath: 'DATA_PROFILE.json',
  stylePath: 'style.json',
  strict: true,
});

if (!report.valid) {
  console.error(report.findings);
  process.exitCode = 1;
}
```

The package also exports the parser, Zod schemas, default rules, style-contract validator, diff utility, rule catalog, and bundled specification. See [`docs/api.md`](docs/api.md).

## Repository structure

```text
cartography.md/
├── docs/
│   ├── spec.md                    # normative format specification
│   ├── spec.zh-CN.md              # Chinese translation of the specification
│   ├── api.md                     # CLI/API integration reference
│   └── api.zh-CN.md               # Chinese translation of the API reference
├── examples/
│   └── openfreemap-bright/
│       ├── CARTOGRAPHY.md         # contract adopting the public bright style
│       ├── DATA_PROFILE.json      # OpenMapTiles source and field facts
│       ├── style.json             # bright style plus governance metadata
│       └── README.md
├── packages/
│   └── cli/
│       ├── src/                   # parser, schemas, rules, CLI, public API
│       └── package.json           # @mapseekai/cartography.md
├── schema/
│   ├── cartography.schema.json
│   └── data-profile.schema.json
├── .agents/skills/cartography-md/SKILL.md
├── PHILOSOPHY.md
└── README.md
```

## Example

The openfreemap-bright example adopts a real production style and adds a governing contract on top:

- water, waterways, and buildings → fills lifted verbatim into tokens;
- road class → nominal scale over the transportation `class` field;
- city labels → maximum-contrast text with a white halo;
- five representative layers carry `cartography:*` governance metadata, demonstrating the style-adoption workflow.

Run it from the repository root:

```bash
pnpm install
pnpm lint:example
```

## Development

Requirements: Node.js 20 or newer.

```bash
pnpm install
pnpm check
pnpm lint:example
pnpm build
```

`pnpm check` runs TypeScript validation, tests, and a production build. CI tests Node.js 20 and 22 with pnpm.

## Conformance

The draft defines separate conformance classes for parsers, document validators, data-contract validators, MapLibre-contract validators, render workflows, and agents. The included package implements the parser, document validator, data-contract validator, and MapLibre-contract validator classes. It declares render fixtures but does not render screenshots itself.

## Project principles

- Data meaning precedes decoration.
- Visual hierarchy is explicit and zoom-aware.
- One visual channel has one primary semantic owner.
- Critical meanings use redundant signals where required.
- Selection augments rather than destroys business status.
- Unknown and null values are never silently treated as normal.
- Style syntax validation is necessary but not sufficient.
- Agents make the smallest coherent change and preserve provenance.

See [`PHILOSOPHY.md`](PHILOSOPHY.md) (中文版：[`PHILOSOPHY.zh-CN.md`](PHILOSOPHY.zh-CN.md)) for the design rationale.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
