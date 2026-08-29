import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterAll, describe, expect, it} from 'vitest';

const cli = fileURLToPath(new URL('../cli.ts', import.meta.url));
const packageDirectory = fileURLToPath(new URL('../../', import.meta.url));
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'cartography-cli-'));
const file = join(temporaryDirectory, 'CARTOGRAPHY.md');
writeFileSync(file, '---\nversion: "0.2.0"\nname: CLI test\n---\n\n## Overview\n\nTest.\n');

function runCli(args: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
    cwd: packageDirectory,
    encoding: 'utf8',
  });
}

describe('lint CLI', () => {
  it('returns a JSON lint report for a document', () => {
    const result = runCli(['lint', file]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({valid: true});
  });

  it.each([
    ['--profile', 'profile.json'],
    ['--style', 'style.json'],
  ])('rejects removed %s input as a usage failure', (flag, value) => {
    const result = runCli(['lint', file, flag, value]);

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain('"valid"');
    expect(result.stderr).not.toContain('"valid"');
  });

  it('rejects --no-strict before reading the document', () => {
    const missingFile = join(temporaryDirectory, 'missing-CARTOGRAPHY.md');
    const result = runCli(['lint', missingFile, '--no-strict']);

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain('"valid"');
    expect(result.stderr).not.toContain('"valid"');
    expect(result.stderr).not.toContain('Unable to read');
  });
});

afterAll(() => rmSync(temporaryDirectory, {recursive: true, force: true}));
