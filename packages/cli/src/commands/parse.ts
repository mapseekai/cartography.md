import {defineCommand} from 'citty';
import {parseCartography} from '../parser/parse.js';
import {readInput} from '../utils/io.js';

export default defineCommand({
  meta: {name: 'parse', description: 'Parse CARTOGRAPHY.md without running semantic rules.'},
  args: {
    file: {type: 'positional', description: 'Path to CARTOGRAPHY.md (or - for stdin)', required: true},
  },
  async run({args}: {args: {file: string}}) {
    try {
      const parsed = parseCartography(await readInput(args.file));
      process.stdout.write(`${JSON.stringify({
        frontmatter: parsed.rawFrontmatter,
        sections: parsed.sections,
        findings: parsed.findings,
      }, null, 2)}\n`);
      process.exitCode = parsed.findings.some((finding) => finding.severity === 'error') ? 1 : 0;
    } catch (error) {
      process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 2;
    }
  },
});
