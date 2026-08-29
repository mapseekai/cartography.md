import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import * as api from '../api.js';
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
    expect(Object.keys(report).sort()).toEqual([
      'cartography',
      'document',
      'findings',
      'resolved',
      'sections',
      'strict',
      'summary',
      'valid',
    ]);
  });

  it('has only document rules', () => {
    expect(DEFAULT_RULES.every((rule) => rule.scope === 'document')).toBe(true);
    expect(getRuleCatalog().every((rule) => rule.scope === 'document')).toBe(true);
  });

  it('does not export removed APIs', () => {
    expect(api).not.toHaveProperty('dataProfileSchema');
    expect(api).not.toHaveProperty('validateMapLibreStyle');
    expect(api).not.toHaveProperty(['validate', 'Map', 'LibreStyle'].join(''));
    expect(Object.keys(api).sort()).toEqual([
      'DEFAULT_RULES',
      'VERSION',
      'cartographySchema',
      'diffCartography',
      'getRuleCatalog',
      'getSpecification',
      'lint',
      'lintCartography',
      'lintFile',
      'parseCartography',
      'resolveReferences',
    ]);
  });

  it('lets a custom rule replace a default rule by id', () => {
    const report = lint(minimalDocument, {maxDocumentBytes: 1, rules: [{
      id: 'document-size',
      severity: 'info',
      scope: 'document',
      description: 'override',
      run: () => [],
    }]});

    expect(report.findings.some((finding) => finding.ruleId === 'rule-execution')).toBe(false);
    expect(report.findings.some((finding) => finding.ruleId === 'document-size')).toBe(false);
  });

  it('reports the supplied file and never reads companion files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-md-'));
    const documentPath = join(directory, 'CARTOGRAPHY.md');
    const companionPath = join(directory, 'DATA_PROFILE.json');
    await writeFile(documentPath, minimalDocument, 'utf8');
    await writeFile(companionPath, '{ not valid json', 'utf8');

    try {
      const report = await api.lintFile(documentPath);
      expect(report.document.path).toBe(documentPath);
      expect(report.findings.some((finding) => finding.ruleId === 'profile' || finding.ruleId === 'style')).toBe(false);
    } finally {
      await rm(directory, {recursive: true, force: true});
    }
  });
});
