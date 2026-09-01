# @mapseekai/cartography.md

Agent-first format and validator for persistent cartographic design systems.

The package parses, lints, resolves, and compares one self-contained `CARTOGRAPHY.md`. YAML front matter supplies exact identity and root-level token groups; Markdown prose carries visual intent, color and typography guidance, composition and layering principles, scale behavior, and map element semantics.

## CLI

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md
pnpm dlx --package=@mapseekai/cartography.md cartographymd diff before.md after.md
pnpm dlx --package=@mapseekai/cartography.md cartographymd spec
```

`parse` returns structured document output, and `rules` lists the built-in document rules. Add `--strict` to lint when warnings must block success.

## TypeScript

```ts
import {diffCartography, lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {strict: true});

if (!report.valid) {
  for (const finding of report.findings) {
    console.error(finding.ruleId, finding.message);
  }
}

const changes = diffCartography(previousSource, currentSource);
```

Core validation checks only the document and its deterministic internal relationships. Current data, task fitness, target-specific production, output validity, and professional visual review remain outside the package boundary.

See the repository [README](https://github.com/mapseekai/cartography.md#readme), [format specification](https://github.com/mapseekai/cartography.md/blob/main/docs/spec.md), and [API reference](https://github.com/mapseekai/cartography.md/blob/main/docs/api.md) for complete details.
