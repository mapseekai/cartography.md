import {describe, expect, it} from 'vitest';
import {cartographySchema} from '../schema/cartography.js';
import {lint} from '../linter/index.js';

const parse = (value: unknown) => cartographySchema.safeParse(value).success;
const base = {version: '0.3.0', name: ' Test '};

describe('cartography schema', () => {
  it('accepts the minimal document', () => expect(parse(base)).toBe(true));
  it('accepts standard groups and references', () => expect(parse({...base, colors: {ink: '#111'}, widths: {line: '{sizes.road}'}, sizes: {road: '2px'}})).toBe(true));
  it('preserves non-empty strings with surrounding whitespace', () => expect(parse({...base, name: ' name '})).toBe(true));
  it.each(['0.5px', '1px'])('accepts valid widths: %s', (dimension) => expect(parse({...base, widths: {line: dimension}})).toBe(true));
  it.each(['-0px', '1rem', '+1px', '.5px'])('rejects invalid dimensions: %s', (dimension) => expect(parse({...base, widths: {line: dimension}})).toBe(false));
  it('accepts negative em where a Dimension is valid', () => expect(parse({...base, typography: {label: {fontFamily: 'Noto', fontSize: '12px', letterSpacing: '-0.02em'}}})).toBe(true));
  it('requires typography fontFamily and fontSize', () => expect(parse({...base, typography: {label: {fontFamily: 'Noto'}}})).toBe(false));
  it('accepts typography references', () => expect(parse({...base, typography: {label: '{symbols.type}'}, symbols: {type: {fontFamily: 'Noto', fontSize: '12px'}}})).toBe(true));
  it('reports reserved MapElement properties', () => expect(lint(`---
version: "0.3.0"
name: Reserved
elements:
  road:
    geometry: line
    strokeWidth: "1px"
    source: x
---

## Overview

Text.
`).findings).toContainEqual(expect.objectContaining({ruleId: 'element-reserved-property'})));
  it('requires omitted objects to be closed', () => expect(parse({...base, omitted: [{section: 'Colors', extra: true}]})).toBe(false));
  it('requires patterns to be non-empty', () => expect(parse({...base, elements: {water: {geometry: 'polygon', pattern: []}}})).toBe(false));
  it('requires exact lowercase geometry and fontWeight literals', () => {
    expect(parse({...base, typography: {label: {fontFamily: 'Noto', fontSize: '12px', fontWeight: 'Bold'}}})).toBe(false);
    expect(parse({...base, elements: {road: {geometry: 'Line', strokeWidth: '1px'}}})).toBe(false);
  });
});
