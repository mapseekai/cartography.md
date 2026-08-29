import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {create} from '@mapbox/mvt-fixtures';
import {describe, expect, it, vi} from 'vitest';

import {
  sampleTiles,
  tileCandidates,
  type SamplerOptions,
  type TileFetcher,
} from '../src/sampling.js';

function options(overrides: Partial<SamplerOptions> = {}): SamplerOptions {
  return {
    template: 'https://tiles.example/{z}/{x}/{y}.pbf',
    bounds: [-180, -85, 180, 85],
    zooms: [4, 5],
    concurrency: 4,
    maxRequests: 40,
    maxNonEmpty: 30,
    stableStop: 8,
    timeoutMs: 10_000,
    retries: 2,
    maxResponseBytes: 5 * 1024 * 1024,
    maxTotalBytes: 50 * 1024 * 1024,
    allowPrivateNetwork: false,
    ...overrides,
  };
}

function pointTile(layerName = 'places'): Uint8Array {
  return create({
    layers: [
      {
        version: 2,
        name: layerName,
        keys: ['name'],
        values: [{string_value: 'Harbor'}],
        extent: 4096,
        features: [{id: 1, tags: [0, 0], type: 1, geometry: [9, 50, 34]}],
      },
    ],
  }).buffer;
}

describe('tileCandidates', () => {
  it('sorts zooms and coordinates while removing duplicate center, corner, and quarter tiles', () => {
    expect(tileCandidates([-180, -85, 180, 85], [1, 0, 1])).toEqual([
      {z: 0, x: 0, y: 0},
      {z: 1, x: 0, y: 0},
      {z: 1, x: 0, y: 1},
      {z: 1, x: 1, y: 0},
      {z: 1, x: 1, y: 1},
    ]);
  });
});

