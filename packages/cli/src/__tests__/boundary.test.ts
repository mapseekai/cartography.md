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
productFiles.push(
  join(repositoryRoot, '.agents/skills/cartography-md/SKILL.md'),
);

// Internal design/planning docs and the data-profile Skill are deliberately outside this
// product surface.
const boundaryTestPath = fileURLToPath(import.meta.url);
const scannedProductFiles = productFiles.filter((path) => path !== boundaryTestPath);
const forbidden = [new RegExp(['map', 'libre'].join(''), 'i'), /source-layer/i, /style\.json/i];
const englishResourceBoundary = 'The built-in `maxDocumentBytes` check is advisory and runs only after the complete input has been read and parsed; callers must enforce byte or stream limits before passing untrusted input to `lint`, `lintFile`, or standard input.';
const chineseResourceBoundary = '内置 `maxDocumentBytes` 检查是事后 advisory：它只在完整输入已经读取和解析后运行；调用方必须在把不受信任的输入传给 `lint`、`lintFile` 或标准输入之前实施字节数或流式限制。';

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

  test('states the advisory resource boundary consistently in public docs', () => {
    for (const relative of ['SECURITY.md', 'docs/spec.md', 'docs/api.md']) {
      expect(readFileSync(join(repositoryRoot, relative), 'utf8'), relative).toContain(englishResourceBoundary);
    }
    for (const relative of ['docs/spec.zh-CN.md', 'docs/api.zh-CN.md']) {
      expect(readFileSync(join(repositoryRoot, relative), 'utf8'), relative).toContain(chineseResourceBoundary);
    }
  });

  test('documents every intentionally exported public constant in both API languages', () => {
    for (const relative of ['docs/api.md', 'docs/api.zh-CN.md']) {
      const contents = readFileSync(join(repositoryRoot, relative), 'utf8');
      expect(contents, relative).toContain('| `DEFAULT_RULES` |');
      expect(contents, relative).toContain('| `VERSION` |');
    }
  });
});
