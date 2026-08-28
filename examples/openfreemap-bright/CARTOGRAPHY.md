---
version: "0.1.0"
name: OpenFreeMap Bright basemap contract
description: "Governing contract for a curated subset of the public OpenFreeMap bright style (OpenMapTiles schema): the contract adopts an existing, unannotated production style and adds traceable cartographic decisions on top of it."
locale: en
target:
  renderer: maplibre
  styleSpecVersion: 8
  platforms: [web]
  modes: [light]
  compatibility: portable
intent:
  mapType: reference
  primaryTask: Orient readers with a calm, legible general-purpose basemap under thematic overlays.
  audience: [web-map-user]
  subject: Global OpenStreetMap basemap served from OpenMapTiles vector tiles.
  aesthetic:
    keywords: [calm, legible, neutral]
    contrast: medium
    saturation: low
    density: standard
  successCriteria:
    - Water, roads, and buildings remain distinguishable from the paper background at street zoom.
    - City labels stay readable over every base fill they may overlap.
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    roadClass: class
    placeName: name
  nullPolicy: "Absent brunnel, intermittent, ramp, or capital attributes mean the property does not apply; absence is not a category and must not be styled as one."
  unknownCategoryPolicy: "Transportation classes outside the governed palette fall back to the minor road color instead of being dropped."
  zeroIsNotNull: true
zoom:
  strategy: continuous-interpolation-between-bands
  bands:
    world: [0, 8]
    regional: [8, 12]
    street: [12, 16]
    detail: [16, 24]
tokens:
  colors:
    background: "#f8f4f0"
    water: "#AECFE2"
    waterway: "#a0c8f0"
    buildingLow: "#f2eae2"
    buildingHigh: "#dfdbd7"
    roadPrimary: "#fea"
    roadMotorway: "#fc8"
    roadTrunk: "#fea"
    roadSecondary: "#fea"
    roadMinor: "#fff"
    label: "#000"
    labelHalo: "#fff"
scales:
  roadClass:
    type: nominal
    field: "{data.bindings.roadClass}"
    values:
      motorway: "{tokens.colors.roadMotorway}"
      trunk: "{tokens.colors.roadTrunk}"
      primary: "{tokens.colors.roadPrimary}"
      secondary: "{tokens.colors.roadSecondary}"
      tertiary: "{tokens.colors.roadSecondary}"
      minor: "{tokens.colors.roadMinor}"
    fallback: "{tokens.colors.roadMinor}"
    description: "Road-class palette lifted verbatim from the bright style; trunk, primary, and secondary tones are intentionally identical upstream."
encodings:
  waterway-line:
    source: openmaptiles
    sourceLayer: waterway
    geometry: line
    role: context
    layerGroup: hydrology-line
    rules:
      - id: waterway-color
        channel: line-color
        value: "{tokens.colors.waterway}"
  water-area:
    source: openmaptiles
    sourceLayer: water
    geometry: polygon
    role: context
    layerGroup: hydrology-area
    rules:
      - id: water-fill
        channel: fill-color
        value: "{tokens.colors.water}"
  building-fill:
    source: openmaptiles
    sourceLayer: building
    geometry: polygon
    role: context
    layerGroup: building
    rules:
      - id: building-base
        channel: fill-color
        value: "{tokens.colors.buildingLow}"
        composite: true
      - id: building-detail
        channel: fill-color
        value: "{tokens.colors.buildingHigh}"
        composite: true
  road-primary:
    source: openmaptiles
    sourceLayer: transportation
    geometry: line
    role: primary
    layerGroup: road
    rules:
      - id: road-class-color
        field: "{data.bindings.roadClass}"
        channel: line-color
        scale: roadClass
  place-label:
    source: openmaptiles
    sourceLayer: place
    geometry: point
    role: primary
    layerGroup: label
    minzoom: 3
    rules:
      - id: label-color
        channel: text-color
        value: "{tokens.colors.label}"
    labels:
      field: "{data.bindings.placeName}"
      minzoom: 3
layerOrder:
  - id: hydrology-line
    order: 10
  - id: hydrology-area
    order: 20
  - id: building
    order: 30
  - id: road
    order: 40
  - id: label
    order: 50
