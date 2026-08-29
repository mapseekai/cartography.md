import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';

const contractUrl = new URL('../../../../examples/openfreemap-bright/CARTOGRAPHY.md', import.meta.url);

describe('openfreemap-bright example', () => {
  it('reports a schema finding for the 0.1 fixture', () => {
    const report = lint(readFileSync(contractUrl, 'utf8'));
    expect(report.findings.some((finding) => finding.ruleId === 'schema')).toBe(true);
  });
});
