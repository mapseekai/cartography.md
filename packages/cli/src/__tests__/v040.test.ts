import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {lint, parseCartography, resolveReferences} from '../api.js';

const doc = (yaml: string, prose = '') => `---\nversion: "0.4.0"\nname: Contract\n${yaml}\n---\n\n## Overview\n\nA precise contract.\n${prose}`;

describe('0.4.0 visual contract', () => {
  it('resolves the technical network casing contract to a 6px bottom stroke', async () => {
    const source = await readFile('../../examples/technical-network/CARTOGRAPHY.md', 'utf8');
    const resolved = resolveReferences(parseCartography(source).rawFrontmatter) as {elements: Record<string, Record<string, unknown>>};
    const line = resolved.elements['pipeline-primary']!;
    expect(line.strokeWidth).toBe('4px');
    expect(line.casingWidth).toBe('1px');
    // Adapter contract projection, not a claim of rendered target equivalence.
    const bottomWidth = parseFloat(line.strokeWidth as string) + 2 * parseFloat(line.casingWidth as string);
    expect(bottomWidth).toBe(6);
  });
  it.each(['quiet-atlas', 'technical-network', 'thematic-map'])('lints the complete %s example', async name => {
    const source = await readFile(`../../examples/${name}/CARTOGRAPHY.md`, 'utf8');
    const report = lint(source);
    expect(report.findings.filter(f => f.severity === 'error')).toEqual([]);
    expect(report.sections).toHaveLength(9);
  });

  it.each(['0.3.0', '0.3.1', '0.5.0'])('rejects unsupported %s without rewriting source', version => {
    const source = doc('colors:\n  ink: "#123456"').replace('0.4.0', version);
    const parsed = parseCartography(source);
    expect(parsed.config).toBeUndefined();
    expect(parsed.rawFrontmatter).toMatchObject({version});
    expect(parsed.findings).toContainEqual(expect.objectContaining({path: 'version', message: expect.stringContaining('Unsupported format version')}));
    expect(lint(source).valid).toBe(false);
  });

  it.each([
    'sizes:\n  invalid: -1px',
    'spacing:\n  invalid: -2px',
    'elements:\n  point:\n    geometry: point\n    size: -1px',
    'elements:\n  label:\n    geometry: label\n    spacing: -1px',
    'colors:\n  ink: "#123456"\nelements:\n  line:\n    geometry: line\n    casingWidth: "{colors.ink}"',
    'elements:\n  line:\n    geometry: line\n    color: "#123456"\n    state: "{states.critical}"',
    'elements:\n  line:\n    geometry: line\n    color: "#123456"\n    paint: {}',
    'elements:\n  line:\n    geometry: line\n    color: "#123456"\n    field: population',
  ])('rejects invalid structure or reference: %s', yaml => {
    expect(lint(doc(yaml)).valid).toBe(false);
  });

  it('resolves prose stages and preserves opaque combined states without merging', () => {
    const source = doc(`widths:
  overview: 1px
  local: 4px
  casing: 1px
sizes:
  point: 12px
spacing:
  gap: 2px
elements:
  critical:
    geometry: line
    color: "#A32828"
    dash: [4px, 2px]
  critical-selected:
    geometry: line
    state: critical-selected
    strokeWidth: "{widths.local}"
    casingWidth: "{widths.casing}"`, '\n## Scale & Generalization\n\nOverview uses {widths.overview}; local uses {widths.local}.');
    expect(lint(source).valid).toBe(true);
    const raw = parseCartography(source).rawFrontmatter;
    const resolved = resolveReferences(raw) as {elements: Record<string, Record<string, unknown>>};
    expect(resolved.elements['critical-selected']).toEqual({geometry: 'line', state: 'critical-selected', strokeWidth: '4px', casingWidth: '1px'});
    expect(lint(source.replace('{widths.overview};', '{widths.missing};')).valid).toBe(false);
  });
});
