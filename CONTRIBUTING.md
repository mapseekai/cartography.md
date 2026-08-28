# Contributing

Cartography.md is a draft specification and reference implementation. Contributions may improve the format, deterministic validation rules, documentation, interoperability, or examples.

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

- `docs/spec.md` is normative.
- `packages/cli/src/schema` is the executable structural model.
- `packages/cli/src/linter` implements deterministic checks.
- `schema/*.schema.json` supports editors and non-TypeScript consumers.
- `examples/*` demonstrate valid, realistic contracts.

A change to one representation should update the others in the same pull request.

## Specification changes

A specification proposal should explain:

1. the cartographic or agent problem;
2. why the existing model cannot express it;
3. the proposed syntax and semantics;
4. validation behavior and severity;
5. backward-compatibility impact;
6. at least one realistic example.

Do not add a field solely because a single style happens to contain a similarly named property. The format describes enduring cartographic intent, not every MapLibre implementation detail.

## Rule changes

Rules must be deterministic, side-effect free, and network independent. A rule should include:

- a stable kebab-case ID;
- one default severity;
- one scope (`document`, `profile`, or `style`);
- focused tests for valid and invalid inputs;
- an update to the rule catalog and documentation.

Use `error` for deterministic invalidity, unsafe behavior, or a broken required contract. Use `warning` for likely quality, portability, completeness, or maintainability problems. Use `info` for non-blocking observations.

## Tests

Add tests under `packages/cli/src/__tests__`. Prefer small fixtures in test code and keep industry-scale examples under `examples/`.

The reference example must remain valid in normal mode:

```bash
pnpm lint:example
```

## Documentation style

Use precise language. Normative sections use MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY. Explain why a constraint exists and distinguish automatic validation from render review.

## Pull requests

Keep changes focused. Include the motivation, affected conformance classes, test evidence, and migration notes. Specification-breaking changes require a versioning discussion before merge.
