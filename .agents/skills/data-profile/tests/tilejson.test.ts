import {describe, expect, it} from 'vitest';

import {discoverTileJson} from '../src/tilejson.js';

describe('discoverTileJson', () => {
  it('records TileJSON declarations as metadata without treating them as observations', () => {
    const fragment = discoverTileJson(
      {
        tilejson: '3.0.0',
        tiles: ['https://tiles.example/{z}/{x}/{y}.pbf'],
        bounds: [100, 20, 110, 30],
        center: [105, 25, 7],
        minzoom: 4,
        maxzoom: 14,
        vector_layers: [
          {
            id: 'habitat',
            fields: {class: 'String', score: 'Number', rank: 'INTEGER', active: 'Boolean', meta: 'JSON'},
            minzoom: 6,
            maxzoom: 14,
          },
        ],
      },
      'ecology',
      'tilejson.json',
    );

    expect(fragment.sources.ecology).toMatchObject({
      type: 'vector',
      tileTemplates: ['https://tiles.example/{z}/{x}/{y}.pbf'],
      bounds: [100, 20, 110, 30],
      center: [105, 25, 7],
      minzoom: 4,
      maxzoom: 14,
    });
    expect(fragment.sources.ecology.layers.habitat.minzoom).toBe(6);
    expect(fragment.sources.ecology.layers.habitat.maxzoom).toBe(14);
    expect(fragment.sources.ecology.layers.habitat.fields).toMatchObject({
      class: {types: ['string'], categories: [], missingObserved: false, nullObserved: false},
      score: {types: ['number'], categories: [], missingObserved: false, nullObserved: false},
      rank: {types: ['integer'], categories: [], missingObserved: false, nullObserved: false},
      active: {types: ['boolean'], categories: [], missingObserved: false, nullObserved: false},
      meta: {types: ['json'], categories: [], missingObserved: false, nullObserved: false},
    });
    expect(fragment.sources.ecology.evidence[0]?.kind).toBe('tilejson-declared');
    expect(fragment.sources.ecology.layers.habitat.evidence[0]?.kind).toBe('tilejson-declared');
    expect(fragment.sources.ecology.layers.habitat.fields.score.evidence[0]?.kind).toBe(
      'tilejson-declared',
    );
  });

  it('retains only credential-safe templates and marks unknown declarations unresolved', () => {
    const fragment = discoverTileJson(
      {
        tiles: [
          'https://user:password@tiles.example/{z}/{x}/{y}.pbf?token=top-secret#private',
          'mapbox://tileset/{z}/{x}/{y}',
        ],
        vector_layers: [{id: 'places', fields: {kind: 'enum'}}],
      },
      'places',
      'tilejson.json',
    );

    expect(fragment.sources.places.tileTemplates).toEqual([
      'https://tiles.example/{z}/{x}/{y}.pbf',
      'mapbox://tileset/{z}/{x}/{y}',
    ]);
    expect(fragment.sources.places.layers.places.fields.kind.types).toEqual(['unknown']);
    expect(fragment.unresolved.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'credential-redacted',
        'tile-template-not-inspectable',
        'tilejson-field-type-unknown',
      ]),
    );
    expect(fragment.unresolved.every((item) => item.evidence[0]?.kind === 'tilejson-declared')).toBe(
      true,
    );
    expect(JSON.stringify(fragment)).not.toContain('user');
    expect(JSON.stringify(fragment)).not.toContain('password');
    expect(JSON.stringify(fragment)).not.toContain('top-secret');
    expect(JSON.stringify(fragment)).not.toContain('token');
    expect(JSON.stringify(fragment)).not.toContain('private');
  });
});
