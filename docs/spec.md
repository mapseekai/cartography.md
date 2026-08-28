# CARTOGRAPHY.md Format Specification

**Status:** Draft 0.1.0  
**Repository:** `mapseekai/cartography.md`  
**Primary target:** MapLibre Style Specification v8  
**Canonical file name:** `CARTOGRAPHY.md`
**中文版：** [spec.zh-CN.md](spec.zh-CN.md)

CARTOGRAPHY.md is a format for describing a persistent cartographic design contract to coding agents and map-style tooling. It combines machine-readable YAML with human-readable Markdown so an agent can understand both the exact values to use and the cartographic reasons behind them.

This document is normative unless a section is explicitly marked informative.

## 1. Purpose

A MapLibre `style.json` tells a renderer how to draw a map. It does not, by itself, explain:

- the purpose of the map;
- the intended audience and decision task;
- which data fields carry semantic meaning;
- which features should dominate or recede;
- how the representation changes across zoom levels;
- which visual channels own which meanings;
- which colors are reserved for warnings, selection, or uncertainty;
- how accessibility, privacy, and data quality should be handled;
- how an agent should preserve human-authored work;
- how the result should be validated beyond style syntax.

CARTOGRAPHY.md fills that gap. It is an upstream design contract from which an agent may generate, modify, review, or explain a MapLibre style.

CARTOGRAPHY.md is not:

- a replacement for the MapLibre Style Specification;
- a data schema or vector-tile schema;
- a complete rendering engine;
- a guarantee that a map is aesthetically successful without render review;
- a place to embed secrets, access tokens, or sensitive feature data.

## 2. Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as normative requirement levels.

## 3. Design goals

The format is designed around the following properties:

1. **Agent readability.** Important choices are explicit and stable across sessions.
2. **Human readability.** A cartographer can review the same file without specialized tooling.
3. **Determinism.** Equivalent inputs produce equivalent parsed models and findings.
4. **Semantic correctness.** Styling decisions remain connected to real data fields and domains.
5. **Renderer portability.** Renderer-specific behavior is declared rather than assumed.
6. **Minimal diffs.** Agents can change one decision without rewriting unrelated style layers.
7. **Traceability.** Generated style layers record the contract rules and tokens that produced them.
8. **Progressive validation.** Syntax, semantics, style conformance, and render evidence are separate checks.

## 4. File name and discovery

The canonical file name is `CARTOGRAPHY.md`.

Tools SHOULD discover it in this order:

1. a path explicitly provided by the caller;
2. `CARTOGRAPHY.md` in the current working directory;
3. the nearest ancestor containing `CARTOGRAPHY.md`;
4. a project-specific configured path.

A repository MAY contain more than one contract. A contract applies to the directory that contains it and its descendants unless a tool defines a more specific scope.

File-name matching SHOULD be case-sensitive on all platforms for reproducibility.

## 5. Document structure

A document has two layers:

1. **YAML front matter** delimited by `---` at the beginning of the file;
2. **Markdown body** containing rationale in canonical `##` sections.

```md
---
version: 0.1.0
name: Example operational map
target:
  renderer: maplibre
  styleSpecVersion: 8
# ...
---

# Example operational map

## Overview

The map supports operators locating abnormal assets without losing local context.
```

The YAML values are normative. Markdown prose explains intent and resolves ambiguity. When they conflict, the precedence rules in section 28 apply.

## 6. Deterministic YAML profile

### 6.1 Supported values

The front matter MAY use:

- mappings with string keys;
- sequences;
- strings;
- finite numbers;
- booleans;
- `null`;
- quoted or unquoted plain scalars that remain unambiguous.

### 6.2 Prohibited constructs

The front matter MUST NOT use:

- anchors or aliases;
- custom tags;
- merge keys;
- non-finite numbers;
- executable values;
- implicit environment-variable expansion;
- duplicate mapping keys.

These features are prohibited because different YAML runtimes and agents may interpret them differently. Reuse SHOULD be expressed with token references.

### 6.3 Dates and ambiguous scalars

Dates, timestamps, values with leading zeroes, and words that may be interpreted as booleans SHOULD be quoted.

```yaml
version: "0.1.0"
generatedAt: "2026-08-28T09:00:00Z"
code: "0012"
```

## 7. Token references

An exact string in the form `{path.to.value}` is a token reference.

```yaml
scales:
  road-status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.semantic.normal}"
      fault: "{tokens.colors.semantic.danger}"
```

Rules:

