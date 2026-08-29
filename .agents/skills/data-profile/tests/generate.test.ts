import {spawn} from 'node:child_process';
import {access, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {create} from '@mapbox/mvt-fixtures';
import {afterEach, describe, expect, it} from 'vitest';

import {generateProfile} from '../src/generate.js';
import {mergeFragments} from '../src/merge.js';
import {stableJson} from '../src/stable-json.js';
import type {ProfileFragment} from '../src/types.js';

const packageDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryDirectories: string[] = [];

function fieldFragment(
  kind: 'tilejson-declared' | 'tile-sampled',
  type: 'number' | 'string',
  input: string,
  observedAt?: string,
): ProfileFragment {
  const evidence = {
    kind,
    input,
    location: '#/fields/score',
    ...(observedAt === undefined ? {} : {observedAt}),
  } as const;
  return {
    inputs: [input],
    sources: {
      ecology: {
        type: 'vector',
        tileTemplates: ['https://tiles.example/{z}/{x}/{y}.pbf'],
        layers: {
          habitat: {
            geometries: kind === 'tile-sampled' ? ['point'] : ['unknown'],
            stableIdObserved: kind === 'tile-sampled',
            fields: {
              score: {
                types: [type],
                categories: type === 'number' ? [2, 9] : ['high'],
                ...(type === 'number' ? {minimum: 2, maximum: 9} : {}),
                missingObserved: false,
                nullObserved: false,
                evidence: [evidence],
              },
            },
            evidence: [evidence],
          },
        },
        evidence: [evidence],
      },
    },
    unresolved: [],
  };
}

function pointTile(score: string | number, kind: string): Uint8Array {
  const scoreValue =
    typeof score === 'string' ? {string_value: score} : {int_value: score};
  return create({
    layers: [
      {
        version: 2,
        name: 'habitat',
        keys: ['score', 'kind'],
        values: [scoreValue, {string_value: kind}],
        extent: 4096,
        features: [{id: 1, tags: [0, 0, 1, 1], type: 1, geometry: [9, 50, 34]}],
      },
    ],
  }).buffer;
}

function runCli(args: string[], cwd: string): Promise<{code: number | null; stdout: string; stderr: string}> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      join(packageDirectory, 'node_modules/.bin/tsx'),
      [join(packageDirectory, 'scripts/generate-profile.ts'), ...args],
      {cwd, stdio: ['ignore', 'pipe', 'pipe']},
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code) => resolve({code, stdout, stderr}));
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, {recursive: true, force: true})),
  );
});

