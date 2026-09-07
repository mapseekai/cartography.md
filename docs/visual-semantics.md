# CARTOGRAPHY.md 0.4.0 visual semantics

This English companion mirrors the 0.4.0 additions in the [complete specification](spec.zh-CN.md), whose maintained normative text is Chinese. MUST, MUST NOT, SHOULD and MAY retain the requirement levels of that specification. Existing YAML, reference, extension and chapter rules still apply.

## Precise visual properties

| Property | Design meaning |
|---|---|
| strokeWidth | MUST be the main stroke's entire width, excluding casing, outline and halo. |
| casingWidth | MUST be additional thickness on each side. For concentric lines, total bottom width = strokeWidth + 2 × casingWidth. 4px + 1px produces 6px total. |
| outlineWidth | Outward thickness from the symbol body's boundary; the nominal size and fill body do not change. A 10px body remains 10px with a 2px outline. |
| haloWidth | Outward thickness from glyph or symbol contours for legibility, not decorative glow by default; nominal size stays unchanged. |
| size | MUST be the body's pre-rotation bounding-box long side, excluding casing, outline and halo. Circle: diameter; square: side; rectangular icon: long side with preserved aspect ratio. A 12px circle has radius 6px. |
| offset | Nonzero values MUST have a documented reference, direction and sign convention. Never assume right/up, screen coordinates, line normal or text offset. Prefer literal signed dimensions or an extension; do not place offsets in widths/sizes/spacing. No offsets standard root is added. |
| spacing | MUST specify edge gap, center spacing, repeat spacing along a path, or surround/layout spacing. These meanings are not interchangeable. |

Specific fillColor, strokeColor, outlineColor, casingColor and haloColor take precedence over generic color. By default color means label text, line main stroke, polygon fill, point body, or background color. Raster has no automatic mapping; mixed needs prose or an extension. Consumers MUST NOT create an otherwise absent stroke, outline or casing just because color exists.

Preserve color alpha. fillOpacity and strokeOpacity apply to their respective drawing parts; unspecified coefficients are 1. opacity applies to the whole component after its internal drawing completes. This is not generally equivalent to multiplying each overlapping part's alpha. Targets need not share an internal compositor, but an incapable target MUST report a capability/adaptation warning, the substitute and its losses; it MUST NOT silently change meaning or claim equivalence.

## Stable tokens and scales

An element's declared attributes form its base expression. Token values and meanings remain stable across tasks and renderers. Authors SHOULD identify which semantic stage uses that expression, which tokens replace it in overview/regional/local/detail, what becomes visible, which properties may change, and the invariant relationships.

For example, a local 2.5px road can use separately declared overview 1px, regional 1.5px and detail 4px tokens, referenced in prose. Primary must not fall below secondary, critical must not recede below context, and essential labels must not become weaker than supporting labels. These relationships require design review, not just schema checks.

Prose MAY allow smooth adjacent transitions. No interpolation DSL or concrete zoom expression is added. A target MAY use discrete stages when necessary and report the difference.

## Families, roles and states

family identifies the reusable expression family; role is the baseline responsibility within it; state identifies a variation relative to baseline; layerRole describes the whole-map conceptual hierarchy. Suggested roles are primary, secondary, context, reference and muted. Suggested states are default, hover, selected, critical, invalid and disabled. They remain open vocabularies, not enums.

Semantic state SHOULD outrank interaction feedback, which outranks decoration. Selection must preserve critical meaning; hover must not erase selection. Explicit critical and critical-selected components can retain risk color and dash while adding selection casing. A combined state name is opaque: consumers MUST NOT split on hyphens, inherit, or merge elements automatically. Every element remains independently interpretable. Relationships come from explicit elements, prose or extensions.

## Thematic encoding

Qualitative categories SHOULD have comparable visual weight without implied ordering; do not endlessly add similar colors. Sequential encoding SHOULD have a clear low-to-high direction and no mid-sequence reversal. Diverging encoding requires a meaningful neutral point and comparable opposing magnitudes. Missing differs from zero, unknown from the lowest class, and not-applicable from missing. Explain each in the legend. Use non-color channels for important distinctions: width, dash, pattern, symbol, outline, text or texture.

Fields, breaks, methods, filters, expressions and value mappings remain runtime concerns. No ramps, classifications or encodings core structure is introduced.

## Agent application and validation

Apply this order: read the whole document; lint; identify identity; identify prohibitions; identify relevant families/elements; resolve tokens; combine task/data context; prefer existing components; adapt missing components for this task; apply scale/state guidance; check preserved meaning; convert to target capabilities; validate output; report degradation, deviations and unresolved facts.

Resolve conflicts in this order: explicit current user request, explicit document requirement/prohibition, component guidance, chapter principle, Overview, agent judgment. A requested deviation may affect the current artifact and must be reported; it does not authorize automatically rewriting the design system. A missing valve may use an adapted technical-symbol family. Permanent component creation requires an explicit request to change the design system.

Report Format validation, Design review, Target validation and Visual review separately. Lint covers structure, schema, references, types, chapters, deterministic boundaries and confirmed prohibited bindings. It does not establish attractive design, readable states, scientific classification, actual accessibility or correct renderer output.

Initializer drafts preserve all nine standard chapters, end with Do's and Don'ts, and use evidence-limited TODOs. Provenance, counts, raw scales, bindings and skipped facts belong in INIT_REPORT.md/JSON. Do not infer role/state from family size, order, suffix or color. Equal values are sharing candidates, not proof of semantic equivalence. Typography comparison includes every core field and preserves unknown extensions.

The supported format is 0.4.0. A 0.3.0 file MUST NOT be silently treated as 0.4.0; follow the [migration review](migrations/0.3-to-0.4.md), including historical size/casing/opacity, scale baseline and role/state meanings. Changing version alone cannot complete migration.
