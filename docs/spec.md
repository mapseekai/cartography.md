# CARTOGRAPHY.md Format Specification

**Status:** Draft 0.2.0  
**Repository:** `mapseekai/cartography.md`  
**Canonical file name:** `CARTOGRAPHY.md`  
**中文版:** [spec.zh-CN.md](spec.zh-CN.md)

CARTOGRAPHY.md is a self-contained, renderer-neutral format for preserving a cartographic design system. It gives humans and agents a durable description of how a family of maps should look, feel, and behave even when the dataset, subject, task, scale, or implementation technology changes.

The format combines two complementary forms of design knowledge:

- YAML front matter records exact, reusable design values.
- Markdown prose records visual identity, relationships, judgment, exceptions, and examples.

The prose is where the design system is explained. Tokens support that explanation with precision; they are not rendering instructions. This document defines the content and meaning of CARTOGRAPHY.md. It does not specify how a particular validator, renderer, or generator must be implemented.

This document is normative unless a passage is explicitly marked informative.

## Purpose

A map style can list colors, widths, fonts, symbols, and layer properties without explaining why those choices belong together. It can reproduce one output while failing to preserve the design logic that should guide the next dataset, task, or scale. CARTOGRAPHY.md fills that gap.

A CARTOGRAPHY.md document SHOULD make it possible for a reader to answer all of these questions:

- What visual world does this design system evoke?
- What makes maps from this system recognizable as one family?
- Which qualities should remain stable across subjects and tasks?
- What is visually dominant, supporting, quiet, exceptional, or prohibited?
- Which exact design values are reused, and what semantic roles do they have?
- How do labels, geometry, symbols, density, and composition behave?
- How does the map reveal or remove detail as scale changes?
- How do interaction states add emphasis without rewriting meaning?
- What accessibility principles apply beyond a single contrast calculation?
- What should a reviewer protect when adapting the system to a new map?

CARTOGRAPHY.md stores durable design decisions. It MUST NOT become a container for operation-time facts such as a current user request, dataset field names, source identifiers, data values, output-layer identifiers, target-format properties, generated-file paths, or temporary implementation choices.

The same CARTOGRAPHY.md SHOULD be reusable for different subjects. A road map and an ecological map may use different data and different visual encodings while still sharing the same paper tone, typographic voice, hierarchy, density, emphasis discipline, and state behavior.

## Scope and boundaries

The format governs cartographic design identity, not a particular data model or rendering language.

It includes:

- exact visual tokens;
- the design system's identity and long-lived audience assumptions;
- hierarchy, color, typography, label, geometry, and symbol principles;
- scale progression and generalization principles;
- layering, composition, interaction, accessibility, and review guidance;
- explicit positive and negative examples.

It excludes:

- one-time user tasks or prompts;
- dataset schemas, fields, categories, ranges, units, IDs, or sampled values;
- target-specific source, layer, expression, paint, or layout properties;
- runtime plans, generated artifacts, and adapter interfaces;
- claims that syntax alone proves visual or professional quality.

Operation-time tools MAY combine CARTOGRAPHY.md with current tasks, data profiles, existing outputs, or target-specific capabilities. Those inputs remain external to this format and MUST NOT be written into CARTOGRAPHY.md merely because they are useful for one operation.

“Self-contained” means that the design system's identity and rules can be understood from CARTOGRAPHY.md alone. It does not mean that CARTOGRAPHY.md contains every input needed to generate a particular map.

A useful durability test is:

- if a statement should still guide several datasets, subjects, or tasks, it belongs in CARTOGRAPHY.md;
- if it becomes false when the current dataset or request changes, it belongs in operation-time context;
- if it names how one target technology implements a decision, it belongs in target-specific tooling or documentation.

## Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** express normative requirement levels.

- **MUST** and **MUST NOT** define requirements necessary for format validity or preservation of meaning.
- **SHOULD** and **SHOULD NOT** define strong design guidance that may be overridden only for a documented reason.
- **MAY** identifies an optional capability or expression.

