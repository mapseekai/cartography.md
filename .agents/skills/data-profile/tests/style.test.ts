import {describe, expect, it} from 'vitest';

import {collectReferencedFields, discoverStyle} from '../src/style.js';

describe('discoverStyle', () => {
  it('discovers vector source, layer zooms, and referenced fields without inferring values', () => {
    const fragment = discoverStyle(
      {
        version: 8,
        sources: {
          roads: {
            type: 'vector',
            url: 'https://tiles.example/roads.json',
            tiles: ['https://tiles.example/{z}/{x}/{y}.pbf'],
          },
        },
        layers: [
          {
            id: 'transportation-lines',
            type: 'line',
            source: 'roads',
            'source-layer': 'transportation',
            minzoom: 5,
            maxzoom: 16,
            filter: ['all', ['has', 'name'], ['==', 'class', 'primary']],
            paint: {'line-color': ['match', ['get', 'status'], 'open', '#0f0', '#f00']},
            layout: {'text-field': 'Road {ref}'},
          },
        ],
      },
      'style.json',
    );

    expect(fragment.sources.roads).toMatchObject({
      type: 'vector',
      tileTemplates: [
        'https://tiles.example/roads.json',
        'https://tiles.example/{z}/{x}/{y}.pbf',
      ],
    });
    expect(fragment.sources.roads.layers.transportation).toMatchObject({
      minzoom: 5,
      maxzoom: 16,
      geometries: ['unknown'],
      stableIdObserved: false,
    });
    expect(fragment.sources.roads.layers.transportation.fields.status.types).toEqual(['unknown']);
    expect(fragment.sources.roads.layers.transportation.fields.name.types).toEqual(['unknown']);
    expect(fragment.sources.roads.layers.transportation.fields.class.types).toEqual(['unknown']);
    expect(fragment.sources.roads.layers.transportation.fields.ref.types).toEqual(['unknown']);
    expect(fragment.sources.roads.layers.transportation.fields.status.categories).toEqual([]);
    expect(fragment.sources.roads.layers.transportation.evidence[0]?.kind).toBe('style-inferred');
    expect(fragment.sources.roads.layers.transportation.fields.status.evidence[0]?.kind).toBe(
      'style-inferred',
    );
  });

  it('reports unresolved style facts instead of guessing a layer or dynamic field', () => {
    const fragment = discoverStyle(
      {
        sources: {custom: {type: 'vector', url: 'mapbox://example.roads'}},
        layers: [
          {id: 'missing-source-layer', type: 'line', source: 'custom'},
          {
            id: 'dynamic-field',
            type: 'line',
            source: 'custom',
            'source-layer': 'roads',
            filter: ['==', ['get', ['var', 'fieldName']], 'primary'],
          },
        ],
      },
      'style.json',
    );

    expect(fragment.sources.custom.layers).toHaveProperty('default');
    expect(fragment.sources.custom.layers.roads.fields).toEqual({});
    expect(fragment.unresolved.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'vector-layer-missing-source-layer',
        'source-url-not-inspectable',
        'dynamic-field-reference',
      ]),
    );
    expect(fragment.unresolved.every((item) => item.evidence[0]?.kind === 'style-inferred')).toBe(true);
  });
});

describe('collectReferencedFields', () => {
  it('recognizes only supported expression and legacy filter field positions', () => {
    expect(
      collectReferencedFields([
        'all',
        ['get', 'modern'],
        ['has', 'present'],
        ['in', 'legacy', 'a', 'b'],
        ['literal', 'not-a-field'],
      ]),
    ).toEqual(['modern', 'present', 'legacy']);
  });
});
