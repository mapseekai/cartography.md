import {describe, expect, it} from 'vitest';
import {diffCartography} from '../linter/diff.js';
import {getRuleCatalog, getSpecification} from '../spec.js';

const before = `---
version: "0.1.0"
name: A
target: {renderer: maplibre, styleSpecVersion: 8}
intent: {mapType: reference, primaryTask: lookup, audience: [reader]}
data: {bindings: {label: name}}
zoom: {bands: {city: [8, 12]}}
tokens: {colors: {text: "#222222"}}
scales: {}
encodings: {labels: {source: places, geometry: point, role: primary, layerGroup: labels, rules: []}}
layerOrder: [{id: labels, order: 10}]
---

## Overview

Before.
`;

describe('diff and bundled metadata', () => {
  it('detects modified resolved values and prose sections', () => {
    const after = before.replace('name: A', 'name: B').replace('Before.', 'After.');
    const report = diffCartography(before, after);
    expect(report.values.modified).toContain('name');
    expect(report.sections.modified).toContain('Overview');
  });

  it('bundles the specification and rule catalog', () => {
    expect(getSpecification()).toContain('# CARTOGRAPHY.md Format Specification');
    expect(getRuleCatalog().some((rule) => rule.id === 'maplibre-style-spec')).toBe(true);
  });
});