Normative requirements describe the document and its semantics. They do not imply that every design judgment can be checked automatically.

## Design philosophy

### Prose carries the design

Exact values alone do not produce a coherent map family. A color value cannot explain why it is scarce, why a label disappears before a subject line, or why selection must not erase a warning state. The Markdown body MUST explain the relationships and judgment behind the values.

Descriptions such as “clean,” “modern,” “professional,” or “beautiful” are too broad to guide reliable design. A strong document uses concrete references and choices: warm archival paper rather than pure white, graphite-like text rather than maximum black, quiet context rather than uniformly saturated layers, or technical annotation rather than decorative labeling.

### Tokens provide exact context

Tokens are named values that prevent accidental drift. They help an agent use the same canvas, ink, accent, width, size, or opacity across tasks. A token name SHOULD express a role such as `canvas`, `context`, `subject`, `critical`, or `selection`, rather than an incidental appearance such as `blue500` or `thickLine`.

Tokens do not define target-format properties. A `widths.emphasis` token describes a reusable design value; a downstream tool decides how that value maps into its own output language.

### Identity is stable; expression adapts

Reuse does not mean every map looks identical. Geometry, data scale, information density, and task can change the appropriate expression. The design system supplies the stable family resemblance and the principles used to adapt it.

For example, one system may use a scarce brick accent for decisive focus. A line-based network might express that accent through casing, while an area-based thematic map might use a boundary or annotation. The implementation differs, but the accent remains scarce and semantically consistent.

### Relationships matter more than isolated values

Cartographic quality emerges from relationships: figure and ground, subject and context, text and background, dense and sparse regions, default and selected states, overview and detail. The document SHOULD describe these relationships explicitly so that changing one value does not silently destroy the larger system.

### Professional judgment remains visible

The format does not reduce cartography to a single score or algorithm. It preserves the reasoning that a professional reviewer needs: what is emphasized, what is restrained, where exceptions are allowed, and what would make an output misleading or visually inconsistent.

## Discovery

The canonical file name is `CARTOGRAPHY.md`.

A consumer SHOULD use an explicit caller-supplied path when one is available. Otherwise it MAY search the current directory and then ancestor directories for the nearest file with the canonical name. File-name matching SHOULD be case-sensitive on every platform for reproducibility.

A repository MAY contain multiple CARTOGRAPHY.md files. Unless a consumer defines a narrower rule, a document applies to its containing directory and descendants. A more deeply nested document MAY specialize the design system for a clearly bounded part of a project, but it SHOULD preserve the parent system's identity unless it explicitly declares a different design family.

Version 0.2.0 defines scope selection, not document inheritance. The nearest applicable CARTOGRAPHY.md replaces the parent document for that scope. Consumers MUST NOT automatically merge parent and child tokens, prose, `omitted`, or `extensions` unless an external tool explicitly defines and discloses its own merge policy.

## Document structure

A CARTOGRAPHY.md document has exactly two structural layers:

1. YAML front matter delimited by `---` at the beginning of the file;
2. Markdown prose organized with canonical `##` headings.

```md
---
version: "0.2.0"
name: Quiet civic atlas
tokens:
  colors:
    canvas: "#F4F1E8"
    ink: "#24303A"
---

## Overview

An archival civic atlas with warm paper, restrained ink, and one scarce accent.
```

The front matter gives exact values and compact metadata. The Markdown body explains why those values exist, how they relate, when they apply, and what must remain recognizable when the system is adapted.

When an exact front-matter value conflicts with prose, the exact value takes precedence for that value. The contradiction SHOULD still be corrected because it makes the design system ambiguous to human and agent readers.

## Deterministic YAML

Front matter MUST use a safe, deterministic YAML subset.

It MAY contain mappings with string keys, sequences, strings, finite numbers, booleans, and `null`.

