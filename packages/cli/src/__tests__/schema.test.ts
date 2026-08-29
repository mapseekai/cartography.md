import {describe, expect, it} from 'vitest';
import {cartographySchema} from '../schema/cartography.js';

const minimal = {version: '0.2.0', name: 'Quiet Atlas'};

describe('cartographySchema 0.2', () => {
  it('accepts the minimal prose-first document', () => {
    expect(cartographySchema.safeParse(minimal).success).toBe(true);
  });

  it('accepts known token groups and exact references', () => {
    const result = cartographySchema.safeParse({
      ...minimal,
      tokens: {
        colors: {ink: '#25221D', label: '{tokens.colors.ink}'},
        typography: {label: {fontFamily: 'Noto Sans', fontSize: 12, fontWeight: 400}},
        widths: {hairline: 0.5},
        sizes: {symbol: '8px'},
        opacities: {context: 0.55},
      },
    });
    expect(result.success).toBe(true);
  });

  it.each([
    [{...minimal, version: '0.1.0'}, 'version'],
    [{...minimal, tokens: {opacities: {context: 1.1}}}, 'opacities'],
    [{...minimal, name: '   '}, 'name'],
  ])('rejects invalid input %j at %s', (input, _path) => {
    expect(cartographySchema.safeParse(input).success).toBe(false);
  });
});
