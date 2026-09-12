#!/usr/bin/env node
import { runCli } from '../src/cli.js';

const args = process.argv.slice(2);
const initialDirectory = process.env.INIT_CWD?.trim();
if (initialDirectory) process.chdir(initialDirectory);
const code = await runCli(args[0] === '--' ? args.slice(1) : args);
process.exit(code);
