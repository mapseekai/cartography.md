import type {Finding, LintRule} from '../../model/types.js';
import {dimensionSchema, typographyTokenSchema} from '../../schema/cartography.js';
import {contrastRatio, resolveColor} from '../../utils/color.js';
import {
  containsValue,
  exactTokenReference,
  flattenLeaves,
  resolveReferencesDeep,
  resolveTokenValue,
} from '../../utils/object.js';

export const colorTokenRule: LintRule = {
  id: 'color-token',
  severity: 'error',
  scope: 'document',
  description: 'Validates color tokens as generic CSS colors.',
  run(context) {
    if (!context.cartography?.tokens?.colors) return [];
    const findings: Finding[] = [];
    for (const [name, value] of Object.entries(context.cartography.tokens.colors)) {
      const {color, resolved} = resolveColor(context.cartography, value);
      if (!resolved) continue;
      if (color) continue;
      findings.push({
        ruleId: this.id,
        severity: this.severity,
        path: `tokens.colors.${name}`,
        message: `Color token "${name}" must be a valid CSS color.`,
        suggestion: 'Use a CSS Color value, such as #1a2b3c, rgb(26 43 60), or oklch(62% 0.18 250).',
      });
    }
    return findings;
  },
};

function resolvedKnownToken(root: unknown, value: unknown): {ready: boolean; value?: unknown} {
  const resolved = resolveTokenValue(root, value);
  if (!resolved.resolved) return {ready: false};
  const deep = resolveReferencesDeep(resolved.value, root);
  if (containsValue(deep, (candidate) => exactTokenReference(candidate) !== undefined)) {
    return {ready: false};
  }
  return {ready: true, value: deep};
}

export const knownTokenTypeRule: LintRule = {
  id: 'known-token-type',
  severity: 'error',
  scope: 'document',
  description: 'Validates resolved width, size, opacity, and typography token values.',
  run(context) {
    const tokens = context.cartography?.tokens;
    if (!context.cartography || !tokens) return [];
    const findings: Finding[] = [];
    const groups: Array<{
      name: 'widths' | 'sizes' | 'opacities' | 'typography';
      expected: string;
      valid(value: unknown): boolean;
    }> = [
      {
        name: 'widths',
        expected: 'a finite nonnegative number or dimension string',
        valid: (value) => dimensionSchema.safeParse(value).success,
      },
      {
        name: 'sizes',
        expected: 'a finite nonnegative number or dimension string',
        valid: (value) => dimensionSchema.safeParse(value).success,
      },
      {
        name: 'opacities',
        expected: 'a finite number from 0 through 1',
        valid: (value) =>
          typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1,
      },
      {
        name: 'typography',
        expected: 'a valid typography object',
        valid: (value) => typographyTokenSchema.safeParse(value).success,
      },
    ];

    for (const group of groups) {
      const values = tokens[group.name];
      if (!values) continue;
      for (const [name, value] of Object.entries(values)) {
        const resolved = resolvedKnownToken(context.cartography, value);
        if (!resolved.ready || group.valid(resolved.value)) continue;
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path: `tokens.${group.name}.${name}`,
          message: `Resolved ${group.name} token "${name}" must be ${group.expected}.`,
          suggestion: 'Point the reference at a value valid for the destination token group.',
        });
      }
    }
    return findings;
  },
};

export const contrastPairsRule: LintRule = {
  id: 'contrast-pairs',
  severity: 'error',
  scope: 'document',
  description: 'Checks declared color pairs against their WCAG 2.1 contrast minimum.',
  run(context) {
    const pairs = context.cartography?.accessibility?.contrastPairs;
    if (!context.cartography || !pairs) return [];
    const findings: Finding[] = [];
    for (const [index, pair] of pairs.entries()) {
      const foreground = resolveColor(context.cartography, pair.foreground);
      const background = resolveColor(context.cartography, pair.background);
      const path = `accessibility.contrastPairs.${index}`;
      if (!foreground.resolved || !background.resolved) continue;
      if (!foreground.color || !background.color) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `Contrast pair "${pair.id}" must resolve to valid CSS colors.`,
          suggestion: 'Use direct CSS colors or exact references to valid tokens.colors values.',
        });
        continue;
      }
      if (foreground.color.alpha !== 1 || background.color.alpha !== 1) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `Contrast pair "${pair.id}" must resolve to fully opaque colors; rendered compositing is required before semitransparent colors can be evaluated.`,
          suggestion: 'Declare an opaque foreground/background pair or evaluate the composited render with a target-specific accessibility tool.',
        });
        continue;
      }
      const actual = contrastRatio(foreground.color, background.color);
      if (actual >= pair.minimum) continue;
      findings.push({
        ruleId: this.id,
        severity: this.severity,
        path,
        message: `Contrast pair "${pair.id}" has a WCAG 2.1 ratio of ${actual.toFixed(2)}:1; its minimum is ${pair.minimum}:1.`,
        suggestion: 'Adjust the foreground or background color to meet the declared minimum contrast ratio.',
        evidence: {actual, minimum: pair.minimum},
      });
    }
    return findings;
  },
};

export const contractSummaryRule: LintRule = {
  id: 'contract-summary',
  severity: 'info',
  scope: 'document',
  description: 'Summarizes loaded token leaves, token groups, and prose sections.',
  run(context) {
    const tokens = context.cartography?.tokens;
    const groups = tokens ? Object.keys(tokens).length : 0;
    const leaves = tokens ? Object.keys(flattenLeaves(tokens)).length : 0;
    const sections = context.parsed.sections.length;
    return [{
      ruleId: this.id,
      severity: this.severity,
      path: '$',
      message: `Loaded ${leaves} token leaves across ${groups} token groups and ${sections} prose sections.`,
    }];
  },
};

export const CARTOGRAPHY_RULES: LintRule[] = [
  colorTokenRule,
  knownTokenTypeRule,
  contrastPairsRule,
  contractSummaryRule,
];
