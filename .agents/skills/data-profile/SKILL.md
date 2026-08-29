---
name: data-profile
description: Use when a cartographic task needs a DATA_PROFILE.json generated, refreshed, or assessed from a style, TileJSON metadata, or MVT tiles.
---

# Data profile

Create evidence-carrying runtime context about a dataset without turning observations into stable cartographic policy. Prefer the strongest available evidence, preserve uncertainty, and keep the result outside the cartography.md core contract.

Run commands from the repository root. In automated or reproducible runs, set `--observed-at` to the actual observation time; the fixed timestamps below only make the examples deterministic.

## Reuse, refresh, or generate

| Choice | Use it when |
|---|---|
| Reuse | The existing profile describes the same inputs, its evidence is recent enough for the task, and its unresolved items do not block the requested decision. |
| Refresh | Inputs may have changed, sampled evidence is stale, or the task needs facts that the existing evidence or unresolved list does not establish. |
| Generate | No profile exists, its format is incompatible, or its provenance cannot be established. |

Do not treat matching filenames as proof that inputs are unchanged. Check `inputs`, `generatedAt`, evidence kinds, sampling coverage, and `unresolved` before reusing a profile.

## Required workflow

Follow these steps in order:

1. Read the user's actual inputs and decide whether an existing profile can be reused.
2. Prefer explicit TileJSON/metadata, then sample actual MVT when declarations are missing or insufficient.
3. Use multiple spatial candidates and relevant zooms within the configured budget; never infer a complete domain from one tile.
4. Keep declared, sampled, and style-inferred evidence separate and retain conflicts.
5. Never copy credentials or unnecessary raw feature values into DATA_PROFILE.json.
6. Write partial results with unresolved items when safe completion is impossible.
7. Treat the output as user/runtime context; do not run or claim cartography.md core validation on it.
8. Never modify CARTOGRAPHY.md to fit the discovered dataset.

## Evidence and reporting

- `tilejson-declared` records metadata assertions. It does not prove that current tiles contain the declared fields or values.
- `tile-sampled` records observations from bounded tile sampling at the listed coordinates and time. A sample is evidence, not a complete domain.
- `style-inferred` records source layers and fields referenced by style expressions. It does not establish field types, value domains, geometry, feature IDs, or actual tile contents.

Retain incompatible declarations and observations together and report their conflict through `unresolved`; do not pick a convenient winner. Report the inputs used, evidence strength, sampling bounds/zooms/budget, conflicts, and unresolved facts alongside the output path.

The generator sanitizes retained references, but credentials must not be placed in arguments, URLs, output, or copied feature values. If authorized access cannot be performed without exposing a secret, stop sampling and keep that gap unresolved.

## CLI examples

### Style only

Use this to discover source and field references without fetching TileJSON or tiles:

```bash
pnpm --filter @cartographymd/data-profile-skill profile -- \
  --style .agents/skills/data-profile/fixtures/openfreemap-bright/style.json \
  --observed-at 2026-08-29T00:00:00Z \
  --output DATA_PROFILE.json
```

Expect `style-inferred` evidence plus unresolved field domains and tile contents.

### TileJSON metadata

```bash
pnpm --filter @cartographymd/data-profile-skill profile -- \
  --tilejson ./data/metadata.json \
  --source-id openmaptiles \
  --observed-at 2026-08-29T00:00:00Z \
  --output DATA_PROFILE.json
```

### Local MVT template

Supply explicit spatial and request bounds. Relative tile paths resolve from the command's working directory.

```bash
pnpm --filter @cartographymd/data-profile-skill profile -- \
  --source-id openmaptiles \
  --tile-template './tiles/{z}/{x}/{y}.pbf' \
  --bbox=-123.2,37.2,-121.7,38.2 \
  --zooms=8,10,12 \
  --max-requests 24 \
  --observed-at 2026-08-29T00:00:00Z \
  --output DATA_PROFILE.json
```

### Bounded remote MVT

Combine metadata with actual observations when the declaration is insufficient:

```bash
pnpm --filter @cartographymd/data-profile-skill profile -- \
  --tilejson ./data/metadata.json \
  --source-id openmaptiles \
  --tile-template 'https://tiles.example.org/{z}/{x}/{y}.pbf' \
  --bbox=-123.2,37.2,-121.7,38.2 \
  --zooms=8,10,12 \
  --max-requests 24 \
  --observed-at 2026-08-29T00:00:00Z \
  --output DATA_PROFILE.json
```

Remote sampling blocks loopback, link-local, and private addresses by default. Add `--allow-private-network` only when the user explicitly authorizes access to a trusted private endpoint: it permits requests into internal network space and can expose or interact with internal services. Keep `--bbox`, `--zooms`, and `--max-requests` bounded even when private access is authorized.

## Common mistakes

- Reusing a profile because it exists, without checking its provenance and unresolved facts.
- Treating style references or one non-empty tile as a complete schema or value domain.
- Collapsing `tilejson-declared`, `tile-sampled`, and `style-inferred` evidence into one confidence level.
- Omitting unresolved facts after an empty, failed, blocked, or budget-limited sample.
- Passing credentials in a URL or copying arbitrary feature values that are not needed for profiling.
- Claiming `cartographymd lint` validates `DATA_PROFILE.json`, or changing `CARTOGRAPHY.md` to match runtime discoveries.
