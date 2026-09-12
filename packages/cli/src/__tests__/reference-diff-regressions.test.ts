import {describe, expect, it} from 'vitest';
import {diffCartography} from '../linter/diff.js';
import {lint, resolveReferences} from '../linter/index.js';
import {resolveTokenReference} from '../utils/object.js';

function document(yaml: string): string {
  return `---\nversion: "0.4.0"\nname: Regression\n${yaml}\n---\n\n## Overview\n\nText.\n`;
}

describe('composite reference cycles', () => {
  it.each([
    'custom: {a: {child: "{custom.a}"}}',
    'custom: {a: ["{custom.a}"]}',
    'custom: {a: {child: "{custom.b}"}, b: [{again: "{custom.a}"}]}',
  ])('rejects an unused composite cycle: %s', (yaml) => {
    const report = lint(document(yaml));
    expect(report.valid).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({
      ruleId: 'token-reference', severity: 'error', message: expect.stringContaining('(cycle)'),
    }));
  });

  it('resolves shared acyclic composites without changing the input', () => {
    const root = {custom: {leaf: {value: 1}, pair: ['{custom.leaf}', '{custom.leaf}']}};
    const original = structuredClone(root);
    expect(resolveTokenReference(root, 'custom.pair').resolved).toBe(true);
    expect(resolveReferences(root)).toEqual({custom: {leaf: {value: 1}, pair: [{value: 1}, {value: 1}]}});
    expect(root).toEqual(original);
  });

  it('preserves raw path traversal through composites', () => {
    const root = {custom: {leaf: {value: 1}, alias: '{custom.leaf}', pair: ['{custom.alias.value}']}};
    expect(resolveTokenReference(root, 'custom.pair')).toMatchObject({resolved: false, reason: 'traverses-reference'});
  });

  it('enforces the reference depth limit through composites', () => {
    const custom: Record<string, unknown> = {end: 1};
    for (let index = 100; index >= 0; index -= 1) custom[`n${index}`] = [`{custom.${index === 100 ? 'end' : `n${index + 1}`}}`];
    expect(resolveTokenReference({custom}, 'custom.n0')).toMatchObject({resolved: false, reason: 'depth-limit'});
  });

  it('checks a branching reference DAG without expanding all paths', () => {
    const custom: Record<string, unknown> = {n0: {value: 1}};
    for (let index = 1; index <= 30; index += 1) custom[`n${index}`] = [`{custom.n${index - 1}}`, `{custom.n${index - 1}}`];
    expect(resolveTokenReference({custom}, 'custom.n30').resolved).toBe(true);
  });

  it('does not reuse a shallow validation beyond the reference depth limit', () => {
    const custom: Record<string, unknown> = {end: 1, leaf: ['{custom.end}'], pair: ['{custom.n0}', '{custom.leaf}']};
    for (let index = 0; index < 98; index += 1) custom[`n${index}`] = `{custom.${index === 97 ? 'leaf' : `n${index + 1}`}}`;
    expect(resolveTokenReference({custom}, 'custom.pair')).toMatchObject({resolved: false, reason: 'depth-limit'});
  });
});

describe('unambiguous diff leaf paths', () => {
  it.each([
    ['a.b', 'a: {b: 2}'],
    ['a[0]', 'a: [2]'],
  ])('detects changes to the literal key %s beside its structural lookalike', (key, nested) => {
    const before = document(`custom: {${JSON.stringify(key)}: 1, ${nested}}`);
    const after = document(`custom: {${JSON.stringify(key)}: 3, ${nested}}`);
    expect(lint(before).valid).toBe(true);
    expect(lint(after).valid).toBe(true);
    expect(diffCartography(before, after).values).toEqual({added: [], removed: [], modified: [`$.custom[${JSON.stringify(key)}]`]});
  });

  it('distinguishes a literal dotted key from a nested leaf with the same value', () => {
    const before = document('custom: {"a.b": 1}');
    const after = document('custom: {a: {b: 1}}');
    expect(diffCartography(before, after).values).toEqual({added: ['$.custom.a.b'], removed: ['$.custom["a.b"]'], modified: []});
  });

  it('preserves ordinary token paths', () => {
    expect(diffCartography(document('widths: {thin: 1px}'), document('widths: {thin: 2px}')).values.modified).toEqual(['$.widths.thin']);
  });

  it.each(['quoted"key', 'line\nbreak', 'trailing\n'])('escapes the extension key %j', (key) => {
    const before = document(`custom: {${JSON.stringify(key)}: 1}`);
    const after = document(`custom: {${JSON.stringify(key)}: 2}`);
    expect(diffCartography(before, after).values.modified).toEqual([`$.custom[${JSON.stringify(key)}]`]);
  });
});
