# CARTOGRAPHY.md Format Specification

**Status:** Draft 0.2.0  
**Repository:** `mapseekai/cartography.md`  
**Canonical file name:** `CARTOGRAPHY.md`  
**中文版:** [spec.zh-CN.md](spec.zh-CN.md)

CARTOGRAPHY.md is a self-contained format for preserving a cartographic design system. It combines machine-readable YAML tokens with human-readable Markdown judgment so people and agents can apply one stable visual identity across datasets, subjects, and tasks.

This document is normative unless a passage is explicitly marked informative.

## Purpose

A CARTOGRAPHY.md document records durable visual identity and cartographic judgment:

- the visual world the design should evoke;
- the audience and long-lived contexts it serves;
- the relative prominence of background, context, subject, focus, and critical states;
- exact reusable color, typography, width, size, and opacity values;
- principles for labels, geometry, symbols, scale transitions, composition, interaction states, accessibility, and review.

The document does not record a one-time user request, the fields or sources of a particular dataset, or instructions for a particular output system. Those are operation-time inputs. Core parsing, linting, and diffing accept one CARTOGRAPHY.md document and assess only that document.

## Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** express normative requirement levels.

## Design goals

The format has these goals:

1. **Prose first.** Prose carries design judgment, boundaries, tradeoffs, and exceptions.
2. **Exact context.** Tokens provide reusable values where precision matters.
3. **Portability.** A document remains useful across datasets, subjects, tasks, and output technologies.
4. **Human and agent readability.** The same file supports professional review and agent use.
5. **Determinism.** Equivalent source produces equivalent parsed values and findings.
6. **Open growth.** Named extensions and unknown token groups can preserve project-specific information without changing core meaning.
7. **Honest validation.** A successful lint establishes document-internal validity only.

## Discovery

The canonical file name is `CARTOGRAPHY.md`.

A tool SHOULD use an explicit caller-supplied path when present. Otherwise it MAY search the current directory and then its ancestors for the nearest file with the canonical name. File-name matching SHOULD be case-sensitive on every platform for reproducibility.

A repository MAY contain multiple documents. Unless a tool defines a narrower scope, a document applies to its containing directory and descendants.

## Document structure

A document has exactly two structural layers:

1. YAML front matter delimited by `---` at the beginning of the file;
2. Markdown prose organized with canonical `##` headings.

```md
---
version: "0.2.0"
name: Quiet civic atlas
tokens:
  colors:
    ink: "#24303A"
    canvas: "#F4F1E8"
---

## Overview

An archival civic atlas with warm paper, restrained ink, and one scarce accent.
```

The front matter supplies exact values. The Markdown body explains why those values exist, when they apply, and which relationships an implementation must preserve.

## Deterministic YAML

Front matter MUST use a safe, deterministic YAML subset.

It MAY contain mappings with string keys, sequences, strings, finite numbers, booleans, and `null`. Dates, timestamps, leading-zero values, and ambiguous words SHOULD be quoted.

It MUST NOT contain:

- duplicate mapping keys;
- anchors or aliases;
- merge keys;
- custom tags or executable values;
- tab indentation;
- block scalars;
- implicit environment-variable expansion;
- non-finite numbers.

Long rationale belongs in Markdown. Reusable exact values SHOULD be expressed as named tokens and token references.

## Root schema

The front matter has the following root fields. This table is the complete normative root schema for version 0.2.0.

| Field | Required | Type | Meaning |
|---|---:|---|---|
| `version` | yes | literal `"0.2.0"` | Format version used by the document. |
| `name` | yes | non-empty string | Human-readable name of the design system. |
| `description` | no | string | Concise catalog description. |
| `locale` | no | non-empty string | Primary language or locale of the document. |
| `tokens` | no | `TokenSet` | Open collection of exact reusable design values. |
| `accessibility` | no | `Accessibility` | Explicit document-internal contrast relationships. |
| `omitted` | no | `OmittedSection[]` | Canonical Markdown sections intentionally omitted. |
| `extensions` | no | object | Project-specific structured data with no core semantics. |

Unknown root keys are preserved. A validator MAY warn about them, especially when a key resembles a normative key. Intentional custom data SHOULD be placed under `extensions`, use an `x-` prefix, or use a namespaced key such as `acme:review`.

