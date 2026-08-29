# Changelog

All notable changes to cartography.md will be documented here.

中文版：[CHANGELOG.zh-CN.md](CHANGELOG.zh-CN.md)

The format and npm package follow semantic versioning. The `0.1` development draft was never released; `0.2.0` is the first public version line.

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
