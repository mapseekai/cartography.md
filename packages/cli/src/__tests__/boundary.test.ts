import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import packageJson from '../../package.json' with {type: 'json'};

describe('core boundaries', () => {
  it('keeps renderer vocabulary out of core source', async () => {
    const source = await readFile(new URL('../linter/rules/boundary.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/maplibre|leaflet|openlayers/i);
  });
  it('does not depend on a renderer package', () => expect(Object.keys({...packageJson.dependencies, ...packageJson.devDependencies}).join(' ')).not.toMatch(/maplibre|leaflet|openlayers/i));
  it('documents advisory document-size resource limits', async () => {
    const docs = await readFile('../../docs/api.md', 'utf8');
    expect(docs).toMatch(/maxDocumentBytes/i);
  });
  it('documents exported API in both languages', async () => {
    const [english, chinese] = await Promise.all([readFile('../../docs/api.md', 'utf8'), readFile('../../docs/api.zh-CN.md', 'utf8')]);
    for (const name of ['lint', 'lintFile', 'diffCartography', 'DEFAULT_RULES']) { expect(english).toContain(name); expect(chinese).toContain(name); }
  });
});