`version` and `name` are the only required root fields. Version 0.2.0 does not define root fields for operation-time tasks, datasets, output technologies, generated files, or provenance.

## Token types

`tokens` is an open mapping. A document MAY define any additional token group, and consumers MUST preserve unknown groups. The following groups have core validation semantics.

| Group | Value type | Requirements |
|---|---|---|
| `colors` | map of strings | Each value MUST be a non-empty generic CSS color or an exact reference resolving to one. |
| `typography` | map of `TypographyToken` | Each value is an exact reference or an open typography object. |
| `widths` | map of `DimensionToken` | Each value is a non-negative number, a supported dimension string, or an exact reference. |
| `sizes` | map of `DimensionToken` | Each value is a non-negative number, a supported dimension string, or an exact reference. |
| `opacities` | map of numbers or references | Each number MUST be in the inclusive range 0–1. |

These requirements apply after exact reference resolution. A known-group token MAY reference another group when the resolved value matches the destination type. Broken and cyclic references are reported by `token-reference` without a second type finding.

A dimension string is a non-negative decimal followed by `px`, `pt`, `mm`, `cm`, `in`, `em`, `rem`, or `%`.

A typography object is open and MAY contain:

| Field | Type |
|---|---|
| `fontFamily` | non-empty string or non-empty array of non-empty strings |
| `fontSize` | `DimensionToken` |
| `fontWeight` | number from 1 through 1000, or non-empty string |
| `lineHeight` | positive number or `DimensionToken` |
| `letterSpacing` | finite number or non-empty string |

Token names SHOULD describe semantic roles rather than incidental appearance. A strong semantic color SHOULD have one stable meaning. Interaction emphasis SHOULD preserve an underlying business meaning when both must remain visible.

## Token references

A token reference uses the form `{path.to.value}`. Each dot-separated name segment is non-empty and contains letters, numbers, `_`, or `-`; numeric array indexes are attached as `[n]`. Leading, trailing, or repeated dots, empty or non-numeric brackets, and a name joined directly after an index are invalid.

```yaml
tokens:
  colors:
    ink: "#24303A"
    label: "{tokens.colors.ink}"
```

Rules:

1. Every reference MUST resolve within the same front matter.
2. A reference in YAML MUST occupy the entire string.
3. Markdown prose MAY embed references within a sentence.
4. Array indexes such as `[0]` resolve only own numeric array properties; inherited sparse indices are ignored.
5. Broken references and reference cycles are errors.
6. Consumers MUST NOT silently substitute a fallback for an unresolved reference.

## Accessibility

`accessibility.contrastPairs` declares exact color relationships that the core validator can calculate.

```yaml
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
```

Each contrast pair has this shape:

| Field | Required | Type | Meaning |
|---|---:|---|---|
| `id` | yes | non-empty string | Stable identifier for the declared relationship. |
| `foreground` | yes | non-empty string | CSS color or exact reference resolving to a color. |
| `background` | yes | non-empty string | CSS color or exact reference resolving to a color. |
| `minimum` | yes | positive finite number | Minimum WCAG 2.1 contrast ratio. |
| `kind` | no | `text`, `large-text`, or `graphic` | Informative classification of the relationship. |

The object is open, so additional project keys are preserved.

A contrast pair MUST resolve to two fully opaque colors. Transparent or semitransparent values are an error because WCAG 2.1 contrast requires the rendered compositing result. A passing contrast-pair check proves only that the declared opaque color values meet the declared numeric minimum. It does not establish accessibility for every composition, background, scale, state, device, or use context. The Markdown `Accessibility` section MUST carry the broader design judgment.

## Markdown sections

The Markdown body uses the following canonical `##` sections in this order:

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

Their responsibilities are:

