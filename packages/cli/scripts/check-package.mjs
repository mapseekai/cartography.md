import {access, mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const execFileAsync = promisify(execFile);
const required = [
  'dist/api.js',
  'dist/api.d.ts',
  'dist/cli.js',
  'dist/spec.md',
  'dist/schema-json/cartography-front-matter.schema.json',
  'README.md',
  'LICENSE',
];

for (const relative of required) {
  await access(path.join(packageRoot, relative));
}

const npmCache = await mkdtemp(path.join(tmpdir(), 'cartography-md-npm-cache-'));
let packOutput;
try {
  ({stdout: packOutput} = await execFileAsync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    {
      cwd: packageRoot,
      env: {...process.env, npm_config_cache: npmCache},
      maxBuffer: 10 * 1024 * 1024,
    },
  ));
} finally {
  await rm(npmCache, {force: true, recursive: true});
}
const packResults = JSON.parse(packOutput);
const publishableFiles = Array.isArray(packResults) && Array.isArray(packResults[0]?.files)
  ? packResults[0].files.map((entry) => String(entry.path))
  : [];
if (publishableFiles.length === 0) {
  throw new Error('npm pack did not return a publishable file list.');
}

const publishableSet = new Set(publishableFiles);
for (const relative of required) {
  if (!publishableSet.has(relative)) {
    throw new Error(`Required artifact is not publishable: ${relative}`);
  }
}

const staleArtifacts = publishableFiles.filter(
  (relative) =>
    relative.startsWith('dist/') &&
    /(?:^|\/)(?:data-profile|profile|style)(?:\.|\/|$)/.test(relative),
);
if (staleArtifacts.length > 0) {
  throw new Error(`Publishable stale 0.1 artifacts found: ${staleArtifacts.join(', ')}.`);
}

const schemaFiles = await readdir(path.join(packageRoot, 'dist/schema-json'));
if (schemaFiles.length !== 1 || schemaFiles[0] !== 'cartography-front-matter.schema.json') {
  throw new Error(
    `dist/schema-json must contain only cartography-front-matter.schema.json; found ${schemaFiles.join(', ') || '(empty)'}.`,
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
