import type * as z from 'zod';
import type {Finding, LintRule} from '../../model/types.js';
import {
  absoluteDimensionSchema,
  nonEmptyString,
  nonNegativeAbsoluteDimensionSchema,
  opacitySchema,
  patternSpecSchema,
  positiveAbsoluteDimensionSchema,
  typographySchema,
} from '../../schema/cartography.js';
import {isCoreColor} from '../../utils/color.js';
import {
  extractTokenReferences,
  isRecord,
  resolveReferencesDeep,
  resolveTokenValue,
  walkObject,
} from '../../utils/object.js';
import {maskMarkdownReferenceLiterals} from '../../parser/markdown.js';

const STYLE_GROUPS = ['colors', 'typography', 'widths', 'sizes', 'opacities', 'spacing', 'dashes'] as const;
const DIMENSION_GROUPS = ['widths', 'sizes', 'spacing'] as const;
const ELEMENT_COLOR_PROPERTIES = new Set(['color', 'fillColor', 'strokeColor', 'outlineColor', 'casingColor', 'haloColor']);
/** Resolved-type requirement per element style property (§9.6); colors and dash have dedicated rules. */
const ELEMENT_PROPERTY_TYPES: Record<string, {schema: z.ZodType; label: string}> = {
  strokeWidth: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  outlineWidth: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  casingWidth: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  haloWidth: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  size: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  spacing: {schema: nonNegativeAbsoluteDimensionSchema, label: 'a non-negative absolute dimension'},
  offset: {schema: absoluteDimensionSchema, label: 'an absolute dimension'},
  opacity: {schema: opacitySchema, label: 'an opacity between 0 and 1'},
  fillOpacity: {schema: opacitySchema, label: 'an opacity between 0 and 1'},
  strokeOpacity: {schema: opacitySchema, label: 'an opacity between 0 and 1'},
  typography: {schema: typographySchema, label: 'a valid Typography object'},
  symbol: {schema: nonEmptyString, label: 'a non-empty string'},
  pattern: {schema: patternSpecSchema, label: 'a non-empty pattern value'},
};

/** Resolve a value and, for composite results, every descendant reference; undefined when unresolvable. */
function resolveFinal(root: unknown, value: unknown): unknown {
  const result = resolveTokenValue(root, value);
  return result.resolved ? resolveReferencesDeep(result.value, root) : undefined;
}

export const colorTokenRule: LintRule = {
  id: 'color-token',
  severity: 'error',
  scope: 'document',
  description: 'Requires resolved color values to be self-contained CSS Color 4 colors.',
  run({cartography}) {
    const findings: Finding[] = [];
    const examine = (value: unknown, path: string) => {
      const finalValue = resolveFinal(cartography, value);
      if (finalValue !== undefined && (typeof finalValue !== 'string' || !isCoreColor(finalValue))) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `The resolved color value at "${path}" is not a self-contained CSS Color 4 color.`,
        });
      }
    };
    for (const [key, value] of Object.entries(cartography.colors ?? {})) {
      examine(value, `colors.${key}`);
    }
    for (const [element, value] of Object.entries(cartography.elements ?? {})) {
      if (!isRecord(value)) continue;
      for (const [key, item] of Object.entries(value)) {
        if (ELEMENT_COLOR_PROPERTIES.has(key)) examine(item, `elements.${element}.${key}`);
      }
    }
    return findings;
  },
};

export const knownTokenTypeRule: LintRule = {
  id: 'known-token-type',
  severity: 'error',
  scope: 'document',
  description: 'Requires resolved token values to satisfy the type of the group or field that uses them.',
  run({cartography}) {
    const findings: Finding[] = [];
    const report = (path: string, message: string) => {
      findings.push({ruleId: this.id, severity: this.severity, path, message});
    };
    for (const group of DIMENSION_GROUPS) {
      for (const [key, value] of Object.entries(cartography[group] ?? {})) {
        const finalValue = resolveFinal(cartography, value);
        if (finalValue !== undefined && !nonNegativeAbsoluteDimensionSchema.safeParse(finalValue).success) {
          report(`${group}.${key}`, `The resolved value at "${group}.${key}" is not a non-negative absolute dimension.`);
        }
      }
    }
    for (const [key, value] of Object.entries(cartography.opacities ?? {})) {
      const finalValue = resolveFinal(cartography, value);
      if (finalValue !== undefined && !opacitySchema.safeParse(finalValue).success) {
        report(`opacities.${key}`, `The resolved value at "opacities.${key}" is not an opacity between 0 and 1.`);
      }
    }
    for (const [key, value] of Object.entries(cartography.typography ?? {})) {
      const finalValue = resolveFinal(cartography, value);
      if (finalValue !== undefined && !typographySchema.safeParse(finalValue).success) {
        report(`typography.${key}`, `The resolved value at "typography.${key}" is not a valid Typography object.`);
      }
    }
    for (const [element, value] of Object.entries(cartography.elements ?? {})) {
      if (!isRecord(value)) continue;
      for (const [property, requirement] of Object.entries(ELEMENT_PROPERTY_TYPES)) {
        if (!Object.hasOwn(value, property)) continue;
        const finalValue = resolveFinal(cartography, value[property]);
        if (finalValue !== undefined && !requirement.schema.safeParse(finalValue).success) {
          report(`elements.${element}.${property}`, `The resolved value at "elements.${element}.${property}" is not ${requirement.label}.`);
        }
      }
    }
    return findings;
  },
};

