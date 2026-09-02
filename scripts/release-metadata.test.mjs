import assert from 'node:assert/strict';
import test from 'node:test';
import {extractSourceVersion, resolveReleaseMetadata} from './release-metadata.mjs';

const versions = {root: '0.4.0', cli: '0.4.0', source: '0.4.0'};

test('stable releases use latest', () => {
  assert.deepEqual(resolveReleaseMetadata('v0.4.0', versions), {
    version: '0.4.0', npmTag: 'latest', prerelease: false,
  });
});

test('prereleases use next', () => {
  assert.deepEqual(resolveReleaseMetadata('v0.4.0-rc.1', {
    root: '0.4.0-rc.1', cli: '0.4.0-rc.1', source: '0.4.0-rc.1',
  }), {version: '0.4.0-rc.1', npmTag: 'next', prerelease: true});
});

test('rejects malformed release tags', () => {
  assert.throws(() => resolveReleaseMetadata('release-0.4.0', versions), /valid v-prefixed SemVer/);
});

test('rejects numeric prerelease identifiers with leading zeroes', () => {
  assert.throws(() => resolveReleaseMetadata('v1.2.3-01', {
    root: '1.2.3-01', cli: '1.2.3-01', source: '1.2.3-01',
  }), /valid v-prefixed SemVer/);
});

test('rejects leading zeroes after a hyphenated prerelease identifier', () => {
  assert.throws(() => resolveReleaseMetadata('v1.2.3-alpha-beta.01', {
    root: '1.2.3-alpha-beta.01',
    cli: '1.2.3-alpha-beta.01',
    source: '1.2.3-alpha-beta.01',
  }), /valid v-prefixed SemVer/);
});

test('accepts zero, dotted, and hyphenated nonnumeric prerelease identifiers', () => {
  for (const version of ['1.2.3-0', '1.2.3-rc.1', '1.2.3-alpha-beta']) {
    assert.deepEqual(resolveReleaseMetadata(`v${version}`, {
      root: version, cli: version, source: version,
    }), {version, npmTag: 'next', prerelease: true});
  }
});

test('rejects version drift', () => {
  assert.throws(() => resolveReleaseMetadata('v0.4.0', {...versions, cli: '0.4.1'}), /version mismatch/);
});

test('extracts the TypeScript version literal', () => {
  assert.equal(extractSourceVersion("export const VERSION = '0.4.0';\n"), '0.4.0');
  assert.throws(() => extractSourceVersion('export const VERSION = compute();'), /literal VERSION/);
});
