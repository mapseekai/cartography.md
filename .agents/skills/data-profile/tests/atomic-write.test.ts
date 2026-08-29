import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {afterEach, describe, expect, it} from 'vitest';

import {atomicWrite} from '../src/atomic-write.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, {recursive: true, force: true})),
  );
});

describe('atomicWrite', () => {
  it('preserves an existing destination and removes the sibling temp when rename fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-atomic-write-'));
    temporaryDirectories.push(directory);
    const destination = join(directory, 'DATA_PROFILE.json');
    await writeFile(destination, 'existing bytes\n');
    let temporaryBytes: string | undefined;

    await expect(
      atomicWrite(destination, 'replacement bytes\n', {
        rename: async (temporary, target) => {
          temporaryBytes = await readFile(temporary, 'utf8');
          expect(target).toBe(destination);
          throw new Error('controlled rename failure');
        },
      }),
    ).rejects.toThrow('controlled rename failure');

    expect(temporaryBytes).toBe('replacement bytes\n');
    expect(await readFile(destination, 'utf8')).toBe('existing bytes\n');
    expect(await readdir(directory)).toEqual(['DATA_PROFILE.json']);
  });
});
