# Philosophy

cartography.md treats a map design system as persistent visual identity, not as a temporary production recipe. A `CARTOGRAPHY.md` should remain useful when the current task, dataset, toolchain, and output change.

中文版：[PHILOSOPHY.zh-CN.md](PHILOSOPHY.zh-CN.md)

## Prose carries the design

Professional cartographic judgment cannot be reduced to a property list. The document's Markdown should describe a vivid, recognizable visual world: what feels quiet or urgent, what earns attention, how density is managed, which tradeoffs protect comprehension, and what must never be allowed to erode the family character.

Generic adjectives are not enough. “Clean and modern” gives an agent almost no direction; “warm paper, pale water, economical ink, and generous label spacing” establishes a world that can guide many decisions.

## Tokens provide exact context

Tokens exist where precision and reuse matter: colors, typography, widths, sizes, opacities, spacing, and dash rhythms. They give prose one stable vocabulary and keep small values from drifting across repeated applications.

Tokens are context for design judgment, not instructions for a particular production target. Every reference must resolve inside the same document, and resolution must not change a value's type. When an exact value and prose disagree in a way a tool can determine, the token is authoritative and the contradiction should be reported.

## Elements compose tokens into components

A vocabulary alone is not a style. Elements assemble tokens into reusable cartographic components: the primary line, the context label, the quiet area. `family`, `role`, and `state` let one idea keep several coordinated expressions without inventing a new name for every variant.

Elements stay design intent. They never record a dataset field, a layer identifier, or a renderer property; mapping to real data and real targets belongs to external data profiles and adapters, decided per task and per renderer.

## Identity survives changing content

A durable design system describes relationships rather than current inventory. It says which semantic roles are quiet, contextual, focal, selected, or alarming without recording today's field names or object list. This lets the same visual family meet unfamiliar content without pretending that unknown facts are already understood.

Agents must preserve semantic meaning while applying the identity. Emphasis may make a selection easier to find, but it must not turn an ordinary object into a warning or erase the distinction between context and focus.

## Hierarchy is the organizing principle

Every visual choice participates in hierarchy. Background, context, subject, focus, and critical state should remain distinguishable through coordinated contrast, weight, size, spacing, and texture. Attention is finite: if everything is emphasized, nothing is.

Composition and layering are therefore described as long-lived relationships, not a list of current objects. The document should explain what yields first when the map becomes dense and which information must retain breathing room.

## Scale is progressive disclosure

Scale behavior should describe recognizable stages of reading — overview, regional, local, detail — without encoding renderer-specific zoom thresholds. At broad distances the design preserves the large spatial story; closer views reveal local structure in a deliberate rhythm. Simplification, clustering, label density, and symbol detail may change while the visual family remains continuous.

The question is not merely what appears or disappears. It is whether each stage still communicates the same hierarchy and identity.

## States preserve underlying meaning

Hover, selection, alert, invalid, and other temporary states are part of the visual language. They should be distinguishable without destroying the base role of the affected object or masking nearby context.

State distinctions should use more than hue when meaning is critical. Shape, outline, pattern, weight, placement, and wording can create redundant cues and keep alerts distinct from selection.

## Inclusive design is a design constraint

Inclusive design belongs to enduring design judgment, not to an afterthought or a machine checklist. Earlier drafts declared contrast pairs for deterministic checking; the current format deliberately keeps contrast and inclusive-design guidance in prose, because the judgments involved — redundant encodings, small-size legibility, density tolerance, critical-state treatment — exceed what a document schema can honestly verify.

State the ambitions in prose: target contrast ratios, fallback cues beyond hue, and degradation strategies when requirements cannot be met. Passing document validation is intentionally narrower than completing accessibility review; real outputs still require evaluation in their actual context.

## Preserve what the core does not understand

The format is open to custom root fields and unknown content, which live beside the standard vocabulary without needing a designated extension point. Parsers and tools should preserve information they do not interpret. Suspected case-only misspellings of standard keys can receive warnings, but unfamiliar content must not be silently discarded merely because the current core has no opinion about it.

This preservation rule lets specialized communities extend the document without forcing every domain concern into the common schema.

## Validate only deterministic internal facts

Core validation is intentionally document-scoped. It can check the restricted YAML profile, the front-matter schema, section structure, reference resolution, resolved token and element property types, and declared omissions. It cannot infer the quality of prose, the truth of current data, task fitness, or the success of a produced artifact.

That boundary keeps findings honest. Automation should be strict where facts are knowable and explicit about where professional review and runtime context begin.