export const dashPatternRule: LintRule = {
  id: 'dash-pattern',
  severity: 'error',
  scope: 'document',
  description: 'Requires resolved dash patterns to have an even member count, positive absolute dimensions, and one common unit.',
  run({cartography}) {
    const findings: Finding[] = [];
    const check = (value: unknown, path: string) => {
      const dash = resolveFinal(cartography, value);
      if (
        !Array.isArray(dash) ||
        dash.length < 2 ||
        dash.length % 2 !== 0 ||
        !dash.every((item) => positiveAbsoluteDimensionSchema.safeParse(resolveFinal(cartography, item)).success)
      ) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `The dash pattern at "${path}" must contain an even number of positive absolute dimensions.`,
        });
        return;
      }
      const units = dash.map((item) => /(?:px|pt|mm|cm|in)$/.exec(String(resolveFinal(cartography, item)))?.[0]);
      if (new Set(units).size > 1) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `The dash pattern at "${path}" must use one common unit.`,
        });
      }
    };
    for (const [key, value] of Object.entries(cartography.dashes ?? {})) {
      check(value, `dashes.${key}`);
    }
    for (const [key, element] of Object.entries(cartography.elements ?? {})) {
      if (isRecord(element) && Object.hasOwn(element, 'dash')) check(element.dash, `elements.${key}.dash`);
    }
    return findings;
  },
};

export const unusedTokenRule: LintRule = {
  id: 'unused-token',
  severity: 'info',
  scope: 'document',
  description: 'Notes standard-group tokens that neither prose nor other values reference.',
  run({cartography, parsed}) {
    const referenced = [
      ...walkObject(cartography)
        .filter((entry) => typeof entry.value === 'string')
        .flatMap((entry) => extractTokenReferences(entry.value as string)),
      ...extractTokenReferences(maskMarkdownReferenceLiterals(parsed.body)),
    ];
    return STYLE_GROUPS.flatMap((group) =>
      Object.keys(cartography[group] ?? {})
        .filter((key) => !referenced.includes(`${group}.${key}`))
        .map((key) => ({
          ruleId: this.id,
          severity: this.severity,
          path: `${group}.${key}`,
          message: `The token "${group}.${key}" is not referenced.`,
        })),
    );
  },
};

export const emptyTokenGroupRule: LintRule = {
  id: 'empty-token-group',
  severity: 'info',
  scope: 'document',
  description: 'Notes standard token groups that are present but empty.',
  run({cartography}) {
    return STYLE_GROUPS.filter((group) => isRecord(cartography[group]) && Object.keys(cartography[group]).length === 0).map(
      (group) => ({
        ruleId: this.id,
        severity: this.severity,
        path: group,
        message: `The standard token group "${group}" is empty.`,
      }),
    );
  },
};

export const undocumentedElementRule: LintRule = {
  id: 'undocumented-element',
  severity: 'info',
  scope: 'document',
  description: 'Notes elements that the Map Elements section does not mention.',
  run({cartography, parsed}) {
    const body = parsed.sections.find((section) => section.canonicalHeading === 'Map Elements')?.body ?? '';
    return Object.keys(cartography.elements ?? {})
      .filter((key) => !body.includes(key))
      .map((key) => ({
        ruleId: this.id,
        severity: this.severity,
        path: `elements.${key}`,
        message: `The element "${key}" is not mentioned in the Map Elements section.`,
      }));
  },
};

export const contractSummaryRule: LintRule = {
  id: 'contract-summary',
  severity: 'info',
  scope: 'document',
  description: 'Summarizes loaded token leaves, token groups, and prose sections.',
  run({cartography, parsed}) {
    const active = [...STYLE_GROUPS, 'elements'].filter((group) => isRecord(cartography[group]));
    const leaves = active.reduce(
      (count, group) =>
        count + walkObject(cartography[group]).filter((entry) => !isRecord(entry.value) && !Array.isArray(entry.value)).length,
      0,
    );
    return [{
      ruleId: this.id,
      severity: this.severity,
      message: `Loaded ${leaves} token leaves across ${active.length} token groups and ${parsed.sections.length} prose sections.`,
    }];
  },
};

export const CARTOGRAPHY_RULES: LintRule[] = [
  colorTokenRule,
  knownTokenTypeRule,
  dashPatternRule,
  unusedTokenRule,
  emptyTokenGroupRule,
  undocumentedElementRule,
  contractSummaryRule,
];
