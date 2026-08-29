#!/usr/bin/env node

import {randomUUID} from 'node:crypto';
import {rename, rm, writeFile} from 'node:fs/promises';
import {basename, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

import {generateProfile, type GenerateOptions} from '../src/generate.js';
import {stableJson} from '../src/stable-json.js';

function isoTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  return Number.isFinite(new Date(value).getTime());
}

function numberList(value: string, length?: number): number[] {
  const numbers = value.split(',').map(Number);
  if (
    numbers.length === 0 ||
    (length !== undefined && numbers.length !== length) ||
    numbers.some((number) => !Number.isFinite(number))
  ) {
    throw new Error('A numeric CLI list is invalid.');
  }
  return numbers;
}

function parseOptions(args: string[], interactive: boolean): {options: GenerateOptions; output: string} {
  const {values} = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: {
      style: {type: 'string'},
      tilejson: {type: 'string'},
      'source-id': {type: 'string'},
      'tile-template': {type: 'string'},
      bbox: {type: 'string'},
      zooms: {type: 'string'},
      'max-requests': {type: 'string'},
      'allow-private-network': {type: 'boolean'},
      'observed-at': {type: 'string'},
      output: {type: 'string'},
    },
  });

  if (values.style === undefined && values.tilejson === undefined && values['tile-template'] === undefined) {
    throw new Error('At least one discovery input is required.');
  }
  const observedAt = values['observed-at'] ?? (interactive ? new Date().toISOString() : undefined);
  if (observedAt === undefined || !isoTimestamp(observedAt)) {
    throw new Error('A valid --observed-at ISO timestamp is required for non-interactive runs.');
  }

  const options: GenerateOptions = {observedAt};
  if (values.style !== undefined) options.stylePath = values.style;
  if (values.tilejson !== undefined) options.tileJsonPath = values.tilejson;
  if (values['source-id'] !== undefined) options.sourceId = values['source-id'];
  if (values['tile-template'] !== undefined) options.tileTemplate = values['tile-template'];
  if (values.bbox !== undefined) {
    const bounds = numberList(values.bbox, 4);
    options.bounds = [bounds[0]!, bounds[1]!, bounds[2]!, bounds[3]!];
  }
  if (values.zooms !== undefined) {
    const zooms = numberList(values.zooms);
    if (zooms.some((zoom) => !Number.isInteger(zoom) || zoom < 0 || zoom > 30)) {
      throw new Error('CLI zooms must be integers between 0 and 30.');
    }
    options.zooms = zooms;
  }
  if (values['max-requests'] !== undefined) {
    const maxRequests = Number(values['max-requests']);
    if (!Number.isSafeInteger(maxRequests) || maxRequests < 0) {
      throw new Error('--max-requests must be a non-negative integer.');
    }
    options.maxRequests = maxRequests;
  }
  if (values['allow-private-network'] === true) options.allowPrivateNetwork = true;
  return {options, output: values.output ?? 'DATA_PROFILE.json'};
}

async function atomicWrite(path: string, contents: string): Promise<void> {
  const destination = resolve(path);
  const temporary = resolve(
    dirname(destination),
    `.${basename(destination)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, contents, {encoding: 'utf8', flag: 'wx', mode: 0o600});
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, {force: true}).catch(() => undefined);
    throw error;
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const forwardedArgs = args[0] === '--' ? args.slice(1) : args;
  const {options, output} = parseOptions(forwardedArgs, process.stdin.isTTY === true);
  const serialized = stableJson(await generateProfile(options));
  await atomicWrite(output, serialized);
  process.stdout.write('Profile written successfully.\n');
}

const invokedPath = process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write('Profile generation failed.\n');
    process.exitCode = 1;
  });
}
