import {describe, expect, it} from 'vitest';
import {lint, DEFAULT_RULES} from '../linter/index.js';
import {getRuleCatalog} from '../spec.js';

const minimalDocument = `---
version: "0.2.0"
name: Minimal
---

## Overview

Quiet and restrained.
`;

describe('document-only linter core', () => {
  it('returns a document-only report', () => {
    const report = lint(minimalDocument);
    expect(report).not.toHaveProperty('artifacts');
    expect(report.document.version).toBe('0.2.0');
  });

  it('has only document rules', () => {
    expect(DEFAULT_RULES.every((rule) => rule.scope === 'document')).toBe(true);
    expect(getRuleCatalog().every((rule) => rule.scope === 'document')).toBe(true);
  });
});