It MUST NOT contain duplicate keys, anchors or aliases, merge keys, custom tags or executable values, tab indentation, block scalars, implicit environment-variable expansion, or non-finite values such as `.nan`, `.inf`, or `-.inf`.

Dates, timestamps, values with leading zeroes, and words that could be interpreted as booleans SHOULD be quoted. Long rationale MUST be written in Markdown rather than hidden inside multiline YAML.

The YAML is configuration-like in syntax but design-system-like in meaning. It SHOULD remain compact enough that the prose is visibly the primary source of design judgment.

## Root schema

The front matter has eight normative root fields in version 0.2.0.

```yaml
version: "0.2.0"
name: <non-empty string>
description: <string?>
locale: <non-empty string?>
tokens: <TokenSet?>
accessibility: <Accessibility?>
omitted: <OmittedSection[]?>
extensions: <object?>
```

The `?` suffix means that the field is optional; it does not mean that `null` is accepted. Normative root keys and known token-group names are case-sensitive.

### `version`

`version` is REQUIRED and MUST equal `"0.2.0"`. It identifies the CARTOGRAPHY.md format version, not the revision of a particular design system or a target technology.

### `name`

`name` is REQUIRED and MUST contain a non-whitespace character. It identifies the design family, not one map, dataset, or task. Prefer `Quiet Civic Atlas` over `roads-v4`.

### `description`

`description` is OPTIONAL. It SHOULD be one concise sentence suitable for a catalog or agent context. It summarizes identity and scope but does not replace the Markdown body.

### `locale`

`locale` is OPTIONAL and MUST be non-blank when present. It identifies the document's primary language, not the languages available in current data. Label-language principles belong in `Typography & Labels`.

### `tokens`

`tokens` is OPTIONAL and contains exact reusable design values. It is open: known groups have defined semantics and unknown groups are preserved. A prose-only document can be valid, but a mature system SHOULD tokenize values whose consistency matters.

### `accessibility`

`accessibility` is OPTIONAL. Version 0.2.0 defines exact `contrastPairs`; broader accessibility guidance belongs in the Markdown section.

### `omitted`

`omitted` is OPTIONAL and records canonical Markdown sections intentionally absent. Omission is a documented design choice, not a shortcut for unfinished work.

### `extensions`

`extensions` is OPTIONAL and preserves project-specific structured information with no core semantics. Extensions MUST NOT redefine a normative field incompatibly.

Extension values use the same deterministic YAML value types as the rest of front matter. Extension owners SHOULD use namespaced keys, describe their meaning in prose or external documentation, and define their own conflict rules.

### Unknown root keys

Unknown root keys are preserved. Intentional custom data SHOULD normally use `extensions`, an `x-` prefix, or a namespace such as `acme:review`. A key resembling a normative field is likely a spelling mistake and SHOULD be surfaced rather than guessed.

The root schema deliberately has no fields for datasets, source layers, user tasks, target formats, output files, adapters, or provenance.

## Token types

### General token principles

`tokens` is an open mapping. Token names SHOULD describe purpose rather than appearance, remain stable when literal values change, avoid dataset and target-property names, and expose relationships such as `context`, `subject`, `focus`, and `critical`.

A design system SHOULD avoid near-duplicate tokens whose distinctions cannot be explained.

The five known groups are:

| Group | Core value semantics |
|---|---|
| `colors` | Generic CSS Color Level 4 value or exact reference resolving to one. |
| `typography` | Open typography object or exact reference resolving to one. |
| `widths` | `DimensionToken`. |
| `sizes` | `DimensionToken`. |
| `opacities` | Finite number from 0 through 1 or exact reference resolving to one. |

A `DimensionToken` is a non-negative finite number, a supported dimension string, or an exact reference resolving to either form. A supported dimension string is a non-negative decimal followed by `px`, `pt`, `mm`, `cm`, `in`, `em`, `rem`, or `%`.

### `colors`

