import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';

const contract = `---
version: "0.1.0"
name: Contract test
target:
  renderer: maplibre
  styleSpecVersion: 8
  compatibility: portable
intent:
  mapType: operational
  primaryTask: inspect assets
  audience: [operator]
data:
  profileRequired: true
  bindings:
    id: asset_id
    status: operating_status
zoom:
  bands:
    site: [16, 24]
tokens:
  colors:
    normal: "#2F7D5B"
scales: {}
encodings:
  assets:
    source: assets
    geometry: point
    role: primary
    layerGroup: subject
    rules:
      - id: status
        field: "{data.bindings.status}"
        channel: circle-color
        value: "{tokens.colors.normal}"
layerOrder:
  - id: subject
    order: 10
maplibre:
  featureStatePaintOnly: true
---

## Overview

Test.
`;

const validProfile = {
  version: '0.1.0',
  sources: {
    assets: {
      type: 'geojson',
      sourceLayers: {
        default: {
          geometry: 'point',
          idField: 'asset_id',
          fields: {
            asset_id: {type: 'string'},
            operating_status: {type: 'string', categories: ['active']},
          },
        },
      },
    },
  },
};

describe('profile and style contracts', () => {
  it('requires a profile when declared', () => {
    const report = lint(contract);
    expect(report.findings.some((finding) => finding.ruleId === 'profile-required')).toBe(true);
    expect(report.valid).toBe(false);
  });

  it('reports a bound field absent from the selected source layer', () => {
    const profile = structuredClone(validProfile) as typeof validProfile & {sources: {assets: {sourceLayers: {default: {fields: Record<string, unknown>}}}}};
    const fields: Record<string, unknown> = profile.sources.assets.sourceLayers.default.fields;
    delete fields.operating_status;
    const report = lint(contract, {dataProfile: profile});
    expect(report.findings.some((finding) => finding.ruleId === 'profile-field')).toBe(true);
  });

  it('rejects portable mapbox resource URLs and feature-state in layout', () => {
    const style = {
      version: 8,
      glyphs: 'mapbox://fonts/example/{fontstack}/{range}.pbf',
      sources: {
        assets: {type: 'geojson', data: {type: 'FeatureCollection', features: []}},
      },
      layers: [
        {
          id: 'asset',
          type: 'circle',
          source: 'assets',
          metadata: {
            'cartography:group': 'subject',
            'cartography:role': 'primary',
            'cartography:priority': 10,
            'cartography:owner': 'agent',
            'cartography:tokenRefs': ['{tokens.colors.normal}'],
            'cartography:sourceRule': 'assets',
          },
          layout: {
            visibility: ['case', ['boolean', ['feature-state', 'selected'], false], 'visible', 'none'],
          },
          paint: {'circle-color': '#2F7D5B'},
        },
      ],
    };
    const report = lint(contract, {dataProfile: validProfile, style});
    expect(report.findings.some((finding) => finding.ruleId === 'style-portability')).toBe(true);
    expect(report.findings.some((finding) => finding.ruleId === 'feature-state-paint-only')).toBe(true);
  });
});
