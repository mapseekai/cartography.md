import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineCommand} from 'citty';

async function loadSpec(): Promise<string> {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(currentDirectory, '../spec.md'),
    path.resolve(currentDirectory, '../../docs/spec.md'),
    path.resolve(currentDirectory, '../../../../docs/spec.md'),
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8');
    } catch {
      // Try the next development or packaged path.
    }
  }
  throw new Error('Unable to locate bundled docs/spec.md.');
}

export default defineCommand({
  meta: {name: 'spec', description: 'Print or copy the bundled CARTOGRAPHY.md format specification.'},
  args: {
    output: {type: 'string', description: 'Optional output file; stdout is used by default'},
  },
  async run({args}: {args: {output?: string}}) {
    try {
      const spec = await loadSpec();
      if (args.output) await writeFile(args.output, spec, 'utf8');
      else process.stdout.write(spec);
    } catch (error) {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 2;
    }
  },
});
