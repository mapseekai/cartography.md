import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {lintFile} from '../linter/index.js';

const contractUrl = new URL('../../../../examples/quiet-atlas/CARTOGRAPHY.md', import.meta.url);

describe('quiet-atlas example', () => {
  it('lints the renderer-neutral example by itself', async () => {
    const report = await lintFile(fileURLToPath(contractUrl));
    expect(report.summary.errors).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.document.version).toBe('0.2.0');
  });
});
