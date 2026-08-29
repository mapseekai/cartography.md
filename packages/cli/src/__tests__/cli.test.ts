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

describe('exact CLI grammar', () => {
  it.each([
    ['lint format followed by an option', ['lint', file, '--format', '--strict'], '"valid"'],
    ['lint invalid format', ['lint', file, '--format', 'yaml'], '"valid"'],
    ['lint boolean with a value', ['lint', file, '--strict=true'], '"valid"'],
    ['lint unknown option', ['lint', file, '--unknown'], '"valid"'],
    ['parse missing input', ['parse'], '"frontmatter"'],
    ['parse extra input', ['parse', file, 'extra'], '"frontmatter"'],
    ['parse option', ['parse', file, '--strict'], '"frontmatter"'],
    ['diff missing input', ['diff', file], '"regression"'],
    ['diff extra input after separator', ['diff', file, file, '--', 'extra'], '"regression"'],
    ['diff option', ['diff', file, file, '--strict'], '"regression"'],
    ['spec positional', ['spec', 'extra'], '**Status:** Draft 0.2.0'],
    ['spec output without a value', ['spec', '--output', '--help'], '**Status:** Draft 0.2.0'],
    ['spec unknown option', ['spec', '--unknown'], '**Status:** Draft 0.2.0'],
    ['rules positional after separator', ['rules', '--', 'extra'], 'frontmatter-required'],
    ['rules unknown option', ['rules', '--unknown'], 'frontmatter-required'],
  ])('rejects %s before command work or output', (_name, args, workOutput) => {
    const result = runCli(args);

    expect(result.status).toBe(2);
    expect(result.stdout).not.toContain(workOutput);
    expect(result.stderr).not.toContain(workOutput);
  });

  it.each([
    ['lint', ['lint', '--help']],
    ['parse', ['parse', '--help']],
    ['diff', ['diff', '--help']],
    ['spec', ['spec', '--help']],
    ['rules', ['rules', '--help']],
    ['top-level', ['--help']],
    ['top-level version', ['--version']],
  ])('preserves %s help or version handling', (_name, args) => {
    expect(runCli(args).status).toBe(0);
  });

  it('accepts lint options on either side of the one positional input', () => {
    const before = runCli(['lint', '--format', 'text', file, '--strict']);
    const after = runCli(['lint', file, '--strict', '--format=text']);

    expect(before.status).toBe(1);
    expect(after.status).toBe(1);
    expect(before.stdout).toContain('CARTOGRAPHY.md validation: FAIL');
    expect(after.stdout).toContain('CARTOGRAPHY.md validation: FAIL');
  });
});

afterAll(() => rmSync(temporaryDirectory, {recursive: true, force: true}));
