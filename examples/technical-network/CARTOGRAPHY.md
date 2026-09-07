---
version: "0.4.0"
name: Technical Network
colors:
  canvas: "#F4F6F8"
  ink: "#183247"
  context: "#8796A2"
  primary: "#236A85"
  critical: "#A32828"
  selection: "#172C65"
widths:
  primary: 4px
  secondary: 2px
  overview: 2px
  regional: 3px
  detail: 5px
  casing: 1px
  outline: 1px
sizes:
  valve: 10px
  facility: 14px
spacing:
  label-gap: 3px
dashes:
  critical: [4px, 2px]
typography:
  technical:
    fontFamily: ["Noto Sans", "sans-serif"]
    fontSize: 12px
    fontWeight: 600
elements:
  pipeline-primary:
    geometry: line
    family: pipeline
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.primary}"
    strokeWidth: "{widths.primary}"
    casingColor: "{colors.canvas}"
    casingWidth: "{widths.casing}"
  pipeline-secondary:
    geometry: line
    family: pipeline
    role: secondary
    layerRole: subject
    strokeColor: "{colors.primary}"
    strokeWidth: "{widths.secondary}"
  pipeline-primary-selected:
    geometry: line
    family: pipeline
    role: primary
    state: selected
    layerRole: subject
    strokeColor: "{colors.primary}"
    strokeWidth: "{widths.primary}"
    casingColor: "{colors.selection}"
    casingWidth: "{widths.casing}"
  pipeline-primary-critical:
    geometry: line
    family: pipeline
    role: primary
    state: critical
    layerRole: subject
    strokeColor: "{colors.critical}"
    strokeWidth: "{widths.primary}"
    dash: "{dashes.critical}"
  pipeline-primary-critical-selected:
    geometry: line
    family: pipeline
    role: primary
    state: critical-selected
    layerRole: subject
    strokeColor: "{colors.critical}"
    strokeWidth: "{widths.primary}"
    dash: "{dashes.critical}"
    casingColor: "{colors.selection}"
    casingWidth: "{widths.casing}"
  valve:
    geometry: point
    family: technical-symbol
    role: primary
    layerRole: subject
    symbol: circle
    size: "{sizes.valve}"
    fillColor: "{colors.canvas}"
    outlineColor: "{colors.ink}"
    outlineWidth: "{widths.outline}"
  facility:
    geometry: point
    family: technical-symbol
    role: reference
    layerRole: subject
    symbol: square
    size: "{sizes.facility}"
    color: "{colors.ink}"
  technical-label:
    geometry: label
    family: network-label
    role: primary
    layerRole: annotation
    color: "{colors.ink}"
    typography: "{typography.technical}"
    spacing: "{spacing.label-gap}"
  context-line:
    geometry: line
    family: context
    role: context
    layerRole: context
    strokeColor: "{colors.context}"
    strokeWidth: 0.5px
---

## Overview

Technical Network favors precise continuity, distinct junction silhouettes and
readable operational states. Network structure and risk take priority over terrain.

## Colors

Blue carries ordinary network structure; red and dash jointly carry critical
meaning. Deep blue casing adds selection without replacing risk. Pale background
and subdued context must never compete with these channels.

## Typography & Labels

Use technical-label for essential identifiers supplied by the current task.
Keep a {spacing.label-gap} edge gap to marks. Remove secondary labels before
critical identifiers; shorten supporting text before reducing nominal font size.

## Composition & Density

In dense networks, reduce context and secondary labels first. Preserve junction
separation and critical continuity; do not fabricate topology to create space.

## Layering & Depth

Context recedes beneath network lines; junction symbols remain visible above them.
Annotations must remain attached unambiguously to their intended marks.

## Geometry & Symbols

Valves use circular bodies with diameter {sizes.valve}; facilities use squares
with side {sizes.facility}. Outlines grow outward without changing these sizes.
Primary base casing total width is 6px: a 4px body plus 1px on each side.

## Scale & Generalization

Local is the base stage for all components. All primary pipeline variants use
{widths.overview}, {widths.regional}, {widths.primary}, {widths.detail} at
overview, regional, local, detail respectively. Hide secondary pipelines at
overview; otherwise retain their base width. Show facilities at all stages,
valves at local/detail, and only critical identifiers at overview/regional.
Keep other visible values at baseline. Smooth adjacent transitions are optional;
report discrete switching. Primary never falls below secondary, critical never
below context, and selection never removes risk color or dash.

## Map Elements

Pipeline roles describe structural importance, not measured flow or risk.
Valve and facility are representative technical symbols, not dataset bindings.
Use them only when their silhouettes retain that meaning; do not use a facility
square as a generic quantitative point. Existing critical-selected explicitly
retains critical color/dash and adds selection casing. Combined names are opaque,
not instructions to merge. Semantic state outranks feedback and decoration;
hover must not override selection. Unsupported states require a reported task
adaptation and must not silently become new permanent components.

## Do's and Don'ts

Preserve risk with both color and dash. Keep point-line junctions coherent.
Do not substitute ordinary selection color for critical red or hide critical
marks under context. If casing or dash cannot be reproduced, report the chosen
substitute and lost distinction, then inspect the rendered state combinations.
