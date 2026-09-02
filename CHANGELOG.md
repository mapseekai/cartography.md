# Changelog

All notable changes to cartography.md will be documented here.

中文版：[CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md)

The format and npm package follow semantic versioning. `0.1` and `0.2.0` were internal drafts that were never published or archived; `0.3.0` is the first public version line.

## 0.3.1-rc.1 - 2026-09-02

### Added

- Added tag-driven npm Trusted Publishing with OIDC, exact-tarball validation, bounded registry verification, and idempotent GitHub prerelease creation.
- Added protected release tags and stable/prerelease channel selection for `latest` and `next`.

### Changed

- Separated the npm/CLI `VERSION` from the `FORMAT_VERSION`, allowing package-only releases while the CARTOGRAPHY.md and JSON Schema contract remains at 0.3.0.

### Fixed

- Hardened manual retry, tag-SHA binding, npm integrity collision handling, historical-tag CI, and npm 12 pack compatibility.

## 0.3.0 - 2026-09-01

### Breaking changes

- Replaced the `tokens` wrapper with root-level `colors`, `typography`, `widths`, `sizes`, `opacities`, `spacing`, `dashes`, and `elements` groups.
- Added `spacing`, `dashes`, and reusable `elements`; MapElement now requires `geometry` and at least one core style property.
- Extended Typography with `fontStyle`, `textTransform`, `fontFeature`, and `fontVariation`; introduced `DashPattern` with even, unit-consistent resolved members.
- Tightened Dimension syntax: core dimensions no longer accept `rem` or `%`.
- Replaced legacy reference paths with root-based references such as `{colors.ink}`; references now support array indexes, forbid metadata roots, and resolve deeply.
- Reduced canonical Markdown chapters from twelve to nine: Overview, Colors, Typography & Labels, Composition & Density, Layering & Depth, Geometry & Symbols, Scale & Generalization, Map Elements, and Do's and Don'ts.
- Made `omitted` objects closed; removed `locale`, `accessibility`, and `extensions` as standard fields. Machine validation of contrast pairs is removed; contrast and inclusive-design guidance belongs in prose.
- Renamed the published schema to `schema/cartography-front-matter.schema.json` with `$id` `urn:cartography-md:schema:front-matter:0.3.0`.
- Added Appendix B conformance coverage for the 0.3.0 format.
- This is a destructive upgrade: no `0.2.0` compatibility layer, field aliases, or legacy rule IDs are retained.

## 0.2.0 - 2026-08-29

### Added

- A self-contained `CARTOGRAPHY.md` format for persistent cartographic visual identity, combining deterministic YAML front matter with prose-first Markdown sections.
- Open design tokens, exact `{path.to.token}` references, declared accessibility contrast pairs, reasoned section omissions, and preservation of unknown extensions.
- Canonical sections for intent, hierarchy, color, typography and labels, geometry and symbols, scale and generalization, composition, interaction states, accessibility, review principles, and Do's and Don'ts.
- A TypeScript parser, Zod schema, generated JSON Schema, document linter, reference resolver, semantic diff, rule catalog, and bundled specification.
- CLI commands `parse`, `lint`, `diff`, `rules`, and `spec`, with structured findings, strict mode, and stable exit codes.
- The independently lintable Quiet Atlas example, bilingual public and normative documentation, and agent workflow guidance.

### Boundaries

- Core validation is restricted to one `CARTOGRAPHY.md` and its deterministic internal relationships.
- Current tasks, data inspection, target-specific production, and output review remain runtime responsibilities outside the core package.
- The package has no target-specific production dependency or compatibility layer for the unreleased `0.1` draft.
