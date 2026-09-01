import { describe, expect, it } from 'vitest';
import { emitDocument } from '../src/emit.js';
import { consolidate } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

function sample() {
  const ir = emptyExtracted({ kind: 'style', name: 'Demo' });
  ir.colors.push({ value: '#3388ff', nameHint: 'accent', usedBy: ['road-a'] });
  ir.widths.push({ value: { value: 2, unit: 'px' }, nameHint: 'line', usedBy: ['road-a'] });
  ir.elements.push({
    name: 'road-a', geometry: 'line', family: 'road', roleHint: 'primary',
    style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } },
    scaleHints: [{ fact: 'zoom 5–15 可见' }],
  });
  ir.scaleHints.push({ fact: 'zoom 5–15 可见' });
  return { ir, c: consolidate(ir) };
}

describe('emitDocument', () => {
  it('emits version 0.3.0 front matter with token references', () => {
    const { ir, c } = sample();
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    expect(doc).toContain('version: "0.3.0"');
    expect(doc).toContain('name: Demo Atlas');
    expect(doc).toContain('accent: "#3388ff"');
    expect(doc).toContain('strokeColor: "{colors.accent}"');
    expect(doc).toContain('strokeWidth: "{widths.line}"');
  });

  it('keeps all nine sections non-empty and marks unknowns as TODO(agent)', () => {
    const { ir, c } = sample();
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    for (const h of ['## Overview', '## Color', '## Typography & Labels', '## Composition & Density',
      '## Layering & Depth', '## Geometry & Symbols', '## Scale & Generalization',
      '## Map Elements', '## Data & Legend']) {
      expect(doc).toContain(h);
    }
    expect(doc).toContain('TODO(agent)');
    expect(doc).toContain('zoom 5–15 可见');
  });

  it('never leaks bindings into the document', () => {
    const { ir, c } = sample();
    ir.bindings.push({ source: 'style', layer: 'roads', kind: 'filter', expression: '"highway" = \'primary\'' });
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    expect(doc).not.toContain('highway');
    expect(doc).not.toContain('dataProfile');
  });
});
