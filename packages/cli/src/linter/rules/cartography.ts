import type {Finding, LintRule} from '../../model/types.js';
import {contrastRatio, resolveColor} from '../../utils/color.js';
import {flattenLeaves} from '../../utils/object.js';

export const colorTokenRule: LintRule = {
  id: 'color-token',
  severity: 'error',
  scope: 'document',
  description: 'Validates color tokens as generic CSS colors.',
  run(context) {
    if (!context.cartography?.tokens?.colors) return [];
    const findings: Finding[] = [];
    for (const [name, value] of Object.entries(context.cartography.tokens.colors)) {
      const {color} = resolveColor(context.cartography, value);
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
  contrastPairsRule,
  contractSummaryRule,
];
