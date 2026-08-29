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

  it.each([
    ['foreground', 'rgb(0 0 0 / 50%)', '#ffffff'],
    ['background', '#000000', 'transparent'],
  ])('requires an opaque resolved %s before WCAG 2.1 contrast', (_channel, foreground, background) => {
    const report = lint(docWithContrast(foreground, background, 1));

    expect(report.findings).toContainEqual(expect.objectContaining({
      ruleId: 'contrast-pairs',
      severity: 'error',
      message: expect.stringContaining('rendered compositing'),
    }));
  });

  it('accepts cross-group references whose resolved values match the known token type', () => {
    const report = lint(`---
version: "0.2.0"
name: Resolved token types
tokens:
  custom:
    css: "#24303A"
    dimension: "2px"
    opacity: 0.6
    typography:
      fontFamily: "Noto Sans"
      fontSize: "12px"
      fontWeight: 600
  colors:
    ink: "{tokens.custom.css}"
  widths:
    line: "{tokens.custom.dimension}"
  sizes:
    symbol: "{tokens.custom.dimension}"
  opacities:
    context: "{tokens.custom.opacity}"
  typography:
    label: "{tokens.custom.typography}"
---

## Overview

Resolved token types.
`);

    expect(report.findings.filter((finding) =>
      finding.ruleId === 'color-token' || finding.ruleId === 'known-token-type'
    )).toEqual([]);
  });

  it('rejects known tokens whose resolved values have the wrong type', () => {
    const report = lint(`---
version: "0.2.0"
name: Invalid resolved token types
tokens:
  custom:
    color: 42
    dimension: -1
    opacity: 1.5
    typography: "#ffffff"
  colors:
    ink: "{tokens.custom.color}"
  widths:
    line: "{tokens.custom.dimension}"
  sizes:
    symbol: "{tokens.custom.dimension}"
  opacities:
    context: "{tokens.custom.opacity}"
  typography:
    label: "{tokens.custom.typography}"
---

## Overview

Invalid resolved token types.
`);

    expect(report.findings).toContainEqual(expect.objectContaining({
      ruleId: 'color-token',
      path: 'tokens.colors.ink',
    }));
    expect(report.findings.filter((finding) => finding.ruleId === 'known-token-type').map((finding) => finding.path)).toEqual(
      [
        'tokens.widths.line',
        'tokens.sizes.symbol',
        'tokens.opacities.context',
        'tokens.typography.label',
      ].sort(),
    );
  });

  it('leaves broken and cyclic references to the token-reference rule alone', () => {
    const report = lint(`---
version: "0.2.0"
name: Broken references
tokens:
  custom:
    cycle-a: "{tokens.custom.cycle-b}"
    cycle-b: "{tokens.custom.cycle-a}"
  colors:
    ink: "{tokens.custom.missing}"
  widths:
    line: "{tokens.custom.cycle-a}"
---

## Overview

Broken references.
`);

    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
    expect(report.findings.some((finding) => finding.ruleId === 'color-token')).toBe(false);
    expect(report.findings.some((finding) => finding.ruleId === 'known-token-type')).toBe(false);
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
