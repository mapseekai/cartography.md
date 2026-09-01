import {Ajv2020} from 'ajv/dist/2020.js';
import {describe, expect, it} from 'vitest';
import schema from '../../../../schema/cartography-front-matter.schema.json' with {type: 'json'};
import {cartographySchema} from '../schema/cartography.js';

const minimal = {version: '0.3.0', name: 'Test'};
const cases: Array<[string, unknown]> = [
  ['minimal', minimal], ['color', {...minimal, colors: {ink: '#111'}}], ['width', {...minimal, widths: {line: '0.5px'}}], ['size', {...minimal, sizes: {icon: '2px'}}], ['opacity', {...minimal, opacities: {muted: 0.5}}], ['spacing', {...minimal, spacing: {gap: '1px'}}], ['dash', {...minimal, dashes: {road: ['1px', '2px']}}], ['element', {...minimal, elements: {road: {geometry: 'line', strokeWidth: '1px'}}}], ['literal reject', {...minimal, name: '{colors.ink}'}], ['identifier 2xl', {...minimal, sizes: {'2xl': '2px'}}], ['identifier Chinese', {...minimal, sizes: {中文: '2px'}}], ['identifier dot', {...minimal, sizes: {'a.b': '2px'}}], ['reference', {...minimal, widths: {line: '{colors.ink}'}}], ['index reference', {...minimal, custom: {a: ['x']}, widths: {line: '{a.b[0]}'}}], ['leading zero index', {...minimal, widths: {line: '{a.b[01]}'}}], ['bare root reference', {...minimal, widths: {line: '{colors}'}}], ['negative zero', {...minimal, widths: {line: '-0px'}}], ['rem', {...minimal, widths: {line: '1rem'}}], ['typography required', {...minimal, typography: {label: {fontFamily: 'Noto'}}}], ['font weight case', {...minimal, typography: {label: {fontFamily: 'Noto', fontSize: '12px', fontWeight: 'Bold'}}}], ['geometry case', {...minimal, elements: {x: {geometry: 'Line', size: '1px'}}}], ['element style', {...minimal, elements: {x: {geometry: 'line'}}}], ['reserved', {...minimal, elements: {x: {geometry: 'line', size: '1px', source: 'a'}}}], ['omitted closed', {...minimal, omitted: [{section: 'Colors', x: 1}]}], ['dash min', {...minimal, dashes: {x: ['1px']}}], ['pattern nonempty', {...minimal, elements: {x: {geometry: 'line', pattern: []}}}]
];

describe('JSON schema parity', () => {
  it('accepts and rejects the same 0.3.0 inputs in Zod and Ajv', () => {
    const validate = new Ajv2020({strict: false}).compile(schema);
    for (const [name, value] of cases) expect(cartographySchema.safeParse(value).success, name).toBe(validate(value));
  });
});
