import { readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

export function loadFixture(rel: string): Buffer {
  return readFileSync(path.join(fixturesDir, rel));
}

export function loadFixtureText(rel: string): string {
  return readFileSync(path.join(fixturesDir, rel), 'utf8');
}

export function makeTempDir(prefix = 'cartography-init-'): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}