describe('mergeFragments', () => {
  it('retains incompatible declaration and observation evidence as an unresolved field conflict', () => {
    const observedAt = '2026-08-29T00:00:00.000Z';
    const declared = fieldFragment('tilejson-declared', 'number', 'metadata.json');
    const sampled = fieldFragment(
      'tile-sampled',
      'string',
      'https://tiles.example/{z}/{x}/{y}.pbf',
      observedAt,
    );

    const merged = mergeFragments([sampled, declared, declared]);
    const field = merged.sources.ecology.layers.habitat.fields.score;

    expect(field.types).toEqual(['number', 'string']);
    expect(field.categories).toEqual([2, 9, 'high']);
    expect(field).toMatchObject({minimum: 2, maximum: 9});
    expect(field.evidence).toEqual([
      {
        kind: 'tile-sampled',
        input: 'https://tiles.example/{z}/{x}/{y}.pbf',
        location: '#/fields/score',
        observedAt,
      },
      {kind: 'tilejson-declared', input: 'metadata.json', location: '#/fields/score'},
    ]);
    expect(merged.unresolved).toEqual([
      expect.objectContaining({
        code: 'field-type-conflict',
        location: '#/sources/ecology/layers/habitat/fields/score',
        evidence: field.evidence,
      }),
    ]);
  });

  it('expands independent source, layer, field, and bounds ranges without selecting a center', () => {
    const first = fieldFragment('tilejson-declared', 'number', 'first.json');
    const second = fieldFragment('tile-sampled', 'number', 'second.pbf', '2026-08-29T00:00:00Z');
    Object.assign(first.sources.ecology, {
      bounds: [-10, -5, 10, 5],
      center: [0, 0, 4],
      minzoom: 5,
      maxzoom: 8,
    });
    Object.assign(second.sources.ecology, {
      bounds: [-20, -4, 5, 9],
      center: [1, 1, 4],
      minzoom: 3,
      maxzoom: 12,
    });
    Object.assign(first.sources.ecology.layers.habitat, {minzoom: 6, maxzoom: 9});
    Object.assign(second.sources.ecology.layers.habitat, {minzoom: 4, maxzoom: 14});
    Object.assign(first.sources.ecology.layers.habitat.fields.score, {minimum: -2, maximum: 8});
    Object.assign(second.sources.ecology.layers.habitat.fields.score, {minimum: 1, maximum: 20});

    const merged = mergeFragments([first, second]);
    const source = merged.sources.ecology;

    expect(source).toMatchObject({
      bounds: [-20, -5, 10, 9],
      minzoom: 3,
      maxzoom: 12,
      layers: {
        habitat: {
          minzoom: 4,
          maxzoom: 14,
          fields: {score: {minimum: -2, maximum: 20}},
        },
      },
    });
    expect(source).not.toHaveProperty('center');
    expect(merged.unresolved).toContainEqual(
      expect.objectContaining({
        code: 'source-center-conflict',
        location: '#/sources/ecology/center',
      }),
    );
  });

  it('deduplicates identical unresolved items while preserving distinct evidence', () => {
    const first = fieldFragment('tilejson-declared', 'number', 'first.json');
    const second = fieldFragment('tile-sampled', 'number', 'second.pbf', '2026-08-29T00:00:00Z');
    const unresolved = {
      code: 'same-gap',
      location: '#/sources/ecology',
      message: 'The same unresolved fact.',
    };
    first.unresolved = [{...unresolved, evidence: first.sources.ecology.evidence}];
    second.unresolved = [
      {...unresolved, evidence: second.sources.ecology.evidence},
      {...unresolved, evidence: second.sources.ecology.evidence},
    ];

    const merged = mergeFragments([first, second]);

    expect(merged.unresolved).toEqual([
      {
        ...unresolved,
        evidence: [
          {
            kind: 'tile-sampled',
            input: 'second.pbf',
            location: '#/fields/score',
            observedAt: '2026-08-29T00:00:00Z',
          },
          {kind: 'tilejson-declared', input: 'first.json', location: '#/fields/score'},
        ],
      },
    ]);
  });
});

