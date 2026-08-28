# openfreemap-bright example

English | [中文](README.zh-CN.md)

This example adopts the public [OpenFreeMap "bright"](https://tiles.openfreemap.org/styles/bright)
style — a production OpenMapTiles basemap — and governs a representative subset
of it with a `CARTOGRAPHY.md` contract:

| Governed layers | Encoding | Decision |
|---|---|---|
| `water`, `waterway-river`, `building` | `water-area`, `waterway-line`, `building-fill` | Fills lifted verbatim into tokens |
| `highway-primary` | `road-primary` | Nominal `roadClass` scale over the `class` field |
| `label_city` | `place-label` | `#000` text on `#fff` halo, 4.5:1 against paper |

Five layers carry `cartography:*` governance metadata (group, role, priority,
owner, token refs, source rule, and token bindings). All other bright layers
remain untouched and ungoverned — adopting them later is one metadata block and
one encoding each.

## Validate

```bash
pnpm install
pnpm lint:example
```

Or directly:

```bash
pnpm --package=@mapseekai/cartography.md dlx cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json \
  --format text
```

## Files

- `CARTOGRAPHY.md` — the governing contract (English, canonical section order);
- `DATA_PROFILE.json` — OpenMapTiles source-layer and field facts for the governed subset;
- `style.json` — the bright style as served, plus governance metadata and a `cartography:spec` root pointer.

Tile access is public; rendering the style requires network access to
`tiles.openfreemap.org` (fonts, sprites, and vector tiles).

## Licenses

`style.json` is upstream OpenFreeMap / OSM Bright work, redistributed here with
modifications under MIT (OpenFreeMap), BSD-3-Clause (style code), and CC BY 4.0
(style design). See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)
(中文：[THIRD_PARTY_LICENSES.zh-CN.md](THIRD_PARTY_LICENSES.zh-CN.md)).