1. A reference MUST resolve from the YAML root.
2. A reference path uses dot-separated mapping keys.
3. Reference cycles are errors.
4. Array indexes MAY be written as `[n]` and are normalized to path segments by the reference implementation. Object tokens are preferred when the same value can be named semantically.
5. Version 0.1.0 permits references only when they occupy the entire string. Embedded references such as `1px solid {tokens.colors.border}` are errors.
6. Unknown references MUST NOT silently fall back to arbitrary values.
7. A MapLibre style does not interpret CARTOGRAPHY.md references directly. A generator MUST compile references to concrete style values and SHOULD record the source references in layer metadata.

## 8. Root schema

The front matter has the following root shape:

```yaml
version: <string>
name: <string>
description: <string?>
target: <Target>
intent: <Intent>
data: <DataContract>
agent: <object?>
zoom: <ZoomModel>
hierarchy: <object?>
tokens: <TokenSet>
scales: <map<string, Scale>>
encodings: <map<string, Encoding>>
layerOrder: <LayerOrderItem[]>
labels: <object?>
states: <object?>
accessibility: <Accessibility?>
security: <object?>
performance: <object?>
maplibre: <MapLibreContract?>
validation: <ValidationContract?>
outputs: <object?>
extensions: <object?>
omitted: <OmittedSection[]?>
```

Unknown root keys MAY be preserved by a parser. A conforming validator SHOULD report unknown keys only when they resemble misspellings of normative keys. Extension keys SHOULD use a namespaced prefix such as `acme:`.

## 9. Core metadata

### 9.1 `version`

`version` is REQUIRED and identifies the CARTOGRAPHY.md format version used by the document.

```yaml
version: "0.1.0"
```

The value does not identify the MapLibre Style Specification version; that belongs in `target.styleSpecVersion`.

### 9.2 `name`

`name` is REQUIRED and provides a human-readable map or style-system name.

### 9.3 `description`

`description` is OPTIONAL and SHOULD be one concise sentence suitable for a catalog or agent prompt.

## 10. Target

`target` declares the renderer and portability expectations.

```yaml
target:
  renderer: maplibre
  styleSpecVersion: 8
  platforms: [web, android, ios]
  modes: [light, dark, imagery]
  projection: mercator
  compatibility: portable
```

### 10.1 Fields

| Field | Required | Meaning |
|---|---:|---|
| `renderer` | yes | Primary rendering family. Version 0.1.0 is designed for `maplibre`. |
| `styleSpecVersion` | yes | Target style specification. MapLibre styles currently use version `8`. |
| `platforms` | no | Runtime targets such as `web`, `android`, and `ios`. |
| `modes` | no | Supported presentation modes, commonly `light`, `dark`, and `imagery`. |
| `projection` | no | Intended map projection or projection family. |
| `compatibility` | no | `strict`, `portable`, or `renderer-specific`. |

### 10.2 Compatibility behavior

- `strict` means the generator SHOULD use only features explicitly allowed by all declared platforms.
- `portable` means renderer-specific features MAY be used only with a documented fallback.
- `renderer-specific` permits target-specific properties but they MUST be identified in prose or extension metadata.

A validator MAY use platform capability tables in future versions. Version 0.1.0 validates the declaration but does not claim complete cross-SDK parity.

## 11. Intent

`intent` defines why the map exists before describing how it looks.

```yaml
intent:
  mapType: operational
  primaryTask: locate and assess abnormal road-network assets
  audience: [map-user, gis-operator]
  subject: road network
  context: [buildings, landuse, administrative areas]
  aesthetic:
    keywords: [technical, calm, precise]
    avoid: [neon, decorative, excessive-saturation]
    contrast: medium
    saturation: low
    density: standard
  successCriteria:
    - abnormal assets are recognizable within two seconds
    - selected objects remain distinguishable from faults
```

### 11.1 Map type

`mapType` MUST be one of:

- `reference` — balanced orientation and lookup;
- `thematic` — a subject or statistical theme dominates context;
- `operational` — status, alarms, and actionable assets dominate;
- `navigation` — route, location, and maneuver information dominate;
- `editing` — editable geometry, errors, snapping, and selection dominate;
- `imagery` — imagery is the primary visual field;
- `hybrid` — two declared purposes share priority.

A hybrid map SHOULD explain which purpose wins during conflicts.

### 11.2 Primary task

`primaryTask` is REQUIRED. It SHOULD describe an observable user task rather than a vague goal such as “show data.”

### 11.3 Audience

`audience` MUST contain at least one role. The audience influences density, terminology, label detail, and interaction states.

### 11.4 Aesthetic direction

Aesthetic keywords are constraints, not decoration. Agents SHOULD translate them into measurable choices such as saturation, contrast, line-weight range, label density, and background prominence.

## 12. Data contract

`data` binds cartographic semantics to real attributes.