`tokens.colors` maps names to generic CSS Color Level 4 strings or exact references resolving to such colors. Supported families include hexadecimal, named, `rgb()`, `hsl()`, `hwb()`, Lab/LCH, OKLab/OKLCH, and `color()` forms defined by that standard.

```yaml
tokens:
  colors:
    canvas: "#F7F5EF"
    ink: "#1F2933"
    water: "oklch(82% 0.05 220)"
    label: "{tokens.colors.ink}"
```

Color tokens SHOULD have durable semantic roles. Palette relationships and exceptions belong in the prose `Color` section.

### `typography`

`tokens.typography` maps names to open typography objects or exact references resolving to them.

| Field | Meaning and constraints |
|---|---|
| `fontFamily` | Non-empty string or non-empty array of non-empty fallback names. |
| `fontSize` | `DimensionToken`. |
| `fontWeight` | Finite number from 1 through 1000, or non-empty string. |
| `lineHeight` | Positive unitless number, or a `DimensionToken`. A zero dimension string is structurally permitted but SHOULD NOT be used for readable text. |
| `letterSpacing` | Finite number or non-empty string. |

Typography tokens provide exact values; hierarchy, density, collision, language, and halo behavior remain prose decisions.

### `widths` and `sizes`

`tokens.widths` and `tokens.sizes` map names to `DimensionToken` values.

Widths commonly describe line weight, casing, halo, or outline. Sizes commonly describe symbols and other reusable dimensions. Names SHOULD express hierarchy or function.

### `opacities`

`tokens.opacities` maps names to finite numbers from 0 through 1 or exact references. Opacity can make context recede, but can also disappear unpredictably over changing backgrounds. Prose SHOULD state what it communicates and the minimum visibility to preserve.

### Unknown token groups

Projects MAY define patterns, dash rhythms, symbol families, or other groups. Unknown groups are preserved but have no core interpretation. They SHOULD still use semantic naming, durable meaning, target independence, and prose explanation.

### References across groups

A token MAY reference another group when the resolved value is valid for the destination group. A width may reuse a dimension; a width MUST NOT resolve to a color merely because the path exists.

## Token references

A token reference uses `{path.to.value}`. Each dot-separated name segment is non-empty and contains letters, numbers, `_`, or `-`; numeric array indexes are appended as `[n]`.

`n` is one or more decimal digits interpreted as a non-negative integer. Signs, whitespace, names, and arithmetic expressions are not valid inside brackets. Leading zeroes are accepted but SHOULD be avoided because they obscure the intended index.

Valid examples:

```text
{tokens.colors.ink}
{tokens.typography.fallbacks[0]}
{extensions.acme-review.palette.primary}
```

Invalid examples:

```text
{tokens..colors.ink}
{tokens.colors.ink[ ]}
{tokens.colors.ink[+1]}
{tokens.colors.ink[name]}
{tokens.colors.ink.}
```

Rules:

1. Every reference MUST resolve within the same front matter.
2. YAML references MUST occupy the entire scalar string.
3. Visible Markdown prose MAY embed references within sentences.
4. References inside fenced code, inline code, or HTML comments are illustrative and are not applied.
5. An array index MUST identify an element that actually exists in the referenced YAML sequence; a missing or sparse index is unresolved.
6. Broken references and cycles are errors.
7. Consumers MUST NOT invent or silently substitute a fallback.

References should improve consistency rather than obscure meaning. Deep chains SHOULD be avoided.

An embedded prose reference is a semantic cross-link to the exact front-matter value. When an agent applies the design, it resolves that link to understand the named value and relationship. It is not a requirement to replace the visible Markdown text during display or serialization; consumers MAY continue to show the literal `{path}` notation to readers.

## Accessibility

### Exact contrast relationships

`accessibility.contrastPairs` declares exact relationships that matter to the design system.

```yaml
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
```

| Field | Required | Meaning |
|---|---:|---|
| `id` | yes | Stable non-empty identifier. |
| `foreground` | yes | CSS color or reference resolving to one. |
| `background` | yes | CSS color or reference resolving to one. |
| `minimum` | yes | Positive finite WCAG 2.1 ratio. |
| `kind` | no | `text`, `large-text`, or `graphic`. |

