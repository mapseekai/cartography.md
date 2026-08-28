import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {lint, lintFile} from '../linter/index.js';

const contractUrl = new URL('../../../../examples/openfreemap-bright/CARTOGRAPHY.md', import.meta.url);
const profileUrl = new URL('../../../../examples/openfreemap-bright/DATA_PROFILE.json', import.meta.url);
const styleUrl = new URL('../../../../examples/openfreemap-bright/style.json', import.meta.url);

function readJson(url: URL): unknown {
  return JSON.parse(readFileSync(url, 'utf8')) as unknown;
}

describe('urban gas network example', () => {
  it('passes the complete contract, profile, and style validation chain', () => {
    const report = lint(readFileSync(contractUrl, 'utf8'), {
      sourcePath: fileURLToPath(contractUrl),
      dataProfile: readJson(profileUrl),
      style: readJson(styleUrl),
    });

    expect(report.summary.errors).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.artifacts).toEqual({
      dataProfileChecked: true,
      styleChecked: true,
      officialMapLibreValidation: true,
    });
  });

  it('resolves the declared data profile relative to CARTOGRAPHY.md', async () => {
    const report = await lintFile(fileURLToPath(contractUrl));
    expect(report.summary.errors).toBe(0);
    expect(report.artifacts.dataProfileChecked).toBe(true);
    expect(report.artifacts.styleChecked).toBe(false);
  });
});
