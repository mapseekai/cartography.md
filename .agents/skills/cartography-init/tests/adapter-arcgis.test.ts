import { describe, expect, it } from 'vitest';
import { parseLyrx } from '../src/adapters/arcgis.js';
import { loadFixture } from './helpers.js';

describe('parseLyrx', () => {
  it('extracts CIM solid stroke/fill with pt units and hex colors', () => {
    const ir = parseLyrx(loadFixture('arcgis-min.lyrx'), 'arcgis-min.lyrx');
    expect(ir.source.kind).toBe('lyrx');
    const roads = ir.elements.find((e) => e.name === 'roads');
    expect(roads?.geometry).toBe('line');
    expect(roads?.style.strokeColor).toBe('#3388ff');
    expect(roads?.style.strokeWidth).toEqual({ value: 1.5, unit: 'pt' });
    const water = ir.elements.find((e) => e.name === 'water');
    expect(water?.geometry).toBe('polygon');
    expect(water?.style.fillColor).toBe('#d8ecff');
  });

  it('skips unsupported CIM effects with reasons', () => {
    const ir = parseLyrx(loadFixture('arcgis-min.lyrx'), 'arcgis-min.lyrx');
    for (const skipped of ir.skipped) expect(skipped.reason.length).toBeGreaterThan(0);
  });

  it('binds CIM unique-value group values to their renderer field', () => {
    const ir = parseLyrx(Buffer.from(JSON.stringify({
      layerDefinitions: [{
        name: 'land use',
        renderer: {
          type: 'CIMUniqueValueRenderer',
          fields: ['kind'],
          groups: [{ classes: [{
            label: 'park',
            values: [['park']],
            symbol: { symbol: { type: 'CIMPolygonSymbol', symbolLayers: [] } },
          }] }],
        },
      }],
    })), 'unique.lyrx');

    expect(ir.bindings).toContainEqual({
      source: 'lyrx', layer: 'park', family: 'land use', kind: 'field-ref', expression: 'kind = park',
    });
  });
});