```yaml
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    id: asset_id
    label: name
    category: asset_type
    importance: traffic_level
    magnitude: traffic_volume
    status: operating_status
    uncertainty: position_accuracy
    time: updated_at
    quality: qc_status
  fallbackLabels: [name, asset_code]
  nullPolicy: neutral-and-visible
  unknownCategoryPolicy: neutral-fallback-and-warning
  zeroIsNotNull: true
  preserveUnits: true
  sensitiveDataPolicy: aggregate-or-omit
```

### 12.1 Semantic bindings

Bindings create a stable vocabulary for agents. Common roles include:

| Role | Typical use |
|---|---|
| `id` | stable feature identity and feature-state |
| `label` | primary text label |
| `category` | nominal class or asset type |
| `importance` | hierarchy, priority, or network level |
| `magnitude` | quantitative size or intensity |
| `status` | operational or lifecycle status |
| `uncertainty` | positional, temporal, or classification confidence |
| `time` | recency and temporal filtering |
| `quality` | quality-control or validation state |

Projects MAY add roles. A role mapped to `null` is intentionally unavailable and MUST NOT be guessed by an agent.

### 12.2 Null, unknown, and zero

A generator MUST distinguish:

- missing/null;
- an explicit unknown category;
- numeric zero;
- empty text;
- a value outside the declared domain.

When `zeroIsNotNull` is true, zero MUST retain its quantitative meaning. Unknown categories SHOULD receive a neutral fallback and a validation finding rather than being assigned a random palette color.

### 12.3 Units

When `preserveUnits` is true, a generator MUST NOT silently reinterpret or normalize numeric values without recording the conversion.

### 12.4 Sensitive data

The contract MAY declare privacy and security constraints. It MUST NOT contain credentials or raw sensitive feature values. Styling MUST NOT reveal a restricted category through hidden layers, labels, metadata, filters, or client-side expressions.

## 13. DATA_PROFILE.json

The optional companion data profile makes semantic validation possible without embedding the data itself.

```json
{
  "version": "0.1.0",
  "name": "Road network sample",
  "generatedAt": "2026-08-28T09:00:00Z",
  "sources": {
    "road-network": {
      "type": "geojson",
      "sourceLayers": {
        "default": {
          "geometry": "line",
          "idField": "asset_id",
          "minzoom": 10,
          "maxzoom": 24,
          "density": "dense",
          "fields": {
            "asset_id": {"type": "string", "nullable": false},
            "operating_status": {
              "type": "string",
              "categories": ["active", "maintenance", "fault", "unknown"]
            }
          }
        }
      }
    }
  }
}
```

### 13.1 Root fields

| Field | Required | Meaning |
|---|---:|---|
| `version` | yes | Data-profile format version. |
| `name` | no | Human-readable profile name. |
| `generatedAt` | no | Quoted timestamp. |
| `sources` | yes | Map of source identifiers. |

### 13.2 Source

A source declares:

- `type`: `vector`, `geojson`, `raster`, `raster-dem`, or `other`;
- `sourceLayers`: a mapping of source-layer identifiers to profiles.

GeoJSON sources SHOULD use the synthetic source-layer key `default`.

### 13.3 Source-layer profile

A layer profile declares:

- `geometry`: `point`, `line`, `polygon`, `mixed`, or `raster`;
- optional `minzoom` and `maxzoom` availability;
- optional stable `idField`;
- optional `featureCount` and density class;
- a `fields` mapping.

### 13.4 Field profile

A field profile contains:

```json
{
  "type": "number",
  "nullable": true,
  "unit": "veh/h",
  "minimum": 0,
  "maximum": 4000,
  "description": "Traffic volume per hour"
}
```

Nominal fields SHOULD declare `categories`. Quantitative fields SHOULD declare units and observed bounds when known.

A profile describes observed and expected data; it is not a substitute for source authorization or server-side validation.

## 14. Zoom model

`zoom` defines how information is introduced and generalized.

```yaml
zoom:
  strategy: progressive-disclosure
  bands:
    regional: [4, 8]
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
  referenceZooms: [8, 12, 15, 18]
  visibility:
    road-segments:
      regional: hidden
      city: primary-only
      street: all-operational
      site: all-with-labels
  generalization:
    geometry: upstream
    labels: runtime-collision
```

### 14.1 Bands

Each band is `[minzoom, maxzoom]`, where `minzoom < maxzoom`. Bands MUST NOT overlap. Adjacent bands MAY share a boundary because `maxzoom` is conventionally exclusive in MapLibre layers.

Band names are project-defined. Common bands are `global`, `regional`, `city`, `street`, and `site`.

### 14.2 Reference zooms

Reference zooms are the zoom levels at which automated screenshots and human reviews SHOULD occur.

### 14.3 Progressive disclosure

A feature family MAY progress through representations such as:

`hidden → aggregate → simplified → complete geometry → geometry + label → editing detail`

A generator SHOULD avoid introducing many unrelated layers at the same zoom threshold.

### 14.4 Generalization boundary

Styling can control visibility, width, opacity, filtering, clustering, and labeling. True geometry simplification, displacement, aggregation, and topology-preserving generalization SHOULD occur in data or tile-production tooling. A style MUST NOT claim to have solved geometry generalization when it only hides features.

## 15. Visual hierarchy

`hierarchy` describes relative prominence. Its internal keys are extensible, but a project SHOULD define a small ordered system.

```yaml
hierarchy:
  levels:
    background: 10
    context: 30
    primary: 60
    focus: 80
    critical: 100
  principles:
    - establish hierarchy with lightness and size before saturated hue
    - preserve one dominant visual focus per map state
    - ordinary status must not look like an alarm
```

A hierarchy SHOULD be understandable without relying on color names alone. Size, line weight, contrast, casing, opacity, and label priority are valid hierarchy mechanisms.

## 16. Tokens

`tokens` stores exact reusable values. Only `tokens.colors` is required in version 0.1.0; additional families are strongly recommended.

```yaml
tokens:
  colors:
    light:
      canvas: "#F5F7FA"
      contextLine: "#C7CED8"
      text: "#27313D"
    semantic:
      normal: "#2F7D5B"
      maintenance: "#D18B19"
      danger: "#C63D45"
      unknown: "#8A94A3"
      selection: "#2F6FED"
  typography:
    label:
      fontStack: [Noto Sans Regular, Arial Unicode MS Regular]
      size: 12
      haloWidth: 1.5
  lineWidth:
    thin: 1
    regular: 2
    strong: 4
  opacity:
    context: 0.55
    subject: 0.95
```

### 16.1 Color syntax

Color values MUST be accepted by the MapLibre style color parser. Hex and functional CSS-style colors supported by the target style package MAY be used. A project SHOULD prefer a consistent notation.

### 16.2 Semantic colors

Strong semantic colors SHOULD be scarce. Danger, warning, selection, and editing colors MUST have distinct meanings. Selection SHOULD be an additive outline, casing, halo, or size change when preserving the underlying business status is important.

### 16.3 Modes

Light, dark, and imagery modes SHOULD be designed independently. Dark mode MUST NOT be produced by blindly inverting every light-mode color. Imagery overlays generally require stronger casing, halo, or localized backing.

### 16.4 Token naming

Token keys SHOULD describe role rather than appearance. Prefer `semantic.danger` over `red500` when the value is a semantic decision. Raw palette scales MAY coexist with semantic aliases.

## 17. Scales

A scale maps a field or value domain to a visual range.

```yaml
scales:
  road-status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.semantic.normal}"
      maintenance: "{tokens.colors.semantic.maintenance}"
      fault: "{tokens.colors.semantic.danger}"
      unknown: "{tokens.colors.semantic.unknown}"
    fallback: "{tokens.colors.semantic.unknown}"
  traffic-width:
    type: ordinal
    field: traffic_level
    values:
      low: "{tokens.lineWidth.thin}"
      medium: "{tokens.lineWidth.regular}"
      high: "{tokens.lineWidth.strong}"
  traffic-volume:
    type: quantitative
    field: traffic_volume
    stops:
      - [200, 1]
      - [1000, 2]
      - [3000, 5]
    clamp: true
    unit: veh/h
```

### 17.1 Types

- `nominal`: unordered categories;
- `ordinal`: ordered categories;
- `quantitative`: continuous or stepped numeric values;
- `diverging`: numeric values around a meaningful center;
- `identity`: values already match the output domain.

### 17.2 Domain coverage

Nominal scales SHOULD cover all categories reported by DATA_PROFILE.json and MUST define a fallback when values may be unknown. A generator MUST NOT assign colors based on unstable category iteration order.

### 17.3 Classification

Quantitative class breaks SHOULD be derived from declared domain knowledge or a reproducible profiling method. An agent MUST NOT invent “natural breaks” without access to the distribution and then present them as data-derived.

## 18. Encodings

`encodings` describe feature families and the ownership of visual channels.

```yaml
encodings:
  road-segments:
    source: road-network
    geometry: line
    role: primary
    layerGroup: subject-line
    minzoom: 10
    maxzoom: 24
    rules:
      - id: road-status-color
        field: operating_status
        channel: line-color
        scale: road-status
        critical: true
        secondaryChannel: line-pattern
      - id: traffic-level-width
        field: traffic_level
        channel: line-width
        scale: traffic-width
    labels:
      field: name
      fallbacks: [asset_code]
      minzoom: 16
      priority: 60
      allowOverlap: false
    states:
      selected:
        channel: casing
        token: "{tokens.colors.semantic.selection}"
```

