import {Ajv2020} from 'ajv/dist/2020.js';
import {describe, expect, it} from 'vitest';
import portableSchema from '../../../../schema/cartography.schema.json' with {type: 'json'};
import {cartographySchema} from '../schema/cartography.js';

const cases = [
  {input: {version: '0.2.0', name: 'Minimal'}, valid: true},
  {input: {version: '0.2.0', name: 'Tokens', tokens: {colors: {ink: '#111'}}}, valid: true},
  {input: {version: '0.1.0', name: 'Old'}, valid: false},
  {input: {version: '0.2.0', name: 'Bad opacity', tokens: {opacities: {muted: 2}}}, valid: false},
];

describe('generated cartography JSON Schema', () => {
  it('matches Zod at the 0.2 document boundary', () => {
    const ajv = new Ajv2020({strict: false});
    const validate = ajv.compile(portableSchema);

    for (const sample of cases) {
      expect(cartographySchema.safeParse(sample.input).success).toBe(sample.valid);
      expect(validate(sample.input)).toBe(sample.valid);
    }
  });
});
