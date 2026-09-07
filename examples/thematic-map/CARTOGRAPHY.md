---
version: "0.4.0"
name: Thematic Evidence
colors:
  paper: "#FAF9F5"
  ink: "#202A32"
  category-a: "#357C9D"
  category-b: "#9563A3"
  low: "#DEEBF7"
  medium: "#9ECAE1"
  high: "#3182BD"
  negative: "#B35806"
  neutral: "#F7F7F7"
  positive: "#542788"
  missing: "#C2C2C2"
  unknown: "#E2D4BD"
typography:
  subject:
    fontFamily: ["Noto Sans", "sans-serif"]
    fontSize: 12px
    fontWeight: 600
  context:
    fontFamily: ["Noto Sans", "sans-serif"]
    fontSize: 10px
elements:
  qualitative-a:
    geometry: polygon
    family: qualitative
    role: primary
    fillColor: "{colors.category-a}"
    pattern: sparse-dots
  qualitative-b:
    geometry: polygon
    family: qualitative
    role: primary
    fillColor: "{colors.category-b}"
    pattern: sparse-diagonal
  sequential-low:
    geometry: polygon
    family: sequential
    role: primary
    fillColor: "{colors.low}"
  sequential-medium:
    geometry: polygon
    family: sequential
    role: primary
    fillColor: "{colors.medium}"
  sequential-high:
    geometry: polygon
    family: sequential
    role: primary
    fillColor: "{colors.high}"
  diverging-negative:
    geometry: polygon
    family: diverging
    role: primary
    fillColor: "{colors.negative}"
  diverging-neutral:
    geometry: polygon
    family: diverging
    role: primary
    fillColor: "{colors.neutral}"
  diverging-positive:
    geometry: polygon
    family: diverging
    role: primary
    fillColor: "{colors.positive}"
  missing:
    geometry: polygon
    family: availability
    role: reference
    fillColor: "{colors.missing}"
    pattern: crosshatch
  unknown:
    geometry: polygon
    family: availability
    role: reference
    fillColor: "{colors.unknown}"
    pattern: stipple
  zero:
    geometry: polygon
    family: availability
    role: reference
    fillColor: "{colors.paper}"
    strokeColor: "{colors.ink}"
    strokeWidth: 0.5px
  not-applicable:
    geometry: polygon
    family: availability
    role: reference
    fillColor: "{colors.paper}"
    pattern: diagonal-slash
  subject-label:
    geometry: label
    family: thematic-label
    role: primary
    layerRole: annotation
    color: "{colors.ink}"
    typography: "{typography.subject}"
  context-label:
    geometry: label
    family: thematic-label
    role: context
    layerRole: annotation
    color: "{colors.ink}"
    opacity: 0.55
    typography: "{typography.context}"
---

## Overview

Thematic Evidence gives measured meaning a quiet page and a disciplined legend.
The subject encoding leads; geography supplies orientation without decorative competition.

## Colors

Qualitative hues have comparable visual weight and no implied order; dots and
diagonals distinguish categories without color alone. Do not add endless similar
hues: group or use another channel. Sequential light-to-dark means low-to-high
and must never reverse. Diverging orange/neutral/purple is only for a quantity
with a meaningful neutral point; magnitudes on each side must remain comparable.

## Typography & Labels

Subject labels precede context labels. Drop context names first under crowding.
Use words or signed values in subject labels to reinforce thematic direction;
do not rely on hue to carry an essential distinction.

## Composition & Density

Keep context faint and reserve open space for the legend. Reduce geographic
texture before sacrificing subject clarity. Avoid thematic overplotting that
conflates unavailable values with small or empty features.

## Layering & Depth

Background and reference geography recede below subject areas; subject labels
and the legend remain readable. Context labels must not look like data values.

## Geometry & Symbols

Use sparse, consistent patterns for qualitative categories and visibly distinct
crosshatch/stipple/slash for availability. Keep patterns distinguishable at the
reading size. When unavailable on a target, use explicit text/symbol alternatives
and report lost pattern fidelity, never silent substitution by the lowest color.

## Scale & Generalization

Regional is the base stage. Keep declared token values at all visible stages.
Overview suppresses context labels and simplifies boundaries; local/detail may
reveal context names if they do not compete. Sequence direction, neutral meaning,
availability distinctions and subject-over-context hierarchy remain invariant.

## Map Elements

Choose qualitative for unordered categories, sequential for ordered intensity,
and diverging only around a justified midpoint. Do not combine these into an
unexplained scale. Missing means no observation; unknown means undetermined;
zero is a known zero, not missing or the lowest class; not-applicable is outside
the measure's domain. Label zero explicitly with “0” and availability with words
as needed. This system maintains default states only; selection must preserve
the encoding through a reported task-level outline or annotation adaptation.

## Do's and Don'ts

Explain all categories, sequence direction, neutral point and availability marks
in the legend. Show missing, unknown, zero and not-applicable separately. Keep
classification fields, methods and breakpoints outside this document. Do not
turn unknown into low or present missing as zero. Validate the final legend and
labels on the target, including a view where color alone cannot distinguish them.
