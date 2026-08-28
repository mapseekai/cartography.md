import type {Finding, LintRule} from '../../model/types.js';
import type {CartographyConfig, CartographyScale} from '../../schema/cartography.js';
import {dataProfileSchema, type DataProfile} from '../../schema/data-profile.js';
import {resolveTokenValue} from '../../utils/object.js';
import {profileLayerForEncoding} from './helpers.js';

function resolveFieldName(config: CartographyConfig, value: string | undefined): string | undefined {
  if (!value) return undefined;
  const resolved = resolveTokenValue(config, value);
  return resolved.resolved && typeof resolved.value === 'string' ? resolved.value : undefined;
}

function scaleForRule(config: CartographyConfig, scaleId: string | undefined): CartographyScale | undefined {
  return scaleId ? config.scales[scaleId] : undefined;
}

export const profileRequiredRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'profile-required',
  severity: 'error',
  scope: 'profile',
  description: 'Require a data profile when the cartographic contract declares it necessary.',
  run(context) {
    if (!context.cartography?.data.profileRequired || context.dataProfile) return [];
    return [{
      ruleId: this.id,
      severity: 'error',
      path: 'data.profile',
      message: 'The contract requires DATA_PROFILE.json, but no data profile was supplied.',
      suggestion: 'Pass --profile, use lintFile(), or place the declared profile next to CARTOGRAPHY.md.',
    }];
  },
};

export const profileSourceRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'profile-source',
  severity: 'error',
  scope: 'profile',
  description: 'Encoding sources and source layers must exist in the data profile.',
  run(context) {
    if (!context.cartography || !context.dataProfile) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      const source = context.dataProfile.sources[encoding.source];
      if (!source) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `encodings.${encodingId}.source`,
          message: `Source "${encoding.source}" is absent from DATA_PROFILE.json.`,
        });
        continue;
      }
      if (encoding.sourceLayer && !source.sourceLayers[encoding.sourceLayer]) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `encodings.${encodingId}.sourceLayer`,
          message: `Source layer "${encoding.sourceLayer}" is absent from profiled source "${encoding.source}".`,
        });
      }
      if (!encoding.sourceLayer && source.type === 'vector' && Object.keys(source.sourceLayers).length > 1) {
        findings.push({
          ruleId: this.id,
          severity: 'warning',
          path: `encodings.${encodingId}.sourceLayer`,
          message: `Vector source "${encoding.source}" has multiple source layers; the encoding should select one explicitly.`,
        });
      }
    }
    return findings;
  },
};

export const profileGeometryRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'profile-geometry',
  severity: 'warning',
  scope: 'profile',
  description: 'Encoding geometry and zoom availability should match the profiled data.',
  run(context) {
    if (!context.cartography || !context.dataProfile) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      const layer = profileLayerForEncoding(context.dataProfile, encoding);
      if (!layer) continue;
      if (encoding.geometry !== 'mixed' && layer.geometry !== 'mixed' && encoding.geometry !== layer.geometry) {
        findings.push({
          ruleId: this.id,
          severity: 'warning',
          path: `encodings.${encodingId}.geometry`,
          message: `Encoding geometry "${encoding.geometry}" differs from profiled geometry "${layer.geometry}".`,
        });
      }
      if (layer.minzoom !== undefined && encoding.minzoom !== undefined && encoding.minzoom < layer.minzoom) {
        findings.push({
          ruleId: 'profile-zoom',
          severity: 'warning',
          path: `encodings.${encodingId}.minzoom`,
          message: `Encoding starts at zoom ${encoding.minzoom}, but profiled data begins at zoom ${layer.minzoom}.`,
        });
      }
      if (layer.maxzoom !== undefined && encoding.maxzoom !== undefined && encoding.maxzoom > layer.maxzoom) {
        findings.push({
          ruleId: 'profile-zoom',
          severity: 'warning',
          path: `encodings.${encodingId}.maxzoom`,
          message: `Encoding ends at zoom ${encoding.maxzoom}, but profiled data ends at zoom ${layer.maxzoom}.`,
        });
      }
    }
    return findings;
  },
};

