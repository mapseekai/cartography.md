# cartography.md

**A persistent cartographic visual identity for agents.**

`CARTOGRAPHY.md` is a portable, agent-readable design-system format for maps. It keeps the visual identity and long-lived cartographic judgment of a map family in one self-contained Markdown document, so agents can apply the same character across datasets, tasks, tools, and outputs.

The core package parses, lints, compares, and explains that document. It validates only document structure and deterministic internal relationships. Current task inputs, data inspection, target-specific production, and output review happen outside core validation.

中文版：[README.zh-CN.md](README.zh-CN.md) · [Specification](docs/spec.md) · [TypeScript API](docs/api.md) · [Philosophy](PHILOSOPHY.md)

## Why it exists

Map-making decisions often disappear into a one-off implementation: which marks deserve attention, how hierarchy changes with scale, how labels feel, how interaction states preserve meaning, and what makes the result recognizably part of one family.

`CARTOGRAPHY.md` makes those decisions durable. Prose carries the professional judgment; tokens provide exact reusable values. An agent can understand both what the visual system is and why its constraints matter.

## The two-layer format

Every document has two complementary layers:

1. YAML front matter holds identity, version, exact tokens, explicit contrast pairs, omissions, and extensions.
2. Markdown sections describe intent, hierarchy, color, typography, symbols, scale behavior, composition, states, accessibility, review principles, and strong positive and negative examples.

```markdown
---
version: "0.2.0"
name: Quiet Atlas
description: "A restrained editorial atlas family for clear orientation and unhurried reading."
tokens:
  colors:
    paper: "#f8f4f0"
    water: "#aecfe2"
    ink: "#000000"
accessibility:
  contrastPairs:
    - id: ink-on-paper
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.paper}"
      minimum: 4.5
      kind: text
---

## Overview

Quiet Atlas is a restrained editorial map family: warm paper, pale blue water,
and near-black ink make the page feel calmly printed rather than brightly lit.

## Visual Hierarchy

Paper is the quiet ground. Water establishes context; inked names and the
reader's active focus carry the strongest attention.
```

YAML token values are normative when an exact value is needed. Prose explains their roles, boundaries, tradeoffs, and exceptions. Token references such as `{tokens.colors.ink}` can be used in either layer.

## Quick start

Requirements: Node.js 20 or newer.

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md
```

Use strict mode when warnings must block success:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md --strict
```

Compare two design-system documents:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd diff before.md after.md
```

Read the bundled normative specification:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd spec
```

The CLI also provides `parse` for structured document output and `rules` for the built-in rule catalog. Exit code `0` means the document passed, `1` means blocking findings exist, and `2` means usage, file access, or an internal operation failed.

## Quiet Atlas example

[`examples/quiet-atlas/CARTOGRAPHY.md`](examples/quiet-atlas/CARTOGRAPHY.md) is a complete, independently lintable example. Its warm paper, pale water, economical ink, measured typography, and restrained emphasis form a specific visual family without binding the document to current data or a production target.

From this repository:

```bash
pnpm install
pnpm lint:example
```

## TypeScript API

```ts
import {diffCartography, lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {strict: true});

if (!report.valid) {
  for (const finding of report.findings) {
    console.error(finding.ruleId, finding.message);
  }
}

const changes = diffCartography(previousSource, currentSource);
console.log(changes.values, changes.sections);
```

The public API includes parsing, the runtime schema, document linting, reference resolution, semantic diffing, the specification, and the rule catalog. See [docs/api.md](docs/api.md) for exact signatures and exported types.

## What core validation guarantees

Core linting checks deterministic properties of one `CARTOGRAPHY.md`, including:

- safe and unambiguous YAML;
- the `0.2.0` front-matter schema;
- canonical section presence, order, omissions, and duplicates;
- known token types and token-reference integrity;
- declared color contrast relationships;
- document size and unknown or likely misspelled root keys.

A passing report means only that the document and its internal relationships are valid. It does not establish that current data is correct, that an output satisfies the user's task, that a target-specific artifact is valid, or that visual and accessibility review is complete.

## Repository map

```text
docs/spec.md                 normative format specification
docs/api.md                  TypeScript API reference
schema/cartography.schema.json
                             generated editor and tooling schema
packages/cli                 CLI and TypeScript package
examples/quiet-atlas         self-contained design-system example
.agents/skills               optional agent workflows
```

## Status and license

Version `0.2.0` is the first public format line. The earlier `0.1` draft was never released and has no compatibility layer.

Apache-2.0. See [LICENSE](LICENSE).
