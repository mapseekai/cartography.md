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
});
