# @mapseekai/cartography.md

**Parse, validate, and compare cartographic design systems written in Markdown.**

`CARTOGRAPHY.md` combines exact YAML tokens with prose describing a map's visual identity, hierarchy, typography, symbols, scale behavior, and states. This package provides the CLI, TypeScript API, runtime schema, rule catalog, and bundled format specification for working with these documents.

Package version: `0.4.1`. Document format: `0.4.0`. Runtime: **Node.js 20 or newer**.

## Installation

```bash
pnpm add @mapseekai/cartography.md
```

Place a `CARTOGRAPHY.md` in your working directory. The repository includes [design examples](https://github.com/mapseekai/cartography.md/tree/main/examples) for atlas, technical-network, and thematic maps.

## CLI

```bash
pnpm exec cartographymd lint CARTOGRAPHY.md --format text
pnpm exec cartographymd lint CARTOGRAPHY.md --strict
pnpm exec cartographymd parse CARTOGRAPHY.md
pnpm exec cartographymd diff before.md after.md
pnpm exec cartographymd rules
pnpm exec cartographymd spec
```

For a one-off invocation:

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md --format text
```

`lint` returns JSON by default and accepts `--format text` for readable output. Its checks cover YAML representation, front-matter structure, sections, token types, references, and map-element properties. Normal mode passes with zero errors; `--strict` also requires zero warnings. Both `lint` and `parse` accept `-` for standard input.

`diff` lists added, removed, and modified front-matter leaf paths and Markdown sections, together with diagnostic counts. Its `regression` flag is set when the error or warning count increases. `spec --output cartography-spec.md` saves the bundled specification to a file.

## TypeScript API

The package exports ES modules and TypeScript declarations.

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
| `parseCartography(source)` | Parse YAML front matter and Markdown sections. |
| `lint(source, options)` / `lintFile(file, options)` | Validate document source or a file. |
| `resolveReferences(frontmatter)` | Return a deeply copied value with token references resolved. |
| `diffCartography(beforeSource, afterSource)` | Compare document values, sections, and diagnostics. |
| `cartographySchema` | Validate front-matter data structure. |
| `getRuleCatalog()` / `getSpecification()` | Read the rule catalog and bundled specification. |
| `VERSION` / `FORMAT_VERSION` | Read the package and document-format versions. |

Use `LintOptions.rules` to add rules or replace default implementations by rule ID. Public types include `CartographyConfig`, `LintOptions`, `LintReport`, `LintRule`, and `CartographyDiffReport`.

## Documentation

[Repository](https://github.com/mapseekai/cartography.md) · [Specification](https://github.com/mapseekai/cartography.md/blob/main/docs/spec.md) · [API reference](https://github.com/mapseekai/cartography.md/blob/main/docs/api.md) · [Authoring guide](https://github.com/mapseekai/cartography.md/blob/main/docs/authoring.md)

## License

[Apache-2.0](LICENSE).
