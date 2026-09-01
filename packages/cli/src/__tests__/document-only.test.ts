import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {DEFAULT_RULES, lint, lintFile} from '../linter/index.js';

const source = '---\nversion: "0.3.0"\nname: Test\n---\n\n## Overview\n\nText.\n';
describe('document-only behavior', () => {
  it('returns the document report shape', () => expect(lint(source)).toMatchObject({document: {name: 'Test', version: '0.3.0'}}));
  it('includes document-scope defaults', () => expect(DEFAULT_RULES.some((rule) => rule.scope === 'document')).toBe(true));
  it('does not export removed APIs', async () => expect(await import('../api.js')).not.toHaveProperty('contrastPairSchema'));
  it('overrides defaults by custom rule id', () => expect(lint(source, {rules: [{id: 'missing-sections', severity: 'error', scope: 'document', description: 'Test override.', run: () => []}]}).summary.errors).toBe(0));
  it('reports over-size documents as advisory warnings', () => expect(lint(source, {maxDocumentBytes: 1}).findings).toContainEqual(expect.objectContaining({ruleId: 'document-size', severity: 'warning'})));
  it('reads only the supplied lintFile path', async () => { const dir = mkdtempSync(join(tmpdir(), 'cartography-')); const file = join(dir, 'one.md'); writeFileSync(file, source); await expect(lintFile(file)).resolves.toMatchObject({document: {path: file}}); rmSync(dir, {recursive: true}); });
});
