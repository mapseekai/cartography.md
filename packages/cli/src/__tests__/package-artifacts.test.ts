import {readdir} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';

describe('package artifacts', () => {
  it('does not publish obsolete 0.1 profile or style artifacts', async () => {
    const entries = await readdir('dist', {recursive: true});
    expect(entries.join('\n')).not.toMatch(/data-profile|profile|style/i);
  });
  it('ships the renamed front-matter schema artifact only', async () => {
    const entries = await readdir('dist/schema-json');
    expect(entries).toEqual(['cartography-front-matter.schema.json']);
  });
});
