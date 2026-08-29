import {defineCommand} from 'citty';
import {lint, lintFile} from '../linter/index.js';
import {FileReadError, formatOutput, readInput} from '../utils/io.js';

export default defineCommand({
  meta: {
    name: 'lint',
    description: 'Validate one CARTOGRAPHY.md design-system document.',
  },
  args: {
    file: {
      type: 'positional',
      description: 'Path to CARTOGRAPHY.md (use "-" for stdin)',
      required: true,
    },
    format: {
      type: 'string',
      description: 'Output format: json or text',
      default: 'json',
    },
    strict: {
      type: 'boolean',
      description: 'Treat warnings as blocking for the valid flag and exit code',
      default: false,
    },
  },
  async run({args}: {args: {file: string; format: string; strict: boolean}}) {
    try {
      const report = args.file === '-'
        ? lint(await readInput('-'), {
            strict: args.strict,
          })
        : await lintFile(args.file, {
            strict: args.strict,
          });
      process.stdout.write(`${formatOutput(report, args.format)}\n`);
      process.exitCode = report.valid ? 0 : 1;
    } catch (error) {
      const message = error instanceof FileReadError
        ? error.friendlyMessage
        : error instanceof Error
          ? error.message
          : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = 2;
    }
  },
});
