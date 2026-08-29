import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';
import {normalizeHeading} from '../parser/sections.js';

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
