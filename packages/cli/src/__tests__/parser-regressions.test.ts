import {describe, expect, it} from 'vitest';
import {lint} from '../linter/index.js';
import {parseCartography} from '../parser/parse.js';
import {canonicalSectionName} from '../parser/sections.js';

const doc = (yaml = '', body = '## Overview\n\nText.') =>
  `---\nversion: "0.4.0"\nname: Test\n${yaml}---\n${body}`;

describe('YAML representation checks', () => {
  it.each([
    'description: "Use *primary and !important with &anchor and <<: text"\n',
    "description: 'Use *primary and !important with &anchor and <<: text'\n",
    '# *example !important &anchor <<: ordinary comment\n',
    'description: |\n  Use *primary !important &anchor <<: text\n  color: #fff\n',
    'description: >\n  Use *primary !important &anchor <<: text\n',
  ])('accepts literal text: %s', (yaml) => {
    expect(lint(doc(yaml)).summary.errors).toBe(0);
  });

  it.each([
    ['custom: [!!str 123]\n', 'yaml-custom-tag-prohibited'],
    ['custom: [!local value]\n', 'yaml-custom-tag-prohibited'],
    ['custom: [&foo abc]\n', 'yaml-alias-prohibited'],
    ['custom: [*foo]\n', 'yaml-alias-prohibited'],
    ['custom: {<<: {a: value}}\n', 'yaml-merge-key-prohibited'],
  ])('rejects flow syntax: %s', (yaml, ruleId) => {
    expect(lint(doc(yaml)).findings).toContainEqual(expect.objectContaining({ruleId, severity: 'error', line: 4}));
  });

  it('keeps hex color diagnostics outside literal block text', () => {
    expect(lint(doc('colors:\n  ink: #fff\n')).findings).toContainEqual(
      expect.objectContaining({ruleId: 'yaml-hex-color-unquoted', line: 5}),
    );
  });
});

describe('list section boundaries', () => {
  it.each([
    '- item\n\n  ## Overview\n\n  Nested.',
    '- item\nlazy paragraph continuation\n  ## Overview\n\n  Nested.',
    '1. item\n\n   ## Overview\n\n   Nested.',
    '- item\n  - nested\n\n    ## Overview\n\n  ## Colors\n\n  Still in outer item.',
    '- item\n\n  ```md\n  ## Overview\n  ```',
    '- item\n\n  ```md\n  ## Overview\n',
  ])('ignores list headings after blank lines: %s', (list) => {
    const parsed = parseCartography(doc('', `## Overview\n\n${list}\n\n## Colors\n\nActual.`));
    expect(parsed.sections.map((section) => section.heading)).toEqual(['Overview', 'Colors']);
    expect(parsed.sections[0]?.body).toContain(list);
    expect(parsed.findings).not.toContainEqual(expect.objectContaining({ruleId: 'duplicate-section'}));
  });

  it('recognizes indented top-level headings after exiting a list', () => {
    const parsed = parseCartography(doc('', '- item\n\nOutside paragraph.\n\n  ## Colors\n\nText.'));
    expect(parsed.sections.map((section) => section.heading)).toEqual(['Colors']);
  });

  it('keeps list markers inside top-level fences from changing section context', () => {
    const parsed = parseCartography(doc('', '```md\n- item\n```\n\n  ## Colors\n\nText.'));
    expect(parsed.sections.map((section) => section.heading)).toEqual(['Colors']);
  });

  it('ends top-level HTML blocks at a blank line before scanning lists', () => {
    const parsed = parseCartography(doc('', '<div>\n- literal\n</div>\n\n  ## Colors\n\nText.'));
    expect(parsed.sections.map((section) => section.heading)).toEqual(['Colors']);
  });
});

describe('own-property name lookup', () => {
  it('rejects constructor as an omitted standard section', () => {
    const report = lint(doc('omitted: [constructor]\n'));
    expect(report.valid).toBe(false);
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'omitted-sections', severity: 'error'}));
  });

  it('preserves repeated unknown constructor headings', () => {
    expect(canonicalSectionName('constructor')).toBeUndefined();
    const report = lint(doc('', '## constructor\n\nA.\n\n## constructor\n\nB.'));
    expect(report.sections).toEqual(['constructor', 'constructor']);
    expect(report.valid).toBe(true);
  });

  it('does not reserve constructor metadata on elements or custom mappings', () => {
    const report = lint(doc('elements:\n  road:\n    geometry: line\n    strokeWidth: 1px\n    constructor: metadata\ncustom:\n  constructor: metadata\n'));
    expect(report.findings.filter((finding) => ['element-reserved-property', 'data-binding-suspicion'].includes(finding.ruleId))).toEqual([]);
    expect(report.valid).toBe(true);
  });

  it('does not relabel schema errors for an element named constructor', () => {
    const report = lint(doc('elements:\n  constructor: false\n'));
    expect(report.findings).toContainEqual(expect.objectContaining({ruleId: 'schema', path: 'elements.constructor'}));
    expect(report.findings).not.toContainEqual(expect.objectContaining({ruleId: 'element-reserved-property'}));
  });
});