| Section | Responsibility |
|---|---|
| `Overview` | Establish a concrete visual world and recognizable family, not a list of generic adjectives. |
| `Intent & Audience` | Describe long-lived contexts and people served by the design system, not a one-time request. |
| `Visual Hierarchy` | Define stable prominence relationships among background, context, subject, focus, and critical states. |
| `Color` | Explain palette roles, scarcity of emphasis, and lightness and saturation tradeoffs. |
| `Typography & Labels` | Define typographic character, label hierarchy, density, conflict handling, and readability. |
| `Geometry & Symbols` | Define the family language for points, lines, areas, textures, patterns, and symbols without binding it to particular data. |
| `Scale & Generalization` | Describe output-independent stages of progressive disclosure and cartographic generalization without numeric view levels. |
| `Layering & Composition` | Explain stacking, whitespace, density, balance, and focal composition without concrete identifiers or ordering values. |
| `Interaction States` | Define visual relationships among hover, selection, alert, invalid, and related states while preserving underlying semantics. |
| `Accessibility` | Cover redundant channels, color vision, contrast, small-screen labels, and critical-state legibility. |
| `Review Principles` | State durable professional review dimensions and questions. |
| `Do's and Don'ts` | Protect the visual family with forceful positive and negative examples. |

English headings and the recognized Chinese aliases normalize to the same canonical names. Unknown `##` sections are preserved. A canonical section MUST NOT appear more than once. Present canonical sections SHOULD follow the order above. An empty canonical section produces a warning. Missing sections produce findings unless declared in `omitted`.

## Omitted sections and extensions

An omitted entry is either a non-empty canonical section name or recognized alias, or an open object with `section` and an optional non-empty `reason` field. After alias normalization, omitted entries MUST be unique and MUST NOT name a canonical section that is present in the Markdown body.

```yaml
omitted:
  - section: Interaction States
    reason: The design system has no interactive use context.
```

Omission is an explicit design decision. A document SHOULD include a reason whenever the absence would otherwise be ambiguous. Omission MUST NOT be used to hide an unresolved decision that affects the design system.

The `extensions` object and unknown token groups are preserved but have no core interpretation. An extension MUST NOT redefine a normative field with incompatible meaning. Unknown Markdown sections are likewise preserved and MUST NOT duplicate a canonical section under an alias.

## Precedence

When instructions conflict, a consumer SHOULD apply this order:

1. applicable safety, legal, and organizational requirements;
2. explicit human constraints for the current operation;
3. exact front-matter values;
4. normative statements in the Markdown body;
5. consumer defaults.

Current-operation constraints do not become durable design-system content automatically. A consumer MUST NOT write task-specific facts into CARTOGRAPHY.md merely to resolve an operation-time need.

When an exact front-matter value conflicts with prose, the exact value wins. A tool MAY report a contradiction when it can do so deterministically, but it MUST NOT pretend to understand every natural-language conflict.

## Agent use

An agent using CARTOGRAPHY.md SHOULD:

1. locate and read the complete document;
2. run the core linter and inspect every finding;
3. resolve exact token references before applying values;
4. understand the design family, audience, hierarchy, and declared exceptions from the prose;
5. combine that stable guidance with the current task and facts supplied at operation time;
6. make the smallest coherent change to the requested deliverable;
7. preserve human-owned work and unresolved meaning;
8. report where professional review or missing facts still matter.

An agent MUST NOT:

- invent data facts or business meanings;
- convert a one-time task into durable front matter;
- treat unknown prose as if it were a deterministic rule;
- claim that a successful lint proves anything beyond document-internal validity;
- overwrite a stable semantic role with a transient interaction state.

## Validator model

The reference linter accepts one source string or one file and returns a structured report:

```ts
interface LintReport {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: FindingSummary;
  cartography?: CartographyConfig;
  resolved?: unknown;
  sections: string[];
  document: {
    path?: string;
    name?: string;
    version?: string;
  };
}
```

A finding has this shape:

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

Normal mode is valid when the report has no errors. Strict mode is valid when it has neither errors nor warnings. Informational findings never block validity.

Ordinary document invalidity is returned as findings. File-access, command-usage, and unexpected internal failures are operational errors.

The command-line exit codes are:

| Code | Meaning |
|---:|---|
| `0` | The operation completed and validation passed under the selected strictness. |
| `1` | Validation completed with blocking findings, or a diff introduced more errors or warnings. |
| `2` | Command usage, file access, or internal execution failed. |

Linting proves only that CARTOGRAPHY.md satisfies its schema and deterministic internal relationships. It does not prove that outside facts are correct, that any generated deliverable is valid, that a current task is satisfied, or that professional cartographic and accessibility review is complete.

The built-in `maxDocumentBytes` check is advisory and runs only after the complete input has been read and parsed; callers must enforce byte or stream limits before passing untrusted input to `lint`, `lintFile`, or standard input.

## Rule catalog

Every built-in rule has document scope.

