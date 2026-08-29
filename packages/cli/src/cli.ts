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

const subCommands = {
  lint: lintCommand,
  parse: parseCommand,
  diff: diffCommand,
  rules: rulesCommand,
  spec: specCommand,
} as const;

type OptionGrammar =
  | {kind: 'boolean'}
  | {kind: 'string'}
  | {kind: 'enum'; values: readonly string[]};

interface CommandGrammar {
  positionals: number;
  options: Record<string, OptionGrammar>;
}

const commandGrammars: Record<string, CommandGrammar> = {
  lint: {
    positionals: 1,
    options: {
      format: {kind: 'enum', values: ['json', 'text']},
      strict: {kind: 'boolean'},
    },
  },
  parse: {positionals: 1, options: {}},
  diff: {positionals: 2, options: {}},
  spec: {positionals: 0, options: {output: {kind: 'string'}}},
  rules: {positionals: 0, options: {}},
};

interface GrammarResult {
  normalizedRawArgs: string[];
  error?: string;
  command?: keyof typeof subCommands;
}

function validateCommandGrammar(rawArgs: string[]): GrammarResult {
  const commandName = rawArgs[0];
  const grammar = commandName === undefined ? undefined : commandGrammars[commandName];
  if (commandName === undefined || !grammar || !(commandName in subCommands)) {
    return {normalizedRawArgs: rawArgs};
  }

  const options: string[] = [];
  const positionals: string[] = [];
  let optionsEnded = false;
  let helpRequested = false;
  const commandArgs = rawArgs.slice(1);

  for (let index = 0; index < commandArgs.length; index += 1) {
    const arg = commandArgs[index]!;
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

    const equals = arg.indexOf('=');
    const flag = equals >= 0 ? arg.slice(0, equals) : arg;
    if (!flag.startsWith('--')) {
      return {normalizedRawArgs: rawArgs, error: `Unknown option ${flag}`};
    }
    const optionName = flag.slice(2);
    const option = grammar.options[optionName];
    if (!option) return {normalizedRawArgs: rawArgs, error: `Unknown option ${flag}`};

    if (option.kind === 'boolean') {
      if (equals >= 0) {
        return {normalizedRawArgs: rawArgs, error: `Option ${flag} does not take a value.`};
      }
      options.push(flag);
      continue;
    }

    const inlineValue = equals >= 0 ? arg.slice(equals + 1) : undefined;
    const nextValue = equals < 0 ? commandArgs[index + 1] : undefined;
    const value = inlineValue ?? nextValue;
    if (value === undefined || value === '' || (inlineValue === undefined && value.startsWith('-'))) {
      return {normalizedRawArgs: rawArgs, error: `Option ${flag} requires a value.`};
    }
    if (option.kind === 'enum' && !option.values.includes(value)) {
      return {
        normalizedRawArgs: rawArgs,
        error: `Option ${flag} must be one of: ${option.values.join(', ')}.`,
      };
    }
    options.push(flag, value);
    if (inlineValue === undefined) index += 1;
  }

  if (positionals.length > grammar.positionals || (!helpRequested && positionals.length !== grammar.positionals)) {
    return {
      normalizedRawArgs: rawArgs,
      error: `Command ${commandName} expects exactly ${grammar.positionals} positional input${grammar.positionals === 1 ? '' : 's'}; received ${positionals.length}.`,
      command: commandName as keyof typeof subCommands,
    };
  }

  return {
    normalizedRawArgs: [commandName, ...options, ...(positionals.length > 0 ? ['--', ...positionals] : [])],
    command: commandName as keyof typeof subCommands,
  };
}

async function showSubcommandUsage(command: keyof typeof subCommands): Promise<void> {
  if (command === 'lint') await showUsage(lintCommand);
  else if (command === 'parse') await showUsage(parseCommand);
  else if (command === 'diff') await showUsage(diffCommand);
  else if (command === 'spec') await showUsage(specCommand);
  else await showUsage(rulesCommand);
}

const rawArgs = process.argv.slice(2);
const grammar = validateCommandGrammar(rawArgs);

if (grammar.error) {
  if (grammar.command) await showSubcommandUsage(grammar.command);
  process.stderr.write(`Error: ${grammar.error}\n`);
  process.exitCode = 2;
} else {
  await runMain(main, {rawArgs: grammar.normalizedRawArgs});
}