export const profileFieldRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'profile-field',
  severity: 'error',
  scope: 'profile',
  description: 'Semantic bindings and labels must resolve to fields available on the selected source layer.',
  run(context) {
    if (!context.cartography || !context.dataProfile) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      const layer = profileLayerForEncoding(context.dataProfile, encoding);
      if (!layer) continue;
      for (const [ruleIndex, rule] of encoding.rules.entries()) {
        const scale = scaleForRule(context.cartography, rule.scale);
        const fieldName = resolveFieldName(context.cartography, rule.field ?? scale?.field);
        if (fieldName && !layer.fields[fieldName]) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: `encodings.${encodingId}.rules.${ruleIndex}.field`,
            message: `Field "${fieldName}" is absent from ${encoding.source}/${encoding.sourceLayer ?? 'default'}.`,
          });
        }
      }
      const labelFields = [encoding.labels?.field, ...(encoding.labels?.fallbacks ?? [])]
        .map((value) => resolveFieldName(context.cartography!, value))
        .filter((value): value is string => Boolean(value));
      for (const [index, fieldName] of labelFields.entries()) {
        if (!layer.fields[fieldName]) {
          findings.push({
            ruleId: this.id,
            severity: index === 0 ? 'error' : 'warning',
            path: `encodings.${encodingId}.labels`,
            message: `Label field "${fieldName}" is absent from ${encoding.source}/${encoding.sourceLayer ?? 'default'}.`,
          });
        }
      }
    }
    return findings;
  },
};

export const categoryCoverageRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'category-coverage',
  severity: 'warning',
  scope: 'profile',
  description: 'Categorical scale domains should cover categories observed in the data profile.',
  run(context) {
    if (!context.cartography || !context.dataProfile) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      const layer = profileLayerForEncoding(context.dataProfile, encoding);
      if (!layer) continue;
      for (const [ruleIndex, rule] of encoding.rules.entries()) {
        const scale = scaleForRule(context.cartography, rule.scale);
        if (!scale || !['nominal', 'ordinal'].includes(scale.type) || !scale.values) continue;
        const fieldName = resolveFieldName(context.cartography, rule.field ?? scale.field);
        const categories = fieldName ? layer.fields[fieldName]?.categories : undefined;
        if (!categories) continue;
        const covered = new Set(Object.keys(scale.values));
        const missing = categories
          .filter((category) => category !== null && !covered.has(String(category)))
          .map(String);
        if (missing.length === 0) continue;
        findings.push({
          ruleId: this.id,
          severity: Object.prototype.hasOwnProperty.call(scale, 'fallback') ? 'warning' : 'error',
          path: `encodings.${encodingId}.rules.${ruleIndex}.scale`,
          message: `Scale "${rule.scale}" does not explicitly cover profiled categories: ${missing.join(', ')}.`,
          suggestion: Object.prototype.hasOwnProperty.call(scale, 'fallback')
            ? 'Confirm that these categories should intentionally use the fallback.'
            : 'Add explicit values or a neutral fallback.',
        });
      }
    }
    return findings;
  },
};

export const stableFeatureIdRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'stable-feature-id',
  severity: 'warning',
  scope: 'profile',
  description: 'Feature-state encodings require stable feature identifiers.',
  run(context) {
    if (!context.cartography || !context.dataProfile) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      if (!encoding.states || Object.keys(encoding.states).length === 0) continue;
      const layer = profileLayerForEncoding(context.dataProfile, encoding);
      if (layer && !layer.idField) {
        findings.push({
          ruleId: this.id,
          severity: context.cartography.maplibre?.stableFeatureIdRequired ? 'error' : 'warning',
          path: `encodings.${encodingId}.states`,
          message: `Encoding "${encodingId}" declares interaction states, but its profiled layer has no stable idField.`,
        });
      }
    }
    return findings;
  },
};

export const PROFILE_RULES: LintRule<CartographyConfig, DataProfile>[] = [
  profileRequiredRule,
  profileSourceRule,
  profileGeometryRule,
  profileFieldRule,
  categoryCoverageRule,
  stableFeatureIdRule,
];

export function parseDataProfile(input: unknown): {profile?: DataProfile; findings: Finding[]} {
  const result = dataProfileSchema.safeParse(input);
  if (result.success) return {profile: result.data as DataProfile, findings: []};
  return {
    findings: result.error.issues.map((issue: {path: Array<string | number>; message: string}) => ({
      ruleId: 'profile-schema',
      severity: 'error' as const,
      path: issue.path.length > 0 ? `dataProfile.${issue.path.join('.')}` : 'dataProfile',
      message: issue.message,
    })),
  };
}
