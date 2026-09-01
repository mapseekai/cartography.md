import {spawnSync} from 'node:child_process';
import {afterAll, describe, expect, it} from 'vitest';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const cli = fileURLToPath(new URL('../cli.ts', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'cartography-cli-'));
const file = join(directory, 'CARTOGRAPHY.md');
const document = '---\nversion: "0.3.0"\nname: CLI test\n---\n\n## Overview\n\nTest.\n';
writeFileSync(file, document);
function run(args: string[], input?: string) { return spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {cwd: fileURLToPath(new URL('../../', import.meta.url)), encoding: 'utf8', input}); }

describe('lint CLI', () => {
  it('prints a JSON lint report', () => expect(JSON.parse(run(['lint', file]).stdout)).toMatchObject({valid: true}));
  it('reads a document from stdin', () => expect(JSON.parse(run(['lint', '-'], document).stdout)).toMatchObject({valid: true}));
  it('applies strict to stdin', () => expect(JSON.parse(run(['lint', '-', '--strict'], document).stdout)).toMatchObject({strict: true}));
  it('prints text reports', () => expect(run(['lint', '-', '--format', 'text'], document).stdout).toContain('CARTOGRAPHY.md validation:'));
  it('rejects a bare dash after a file', () => expect(run(['lint', file, '-']).status).toBe(2));
  it('rejects no-strict', () => expect(run(['lint', file, '--no-strict']).status).toBe(2));
  it('rejects unknown short options', () => expect(run(['lint', file, '-v']).status).toBe(2));
  it('accepts lint options around positional input', () => {
    expect(run(['lint', '--format', 'text', file, '--strict']).status).toBe(0);
    expect(run(['lint', file, '--strict', '--format=text']).status).toBe(0);
  });
});
afterAll(() => rmSync(directory, {recursive: true, force: true}));