### 18.1 Encoding fields

| Field | Required | Meaning |
|---|---:|---|
| `source` | yes | MapLibre source identifier. |
| `sourceLayer` | vector only | Vector-tile source layer. |
| `geometry` | yes | `point`, `line`, `polygon`, `raster`, `model`, or `mixed`. |
| `role` | yes | `background`, `context`, `primary`, `focus`, or `critical`. |
| `layerGroup` | yes | Identifier from `layerOrder`. |
| `minzoom`, `maxzoom` | no | Visibility range. |
| `filter` | no | Optional data subset. |
| `rules` | yes | Visual channel assignments. |
| `labels` | no | Label source and priority. |
| `states` | no | Hover, selection, warning, editing, or validation states. |

### 18.2 Encoding rule

A rule MUST define:

- a unique `id` within its encoding;
- a `channel`;
- either `scale` or `value`.

It MAY define:

- `field`;
- `composite`;
- `critical`;
- `secondaryChannel`;
- `priority`.

### 18.3 Channel ownership

Within one encoding, one visual channel SHOULD have one primary semantic owner. Two rules MAY share a channel only when the later rule declares `composite: true` and the combination is explained in prose.

A recommended network-map vocabulary is:

- width → segment importance or traffic level;
- hue → operating status;
- dash/pattern → lifecycle or uncertainty;
- opacity → confidence or recency;
- casing/halo → selection;
- symbol shape → asset category;
- label priority → operational importance.

### 18.4 Critical semantics

When `accessibility.requireSecondaryChannelForCriticalSemantics` is true, a rule marked `critical: true` MUST define `secondaryChannel`. Critical status must not be communicated by color alone.

### 18.5 Data validation

With a data profile, a validator SHOULD verify:

- source existence;
- source-layer existence;
- geometry compatibility;
- field existence;
- category-domain coverage;
- source zoom availability;
- stable identifiers for feature-state.

## 19. Layer order

`layerOrder` is the canonical group stack from bottom to top.

```yaml
layerOrder:
  - id: background
    order: 0
  - id: context-fill
    order: 10
  - id: context-line
    order: 20
  - id: subject-casing
    order: 50
  - id: subject-line
    order: 60
  - id: subject-point
    order: 70
  - id: subject-label
    order: 80
  - id: interaction
    order: 100
```

Group identifiers MUST be unique. Order values MUST be strictly increasing in document order. Every encoding MUST reference a declared group.

A generated `style.layers` array SHOULD be monotonically ordered by these groups. Layers within a group MAY be ordered using project-specific priorities.

## 20. Labels

`labels` is extensible. It SHOULD define global label behavior not repeated by each encoding.

```yaml
labels:
  language:
    primary: zh-Hans
    fallbacks: [name:zh, name, name:en]
  collision:
    defaultAllowOverlap: false
    preserveCriticalLabels: true
  typography:
    minimumSize: 11
    maximumSize: 18
    defaultHaloWidth: 1.5
  lineLabels:
    minimumScreenLengthPx: 80
    repeatDistancePx: 300
```

Rules:

- Label priority MUST follow semantic importance, not source order.
- Collision should normally be resolved by hiding lower-priority labels.
- Agents SHOULD reduce label density before reducing text below the declared readable minimum.
- Chinese labels SHOULD NOT be automatically uppercased or given Latin-oriented letter spacing.
- Font and glyph behavior MUST be reviewed on each declared platform.
- Critical labels that allow overlap SHOULD be few and explicitly justified.

## 21. Interaction states

`states` describes global behavior for hover, selection, editing, warning, disabled, and validation states.

```yaml
states:
  selected:
    strategy: additive-casing
    color: "{tokens.colors.semantic.selection}"
    preserveBusinessColor: true
  hover:
    strategy: width-and-opacity
  invalid:
    strategy: color-plus-pattern
```

Selection SHOULD preserve the underlying business color when that color is meaningful. Hover SHOULD not resemble selection or alarm. Editing handles and topology errors SHOULD use dedicated symbols or patterns.

When feature-state is used:

- source features MUST have stable identifiers;
- `promoteId` or feature `id` behavior SHOULD be documented;
- if `maplibre.featureStatePaintOnly` is true, feature-state MUST NOT appear in layout expressions;
- state cleanup and source refresh behavior SHOULD be tested.

## 22. Accessibility

```yaml
accessibility:
  textContrast:
    normal: 4.5
    large: 3
  nonTextGraphicContrast: 3
  requireSecondaryChannelForCriticalSemantics: true
  contrastPairs:
    - id: primary-label-on-canvas
      foreground: "{tokens.colors.light.text}"
      background: "{tokens.colors.light.canvas}"
      minimum: 4.5
      kind: text
```