describe('sampleTiles', () => {
  it('never exceeds the configured fetch concurrency', async () => {
    let active = 0;
    let peak = 0;
    const fetcher: TileFetcher = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return new Uint8Array();
    };

    const result = await sampleTiles(options({maxRequests: 12, retries: 0}), fetcher);

    expect(peak).toBe(4);
    expect(result.summary.requested).toBe(12);
    expect(result.summary.stopReason).toBe('budget-exhausted');
  });

  it('performs only the initial attempt plus two configured retries', async () => {
    let attempts = 0;
    const fetcher: TileFetcher = async () => {
      attempts += 1;
      throw new Error('temporary failure');
    };

    const result = await sampleTiles(
      options({bounds: [0, 0, 0, 0], zooms: [0], maxRequests: 20}),
      fetcher,
    );

    expect(attempts).toBe(3);
    expect(result.summary).toMatchObject({requested: 3, failed: 1});
    expect(result.unresolved.map((item) => item.code)).toEqual(['tile-fetch-failed']);
    expect(result.summary.stopReason).toBe('candidates-exhausted');
  });

  it('counts retry attempts against maxRequests and never retries forever', async () => {
    let attempts = 0;
    const fetcher: TileFetcher = async () => {
      attempts += 1;
      throw new Error('still unavailable');
    };

    const result = await sampleTiles(options({maxRequests: 5, retries: 20}), fetcher);

    expect(attempts).toBe(5);
    expect(result.summary.requested).toBe(5);
    expect(result.summary.stopReason).toBe('budget-exhausted');
  });

  it('reports candidates exhausted when the final successful candidate exactly meets the budget', async () => {
    const result = await sampleTiles(
      options({
        bounds: [0, 0, 0, 0],
        zooms: [0],
        maxRequests: 1,
        retries: 2,
      }),
      async () => pointTile(),
    );

    expect(result.summary.requested).toBe(1);
    expect(result.summary.stopReason).toBe('candidates-exhausted');
    expect(result.unresolved.map((item) => item.code)).not.toContain(
      'sampling-budget-exhausted',
    );
  });

  it('stops after eight consecutive non-empty observations add no structure', async () => {
    const tile = pointTile();
    const fetcher: TileFetcher = async () => tile;

    const result = await sampleTiles(options({concurrency: 1, retries: 0}), fetcher);

    expect(result.observations).toHaveLength(9);
    expect(result.summary).toMatchObject({requested: 9, decoded: 9, empty: 0, failed: 0});
    expect(result.summary.stopReason).toBe('structure-stable');
  });

  it('samples explicit local file templates without network access', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cartography-sampling-'));
    try {
      await writeFile(join(directory, '0-0-0.pbf'), pointTile('local'));

      const result = await sampleTiles(
        options({
          template: join(directory, '{z}-{x}-{y}.pbf'),
          bounds: [0, 0, 0, 0],
          zooms: [0],
          retries: 0,
        }),
      );

      expect(result.summary).toMatchObject({requested: 1, decoded: 1, failed: 0});
      expect(result.observations[0]?.observation.layers.local.featureCount).toBe(1);
    } finally {
      await rm(directory, {recursive: true});
    }
  });

  it('returns unsupported protocols as unresolved without retaining URL credentials', async () => {
    const result = await sampleTiles(
      options({
        template:
          'ftp://user:password@tiles.example/{z}/{x}/{y}.pbf?token=top-secret#private',
      }),
    );
    const serialized = JSON.stringify(result);

    expect(result.summary.requested).toBe(0);
    expect(result.unresolved.map((item) => item.code)).toEqual([
      'tile-template-not-inspectable',
    ]);
    expect(serialized).not.toContain('user');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('top-secret');
    expect(serialized).not.toContain('private');
  });

  it('blocks loopback HTTP targets by default before issuing a fetch', async () => {
    const result = await sampleTiles(
      options({
        template: 'http://127.0.0.1/{z}/{x}/{y}.pbf',
        bounds: [0, 0, 0, 0],
        zooms: [0],
        retries: 0,
      }),
    );

    expect(result.summary).toMatchObject({requested: 1, decoded: 0, failed: 1});
    expect(result.unresolved.map((item) => item.code)).toEqual([
      'tile-private-network-blocked',
    ]);
  });

  it.each(['[::1]', '[fc00::1]', '[fe80::1]'])(
    'blocks loopback, private, and link-local IPv6 target %s',
    async (host) => {
      const result = await sampleTiles(
        options({
          template: `http://${host}/{z}/{x}/{y}.pbf`,
          bounds: [0, 0, 0, 0],
          zooms: [0],
          retries: 0,
        }),
      );

      expect(result.unresolved.map((item) => item.code)).toEqual([
        'tile-private-network-blocked',
      ]);
    },
  );

  it('permits at most three manual redirects', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {status: 302, headers: {location: '/next'}}),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const result = await sampleTiles(
        options({
          template: 'http://127.0.0.1/{z}/{x}/{y}.pbf',
          bounds: [0, 0, 0, 0],
          zooms: [0],
          retries: 0,
          allowPrivateNetwork: true,
        }),
      );

      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(result.unresolved.map((item) => item.code)).toEqual(['tile-redirect-limit']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('revalidates the protocol of every manual redirect target', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {status: 302, headers: {location: 'file:///private/tile.pbf'}}),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const result = await sampleTiles(
        options({
          template: 'http://127.0.0.1/{z}/{x}/{y}.pbf',
          bounds: [0, 0, 0, 0],
          zooms: [0],
          retries: 0,
          allowPrivateNetwork: true,
        }),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.unresolved.map((item) => item.code)).toEqual([
        'tile-template-not-inspectable',
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('enforces response and total-byte caps for injected fetchers', async () => {
    const oversized = await sampleTiles(
      options({
        bounds: [0, 0, 0, 0],
        zooms: [0],
        retries: 20,
        maxResponseBytes: 2,
      }),
      async () => new Uint8Array(3),
    );
    const totalLimited = await sampleTiles(
      options({maxRequests: 10, retries: 0, maxResponseBytes: 10, maxTotalBytes: 4}),
      async () => new Uint8Array(3),
    );

    expect(oversized.summary).toMatchObject({requested: 1, bytes: 0, failed: 1});
    expect(oversized.unresolved.map((item) => item.code)).toEqual([
      'tile-response-too-large',
    ]);
    expect(totalLimited.summary.bytes).toBeLessThanOrEqual(4);
    expect(totalLimited.summary.stopReason).toBe('budget-exhausted');
    expect(totalLimited.unresolved.map((item) => item.code)).toContain(
      'tile-total-bytes-exceeded',
    );
  });

  it('applies injected-fetch byte budgets in candidate order, not completion order', async () => {
    const firstTile = pointTile('alpha');
    const secondTile = pointTile('bravo');
    expect(firstTile.byteLength).toBe(secondTile.byteLength);

    const result = await sampleTiles(
      options({
        bounds: [-180, -85, 180, 85],
        zooms: [1],
        concurrency: 2,
        maxRequests: 2,
        retries: 0,
        maxResponseBytes: firstTile.byteLength,
        maxTotalBytes: firstTile.byteLength,
      }),
      async (coordinate) => {
        if (coordinate.y === 0) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return firstTile;
        }
        return secondTile;
      },
    );

    expect(result.observations.map(({coordinate}) => coordinate)).toEqual([{z: 1, x: 0, y: 0}]);
    expect(Object.keys(result.observations[0]!.observation.layers)).toEqual(['alpha']);
    expect(result.summary.stopReason).toBe('budget-exhausted');
  });

  it('times out an injected fetcher even when it ignores the abort signal', async () => {
    const result = await sampleTiles(
      options({
        bounds: [0, 0, 0, 0],
        zooms: [0],
        retries: 0,
        timeoutMs: 5,
      }),
      async () => new Promise<Uint8Array>(() => undefined),
    );

    expect(result.summary).toMatchObject({requested: 1, failed: 1});
    expect(result.unresolved.map((item) => item.code)).toEqual(['tile-fetch-timeout']);
  });
});
