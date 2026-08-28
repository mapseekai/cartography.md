import {defineCommand} from 'citty';
import {lint, lintFile} from '../linter/index.js';
import {FileReadError, formatOutput, readInput, readJson} from '../utils/io.js';

export default defineCommand({
  meta: {
    name: 'lint',
    description: 'Validate CARTOGRAPHY.md and optional DATA_PROFILE.json / MapLibre style.json.',
  },
  args: {
    file: {
      type: 'positional',
      description: 'Path to CARTOGRAPHY.md (use "-" for stdin)',
      required: true,
    },
    profile: {
      type: 'string',
      description: 'Path to DATA_PROFILE.json',
    },
    style: {
      type: 'string',
      description: 'Path to MapLibre style.json',
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
  async run({args}: {args: {file: string; profile?: string; style?: string; format: string; strict: boolean}}) {
    try {
      const report = args.file === '-'
        ? lint(await readInput('-'), {
            ...(args.profile ? {dataProfile: await readJson(args.profile)} : {}),
            ...(args.style ? {style: await readJson(args.style)} : {}),
            strict: args.strict,
          })
        : await lintFile(args.file, {
            ...(args.profile ? {dataProfilePath: args.profile} : {}),
            ...(args.style ? {stylePath: args.style} : {}),
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
