---
name: cartography-md
description: Read and apply CARTOGRAPHY.md contracts when generating, modifying, or reviewing MapLibre styles.
---

# Cartography.md agent skill

Use this skill when a repository contains `CARTOGRAPHY.md` or the user asks for an agent-governed MapLibre style.

## Required workflow

1. Read the full `CARTOGRAPHY.md`, including YAML and Markdown.
2. Load `DATA_PROFILE.json` when `data.profileRequired` is true.
3. Identify the primary task, audience, map type, supported modes, and visual focus.
4. Resolve exact `{path.to.token}` references before writing `style.json` values.
5. Verify source names, source layers, geometry types, fields, categories, units, zoom availability, and stable IDs from the data profile.
6. Preserve protected or human-owned layers and make the smallest coherent change.
7. Keep one primary semantic owner per visual channel unless a deliberate composite is declared.
8. Preserve business status when adding hover, selection, alert, invalid, or quality states.
9. Add `cartography:*` provenance metadata to governed MapLibre layers.
10. Run the Cartography.md validator and official MapLibre style validation.
11. Review all declared render fixtures before claiming visual completion.

## Never assume

Do not invent field names, source layers, units, category ordering, missing-value meaning, or risk severity. Do not treat `style.json` syntax validity as evidence that the map is visually or semantically correct.

## Commands

```bash
cartographymd lint CARTOGRAPHY.md --profile DATA_PROFILE.json --style style.json
cartographymd diff CARTOGRAPHY.md CARTOGRAPHY.next.md
cartographymd rules
cartographymd spec
```

Use `--strict` in CI when warnings are intended to block changes.
