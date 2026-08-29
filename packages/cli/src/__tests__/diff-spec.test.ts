import {describe, expect, it} from 'vitest';
import {diffCartography} from '../linter/diff.js';
import {getRuleCatalog, getSpecification} from '../spec.js';

const before = `---
version: "0.2.0"
name: A
tokens: {colors: {text: "#222222"}}
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
    expect(getSpecification()).toContain('**Status:** Draft 0.2.0');
    expect(getSpecification()).toContain('## Markdown sections');
    expect(getRuleCatalog().every((rule) => rule.scope === 'document')).toBe(true);
  });
});
