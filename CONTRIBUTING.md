# Contributing

cartography.md welcomes contributions to the format, document-scoped validation, documentation, examples, and tooling.

## Development setup

Requirements:

- Node.js 20 or newer;
- pnpm 10 or newer.

```bash
pnpm install
pnpm check
pnpm lint:example
```

## Repository responsibilities

- `docs/spec.md` is the normative format specification.
- `packages/cli/src/schema` is the executable structural model.
- `packages/cli/src/linter` contains deterministic document rules.
- `schema/cartography-front-matter.schema.json` is the informational schema published with the specification for editors and non-TypeScript consumers.
- `examples/*` demonstrate realistic, independently valid documents.

Keep these representations synchronized in the same pull request.

## Specification changes

A proposal should explain:

1. the enduring cartographic or agent problem;
2. why existing prose, tokens, sections, omissions, or custom root fields cannot express it;
3. the proposed syntax and semantics;
4. deterministic document validation, if any;
5. versioning impact;
6. at least one realistic, self-contained example.

Do not add core fields for a single dataset, current user task, target tool, or output. The common format stores portable visual identity and long-lived design judgment.

## Rule changes

Every built-in rule has only `document` scope. It must be deterministic, side-effect free, and network independent. A rule change should include:

- a stable kebab-case ID;
- one default severity;
- `scope: 'document'`;
- focused valid and invalid fixtures;
- updates to the rule catalog and relevant documentation.

Use `error` for deterministic document invalidity or unsafe input. Use `warning` for likely misspellings, contradictions, maintainability risks, or strict-mode concerns. Use `info` only for non-blocking document observations.

Rules may inspect only the supplied `CARTOGRAPHY.md` source and explicit document-lint options. They must not fetch resources, inspect companion inputs, infer natural-language quality, or claim facts about runtime production.

## Tests

Add tests under `packages/cli/src/__tests__`. Derive expected values independently and use the smallest fixture that demonstrates the contract. Keep the Quiet Atlas example valid in normal mode:

```bash
pnpm lint:example
```

Schema changes must keep the runtime Zod schema and the published informational JSON Schema in parity; parity tests enforce that relationship. The schema is released with the specification rather than generated at runtime. Public product changes must retain the core boundary checks.

## Documentation style

Use precise language. Normative sections use MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY. Explain why each constraint exists, keep English and Chinese documents semantically aligned, and distinguish document validity from professional or runtime review.

## Pull requests

Keep changes focused. Include the motivation, affected document behavior, test evidence, bilingual documentation updates where applicable, and versioning notes for breaking format changes.

## Publishing releases

The `Publish` GitHub Actions workflow publishes `@mapseekai/cartography.md` through npm Trusted Publishing. Do not create an `NPM_TOKEN` repository secret.

Before the first automated release, configure the package on npmjs.com with a GitHub Actions Trusted Publisher:

- organization or user: `mapseekai`
- repository: `cartography.md`
- workflow filename: `publish.yml`
- environment: leave empty

Set the same version in root `package.json`, `packages/cli/package.json`, and `packages/cli/src/version.ts`, update both changelogs, and merge a green CI commit to `main`. Push an annotated tag matching that version:

```bash
git tag -a v0.4.0 -m "cartography.md v0.4.0"
git push origin v0.4.0
```

Stable tags publish to npm `latest`. Tags containing a SemVer prerelease suffix, such as `v0.4.0-rc.1`, publish to `next` and create a GitHub prerelease.

To retry an existing tag without moving it, run the `Publish` workflow manually and provide the exact tag. The workflow never overwrites an existing npm version or GitHub Release. A release is complete only after the workflow installs the public registry package and verifies `cartographymd --version`.
