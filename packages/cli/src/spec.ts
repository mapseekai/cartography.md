import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {RULE_CATALOG} from './linter/rule-catalog.js';

function readFirst(candidates: URL[]): string {
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return readFileSync(fileURLToPath(candidate), 'utf8');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to locate bundled spec.md.');
}

export function getSpecification(): string {
  return readFirst([
    new URL('./spec.md', import.meta.url),
    new URL('../../../docs/spec.md', import.meta.url),
  ]);
}

export function getRuleCatalog() {
  return [...RULE_CATALOG];
}
