# cartography.md philosophy
中文版：[PHILOSOPHY.zh-CN.md](PHILOSOPHY.zh-CN.md)

cartography.md exists because a map style is more than a collection of renderer properties. A useful electronic map is a negotiated relationship between purpose, data, scale, perception, interaction, and implementation.

## A style is execution; the contract is intent

MapLibre Style Specification provides a precise language for sources, layers, filters, expressions, paint, and layout. That precision is necessary, but it is downstream of several decisions that are usually left implicit:

- what the map helps a person decide;
- which data is authoritative;
- which distinctions are nominal, ordered, quantitative, uncertain, or critical;
- which objects should dominate at each scale;
- which visual channels carry each meaning;
- how interaction may change emphasis without changing business truth.

`CARTOGRAPHY.md` makes those decisions persistent. The generated `style.json` remains the executable output.

## Machine-readable values and human judgment belong together

Tokens alone cannot explain why danger red is scarce, why a label should disappear before a network segment, or why an uncertainty field should reduce opacity only up to a safe floor. Prose alone cannot guarantee that an agent uses the same color or field name twice.

The format therefore has two equal parts:

- YAML gives agents exact values and relationships;
- Markdown gives agents reasons, exceptions, and conflict-resolution guidance.

Neither replaces the other.

## Data meaning precedes visual treatment

An agent must not infer that a field called `level` is ordered, that a larger number is more dangerous, or that an unknown category is normal. The contract binds semantic roles to actual fields, while `DATA_PROFILE.json` records observed facts such as geometry, domain, units, nullability, zoom availability, density, and stable identifiers.

A cartographic choice is valid only when its data assumptions are valid.

## Visual channels need ownership

Maps often need to show several attributes at once. Without an explicit ownership model, agents repeatedly overload color and produce attractive but unreadable results.

cartography.md treats color, lightness, width, size, opacity, pattern, shape, and casing as limited resources. A channel should have one primary semantic owner. Deliberate combinations must be declared and explained.

Critical meanings may require a second channel so they remain distinguishable under color-vision differences, poor displays, imagery backgrounds, and fast operational use.

## Zoom is part of the design, not an afterthought

An electronic map is not a static poster. The representation may move through hidden, aggregate, simplified, full geometry, label, and editing-detail states as zoom changes. The contract describes these transitions explicitly.

Style-level visibility is not the same as geometric generalization. Simplification, merging, displacement, and topology protection usually belong upstream in data or tile production. The format keeps that boundary honest.

## Selection must not rewrite truth

Interaction is emphasis, not a new business classification. A selected faulty pipe remains faulty. A hovered maintenance asset remains under maintenance. Additive casing, stroke, halo, or controlled width changes are generally safer than replacing the subject color.

The same principle applies to quality flags, validation errors, and permissions: independent meanings should not silently overwrite one another.

## Aesthetics are constrained relationships

“Beautiful” is not a single score. Cartographic quality emerges from hierarchy, figure-ground separation, rhythm, density, balance, restraint, and task fit. These properties are affected by real data and real viewports.

The reference validator checks deterministic preconditions and declared evidence. It does not pretend that a syntax tree can fully judge a rendered map. Render fixtures and human review remain part of conformance.

## Provenance makes agent editing maintainable

Generated and modified layers should say which semantic group, encoding, and token references produced them. Provenance enables small diffs, drift detection, ownership protection, and future agent revisions.

The goal is not to make every layer verbose. The goal is to make important decisions recoverable.

## Unknown content should survive

Organizations will extend the format for industries, security regimes, renderers, and quality gates. Unknown namespaced keys and Markdown sections should be preserved. Tools should warn when they cannot evaluate an extension, but must not erase it.

## Validation is layered

The project separates:

1. document validity;
2. data-contract validity;
3. official MapLibre style validity;
4. cartography.md-to-style consistency;
5. render evidence;
6. task review.

Passing an earlier layer never proves the later layers. A map can be syntactically valid and still be misleading, inaccessible, or visually incoherent.

## The final principle

A durable map style connects four things:

- **tokens** provide exact values;
- **data bindings** provide truth;
- **prose** provides judgment;
- **validation evidence** provides confidence.

cartography.md keeps those four things in one agent-readable contract.
