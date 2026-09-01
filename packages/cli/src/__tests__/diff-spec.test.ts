import {describe, expect, it} from 'vitest';
import {readFile} from 'node:fs/promises';
import {diffCartography} from '../linter/diff.js';

const before = `---\nversion: "0.3.0"\nname: Atlas\ncolors:\n  ink: "#111"\n---\n\n## Overview\n\nOld.\n`;
const after = before.replace('#111', '#222').replace('Old.', 'New.\n\n## Colors\n\nInk.');

describe('diff and specification', () => {
  it('detects 0.3.0 token values and sections that changed', () => {
    const diff = diffCartography(before, after);
    expect(JSON.stringify(diff)).toContain('colors.ink');
    expect(JSON.stringify(diff)).toContain('Colors');
  });
  it('ships non-empty bilingual 0.3.0 specifications', async () => {
    const [english, chinese] = await Promise.all([readFile('../../docs/spec.md', 'utf8'), readFile('../../docs/spec.zh-CN.md', 'utf8')]);
    expect(english).toContain('0.3.0');
    expect(chinese).toContain('0.3.0');
  });
});