Declared contrast pairs are deterministic token checks. They do not replace actual-render checks over imagery, raster data, antialiasing, opacity, blending, or variable geometry.

A conforming workflow SHOULD also review:

- common color-vision deficiencies;
- grayscale distinguishability;
- small-screen readability;
- high-density label collisions;
- critical symbols without color;
- keyboard and screen-reader behavior of surrounding UI when applicable.

## 23. Security and privacy

`security` is extensible and MAY describe:

- restricted layers;
- minimum aggregation levels;
- redaction rules;
- client/server enforcement boundaries;
- prohibited labels or metadata;
- export restrictions.

Security rules MUST be enforced at the data and service layers where needed. Hiding a MapLibre layer is not an authorization mechanism. Sensitive features MUST NOT be delivered to an unauthorized client merely because they are invisible by default.

## 24. Performance

`performance` MAY define budgets such as:

```yaml
performance:
  maximumStyleLayers: 120
  maximumSymbolLayers: 30
  maximumExpressionDepth: 16
  preferSharedSources: true
  avoidUnboundedAllowOverlap: true
```

Budgets SHOULD be treated as review thresholds, not universal truths. Performance depends on tile density, source count, expression complexity, symbol placement, device capability, pitch, terrain, and runtime SDK.

An agent SHOULD prefer clarity and correctness over premature micro-optimization, but MUST avoid generating redundant layers when one expression can express the same design without harming maintainability.

## 25. MapLibre contract

```yaml
maplibre:
  rootMetadataPrefix: "cartography"
  layerIdPattern: "^[a-z0-9]+(?:[._-][a-z0-9]+)*$"
  layerMetadata:
    required:
      - "cartography:group"
      - "cartography:role"
      - "cartography:owner"
      - "cartography:sourceRule"
    optional:
      - "cartography:tokenRefs"
      - "cartography:ruleIds"
  featureStatePaintOnly: true
  stableFeatureIdRequired: true
  runtimeOptions:
    localIdeographFontFamily: "Noto Sans CJK SC"
```

### 25.1 Style version

A MapLibre style generated for version 0.1.0 MUST use style version `8` unless the target renderer explicitly supports another declared version.

### 25.2 Sources and source layers

- Every non-background layer MUST reference an existing source.
- A layer using a vector source MUST identify a valid `source-layer`.
- A GeoJSON encoding SHOULD omit `sourceLayer` and use the data-profile key `default`.
- Source and source-layer names MUST match the data profile when one is supplied.

### 25.3 Layer metadata

MapLibre metadata does not affect rendering and is used for provenance.

```json
{
  "metadata": {
    "cartography:group": "subject-line",
    "cartography:role": "primary",
    "cartography:owner": "agent",
    "cartography:sourceRule": "road-segments",
    "cartography:ruleIds": ["road-status-color", "traffic-level-width"],
    "cartography:tokenRefs": [
      "{tokens.colors.semantic.normal}",
      "{tokens.lineWidth.regular}"
    ]
  }
}
```

A generator SHOULD preserve metadata on unchanged layers. It MUST NOT use provenance metadata as a substitute for actual style validation.

### 25.4 Filters

Expression filter syntax is preferred for generated styles. A generator SHOULD avoid mixing legacy property-filter operands with expression operands in one filter.

### 25.5 Expressions

- Continuous changes SHOULD use `interpolate` when interpolation is meaningful.
- Discrete category or threshold changes SHOULD use `match` or `step`.
- Expressions SHOULD include explicit fallbacks.
- Deep repeated expressions SHOULD be factored at the generator level or documented.
- A generator MUST distinguish `null`, unknown, and zero according to the data contract.

### 25.6 Protocol portability

In `portable` or `strict` mode, `mapbox://` URLs are errors unless a declared runtime adapter resolves them. Public or self-hosted glyph, sprite, tile, and resource URLs SHOULD be explicit.

## 26. Validation contract

```yaml
validation:
  checks:
    - document
    - token-references
    - data-profile
    - maplibre-style-spec
    - style-contract
    - accessibility
    - render-fixtures
  fixtures:
    - id: dense-urban
      required: true
    - id: sparse-suburban
      required: true
    - id: null-and-unknown
      required: true
    - id: light-mode
      required: true
    - id: dark-mode
      required: true
    - id: mobile
      required: true
    - id: desktop
      required: true
  report:
    format: json
    includeResolvedContract: true
```

### 26.1 Validation layers

A complete workflow has five layers:

