import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { fixturesDir } from './helpers.js';

describe('runCli end-to-end', () => {
  it('generates a lint-clean document from style-min.json', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const out = path.join(dir, 'CARTOGRAPHY.md');
    const code = await runCli([
      '--input', path.join(fixturesDir, 'style-min.json'),
      '--output', out,
      '--report-json', path.join(dir, 'INIT_REPORT.json'),
    ]);
    expect(code).toBe(0);
    const doc = readFileSync(out, 'utf8');
    expect(doc).toContain('version: "0.3.0"');
    expect(doc).not.toContain('source-layer');
  });

  it('refuses to write on unrecognised input', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const out = path.join(dir, 'CARTOGRAPHY.md');
    const bad = path.join(dir, 'mystery.bin');
    writeFileSync(bad, Buffer.from([0, 1, 2, 3]));
    const code = await runCli(['--input', bad, '--output', out]);
    expect(code).toBe(2);
    expect(existsSync(out)).toBe(false);
  });

  it('--check-report exits 1 until every binding is triaged', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const reportJson = path.join(dir, 'INIT_REPORT.json');
    const code1 = await runCli([
      '--input', path.join(fixturesDir, 'style-boundary.json'),
      '--output', path.join(dir, 'CARTOGRAPHY.md'),
      '--report-json', reportJson,
    ]);
    expect(code1).toBe(0);
    expect(await runCli(['--check-report', reportJson])).toBe(1);
  });
});
