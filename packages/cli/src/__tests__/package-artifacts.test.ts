import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

const packageDirectory = fileURLToPath(new URL('../../', import.meta.url));
const staleArtifacts = [
  'dist/schema/data-profile.js',
  'dist/schema/data-profile.d.ts',
  'dist/linter/rules/profile.js',
  'dist/linter/rules/style.js',
];

function seedStaleArtifacts(): void {
  for (const relative of staleArtifacts) {
    const file = join(packageDirectory, relative);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, '// stale 0.1 artifact\n', 'utf8');
  }
}

function removeStaleArtifacts(): void {
  for (const relative of staleArtifacts) {
    rmSync(join(packageDirectory, relative), {force: true});
  }
}

function runPackageScript(script: 'build' | 'check-package') {
  return spawnSync('pnpm', ['run', script], {
    cwd: packageDirectory,
    encoding: 'utf8',
  });
}

describe('publishable package artifacts', () => {
  it('cleans a seeded 0.1 dist before compiling the current package', () => {
    seedStaleArtifacts();
    try {
      const result = runPackageScript('build');

      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      for (const relative of staleArtifacts) {
        expect(existsSync(join(packageDirectory, relative)), relative).toBe(false);
      }
    } finally {
      removeStaleArtifacts();
    }
  });

  it('rejects stale 0.1 files in the actual publishable file list', () => {
    seedStaleArtifacts();
    try {
      const result = runPackageScript('check-package');
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.status, output).toBe(1);
      for (const relative of staleArtifacts) {
        expect(output).toContain(relative);
      }
    } finally {
      removeStaleArtifacts();
    }
  });
});