1. **Document validation** — front matter, schema, sections, references, ordering.
2. **Data validation** — sources, source layers, fields, domains, units, IDs.
3. **Style validation** — official MapLibre Style Specification validation.
4. **Contract validation** — style provenance, layer groups, encodings, semantics, portability.
5. **Render validation** — screenshots, collision behavior, density, modes, states, and task review.

The CLI supplied by this repository implements deterministic layers 1–4 and checks that render fixtures are declared. It does not claim to judge screenshots automatically in version 0.1.0.

### 26.2 Recommended fixtures

At minimum, a production map SHOULD include fixtures for:

- dense urban data;
- sparse suburban or rural data;
- null and unknown categories;
- light mode;
- dark mode when declared;
- imagery mode when declared;
- mobile viewport;
- desktop viewport;
- default, hover, selected, critical, and invalid states when those states exist;
- 1× and 2× device pixel ratios where text and symbols are sensitive.

### 26.3 Task review

A map SHOULD be reviewed separately for:

- task fit;
- visual hierarchy;
- legibility;
- consistency;
- data honesty;
- accessibility;
- technical correctness.

A single averaged “beauty score” MUST NOT allow a data-honesty or security failure to pass.

## 27. Outputs

`outputs` MAY declare expected generated artifacts.

```yaml
outputs:
  style: ./dist/style.json
  report: ./dist/cartography-report.json
  screenshots: ./dist/screenshots
```

A generator SHOULD avoid writing undeclared files unless explicitly requested. Reports SHOULD include tool version, contract version, findings, and which companion artifacts were checked.

## 28. Markdown body

### 28.1 Canonical section order

The Markdown body uses `##` headings. Canonical sections, in order, are:

1. `Overview`
2. `Intent & Audience`
3. `Data Semantics`
4. `Visual Hierarchy`
5. `Color`
6. `Typography & Labels`
7. `Geometry & Symbols`
8. `Zoom & Generalization`
9. `Layer Order`
10. `Interaction States`
11. `Accessibility`
12. `MapLibre Implementation`
13. `Validation`
14. `Do's and Don'ts`

Chinese aliases such as `概述`, `意图与受众`, `数据语义`, `视觉层级`, `色彩`, `字体与标注`, `几何与符号`, `缩放与制图综合`, `图层顺序`, `交互状态`, `无障碍`, `MapLibre 实现`, `验证`, and `正反例` MAY be recognized by tools.

Unknown sections MUST be preserved. Duplicate canonical sections are errors. Present canonical sections SHOULD remain in order.

### 28.2 Omitted sections

A section MAY be intentionally omitted:

```yaml
omitted:
  - section: Interaction States
    reason: Static export only; no interactive states exist.
```

An omitted declaration MUST NOT be used to conceal a relevant unresolved decision.

### 28.3 Prose quality

Prose SHOULD explain:

- why a decision exists;
- which cases are exceptions;
- how conflicts are resolved;
- what an agent must preserve;
- what must be verified in rendered output.

Prose SHOULD NOT merely repeat token values already present in YAML.

## 29. Precedence and conflict resolution

When instructions conflict, consumers MUST apply this order:

1. security and privacy constraints;
2. explicit human instructions supplied for the current operation;
3. normative YAML values;
4. normative statements in Markdown body;
5. DATA_PROFILE.json facts;
6. existing style provenance and protected ownership;
7. generator defaults.

If YAML and prose conflict, the YAML value wins, but the validator SHOULD report the inconsistency when it can be detected deterministically.

An agent MUST NOT silently resolve a high-impact ambiguity by inventing a business meaning. It SHOULD preserve the current style and report the ambiguity.

## 30. Agent behavior

A conforming agent SHOULD:

1. read the full contract before editing style layers;
2. load DATA_PROFILE.json when required;
3. identify the primary task and visual focus;
4. map real fields to declared semantics;
5. resolve token references deterministically;
6. preserve human-owned or protected layers;
7. make the smallest coherent style change;
8. record provenance metadata;
9. run the CLI and official MapLibre validation;
10. inspect declared render fixtures;
11. report unresolved data, compatibility, and aesthetic risks.

A conforming agent MUST NOT:

- invent source-layer or field names when a profile is required;
- assign nominal colors based on unstable iteration order;
- treat zero as null when prohibited;
- use color as the sole signal for critical semantics when a secondary channel is required;
- overwrite business status colors with selection colors when preservation is required;
- expose restricted features through client-side styling;
- claim that syntax validation proves aesthetic quality.

## 31. Validator model

The reference API returns:

```ts
interface LintReport {
  valid: boolean;
  strict: boolean;
  document: {
    name?: string;
    version?: string;
    path?: string;
  };
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  findings: Finding[];
  cartography?: CartographyConfig;
  resolved?: unknown;
  sections: string[];
  artifacts: {
    dataProfileChecked: boolean;
    styleChecked: boolean;
    officialMapLibreValidation: boolean;
  };
}
```

