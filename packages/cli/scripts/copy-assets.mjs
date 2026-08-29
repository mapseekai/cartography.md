import {copyFile, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const dist = path.join(packageRoot, 'dist');
const schemaDist = path.join(dist, 'schema-json');

await mkdir(schemaDist, {recursive: true});
await rm(path.join(schemaDist, 'data-profile.schema.json'), {force: true});
await copyFile(path.join(repositoryRoot, 'docs/spec.md'), path.join(dist, 'spec.md'));
await copyFile(
  path.join(repositoryRoot, 'schema/cartography.schema.json'),
  path.join(schemaDist, 'cartography.schema.json'),
);
