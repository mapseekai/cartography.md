import { describe, expect, it } from 'vitest';
import { consolidate, slugify } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

describe('slugify', () => {
  it('keeps TokenIdentifier charset and transliterates nothing', () => {
    expect(slugify('Roads (primary)')).toBe('roads-primary');
    expect(slugify('主干道')).toBe('');
    expect(slugify('a  b__c')).toBe('a-b__c');
  });
});

describe('consolidate', () => {
  it('dedups colors by value and prefers semantic name hints', () => {
    const ir = emptyExtracted({ kind: 'style' });
    ir.colors.push(
      { value: '#3388ff', nameHint: 'Roads Primary', usedBy: ['l1'] },
      { value: '#3388ff', nameHint: 'roads-primary', usedBy: ['l2'] },
      { value: '#ffffff', usedBy: ['l3'] },
    );
    const c = consolidate(ir);
    expect(Object.values(c.tokens.colors)).toEqual(['#3388ff', '#ffffff']);
    expect(c.tokens.colors['roads-primary']).toBe('#3388ff');
    expect(c.tokens.colors['color-1']).toBe('#ffffff');
  });

  it('assigns roles within a family and replaces element values with token names', () => {
    const ir = emptyExtracted({ kind: 'style' });
    ir.colors.push({ value: '#3388ff', nameHint: 'accent', usedBy: ['a', 'b'] });
    ir.elements.push(
      { name: 'road-a', geometry: 'line', family: 'road', roleHint: 'primary', style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } }, scaleHints: [] },
      { name: 'road-b', geometry: 'line', family: 'road', roleHint: 'secondary', style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } }, scaleHints: [] },
    );
    ir.widths.push({ value: { value: 2, unit: 'px' }, nameHint: 'line', usedBy: ['a', 'b'] });
    const c = consolidate(ir);
    expect(c.elements[0]!.role).toBe('primary');
    expect(c.elements[0]!.style.strokeColor).toBe('accent');
    expect(c.elements[0]!.style.strokeWidth).toBe('line');
  });
});
