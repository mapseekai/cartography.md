---
version: "0.2.0"
name: Quiet Atlas
description: "A restrained editorial atlas family for clear orientation and unhurried reading."
locale: en
tokens:
  colors:
    paper: "#f8f4f0"
    water: "#aecfe2"
    waterway: "#a0c8f0"
    building: "#dfdbd7"
    road-warm: "#ffeeaa"
    road-amber: "#ffcc88"
    ink: "#000000"
accessibility:
  contrastPairs:
    - id: ink-on-paper
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.paper}"
      minimum: 4.5
      kind: text
    - id: water-on-paper
      foreground: "{tokens.colors.water}"
      background: "{tokens.colors.paper}"
      minimum: 1.2
      kind: graphic
---

## Overview

Quiet Atlas is a restrained editorial map family: warm paper, pale blue water,
and near-black ink make the page feel calmly printed rather than brightly
screen-lit. It favors pauses, generous margins, and a small set of durable
signals that let a reader settle into an unfamiliar place.

## Intent & Audience

This family supports orientation, place reading, and explanatory storytelling
for readers who value a composed reference image beneath their own subject
matter. Its long-lived role is to make geographic context legible without
turning every available detail into a competing headline.

## Visual Hierarchy

Paper is the quiet ground. Water and built texture establish context; warm
routes guide movement; inked names and the reader's active focus carry the
strongest attention. Reserve the deepest contrast for essential names and
meaningful change, so ordinary context can remain present without becoming
insistent.

## Color

Use {tokens.colors.paper} as the warm, low-glare canvas and
{tokens.colors.water} as the dominant cool counterweight. Let
{tokens.colors.road-warm} and {tokens.colors.road-amber} supply a closely
related, sparing navigation accent; do not introduce loud unrelated hues.
{tokens.colors.ink} is precious: it anchors names, key boundaries, and
decisive editorial marks rather than broad decoration.

## Typography & Labels

Typography should feel measured, literate, and quietly contemporary. Names
form a small, consistent hierarchy with sufficient breathing room; prefer
fewer well-placed names to an unbroken run of text. A light surrounding
buffer may protect important names over variable context, but never becomes a
visible badge or a second voice.

## Geometry & Symbols

Favor slender, deliberate linework; soft, low-contrast areas; and compact
marks with unambiguous silhouettes. Curves should read as calm gestures, not
technical traces. Repeated symbols belong to one family of optical weight, and
texture is used only when it clarifies an area without reducing the paper's
quiet.

## Scale & Generalization

At broad reading distances, preserve the large spatial story and remove
incidental detail. As the reader comes closer, reveal local structure in a
steady rhythm, simplifying curves, clustering nearby marks, and protecting
names from collisions. Each stage should feel like the same atlas becoming
more articulate, never a different visual system.

## Layering & Composition

Compose the map from a quiet ground through contextual forms to routes, names,
and active emphasis. Protect open paper around important names and across
large calm areas. When density rises, reduce secondary texture before crowding
the focal marks; visual breathing room is part of the information design.

## Interaction States

Hover is a light acknowledgement that preserves the underlying role. Selection
adds a clear, durable emphasis without erasing surrounding context. Alert and
invalid states use both shape or pattern and a reserved accent so they remain
distinguishable without relying on color alone. No temporary state may make a
routine element appear more important than an active selection.

## Accessibility

Ink-on-paper maintains the declared text contrast, and water-on-paper remains
perceptible as a broad graphic relationship. Important distinctions are
repeated through weight, outline, pattern, placement, or wording rather than
hue alone. Keep essential names readable at small physical sizes and leave
enough separation for readers with reduced color discrimination.

## Review Principles

Review the family at both distant and close reading distances: first for the
spatial story, then for names, density, and moments of emphasis. Ask whether
the palette still feels like one quiet printed world, whether the reader can
find the focal information quickly, and whether any added detail has earned
its attention. Treat restraint as a positive decision, not unfinished work.

## Do's and Don'ts

Do preserve the paper-water-ink relationship and spend warm accents sparingly.
Do make active states clear while retaining their original meaning. Don't fill
every empty area with texture or labels. Don't use pure decorative color,
heavy outlines, or competing type voices to manufacture energy.
