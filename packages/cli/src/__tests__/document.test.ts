import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';
import {normalizeHeading} from '../parser/sections.js';
import {getAtPath, resolveReferencesDeep} from '../utils/object.js';

const base = `---
version: "0.2.0"
name: Reference test
tokens:
  colors:
    ink: "#25221D"
---

## Overview

Quiet.
`;

describe('document validation', () => {
  it('allows inline references in prose but not YAML scalars', () => {
    const prose = lint(base.replace('Quiet.', 'Use {tokens.colors.ink} for labels.'));
    const yaml = lint(base.replace('ink: "#25221D"', 'ink: "prefix-{tokens.colors.paper}"'));

    expect(prose.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
    expect(yaml.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
  });

  it('reports a broken inline prose reference', () => {
    const report = lint(base.replace('Quiet.', 'Use {tokens.colors.missing}.'));

    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'token-reference'}));
  });

  it('normalizes new Chinese aliases', () => {
    expect(normalizeHeading('比例尺与制图综合')).toBe('Scale & Generalization');
    expect(normalizeHeading('层叠与构图')).toBe('Layering & Composition');
    expect(normalizeHeading('评审原则')).toBe('Review Principles');
  });

  it.each([
    ['unknown root', 'unexpected: .nan', 'unexpected'],
    ['extensions', 'extensions:\n  sample: .inf', 'extensions.sample'],
    ['unknown token group', 'tokens:\n  custom:\n    sample: -.inf', 'tokens.custom.sample'],
  ])('rejects non-finite YAML numbers in %s', (_name, yaml, path) => {
    const report = lint(`---\nversion: "0.2.0"\nname: Finite test\n${yaml}\n---\n\n## Overview\n\nFinite.\n`);

    expect(report.findings).toContainEqual(expect.objectContaining({
      ruleId: 'yaml-non-finite-number-prohibited',
      path,
      severity: 'error',
    }));
    expect(report).not.toHaveProperty('cartography');
    expect(report).not.toHaveProperty('resolved');
  });

  it('does not resolve token paths through the object prototype chain', () => {
    const report = lint(`---
version: "0.2.0"
name: Prototype test
tokens:
  custom:
    inheritedToString: "{toString}"
    inheritedConstructor: "{constructor}"
    inheritedPrototype: "{__proto__}"
---

## Overview

Prototype test.
`);

    for (const path of ['toString', 'constructor', '__proto__']) {
      expect(report.findings).toContainEqual(expect.objectContaining({
        ruleId: 'token-reference',
        message: `Broken token reference {${path}}.`,
      }));
    }
    const resolved = report.resolved as {tokens: {custom: Record<string, unknown>}};
    expect(Object.values(resolved.tokens.custom).every((value) => typeof value === 'string')).toBe(true);
  });

  it.each([
    'tokens..colors.ink',
    '.tokens.colors.ink',
    'tokens.colors.ink.',
    'tokens.colors[ink]',
    'tokens.colors.ink[]',
    'tokens.colors.ink[ ]',
    'tokens.colors.ink[+1]',
    'tokens.colors.ink[-1]',
    'tokens.colors.ink[a/b]',
    'tokens.colors.ink[0',
    'tokens.colors.ink]',
    'tokens.colors.ink[[0]]',
    'tokens.colors.ink[0]tail',
    'tokens.colors.[0]',
  ])('rejects malformed token path grammar in YAML and prose: %s', (reference) => {
    const yaml = lint(base.replace('ink: "#25221D"', `ink: "{${reference}}"`));
    const prose = lint(base.replace('Quiet.', `Use {${reference}} for labels.`));

    for (const report of [yaml, prose]) {
      expect(report.findings).toContainEqual(expect.objectContaining({
        ruleId: 'token-reference',
        message: `Invalid token reference path {${reference}}.`,
      }));
    }
  });

  it('does not treat ordinary prose or code braces as token references', () => {
    const report = lint(base.replace('Quiet.', `Objects may look like { color: red; } or {left + right}.
Inline code may contain \`{left[0] + right[0]}\`.

\`\`\`js
const style = {color: '#25221D'};
\`\`\``));

    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
  });

  it('ignores reviewer indexing examples in inline code, JSX, and plain expressions', () => {
    const report = lint(base.replace('Quiet.', `Advance with \`{items[index + 1]}\` when another item exists.

Render <Item>{items[index + 1]}</Item>, evaluate {items[index + 1]}, and retain {items[0]} as ordinary code.`));

    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
  });

  it('scans visible references while ignoring Markdown code and HTML comments', () => {
    const report = lint(base.replace('Quiet.', `Use {tokens.colors.ink} in visible prose.

Ignore \`{tokens.colors.missing}\` and \`\`{tokens.colors.ink[ ]}\`\` inline.

\`\`\`js
const color = '{tokens.colors.missing}';
const next = {items[index + 1]};
\`\`\`

~~~jsx
<Item>{tokens.colors.ink[+1]}</Item>
~~~

<!-- Ignore {tokens.colors.missing}
and {tokens.colors.ink[a/b]} here. -->`));

    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
  });

  it('accepts dotted and hyphenated names with numeric bracket indices', () => {
    const report = lint(`---
version: "0.2.0"
name: Path grammar
tokens:
  custom:
    palette:
      - "#25221D"
    hyphen-name: "{tokens.custom.palette[0]}"
---

## Overview

Use {tokens.custom.palette[0]} consistently.
`);

    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(false);
    expect((report.resolved as {tokens: {custom: {'hyphen-name': string}}}).tokens.custom['hyphen-name']).toBe('#25221D');
  });

  it('never resolves or materializes inherited sparse array indices', () => {
    const inheritedIndex = 19_937;
    const inheritedValue = 'must-not-resolve';
    const previous = Object.getOwnPropertyDescriptor(Array.prototype, inheritedIndex);
    Object.defineProperty(Array.prototype, inheritedIndex, {
      configurable: true,
      writable: true,
      value: inheritedValue,
    });
    try {
      const values = new Array(inheritedIndex + 1);
      const root = {
        tokens: {custom: {values}},
        selected: `{tokens.custom.values[${inheritedIndex}]}`,
      };

      expect(getAtPath(root, `tokens.custom.values[${inheritedIndex}]`)).toEqual({found: false});
      const resolved = resolveReferencesDeep(root) as typeof root;
      expect(resolved.selected).toBe(root.selected);
      expect(Object.hasOwn(resolved.tokens.custom.values, inheritedIndex)).toBe(false);
    } finally {
      if (previous) Object.defineProperty(Array.prototype, inheritedIndex, previous);
      else delete Array.prototype[inheritedIndex];
    }
  });

  it.each([
    ['backtick', '```'],
    ['tilde', '~~~'],
  ])('ignores canonical headings inside a %s fence', (_name, fence) => {
    const report = lint(`---
version: "0.2.0"
name: Fence test
---

## Overview

Before.

${fence}md
## Color
Inside code.
${fence}

## Color

Real color guidance.
`);

    expect(report.sections).toEqual(['Overview', 'Color']);
    expect(report.findings.some((finding) => finding.ruleId === 'duplicate-section')).toBe(false);
  });

  it('ignores headings inside HTML comments and finds the real heading after them', () => {
    const report = lint(`---
version: "0.2.0"
name: Comment test
---

## Overview

Before.

<!--
## Color
Hidden.
-->

## Color

Real color guidance.
`);

    expect(report.sections).toEqual(['Overview', 'Color']);
    expect(report.findings.some((finding) => finding.ruleId === 'duplicate-section')).toBe(false);
  });

  it('preserves repeated unknown headings without reporting canonical duplicates', () => {
    const report = lint(`---
version: "0.2.0"
name: Notes test
---

## Overview

Overview.

## Notes

First.

## Notes

Second.
`);

    expect(report.sections).toEqual(['Overview', 'Notes', 'Notes']);
    expect(report.findings.some((finding) => finding.ruleId === 'duplicate-section')).toBe(false);
  });

  it('reports unknown, duplicate, and present omitted canonical sections', () => {
    const report = lint(`---
version: "0.2.0"
name: Omitted test
omitted:
  - Unknown section
  - Color
  - 颜色
  - Overview
---

## Overview

Overview.
`);

    const findings = report.findings.filter((finding) => finding.ruleId === 'omitted-sections');
    expect(findings).toHaveLength(3);
    expect(findings.map((finding) => finding.path)).toEqual([
      'omitted.0',
      'omitted.2',
      'omitted.3',
    ]);
  });
});