Both colors MUST be fully opaque. Semitransparent contrast depends on compositing and cannot be established from isolated values.

WCAG 2.1 relative luminance is defined in the sRGB color space. For a declared pair, consumers MUST convert each resolved opaque color deterministically to sRGB before calculating the ratio. Authors SHOULD prefer colors already inside the sRGB gamut for portable exact relationships. If an out-of-gamut color requires gamut mapping, the chosen mapping MUST be documented because different mappings can produce different ratios.

Meaningful WCAG 2.1 contrast ratios range from 1:1 through 21:1. A `minimum` outside that range does not describe a useful WCAG threshold and SHOULD NOT be used. Contrast-pair IDs SHOULD be unique within the document.

The `accessibility` object is open. It MAY be present without `contrastPairs`, and additional project-specific accessibility keys are preserved. Such keys have no core semantics and SHOULD be explained in the Markdown `Accessibility` section.

### Accessibility is broader than contrast

A pair does not prove accessibility over imagery, blended fills, changing backgrounds, dense labels, interaction states, or color-vision differences. The Markdown section SHOULD explain redundant channels, grayscale behavior, minimum readable text and symbols, small-screen behavior, difficult backgrounds, and risks requiring rendered review.

## Markdown sections

The Markdown body is the core design narrative. It uses these canonical `##` sections in order:

1. `Overview`
2. `Intent & Audience`
3. `Visual Hierarchy`
4. `Color`
5. `Typography & Labels`
6. `Geometry & Symbols`
7. `Scale & Generalization`
8. `Layering & Composition`
9. `Interaction States`
10. `Accessibility`
11. `Review Principles`
12. `Do's and Don'ts`

Every canonical section MUST be accounted for exactly once: either it appears in the Markdown body or it is named in `omitted`. Unknown sections are preserved. A canonical section MUST NOT appear twice, including through aliases. Present sections SHOULD follow this order. A document that silently lacks a section is incomplete even if its front matter is otherwise valid.

Heading normalization trims surrounding whitespace, removes a trailing colon, normalizes curly apostrophes, collapses repeated whitespace, and compares aliases case-insensitively. The recognized aliases are:

| Canonical section | English aliases | Chinese aliases |
|---|---|---|
| `Overview` | `overview`, `purpose` | `概述`, `目的` |
| `Intent & Audience` | `map intent`, `intent`, `intent and audience`, `intent & audience` | `地图意图`, `意图与受众` |
| `Visual Hierarchy` | `hierarchy`, `visual hierarchy` | `视觉层级` |
| `Color` | `color`, `colors` | `色彩`, `颜色` |
| `Typography & Labels` | `labels`, `typography`, `typography and labels`, `typography & labels` | `字体与标注`, `标注` |
| `Geometry & Symbols` | `geometry`, `symbols`, `geometry and symbols`, `geometry & symbols` | `几何与符号` |
| `Scale & Generalization` | `scale`, `generalization`, `scale and generalization`, `scale & generalization` | `比例尺与制图综合` |
| `Layering & Composition` | `layering`, `composition`, `layering and composition`, `layering & composition` | `层叠与构图` |
| `Interaction States` | `states`, `interaction states` | `交互状态` |
| `Accessibility` | `accessibility` | `无障碍` |
| `Review Principles` | `review`, `review principles` | `评审原则` |
| `Do's and Don'ts` | `do's and don'ts`, `dos and donts` | `正反例`, `应该与不应该` |

### `Overview`

`Overview` establishes the visual world in language rich enough to guide choices with no explicit token. It SHOULD describe concrete references, tone, family resemblance, restraint versus emphasis, and what the system refuses to resemble. It SHOULD NOT be a current project brief, dataset description, generic adjective list, or repetition of token values.

