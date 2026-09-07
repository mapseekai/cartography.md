# 0.4.0 adapter contract tests

These are target-adapter requirements, independent of core document lint. An adapter must test actual generated target properties and validate target syntax, then inspect representative rendered results. No production renderer adapter or pixel-equivalence guarantee is provided by core.

MapLibre source conventions are checked against its [official layer specification](https://maplibre.org/maplibre-style-spec/layers/): circles use radius, their stroke is outside that radius, and dash lengths are multiples of line width. Import multiplies a literal dash pattern by its known width; expression-dependent widths require a reported adaptation instead.

| Input design | Target expectation |
|---|---|
| Circle `size: 12px` | MapLibre `circle-radius: 6`; reverse import returns `size: 12px`. |
| Rectangular icon 24 × 12, `size: 12px` | Body becomes 12 × 6 before rotation, preserving aspect ratio. |
| `strokeWidth: 4px`, `casingWidth: 1px` | Centered bottom line total width is 6px; foreground remains 4px. |
| `size: 10px`, `outlineWidth: 2px` | Nominal body remains 10px, visual long side grows to 14px for a surrounding outline. |
| Alpha 0.5, fillOpacity 0.4, opacity 0.5 | Isolated fill effective alpha is 0.1; overlapping parts must additionally test post-composition group opacity. |
| critical-selected | Retain critical color and non-color channel, add selection feedback; no implicit state merge. |
| Nonzero offset / generic spacing | Require documented reference and direction / gap convention; no axis guessing. |
| Unsupported compositing or smooth scale transition | Produce an adaptation warning naming the substitute and semantic loss; never claim equivalence. |

Use compatible absolute units before arithmetic. Test base and adjacent semantic stages, dense labels, missing/unknown/zero, and state collisions on each target. Keep data bindings in target fixtures outside CARTOGRAPHY.md. Report Format validation, Design review, Target validation and Visual review separately. This specification is the acceptance contract for downstream MapLibre, QGIS and ArcGIS adapters, not evidence that all targets have already been rendered.