accessibility:
  textContrast:
    cityLabelOnBackground: 4.5
  contrastPairs:
    - id: city-label-on-paper
      foreground: "{tokens.colors.label}"
      background: "{tokens.colors.background}"
      minimum: 4.5
      kind: text
    - id: water-on-paper
      foreground: "{tokens.colors.water}"
      background: "{tokens.colors.background}"
      minimum: 1.2
      kind: graphic
    - id: waterway-on-paper
      foreground: "{tokens.colors.waterway}"
      background: "{tokens.colors.background}"
      minimum: 1.2
      kind: graphic
    - id: building-on-paper
      foreground: "{tokens.colors.buildingHigh}"
      background: "{tokens.colors.background}"
      minimum: 1.2
      kind: graphic
maplibre:
  rootMetadataPrefix: cartography
  layerMetadata:
    required: [group, role, priority, owner, tokenRefs, sourceRule]
  stableFeatureIdRequired: false
validation:
  fixtures:
    - id: dense-urban
    - id: sparse-suburban
    - id: null-and-unknown
    - id: mobile
    - id: desktop
    - id: light-mode
---

## Overview

This contract governs a representative subset of the public OpenFreeMap
"bright" style: rivers, water polygons, buildings, primary roads, and city
labels. The remaining bright layers stay untouched and ungoverned; adopting
them later means adding a `cartography:*` block and an encoding here.

## Intent & Audience

The map is a neutral reference basemap for web users. It must stay calm under
thematic overlays: low saturation fills, one hue family for water, one warm
family for roads, and maximum-contrast text.

## Data Semantics

Data comes from the OpenMapTiles schema served at
`https://tiles.openfreemap.org/planet`. The `class` field on transportation is
a nominal road class; `name` on place is the display label. Absent `brunnel`
or `intermittent` values are semantically empty, not a category, and zero is
not null where integer flags are used.

## Visual Hierarchy

Labels dominate, then roads, then buildings, then hydrography, then the paper
background. The declared `layerOrder` mirrors the layer array of the adopted
style so governance checks can verify draw order.

## Color

Every governed color is lifted verbatim from bright and registered as a token.
The two-tone building fill is one deliberate zoom-driven composite on the
`fill-color` channel, not two competing owners.

## Typography & Labels

City labels use `Noto Sans Regular` at `#000` with a `#fff` halo. The label
field is the OpenMapTiles `name`; localized variants remain available to the
renderer exactly as bright expresses them.

## Geometry & Symbols

Water polygons and buildings are polygon fills, rivers and primary roads are
lines, city labels are points. Geometry types in the encoding match the
profiled source layers.

## Zoom & Generalization

Bands describe reading distance, not data presence: world, regional, street,
and detail. Bright performs continuous interpolation inside bands; no
simplification or displacement is declared at the style level, so
generalization stays upstream in tile production.

## Layer Order

Declared groups follow the adopted draw order: hydrology lines, hydrology
areas, buildings, roads, labels. Governance metadata on the five governed
layers keeps the style array honest against this sequence.

## Interaction States

No feature-state styling is declared for this basemap. Hover and selection
belong to the overlay layers that consumer projects add above it.

## Accessibility

City label text keeps a 4.5:1 ratio against the paper background. Water,
waterway, and building fills keep at least 1.2:1 against the same background
so their shapes stay perceivable without relying on hue alone.

## MapLibre Implementation

Governed layers carry `cartography:*` metadata with group, role, priority,
owner, token references, and the encoding that produced them. Token bindings
record the exact paint properties that must not drift from this contract.

## Validation

Validate with the companion profile and the full style:

```bash
cartographymd lint CARTOGRAPHY.md --profile DATA_PROFILE.json --style style.json
```

Fixtures cover dense urban, sparse suburban, null-and-unknown attributes,
mobile and desktop viewports, and light mode.

## Do's and Don'ts

Do keep new governed colors as tokens lifted from the rendered style. Do
extend governance layer by layer with an encoding plus metadata. Don't recolor
governed layers without updating the token and the profile. Don't treat absent
`brunnel` or `intermittent` attributes as categories.