Useful questions: What remains recognizable if values shift? Which publication, material, instrument, or mapping tradition evokes the system? What should a viewer feel before reading? Which visual temptation must be resisted?

> Example: A quiet civic atlas printed on warm archival paper—precise ink, pale cool water, compact humanist labels, and one brick accent used only for decisive focus; never glossy, neon, or dashboard-like.

### `Intent & Audience`

This section records long-lived contexts and audience characteristics. It SHOULD describe recurring reading modes, map literacy, domain familiarity, reading conditions, density, tone, and the balance between experts and general readers.

A durable intent is not a current request. “Support calm public orientation and careful comparison” belongs here; “highlight this month's failures” does not.

Useful questions: Who should understand the map without training? Who needs extra precision? Is it read slowly or scanned under pressure? How much density can the audience interpret?

Durable media guidance also belongs here: screen versus print, expected physical size, viewing distance, color-management assumptions, and field or presentation conditions. Device-specific implementation settings remain external.

### `Visual Hierarchy`

This section defines stable prominence among **background**, **context**, **subject**, **focus**, and **critical** information. These are roles, not required layer names.

It SHOULD explain which channels establish order first, how many focal points are allowed, how context remains useful without competing, how critical differs from ordinary emphasis, and what happens when roles overlap. Hierarchy SHOULD remain legible without hue alone.

### `Color`

This section explains palette roles, not attractive swatches. It SHOULD describe canvas, ink, context, subject, accent, critical, unknown, and selection roles when applicable; lightness and saturation ranges; accent scarcity; stable meanings; and family resemblance across backgrounds.

Establish hierarchy with lightness and weight before saturation. Do not reuse critical color as decoration. Do not assign categories by unstable input order. Keep unknown and normal distinct. Selection SHOULD add emphasis rather than replace meaningful color.

### `Typography & Labels`

This section defines the voice and behavior of text: font personality and fallbacks; hierarchy by semantic role; size, weight, casing, spacing, and halo relationships; script/language behavior; density, collision, repetition, and abbreviation; reduction order; difficult-background and small-screen behavior.

Lower-priority labels SHOULD disappear before important text becomes unreadably small. Latin conventions MUST NOT be blindly applied to other scripts. Halos exist for separation, not decoration.

The section SHOULD address right-to-left layout, complex-script shaping, localized number/date formatting, and mixed-script fallback whenever those concerns are durable parts of the design system.

### `Geometry & Symbols`

This section defines family language for points, lines, areas, boundaries, textures, patterns, and symbols. It SHOULD explain line character and weight relationships, fill/boundary behavior, symbol silhouettes, familiar versus custom conventions, cross-geometry family resemblance, and detail to avoid at small sizes.

The same meaning may adapt across geometry: criticality can use shape plus outline for points, casing plus pattern for lines, and boundary plus texture for areas.

Durable projection or coordinate-reference preferences MAY be explained here when they materially shape geometry, direction, distortion, or the visual world. Dataset-specific CRS facts and transformation parameters remain operation-time context.

### `Scale & Generalization`

This section explains change across reading scales without target-specific numeric view levels. It SHOULD describe semantic stages such as overview, regional, local, and detail; what enters or leaves; label density; weight and size change; aggregation or simplification; preserved relationships; and avoidance of abrupt jumps.

Visual disclosure is not the same as geometric simplification, aggregation, displacement, or topology protection. The document SHOULD keep that boundary honest.

### `Layering & Composition`

This section describes figure-ground, conceptual stacking, whitespace, density, rhythm, balance, overlap, and aspect-ratio adaptation. It MUST NOT list target layer IDs or concrete ordering values; it explains why information sits above or below other information.

A composition SHOULD have one clear primary subject. Temporary focus may sit above it but SHOULD NOT erase its meaning.

When they are part of the map family, this section SHOULD also describe titles, legends, scale indicators, north arrows, graticules, annotations, insets, attribution, frames, and other marginal elements. It defines their visual role and placement principles, not target-specific widgets.

### `Interaction States`