| Rule ID | Severity | Purpose |
|---|---|---|
| `frontmatter-required` | error | Require a YAML front-matter fence at the beginning of the file. |
| `frontmatter-unclosed` | error | Detect a missing closing front-matter fence. |
| `yaml-syntax` | error | Report YAML syntax errors and duplicate keys. |
| `yaml-alias-prohibited` | error | Reject anchors and aliases. |
| `yaml-custom-tag-prohibited` | error | Reject custom YAML tags. |
| `yaml-merge-key-prohibited` | error | Reject merge keys. |
| `yaml-block-scalar-prohibited` | error | Keep long rationale in Markdown. |
| `yaml-tab-indentation-prohibited` | error | Reject tab indentation in YAML. |
| `yaml-non-finite-number-prohibited` | error | Reject non-finite numbers anywhere in YAML front matter. |
| `schema` | error | Validate the version 0.2.0 front-matter schema. |
| `duplicate-section` | error | Reject duplicate canonical Markdown sections. |
| `document-size` | warning | Report a document larger than the configured byte limit. |
| `omitted-sections` | error | Reject unknown, duplicate, or present canonical section omissions. |
| `required-sections` | warning or info | Report canonical sections that are neither present nor omitted. |
| `empty-section` | warning | Report empty narrative sections. |
| `section-order` | warning | Check canonical section order. |
| `unknown-root-key` | warning | Preserve custom root keys while identifying likely mistakes. |
| `token-reference` | error | Check exact references, embedded YAML references, broken paths, and cycles. |
| `color-token` | error | Validate known color tokens as generic CSS colors. |
| `known-token-type` | error | Validate resolved width, size, opacity, and typography token values. |
| `contrast-pairs` | error | Require opaque colors and calculate declared WCAG 2.1 contrast minimums. |
| `contract-summary` | info | Summarize token leaves, token groups, and prose sections. |
| `rule-execution` | error | Contain an unexpected custom-rule failure as a finding. |

Custom rules MAY replace a built-in rule with the same ID. They SHOULD be deterministic, side-effect free, network independent, and scoped to the document.

## Versioning

The format uses semantic versioning.

- A patch version clarifies wording or makes backward-compatible corrections.
- A minor version may add optional fields, token semantics, sections, or findings.
- A major version may change required structure or existing meaning.

A consumer SHOULD reject an unsupported version rather than silently reinterpret it. The reference schema for this specification accepts the exact literal `"0.2.0"`.

## Minimal example

The following complete document uses every canonical section and passes document-internal validation in normal mode.

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
    accent: "#A33A2B"
  typography:
    label:
      fontFamily: ["Source Sans 3", "sans-serif"]
      fontSize: 12px
      fontWeight: 500
      lineHeight: 1.35
  widths:
    hairline: 0.75px
    emphasis: 2px
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
extensions:
  acme:reviewCycle: annual
---

## Overview

A quiet civic atlas: warm paper, precise dark ink, soft context, and a scarce brick accent.

## Intent & Audience

The system serves broad public audiences who need calm orientation before detailed comparison.

## Visual Hierarchy

Canvas recedes, context supports, the subject leads, and the accent is reserved for decisive focus.

## Color

Lightness establishes order before hue. The brick accent never becomes a general category palette.

## Typography & Labels

Labels are plainspoken and compact, with density reduced before type becomes too small to read.

## Geometry & Symbols

Lines use restrained weight changes; symbols share simple silhouettes and avoid decorative detail.

## Scale & Generalization

The system moves from broad structure to local detail in deliberate stages, preserving identity as detail changes.

## Layering & Composition

Whitespace and soft context frame one primary subject; focus marks sit above but do not erase its meaning.

## Interaction States

Hover is subtle, selection is additive, and critical states retain a redundant cue beyond color.

## Accessibility

Important differences use shape, weight, text, or pattern as well as color and remain legible on small screens.

## Review Principles

Review hierarchy, label collisions, semantic consistency, density, contrast, and honest treatment of uncertainty.

## Do's and Don'ts

Do preserve warm restraint and scarce emphasis. Don't introduce unrelated saturated accents or ornamental symbols.
```

## Final principle

> CARTOGRAPHY.md preserves transferable cartographic identity and durable design judgment. Core tools validate only the document itself; operation-time tasks and facts remain outside the format.
