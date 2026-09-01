---
name: cartography-md
description: Use when applying a CARTOGRAPHY.md design system to cartographic work across datasets, tasks, or renderers.
---

# cartography.md agent skill

Use this skill when a repository contains `CARTOGRAPHY.md` or when work should follow a reusable cartographic design system.

## Required workflow

1. Locate and read the complete `CARTOGRAPHY.md`, including YAML front matter and every Markdown section.
2. Run `cartographymd lint CARTOGRAPHY.md` and resolve blocking document findings before applying the system.
3. Identify the stable visual identity, token vocabulary, and guidance in the nine standard chapters: Overview; Colors; Typography & Labels; Composition & Density; Layering & Depth; Geometry & Symbols; Scale & Generalization; Map Elements; and Do's and Don'ts.
4. Read the user's current task and any available runtime data context without writing those facts back into `CARTOGRAPHY.md`.
5. Resolve every root-based reference (for example, `{colors.ink}`) to its declared value before applying that value.
6. Preserve the underlying semantic meaning when adding selection, hover, alert, invalid, or quality emphasis.
7. Use target-specific tools only outside the core contract, and verify their outputs with the tools appropriate to that target.
8. Report unresolved runtime facts separately from `CARTOGRAPHY.md` lint findings.

## Boundaries

`CARTOGRAPHY.md` holds stable visual guidance. Do not alter it to record a one-off task, observed data fields, runtime assumptions, or target-specific details.

Document lint checks only the document's structure and deterministic internal relationships. A passing lint result is not validation of runtime data, a target format, rendered output, or task suitability. Verify those concerns separately in the environment that owns them.

## Runtime facts

Do not invent unavailable runtime facts. State what is known, what remains unresolved, and what information or target-specific verification would resolve it. Keep these runtime observations separate from the reusable design system.