This section defines default, hover, selection, focus, alert, invalid, disabled, uncertain, and editing states when relevant. Interaction is emphasis, not reclassification. Selected critical information remains critical.

It SHOULD explain coexistence precedence, permitted channels, differences between hover/selection/alert, accessible invalid/uncertain states, and fallback when a target cannot express the preferred state.

### `Accessibility`

This section covers realistic contrast, redundant critical channels, grayscale and color-vision behavior, minimum readable text/symbols, small-screen and dense-scene behavior, imagery legibility, state distinctions, and motion restraint when relevant.

Color MUST NOT be the only carrier of critical meaning. Redundancy may use shape, pattern, text, weight, outline, or position.

For interactive maps, durable guidance MAY also cover keyboard focus, text alternatives, announcements, and screen-reader relationships in the surrounding interface. CARTOGRAPHY.md describes the design intent; application code remains responsible for exposing those semantics.

### `Review Principles`

This section tells reviewers what to protect. It SHOULD address identity, hierarchy, legibility, density, consistency, accessibility, adaptation, and honesty. Review should ask whether the result belongs to the family, remains readable, adapts without losing identity, and avoids implying unsupported certainty or importance.

Recurring review scenarios MAY be listed, but they do not replace rendered inspection or professional judgment.

### `Do's and Don'ts`

This section protects the family with concrete paired examples:

- Do reserve the brick accent for decisive focus. Don't turn it into a generic category palette.
- Do remove low-priority labels when density rises. Don't shrink everything below readable size.
- Do add selection with casing or outline. Don't overwrite meaningful status.
- Do preserve quiet context. Don't give every boundary equal contrast.

Avoid vague instructions such as “make it beautiful.” Each rule SHOULD name a real decision or failure mode.

## Cross-section design relationships

The sections are not independent checklists.

- `Overview` defines the world; `Intent & Audience` constrains its application.
- `Visual Hierarchy`, `Color`, `Typography & Labels`, and `Geometry & Symbols` share limited visual channels. One channel SHOULD have one primary semantic owner in a given expression.
- `Scale & Generalization` determines when information appears; `Layering & Composition` determines how present information shares attention.
- `Interaction States` defines combinations; `Accessibility` ensures combinations remain distinguishable.
- Tokens give values; prose gives meaning. Incompatible prose meanings assigned to one token make the system incoherent.

## Omitted sections and extensions

An omitted entry is a canonical name/alias or an open object with `section` and optional non-empty `reason`.

```yaml
omitted:
  - section: Interaction States
    reason: The system is used only for static printed maps.
```

After normalization, entries MUST be unique and MUST NOT name a present section. A reason SHOULD be supplied when absence could look unfinished. Omission MUST NOT hide a decision that materially affects the design.

Extensions, unknown token groups, and unknown Markdown sections preserve project-specific meaning. They SHOULD have a clear owner, avoid redefining core fields, remain understandable without custom tooling, and be preserved by consumers.

Durable professional modes MAY appear as prose subsections inside relevant canonical sections. One-time modes remain operation-time inputs.

## Precedence and conflict resolution

When instructions conflict, consumers SHOULD apply:

1. safety, legal, and organizational requirements;
2. explicit current-operation human constraints;
3. exact front-matter values;
4. normative Markdown statements;
5. consumer defaults.

Current-operation constraints do not automatically become design-system content. Conflicting prose SHOULD be resolved by the document owner rather than repeatedly inferred by consumers.

## Agent use

An agent SHOULD read the complete document, understand identity/audience/hierarchy/tokens/scale/states/accessibility/prohibitions, resolve references, separate durable guidance from current facts, adapt to geometry while preserving family resemblance, make the smallest coherent change, preserve human work and uncertainty, report capability gaps, and leave CARTOGRAPHY.md unchanged during ordinary dataset-specific work.

An agent MUST NOT invent data meaning, treat tokens as target properties, convert current prompts into identity without instruction, use color alone for critical meaning, overwrite meaningful states with interaction, or claim document validity proves rendered quality.

