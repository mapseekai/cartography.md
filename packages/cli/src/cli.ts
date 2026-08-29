#!/usr/bin/env node
import {defineCommand, runMain, showUsage} from 'citty';
import lintCommand from './commands/lint.js';
import parseCommand from './commands/parse.js';
import diffCommand from './commands/diff.js';
import rulesCommand from './commands/rules.js';
import specCommand from './commands/spec.js';
import {VERSION} from './version.js';

const main = defineCommand({
  meta: {
    name: 'cartography.md',
    version: VERSION,
    description: 'Agent-first cartographic design contract and document validator.',
  },
  subCommands: {
    lint: lintCommand,
    parse: parseCommand,
    diff: diffCommand,
    rules: rulesCommand,
    spec: specCommand,
  },
});

const knownLintFlags = new Set(['--format', '--strict', '--no-strict', '--help', '-h']);

function findUnknownLintFlag(rawArgs: string[]): string | undefined {
  if (rawArgs[0] !== 'lint') {
    return undefined;
  }

  for (const arg of rawArgs.slice(1)) {
    if (arg === '--') {
      break;
    }
    if (!arg.startsWith('-')) {
      continue;
    }

    const flag = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    if (!knownLintFlags.has(flag)) {
      return flag;
    }
  }

  return undefined;
}

const rawArgs = process.argv.slice(2);
const unknownLintFlag = findUnknownLintFlag(rawArgs);

if (unknownLintFlag) {
  await showUsage(lintCommand);
  process.stderr.write(`Error: Unknown option ${unknownLintFlag}\n`);
  process.exitCode = 2;
} else {
  await runMain(main, {rawArgs});
}