describe('generateProfile', () => {
  it('orchestrates style, TileJSON, and two sampled tiles deterministically', async () => {
    const style = JSON.stringify({
      version: 8,
      sources: {
        ecology: {type: 'vector', tiles: ['https://tiles.example/{z}/{x}/{y}.pbf']},
      },
      layers: [
        {
          id: 'habitat',
          type: 'circle',
          source: 'ecology',
          'source-layer': 'habitat',
          paint: {'circle-radius': ['get', 'score']},
        },
      ],
    });
    const tileJson = JSON.stringify({
      tilejson: '3.0.0',
      tiles: ['https://tiles.example/{z}/{x}/{y}.pbf'],
      bounds: [0, 0, 0, 0],
      minzoom: 0,
      maxzoom: 1,
      vector_layers: [{id: 'habitat', fields: {score: 'Number', kind: 'String'}}],
    });
    const inputs: Record<string, string> = {'style.json': style, 'metadata.json': tileJson};
    const options = {
      stylePath: 'style.json',
      tileJsonPath: 'metadata.json',
      sourceId: 'ecology',
      tileTemplate: 'https://tiles.example/{z}/{x}/{y}.pbf',
      bounds: [0, 0, 0, 0] as [number, number, number, number],
      zooms: [0, 1],
      maxRequests: 2,
      observedAt: '2026-08-29T00:00:00.000Z',
    };
    const dependencies = {
      readText: async (path: string) => inputs[path]!,
      fetchTile: async ({z}: {z: number}) =>
        z === 0 ? pointTile('high', 'woodland') : pointTile(7, 'wetland'),
      now: () => new Date('2099-01-01T00:00:00.000Z'),
    };

    const first = await generateProfile(options, dependencies);
    const second = await generateProfile(options, dependencies);

    expect(first.generatedAt).toBe('2026-08-29T00:00:00.000Z');
    expect(first.sources.ecology.layers.habitat).toMatchObject({
      geometries: ['point', 'unknown'],
      stableIdObserved: true,
      fields: {
        score: {types: ['integer', 'number', 'string', 'unknown'], categories: [7, 'high']},
        kind: {types: ['string'], categories: ['wetland', 'woodland']},
      },
    });
    expect(first.sampling).toMatchObject({
      requested: 2,
      decoded: 2,
      empty: 0,
      failed: 0,
      coordinates: [
        {z: 0, x: 0, y: 0},
        {z: 1, x: 1, y: 1},
      ],
      stopReason: 'candidates-exhausted',
    });
    expect(Array.isArray(first.unresolved)).toBe(true);
    expect(first.unresolved.map((item) => item.code)).toContain('field-type-conflict');
    expect(
      first.sources.ecology.layers.habitat.fields.score.evidence
        .filter((item) => item.kind === 'tile-sampled')
        .every((item) => item.observedAt === options.observedAt),
    ).toBe(true);
    expect(stableJson(first)).toBe(stableJson(second));
  });

  it('requires at least one discovery input', async () => {
    await expect(
      generateProfile(
        {observedAt: '2026-08-29T00:00:00.000Z'},
        {readText: async () => '{}', now: () => new Date(0)},
      ),
    ).rejects.toThrow('at least one discovery input');
  });

  it('redacts credentials from a remote style input before retaining evidence', async () => {
    const secretInput =
      'https://user:password@example.test/style.json?token=top-secret#private';

    const profile = await generateProfile(
      {stylePath: secretInput, observedAt: '2026-08-29T00:00:00.000Z'},
      {
        readText: async () =>
          JSON.stringify({version: 8, sources: {places: {type: 'vector'}}, layers: []}),
        now: () => new Date(0),
      },
    );
    const serialized = stableJson(profile);

    expect(profile.inputs).toEqual(['https://example.test/style.json']);
    expect(serialized).not.toMatch(/user|password|token|top-secret|private/);
  });

  it('does not report credential redaction for harmless URL normalization', async () => {
    const profile = await generateProfile(
      {stylePath: 'https://example.test', observedAt: '2026-08-29T00:00:00.000Z'},
      {
        readText: async () =>
          JSON.stringify({version: 8, sources: {places: {type: 'vector'}}, layers: []}),
        now: () => new Date(0),
      },
    );

    expect(profile.inputs).toEqual(['https://example.test/']);
    expect(profile.unresolved.map((item) => item.code)).not.toContain('credential-redacted');
  });

  it('does not expose a credential-bearing input through read failures', async () => {
    const secretInput =
      'https://user:password@example.test/style.json?token=top-secret#private';

    await expect(
      generateProfile(
        {stylePath: secretInput, observedAt: '2026-08-29T00:00:00.000Z'},
        {
          readText: async (path) => {
            throw new Error(`ENOENT ${path}`);
          },
          now: () => new Date(0),
        },
      ),
    ).rejects.not.toThrow(/user|password|token|top-secret|private/);
  });

  it('marks style-only field domains and tile contents as unobserved', async () => {
    const profile = await generateProfile(
      {stylePath: 'style.json', observedAt: '2026-08-29T00:00:00.000Z'},
      {
        readText: async () =>
          JSON.stringify({
            version: 8,
            sources: {places: {type: 'vector'}},
            layers: [
              {
                id: 'places',
                type: 'circle',
                source: 'places',
                'source-layer': 'places',
                paint: {'circle-radius': ['get', 'rank']},
              },
            ],
          }),
        now: () => new Date(0),
      },
    );

    expect(profile.unresolved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'field-domain-unobserved',
          location: '#/sources/places/layers/places/fields/rank',
        }),
        expect.objectContaining({
          code: 'tile-contents-unobserved',
          location: '#/sources/places',
        }),
      ]),
    );
    expect(profile.unresolved.every((item) => item.evidence.length > 0)).toBe(true);
  });

  it('records redaction without retaining secrets from an explicitly sampled template', async () => {
    const profile = await generateProfile(
      {
        tileTemplate:
          'https://user:password@tiles.example/{z}/{x}/{y}.pbf?token=top-secret#private',
        bounds: [0, 0, 0, 0],
        zooms: [0],
        maxRequests: 1,
        observedAt: '2026-08-29T00:00:00.000Z',
      },
      {
        readText: async () => '{}',
        fetchTile: async () => pointTile(1, 'woodland'),
        now: () => new Date(0),
      },
    );
    const serialized = stableJson(profile);

    expect(profile.inputs).toEqual(['https://tiles.example/{z}/{x}/{y}.pbf']);
    expect(profile.unresolved.map((item) => item.code)).toContain('credential-redacted');
    expect(serialized).not.toMatch(/user|password|token|top-secret|private/);
  });
});