## Conformance

A conforming document begins with deterministic YAML, declares version `"0.2.0"` and a non-empty name, uses known token groups according to their types, contains valid references, uses or omits canonical sections consistently, and preserves the boundary between durable design and operation-time facts.

Specifically, each of the twelve canonical sections MUST either appear once or be declared once in `omitted`; it cannot be silently absent, duplicated, or both present and omitted.

Structural conformance is necessary but not sufficient. A document can be structurally valid yet vague, contradictory, generic, or professionally weak. The design sections above define the content quality expected from a useful CARTOGRAPHY.md.

## Versioning

The format uses semantic versioning. Patch versions clarify or correct compatibly; minor versions may add optional fields or semantics; major versions may change required structure or meaning. Consumers SHOULD reject unsupported versions.

The format version does not track revisions of a particular design system. Projects MAY record their own revision in a namespaced extension.

## Complete example

```md
---
version: "0.2.0"
name: Quiet civic atlas
description: A warm, restrained visual system for public-interest maps.
locale: en
tokens:
  colors:
    canvas: "#F7F5EF"
    ink: "#1F2933"
    context: "#8A938B"
    water: "#A8C8D4"
    accent: "#A33A2B"
  typography:
    primary-label:
      fontFamily: ["Source Sans 3", "sans-serif"]
      fontSize: 12px
      fontWeight: 500
      lineHeight: 1.35
  widths:
    hairline: 0.75px
    subject: 2px
  sizes:
    compact-symbol: 6px
  opacities:
    context: 0.58
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
---

## Overview

A quiet civic atlas printed on warm paper. Precise dark ink carries text and structure; pale cool water and soft gray-green context recede; one brick accent marks decisive focus. The family should feel edited and public-minded, never glossy, neon, or dashboard-like.

## Intent & Audience

The system supports orientation, public explanation, and careful comparison for readers with mixed map literacy. It favors calm hierarchy and plain language while retaining enough precision for professional review.

## Visual Hierarchy

The canvas is quiet, context is subordinate, and the subject is evident. Lightness and weight establish order before saturation. Critical information remains stronger than ordinary focus.

## Color

Warm off-white replaces pure white, graphite replaces maximum black, and water remains pale and cool. Brick is the sole saturated accent and never becomes a generic category palette.

## Typography & Labels

Labels use a compact humanist sans-serif and ordinary sentence casing. Context labels disappear before text becomes too small. Halos are narrow and used only where needed.

## Geometry & Symbols

Lines use a small explainable weight range. Areas stay quiet, and boundaries strengthen only when separation is meaningful. Point symbols use simple silhouettes that survive at compact sizes.

## Scale & Generalization

Overview reveals broad structure; regional reading adds important connections; local reading reveals complete subject geometry; detail adds annotation. Each transition preserves identity and avoids simultaneous unrelated additions.

## Layering & Composition

Quiet regions provide breathing room. Background and context sit below the subject; labels and interaction marks sit above it. Composition maintains one primary reading path.

## Interaction States

Hover is subtle. Selection adds casing or outline while preserving base meaning. Alerts combine emphasis with a redundant pattern or symbol.

## Accessibility

Important differences use shape, pattern, text, weight, or outline as well as color. Density is reduced before text becomes unreadable. Contrast is reviewed in realistic compositions.

## Review Principles

Review family resemblance, subject prominence, context restraint, label collision, scale progression, state combinations, color-vision resilience, and honest uncertainty.

## Do's and Don'ts

Do preserve warm restraint and scarce emphasis. Don't use brick for ordinary categories, shrink all labels equally, replace meaningful states with selection, or add ornamental symbols that fail at map scale.
```

## Final principle

> CARTOGRAPHY.md preserves a portable cartographic identity and the durable judgment needed to apply it. Exact tokens keep values stable; prose keeps the design meaningful; operation-time tasks and data remain outside the format.
