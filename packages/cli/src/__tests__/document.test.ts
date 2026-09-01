import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';
import {canonicalSectionName} from '../parser/sections.js';
import {getAtPath, resolveReferencesDeep} from '../utils/object.js';

const base = `---
version: "0.3.0"
name: Reference test
colors:
  ink: "#25221D"
elements:
  road-primary:
    geometry: line
    strokeWidth: "2px"
---

## Overview

Quiet.
`;

function tokenFindings(text: string) {
  return lint(text).findings.filter((finding) => finding.ruleId === 'token-reference');
}

describe('document validation', () => {
  it('allows inline references in prose but not YAML scalar substrings', () => {
    expect(tokenFindings(base.replace('Quiet.', 'Use {colors.ink} for labels.'))).toEqual([]);
    expect(tokenFindings(base.replace('ink: "#25221D"', 'ink: "prefix-{colors.paper}"'))).toEqual([]);
  });
  it('reports broken visible prose references', () => {
    expect(tokenFindings(base.replace('Quiet.', 'Use {colors.missing}.'))).not.toEqual([]);
  });
  it('reports broken references in the preamble before the first heading', () => {
    const findings = tokenFindings(base.replace('\n## Overview', '\nBroken {colors.missing}.\n\n## Overview'));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(12);
  });
  it('reports broken references inside unknown heading text', () => {
    const findings = tokenFindings(base.replace('Quiet.', 'Quiet.\n\n## Notes {colors.missing}\n\nText.'));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(16);
  });
  it('resolves valid references inside heading text', () => {
    expect(tokenFindings(base.replace('## Overview', '## Overview {colors.ink}'))).toEqual([]);
  });
  it('normalizes current Chinese section aliases', () => {
    expect(canonicalSectionName('比例尺与制图综合')).toBe('Scale & Generalization');
    expect(canonicalSectionName('层级与深度')).toBe('Layering & Depth');
    expect(canonicalSectionName('地图要素')).toBe('Map Elements');
  });
  it('rejects a bare invalid reference through schema validation', () => {
    const report = lint(base.replace('ink: "#25221D"', 'ink: "{toString}"'));
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'schema'}));
  });
  it('does not treat ordinary braces or code as references', () => {
    const report = lint(base.replace('Quiet.', 'Objects { color: red } and `{items[0]}` are examples.'));
    expect(report.findings.filter((finding) => finding.ruleId === 'token-reference')).toEqual([]);
  });
  it('ignores inline code JSX and expressions containing index examples', () => {
    const report = lint(base.replace('Quiet.', '`{items[index + 1]}` <Item>{items[index + 1]}</Item>'));
    expect(report.findings.filter((finding) => finding.ruleId === 'token-reference')).toEqual([]);
  });
  it('treats reference-shaped visible prose as a reference that must resolve', () => {
    const report = lint(base.replace('Quiet.', 'A plain {items[0]} expression is reference syntax.'));
    expect(report.findings.filter((finding) => finding.ruleId === 'token-reference')).toHaveLength(1);
  });
  it('masks fences and HTML comments', () => {
    const report = lint(base.replace('Quiet.', '```js\n{colors.missing}\n```\n<!-- {colors.missing} -->'));
    expect(report.findings.filter((finding) => finding.ruleId === 'token-reference')).toEqual([]);
  });
  it('treats comment openers inside inline code literally', () => {
    const findings = tokenFindings(base.replace('Quiet.', '`<!--` visible {colors.missing}'));
    expect(findings).toHaveLength(1);
  });
  it('treats comment openers in fence info literally and resumes after closing', () => {
    const findings = tokenFindings(base.replace('Quiet.', '```jsx <!-- literal\n{colors.missing}\n```\n{colors.missing}'));
    expect(findings).toHaveLength(1);
  });
  it('accepts dotted hyphenated names and numeric indices', () => {
    const report = lint(base.replace('Quiet.', 'Use {elements.road-primary.strokeWidth}; {symbols.facility.fallbacks[0]}.').replace('elements:\n', 'symbols:\n  facility:\n    fallbacks: ["ok"]\nelements:\n'));
    expect(report.findings.filter((finding) => finding.ruleId === 'token-reference')).toEqual([]);
  });
  it('does not materialize sparse inherited array indices', () => {
    const values = new Array(3);
    const root = {symbols: {values}, selected: '{symbols.values[2]}'};
    expect(getAtPath(root, 'symbols.values[2]')).toMatchObject({found: false});
    expect((resolveReferencesDeep(root) as typeof root).selected).toBe(root.selected);
    expect(Object.hasOwn(values, 2)).toBe(false);
  });
  it('ignores headings in HTML comments and finds following real headings', () => {
    const report = lint(base.replace('Quiet.', '<!--\n## Colors\n-->\n\n## Colors\n\nActual.'));
    expect(report.sections).toContain('Colors');
    expect(report.findings.some((finding) => finding.ruleId === 'duplicate-section')).toBe(false);
  });
  it('does not report duplicate unknown headings', () => {
    const report = lint(base.replace('Quiet.', '## Notes\n\nA\n\n## Notes\n\nB'));
    expect(report.findings.some((finding) => finding.ruleId === 'duplicate-section')).toBe(false);
  });
  it('reports unknown duplicate and present omitted sections', () => {
    const report = lint(base.replace('---\n\n## Overview', 'omitted:\n  - Unknown\n  - Colors\n  - 颜色\n  - Overview\n---\n\n## Overview'));
    expect(report.findings.filter((finding) => finding.ruleId === 'omitted-sections')).toHaveLength(3);
  });
});
