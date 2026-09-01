import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';

function document(colors: string, extra = '') {
  return `---\nversion: "0.3.0"\nname: Color test\ncolors:\n${colors}\n${extra}---\n\n## Overview\n\nColor test.\n`;
}

describe('design tokens', () => {
  it('accepts CSS Color 4 including oklch', () => {
    expect(lint(document('  accent: "oklch(62% 0.18 250)"')).findings.some((finding) => finding.ruleId === 'color-token')).toBe(false);
  });
  it('rejects invalid CSS colors', () => {
    expect(lint(document('  accent: "definitely-not-a-color"')).findings).toContainEqual(expect.objectContaining({ruleId: 'color-token'}));
  });
  it.each(['currentColor', 'Canvas', 'var(--ink)'])('rejects non-core colors: %s', (color) => {
    expect(lint(document(`  accent: "${color}"`)).findings).toContainEqual(expect.objectContaining({ruleId: 'color-token'}));
  });
  it('accepts cross-group references with matching resolved types', () => {
    const report = lint(`---
version: "0.3.0"
name: Resolved token types
custom:
  css: "#24303A"
  dimension: "2px"
colors:
  ink: "{custom.css}"
widths:
  line: "{custom.dimension}"
---

## Overview

Resolved token types.
`);
    expect(report.findings.filter((finding) => ['color-token', 'known-token-type'].includes(finding.ruleId))).toEqual([]);
  });
  it('reports wrong resolved types as known-token-type', () => {
    const report = lint(document('  ink: "{custom.bad}"', 'custom:\n  bad: 42\nwidths:\n  line: "{custom.bad}"\n'));
    expect(report.findings.some((finding) => finding.ruleId === 'known-token-type')).toBe(true);
  });
  it('rejects color references resolving to non-string values', () => {
    const report = lint(document('  ink: "{custom.bad}"', 'custom:\n  bad: 42\n'));
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'color-token', path: 'colors.ink'}));
  });
  it('enforces element property types after reference resolution', () => {
    const report = lint(document('  ink: "#111111"', 'widths:\n  thin: "1px"\nelements:\n  road:\n    geometry: line\n    strokeWidth: "{colors.ink}"\n  river:\n    geometry: line\n    strokeWidth: "{widths.thin}"\n'));
    const findings = report.findings.filter((finding) => finding.ruleId === 'known-token-type');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.path).toBe('elements.road.strokeWidth');
  });
  it('leaves broken and cyclic references to token-reference alone', () => {
    const report = lint(document('  ink: "{custom.missing}"', 'custom:\n  a: "{custom.b}"\n  b: "{custom.a}"\nwidths:\n  line: "{custom.a}"\n'));
    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
    expect(report.findings.some((finding) => ['color-token', 'known-token-type'].includes(finding.ruleId))).toBe(false);
  });
  it('summarizes leaves and root groups', () => {
    expect(lint(document('  accent: "#000"')).findings).toContainEqual(expect.objectContaining({ruleId: 'contract-summary', message: 'Loaded 1 token leaves across 1 token groups and 1 prose sections.'}));
  });
});