describe('generate-profile CLI', () => {
  it.each([
    ['bbox with an empty token', ['--bbox', '1,,2,3']],
    ['bbox with a whitespace token', ['--bbox', '1, ,2,3']],
    ['bbox with only three coordinates', ['--bbox', '1,2,3']],
    ['zooms with a trailing empty token', ['--zooms', '1,']],
    ['empty zooms', ['--zooms', '']],
    ['a non-finite zoom', ['--zooms', 'Infinity']],
    ['an empty max request count', ['--max-requests', '']],
    ['a whitespace max request count', ['--max-requests', '   ']],
    ['a NaN max request count', ['--max-requests', 'NaN']],
    ['an out-of-range longitude', ['--bbox', '-181,0,1,1']],
    ['an out-of-range latitude', ['--bbox', '0,-91,1,1']],
    ['zoom 25', ['--zooms', '25']],
    ['zero max requests', ['--max-requests', '0']],
  ])('exits 2 without output for %s', async (_caseName, invalidArgs) => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-profile-cli-'));
    temporaryDirectories.push(directory);

    const result = await runCli(
      [
        '--tile-template',
        './tiles/{z}/{x}/{y}.pbf',
        '--observed-at',
        '2026-08-29T00:00:00.000Z',
        ...invalidArgs,
        '--output',
        'profile.json',
      ],
      directory,
    );

    expect(result).toMatchObject({code: 2, stdout: ''});
    await expect(access(join(directory, 'profile.json'))).rejects.toThrow();
    expect(await readdir(directory)).toEqual([]);
  });

  it('writes the default DATA_PROFILE.json destination through the real entrypoint', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-profile-cli-'));
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'style.json'),
      JSON.stringify({version: 8, sources: {places: {type: 'vector'}}, layers: []}),
    );

    const result = await runCli(
      [
        '--',
        '--style',
        'style.json',
        '--allow-private-network',
        '--observed-at',
        '2026-08-29T00:00:00.000Z',
      ],
      directory,
    );

    expect(result).toMatchObject({code: 0, stderr: ''});
    const profile = JSON.parse(await readFile(join(directory, 'DATA_PROFILE.json'), 'utf8'));
    expect(profile).toMatchObject({
      format: 'cartography-data-profile/1',
      generatedAt: '2026-08-29T00:00:00.000Z',
    });
    expect(profile.unresolved.map((item: {code: string}) => item.code)).toContain(
      'tile-contents-unobserved',
    );
    expect(await readdir(directory)).toEqual(['DATA_PROFILE.json', 'style.json']);
  });

  it('rejects unknown flags and leaves no destination or sibling temporary file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-profile-cli-'));
    temporaryDirectories.push(directory);

    const result = await runCli(
      [
        '--tile-template',
        'https://user:password@tiles.example/{z}/{x}/{y}.pbf?token=secret',
        '--allow-private-network',
        '--observed-at',
        '2026-08-29T00:00:00.000Z',
        '--unknown-flag',
        '--output',
        'profile.json',
      ],
      directory,
    );

    expect(result.code).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toMatch(/password|token|secret/);
    await expect(access(join(directory, 'profile.json'))).rejects.toThrow();
    expect(await readdir(directory)).toEqual([]);
  });
});
