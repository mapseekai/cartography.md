import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as z from 'zod';
import {cartographySchema} from '../src/schema/cartography.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '../../..');
const outputPath = path.join(repositoryRoot, 'schema/cartography.schema.json');
const output = `${JSON.stringify({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://mapseek.ai/cartography.md/schema/0.2.0',
  ...z.toJSONSchema(cartographySchema, {
    target: 'draft-2020-12',
    reused: 'ref',
    cycles: 'ref',
  }),
}, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== output) {
    process.stderr.write('schema/cartography.schema.json is stale; run pnpm schema:generate.\n');
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, output);
}
