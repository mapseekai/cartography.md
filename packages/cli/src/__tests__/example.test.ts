import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';

describe('quiet-atlas example', () => {
  it('has no lint errors', async () => {
    const source = await readFile('../../examples/quiet-atlas/CARTOGRAPHY.md', 'utf8');
    expect(lint(source).summary.errors).toBe(0);
  });
});
