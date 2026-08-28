#!/usr/bin/env node
import {defineCommand, runMain} from 'citty';
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
    description: 'Agent-first cartographic design contract and validator for MapLibre styles.',
  },
  subCommands: {
    lint: lintCommand,
    parse: parseCommand,
    diff: diffCommand,
    rules: rulesCommand,
    spec: specCommand,
  },
});

runMain(main);
