# Authoring a 0.4.0 design system

Write decisions another author can apply without knowing the original dataset. Give exact tokens in YAML and explain their purpose, limits and relationships in prose. Do not invent reasons when extracting an old style: leave a specific TODO for review.

| Chapter | Question to answer |
|---|---|
| Overview | What makes this map family recognizable? Name its visual priorities and intended reading. |
| Colors | What does each color mean? Which combinations are prohibited? |
| Typography & Labels | Which labels disappear first under crowding, and which must survive? |
| Composition & Density | How do subject, context and open space balance? |
| Layering & Depth | What comes forward, what recedes, and what must not be obscured? |
| Geometry & Symbols | How do points, lines and areas maintain family resemblance? Explain size and spacing conventions. |
| Scale & Generalization | Which stage uses the base expression, what changes, and what remains invariant? |
| Map Elements | Which components represent the design, and when should each be used or avoided? |
| Do's and Don'ts | Which plausible mistakes would destroy the design's identity or meaning? |

For each important component, use these optional subheadings: Purpose; Visual Character; Use When; Avoid When; Scale Behavior; State Behavior; Invariants; Do Not. They are an authoring template, not required format structure. Explain why each visual channel is present. A useful rule is actionable: “remove context labels before orientation names” is more specific than “keep labels readable.”

Keep exact values stable. Declare overview/regional/local/detail substitutions with references to actual tokens, not renderer zoom expressions. Identify permitted changes, visibility and invariant relationships. If smooth transitions are intended, describe them in prose and allow reported stage switching where necessary.

For states, define explicit critical and critical-selected elements. Keep risk color and dash while adding a selection outline or casing; never split combined names or infer inheritance. State the conflict priority: semantic state, then interaction feedback, then decoration. If interaction is not maintained, say so.

For thematic maps, explain qualitative classes without false order, a monotonic sequential direction, and diverging colors only around a meaningful midpoint. Distinguish missing, unknown, zero and not applicable. Explain these in the legend and supply shape, pattern or text as well as color. Suppress context so it cannot compete with the subject. Fields, break algorithms and class thresholds remain in runtime context.

Review four separate results:

- Format validation: schema, types, references, chapters and deterministic boundaries.
- Design review: specific identity, clear hierarchy, component purpose and limits, scale rationale, state conflicts, missing/zero distinction, and redundant channels.
- Target validation: target syntax, required resources and capability warnings; preserve semantic intent and report substitutions/losses.
- Visual review: inspect actual legibility, density, states and accessibility in representative outputs. Record unperformed checks honestly.

See [migration guidance](migrations/0.3-to-0.4.md) and [adapter contracts](adapter-contracts.md).
