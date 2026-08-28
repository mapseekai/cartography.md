import {defineCommand} from 'citty';
import {diffCartography} from '../linter/diff.js';
import {readInput} from '../utils/io.js';

export default defineCommand({
  meta: {name: 'diff', description: 'Compare two CARTOGRAPHY.md contracts.'},
  args: {
    before: {type: 'positional', description: 'Base CARTOGRAPHY.md', required: true},
    after: {type: 'positional', description: 'Changed CARTOGRAPHY.md', required: true},
  },
  async run({args}: {args: {before: string; after: string}}) {
    try {
      const report = diffCartography(await readInput(args.before), await readInput(args.after));
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = report.regression ? 1 : 0;
    } catch (error) {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 2;
    }
  },
});