A finding contains:

```ts
interface Finding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
  evidence?: unknown;
}
```

### 31.1 Severity

- `error`: deterministic invalidity, unsafe behavior, broken contract, or missing required evidence;
- `warning`: likely quality, portability, completeness, or maintainability problem;
- `info`: non-blocking observation.

Normal mode is valid when there are no errors. Strict mode is valid only when there are no errors or warnings.

### 31.2 Exit codes

| Code | Meaning |
|---:|---|
| `0` | Validation passed under the selected strictness. |
| `1` | Validation completed but findings are blocking. |
| `2` | CLI usage, file access, JSON parsing, or internal execution failed. |

## 32. Core rule catalog

The reference implementation includes deterministic rules for:

- front matter presence and YAML syntax;
- prohibited aliases and custom tags;
- schema conformance;
- duplicate, missing, and out-of-order Markdown sections;
- broken and cyclic token references;
- valid MapLibre color tokens;
- zoom-band ordering and overlap;
- layer-group uniqueness and ordering;
- encoding rule identity and channel ownership;
- critical secondary channels;
- declared contrast pairs;
- data-profile schema;
- source, source-layer, geometry, and field contracts;
- nominal-domain coverage;
- stable feature identifiers;
- official MapLibre Style Specification validation;
- layer provenance metadata and group order;
- portable resource protocols;
- deprecated filter syntax;
- declared render-fixture coverage.

Projects MAY add rules through the TypeScript API. Custom rules SHOULD be deterministic, side-effect free, and network independent.

## 33. Conformance classes

A tool MAY claim one or more classes:

- **Parser conformant** — parses the deterministic YAML profile and Markdown sections.
- **Document validator conformant** — validates schema, references, and canonical structure.
- **Data-contract conformant** — validates DATA_PROFILE.json and encoding semantics.
- **MapLibre-contract conformant** — runs official style validation and contract checks.
- **Render-workflow conformant** — produces and reviews all required fixtures.
- **Agent conformant** — follows the behavior and precedence rules in this specification.

A tool MUST state which classes it implements.

## 34. Extension model

Unknown YAML keys and Markdown sections SHOULD be preserved. Extensions SHOULD use namespaced keys:

```yaml
acme:qualityGates:
  maximumUnknownStatusPercent: 0.5
```

An extension MUST NOT redefine a normative key with incompatible meaning. A validator MAY warn about an extension it cannot evaluate but MUST NOT delete it.

## 35. Versioning

The format uses semantic versioning.

- Patch versions clarify wording or add backward-compatible validation.
- Minor versions add optional fields, rules, or conformance behavior.
- Major versions may change required structure or semantics.

A consumer SHOULD reject an unsupported future major version or continue only in an explicit best-effort mode.

## 36. Minimal conforming example

```md
---
version: "0.1.0"
name: Minimal operational network map
target:
  renderer: maplibre
  styleSpecVersion: 8
  platforms: [web]
  modes: [light]
  compatibility: portable
intent:
  mapType: operational
  primaryTask: locate abnormal network segments
  audience: [operator]
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    id: asset_id
    label: name
    status: operating_status
zoom:
  bands:
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
tokens:
  colors:
    canvas: "#F5F7FA"
    active: "#2F7D5B"
    fault: "#C63D45"
    unknown: "#8A94A3"
scales:
  status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.active}"
      fault: "{tokens.colors.fault}"
    fallback: "{tokens.colors.unknown}"
encodings:
  road-segments:
    source: road-network
    geometry: line
    role: primary
    layerGroup: subject-line
    rules:
      - id: status-color
        field: operating_status
        channel: line-color
        scale: status
layerOrder:
  - id: background
    order: 0
  - id: subject-line
    order: 50
---

## Overview

A calm operational map in which abnormal segments dominate neutral context.

## Intent & Audience

Operators must identify faults quickly without mistaking selection for status.

## Data Semantics

`operating_status` is nominal. Unknown values use the neutral fallback.

## Visual Hierarchy

Background is subordinate; network segments are primary; faults are critical.

## Zoom & Generalization

The full network appears at street zoom. Labels are introduced only at site zoom.

## Layer Order

Context remains below subject lines and interaction overlays.

## MapLibre Implementation

Generated layers carry `cartography:*` provenance metadata.

## Validation

Validate the contract, profile, style specification, and representative screenshots.
```

## 37. Final principle

CARTOGRAPHY.md exists to make cartographic intent durable and executable. Tokens provide exact values; data bindings provide truth; prose provides judgment; validation provides evidence. A successful implementation keeps all four connected.
