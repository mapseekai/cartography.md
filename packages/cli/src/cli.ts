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

interface LintGrammarResult {
  normalizedRawArgs: string[];
  error?: string;
}

function validateLintGrammar(rawArgs: string[]): LintGrammarResult {
  if (rawArgs[0] !== 'lint') {
    return {normalizedRawArgs: rawArgs};
  }

  const options: string[] = [];
  const positionals: string[] = [];
  let optionsEnded = false;
  let helpRequested = false;
  const lintArgs = rawArgs.slice(1);

  for (let index = 0; index < lintArgs.length; index += 1) {
    const arg = lintArgs[index]!;
    if (!optionsEnded && arg === '--') {
      optionsEnded = true;
      continue;
    }

    if (optionsEnded || arg === '-' || !arg.startsWith('-')) {
      positionals.push(arg);
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      helpRequested = true;
      options.push(arg);
      continue;
    }
    if (arg === '--strict' || arg.startsWith('--strict=')) {
      options.push(arg);
      continue;
    }
    if (arg === '--format') {
      const value = lintArgs[index + 1];
      if (value === undefined || value === '--') {
        return {normalizedRawArgs: rawArgs, error: 'Option --format requires a value.'};
      }
      options.push(arg, value);
      index += 1;
      continue;
    }
    if (arg.startsWith('--format=')) {
      options.push(arg);
      continue;
    }

    const flag = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    return {normalizedRawArgs: rawArgs, error: `Unknown option ${flag}`};
  }

  if (helpRequested) return {normalizedRawArgs: rawArgs};
  if (positionals.length !== 1) {
    return {
      normalizedRawArgs: rawArgs,
      error: `Expected exactly one CARTOGRAPHY.md input; received ${positionals.length}.`,
    };
  }

  return {normalizedRawArgs: ['lint', ...options, '--', positionals[0]!]};
}

const rawArgs = process.argv.slice(2);
const lintGrammar = validateLintGrammar(rawArgs);

if (lintGrammar.error) {
  await showUsage(lintCommand);
  process.stderr.write(`Error: ${lintGrammar.error}\n`);
  process.exitCode = 2;
} else {
  await runMain(main, {rawArgs: lintGrammar.normalizedRawArgs});
}
