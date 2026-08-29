import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';

function docWithColors(colors: Record<string, string>): string {
  const lines = Object.entries(colors).map(([name, value]) => `    ${name}: ${JSON.stringify(value)}`).join('\n');
  return `---\nversion: "0.2.0"\nname: Color test\ntokens:\n  colors:\n${lines}\n---\n\n## Overview\n\nColor test.\n`;
}

function docWithContrast(foreground: string, background: string, minimum: number): string {
  return `---
version: "0.2.0"
name: Contrast test
tokens:
  colors:
    foreground: ${JSON.stringify(foreground)}
    background: ${JSON.stringify(background)}
accessibility:
  contrastPairs:
    - id: declared-pair
      foreground: "{tokens.colors.foreground}"
      background: "{tokens.colors.background}"
      minimum: ${minimum}
      kind: text
---

## Overview

Contrast test.
`;
}

describe('generic design tokens', () => {
  it('accepts CSS Color 4 independently of any renderer', () => {
    const report = lint(docWithColors({accent: 'oklch(62% 0.18 250)'}));
    expect(report.findings.some((finding) => finding.ruleId === 'color-token')).toBe(false);
  });

  it('rejects an invalid CSS color', () => {
    const report = lint(docWithColors({accent: 'definitely-not-a-color'}));
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'color-token', severity: 'error'}));
  });

  it('checks declared WCAG 2.1 pairs', () => {
    const report = lint(docWithContrast('#777777', '#777777', 4.5));
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'contrast-pairs'}));
  });

  it('summarizes token leaves, groups, and prose sections', () => {
    const report = lint(docWithColors({accent: '#000000'}));
    expect(report.findings).toContainEqual(expect.objectContaining({
      ruleId: 'contract-summary',
      severity: 'info',
      message: 'Loaded 1 token leaves across 1 token groups and 1 prose sections.',
    }));
  });
});
