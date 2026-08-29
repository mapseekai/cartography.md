import {access, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const required = [
  'dist/api.js',
  'dist/api.d.ts',
  'dist/cli.js',
  'dist/spec.md',
  'dist/schema-json/cartography.schema.json',
  'README.md',
  'LICENSE',
];

for (const relative of required) {
  await access(path.join(packageRoot, relative));
}

const schemaFiles = await readdir(path.join(packageRoot, 'dist/schema-json'));
if (schemaFiles.length !== 1 || schemaFiles[0] !== 'cartography.schema.json') {
  throw new Error(
    `dist/schema-json must contain only cartography.schema.json; found ${schemaFiles.join(', ') || '(empty)'}.`,
  );
}

const cli = await readFile(path.join(packageRoot, 'dist/cli.js'), 'utf8');
if (!cli.startsWith('#!/usr/bin/env node')) {
  throw new Error('dist/cli.js is missing its executable shebang.');
}

const manifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
for (const [name, relative] of Object.entries(manifest.bin ?? {})) {
  await access(path.join(packageRoot, String(relative)));
  if (!['cartography.md', 'cartographymd'].includes(name)) {
    throw new Error(`Unexpected binary name: ${name}`);
  }
}

const rootManifest = JSON.parse(await readFile(path.join(packageRoot, '../../package.json'), 'utf8'));
const declaredVersion = /VERSION\s*=\s*["']([^"']+)["']/.exec(
  await readFile(path.join(packageRoot, 'dist/version.js'), 'utf8'),
)?.[1];
if (manifest.version !== rootManifest.version || declaredVersion !== manifest.version) {
  throw new Error(
    `Version mismatch: root package.json ${rootManifest.version}, package.json ${manifest.version}, dist/version.js ${declaredVersion}.`,
  );
}

process.stdout.write('Package artifacts are complete.\n');
