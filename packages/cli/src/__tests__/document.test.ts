import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';
import {parseCartography} from '../parser/parse.js';

const base = `---
version: "0.1.0"
name: Test map
target:
  renderer: maplibre
  styleSpecVersion: 8
intent:
  mapType: operational
  primaryTask: locate faults
  audience: [operator]
data:
  bindings:
    status: operating_status
zoom:
  bands:
    city: [8, 12]
tokens:
  colors:
    active: "#2F7D5B"
    fault: "#C63D45"
scales: {}
encodings:
  network:
    source: network
    geometry: line
    role: primary
    layerGroup: subject
    rules:
      - id: color
        channel: line-color
        value: "{tokens.colors.active}"
layerOrder:
  - id: subject
    order: 10
---

## Overview

Test.
`;

describe('document validation', () => {
  it('reports broken token references', () => {
    const report = lint(base.replace('{tokens.colors.active}', '{tokens.colors.missing}'));
    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
    expect(report.valid).toBe(false);
  });

  it('rejects embedded token references in version 0.1.0', () => {
    const report = lint(base.replace('{tokens.colors.active}', 'prefix-{tokens.colors.active}'));
    expect(report.findings.some((finding) => finding.ruleId === 'token-reference')).toBe(true);
  });

  it('recognizes Chinese canonical section aliases', () => {
    const parsed = parseCartography(base.replace('## Overview', '## 概述'));
    expect(parsed.sections[0]?.canonicalHeading).toBe('Overview');
  });

  it('makes warnings blocking only in strict mode', () => {
    const normal = lint(base);
    const strict = lint(base, {strict: true});
    expect(normal.summary.errors).toBe(0);
    expect(normal.valid).toBe(true);
    expect(strict.summary.warnings).toBeGreaterThan(0);
    expect(strict.valid).toBe(false);
  });
});

describe('zoom bands', () => {
  const zoomBandsDoc = `---
version: "0.1.0"
name: Zoom bands test
target:
  renderer: maplibre
  styleSpecVersion: 8
intent:
  mapType: reference
  primaryTask: inspect zoom behavior
  audience: [reader]
data:
  bindings: {}
zoom:
  bands:
__BANDS__
tokens:
  colors: {}
scales: {}
encodings: {}
layerOrder:
  - id: base
    order: 10
---

## Overview

Test.
`;

  it('detects overlaps with non-adjacent bands', () => {
    const report = lint(zoomBandsDoc.replace('__BANDS__', '    world: [0, 24]\n    mid: [5, 10]\n    far: [20, 24]'));
    const overlapping = report.findings.filter((finding) => finding.ruleId === 'zoom-bands');
    expect(overlapping.map((finding) => finding.path).sort()).toEqual(['zoom.bands.far', 'zoom.bands.mid']);
  });

  it('allows adjacent bands that share a boundary', () => {
    const report = lint(zoomBandsDoc.replace('__BANDS__', '    city: [8, 12]\n    street: [12, 16]'));
    expect(report.findings.some((finding) => finding.ruleId === 'zoom-bands')).toBe(false);
  });

  it('requires increasing bounds within a band', () => {
    const report = lint(zoomBandsDoc.replace('__BANDS__', '    inverted: [12, 8]'));
    expect(report.findings.some((finding) => finding.ruleId === 'zoom-bands' && finding.message.includes('minzoom < maxzoom'))).toBe(true);
  });
});
