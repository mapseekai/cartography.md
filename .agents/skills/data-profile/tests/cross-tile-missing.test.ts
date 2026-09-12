import {create} from '@mapbox/mvt-fixtures';
import {describe, expect, it} from 'vitest';
import {generateProfile} from '../src/generate.js';

type TileKind = 'present' | 'missing' | 'empty' | 'other-layer';

function tile(kind: TileKind): Uint8Array {
  return create({layers: [{
    version: 2,
    name: kind === 'other-layer' ? 'other' : 'habitat',
    keys: kind === 'present' ? ['score'] : [],
    values: kind === 'present' ? [{int_value: 7}] : [],
    extent: 4096,
    features: kind === 'empty' ? [] : [{
      tags: kind === 'present' ? [0, 0] : [],
      type: 1,
      geometry: [9, 50, 34],
    }],
  }]}).buffer;
}

const observedAt = '2026-09-12T00:00:00Z';

async function profile(first: TileKind, second: TileKind) {
  return generateProfile({
    sourceId: 'ecology',
    tileTemplate: './tiles/{z}/{x}/{y}.pbf',
    bounds: [0, 0, 0, 0],
    zooms: [0, 1],
    maxRequests: 2,
    observedAt,
  }, {
    readText: async () => '{}',
    now: () => new Date(observedAt),
    fetchTile: async ({z}) => tile(z === 0 ? first : second),
  });
}

describe('cross-tile field absence', () => {
  it.each([
    ['present', 'missing'],
    ['missing', 'present'],
  ] as const)('retains absence evidence for %s then %s', async (first, second) => {
    const result = await profile(first, second);
    expect(result.sampling).toMatchObject({decoded: 2, failed: 0});
    const field = result.sources.ecology.layers.habitat.fields.score;
    expect(field).toMatchObject({
      types: ['integer'], categories: [7], minimum: 7, maximum: 7,
      missingObserved: true, nullObserved: false,
    });
    expect(field.evidence).toEqual([
      {kind: 'tile-sampled', input: './tiles/{z}/{x}/{y}.pbf', location: '#/tiles/0/0/0', observedAt},
      {kind: 'tile-sampled', input: './tiles/{z}/{x}/{y}.pbf', location: '#/tiles/1/1/1', observedAt},
    ]);
  });

  it.each(['present', 'empty', 'other-layer'] as const)(
    'does not infer field absence from a %s tile', async (second) => {
      const result = await profile('present', second);
      expect(result.sources.ecology.layers.habitat.fields.score.missingObserved).toBe(false);
    },
  );
});
