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

function runCli(args: string[], input?: string) {
  return spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
    cwd: packageDirectory,
    encoding: 'utf8',
    input,
  });
}

describe('lint CLI', () => {
  it('returns a JSON lint report for a document', () => {
    const result = runCli(['lint', file]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({valid: true});
  });

  it('returns a valid JSON lint report for a document read from stdin', () => {
    const input = '---\nversion: "0.2.0"\nname: CLI stdin test\n---\n\n## Overview\n\nTest.\n';
    const result = runCli(['lint', '-'], input);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({valid: true});
  });

  it('applies --strict when stdin is the positional input', () => {
    const input = `---
version: "0.2.0"
name: CLI stdin strict test
omitted:
  - Intent & Audience
  - Visual Hierarchy
  - Color
  - Typography & Labels
  - Geometry & Symbols
  - Scale & Generalization
  - Layering & Composition
  - Interaction States
  - Accessibility
  - Review Principles
  - Do's and Don'ts
---

## Overview

Test.
`;
    const result = runCli(['lint', '-', '--strict'], input);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({strict: true, valid: true});
  });

  it('accepts text formatting after the stdin positional input', () => {
    const input = '---\nversion: "0.2.0"\nname: CLI stdin test\n---\n\n## Overview\n\nTest.\n';
    const result = runCli(['lint', '-', '--format', 'text'], input);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CARTOGRAPHY.md validation: PASS');
  });

  it('rejects a bare dash unless it is the only lint input', () => {
    const result = runCli(['lint', file, '-']);

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain('"valid"');
    expect(result.stderr).not.toContain('"valid"');
  });

  it.each([
    ['ordinary extra positional', [file, 'extra']],
    ['extra positional after --', [file, '--', 'extra']],
    ['stdin marker after a file and --', [file, '--', '-']],
  ])('rejects %s before producing a lint report', (_name, args) => {
    const result = runCli(['lint', ...args]);

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain('"valid"');
    expect(result.stderr).not.toContain('"valid"');
  });

  it.each([
    ['--profile', 'profile.json'],
    ['--style', 'target.json'],
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
