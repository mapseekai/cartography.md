import {readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

import {describe, expect, test} from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function walk(directory: string): string[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const productFiles = [
  'README.md',
  'README.zh-CN.md',
  'PHILOSOPHY.md',
  'PHILOSOPHY.zh-CN.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'packages/cli/README.md',
].map((path) => join(repositoryRoot, path));

const internalDocsRoot = join(repositoryRoot, 'docs/superpowers');
productFiles.push(
  ...walk(join(repositoryRoot, 'docs')).filter(
    (path) =>
      !path.startsWith(`${internalDocsRoot}/`) &&
      /(?:spec|api)(?:\.zh-CN)?\.md$/.test(path),
  ),
);
productFiles.push(...walk(join(repositoryRoot, 'packages/cli/src')));
productFiles.push(...walk(join(repositoryRoot, 'schema')));
productFiles.push(...walk(join(repositoryRoot, 'examples')));

// Internal design/planning docs and the data-profile Skill are deliberately outside this
// product surface. Task 10 rewrites the universal Skill and will add it to this scan.
const boundaryTestPath = fileURLToPath(import.meta.url);
const scannedProductFiles = productFiles.filter((path) => path !== boundaryTestPath);
const forbidden = [new RegExp(['map', 'libre'].join(''), 'i'), /source-layer/i, /style\.json/i];

describe('renderer-neutral product boundary', () => {
  test('keeps renderer-bound vocabulary out of the core product surface', () => {
    const violations = scannedProductFiles.flatMap((path) => {
      const contents = readFileSync(path, 'utf8');
      return forbidden
        .filter((pattern) => pattern.test(contents))
        .map((pattern) => `${relative(repositoryRoot, path)}: ${pattern}`);
    });

    expect(violations).toEqual([]);
  });

  test('keeps renderer-specific packages out of core dependencies', () => {
    const packageManifest = JSON.parse(
      readFileSync(join(repositoryRoot, 'packages/cli/package.json'), 'utf8'),
    ) as {dependencies?: Record<string, string>};

    expect(packageManifest.dependencies).not.toHaveProperty(
      ['@', 'map', 'libre/maplibre-gl-style-spec'].join(''),
    );
  });
});
