import {validateStyleMin, type StyleSpecification} from '@maplibre/maplibre-gl-style-spec';
import type {Finding, LintRule} from '../../model/types.js';
import type {CartographyConfig} from '../../schema/cartography.js';
import type {DataProfile} from '../../schema/data-profile.js';
import {
  exactTokenReference,
  getAtPath,
  isRecord,
  resolveTokenValue,
  stableStringify,
  valueAtRelativePath,
} from '../../utils/object.js';
import {
  allStrings,
  containsFeatureState,
  getMetadata,
  isLegacyFilter,
  profileLayerForEncoding,
  styleLayers,
} from './helpers.js';

const DEFAULT_REQUIRED_METADATA = [
  'cartography:group',
  'cartography:role',
  'cartography:priority',
  'cartography:owner',
  'cartography:tokenRefs',
  'cartography:sourceRule',
];

function prefixFor(config: CartographyConfig): string {
  return config.maplibre?.rootMetadataPrefix ?? 'cartography';
}

function governedLayers(style: unknown, prefix: string): Array<Record<string, unknown>> {
  return styleLayers(style).filter((layer) =>
    Object.keys(getMetadata(layer)).some((key) => key.startsWith(`${prefix}:`)),
  );
}

export const mapLibreStyleSpecRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'maplibre-style-spec',
  severity: 'error',
  scope: 'style',
  description: 'Run the official MapLibre Style Specification validator.',
  run(context) {
    if (context.style === undefined) return [];
    try {
      const errors = validateStyleMin(context.style as StyleSpecification);
      return errors.map((error, index) => {
        const candidate = error as unknown as {message?: unknown; line?: unknown; identifier?: unknown};
        return {
          ruleId: this.id,
          severity: 'error' as const,
          path: typeof candidate.identifier === 'string' ? candidate.identifier : `style.${index}`,
          ...(typeof candidate.line === 'number' ? {line: candidate.line} : {}),
          message: typeof candidate.message === 'string' ? candidate.message : String(error),
        };
      });
    } catch (error) {
      return [{
        ruleId: this.id,
        severity: 'error',
        path: 'style',
        message: error instanceof Error ? error.message : 'The MapLibre style validator could not process this value.',
      }];
    }
  },
};

export const styleMetadataRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-metadata',
  severity: 'warning',
  scope: 'style',
  description: 'Governed style layers require traceable cartography.md metadata.',
  run(context) {
    if (!context.cartography || context.style === undefined) return [];
    const findings: Finding[] = [];
    const prefix = prefixFor(context.cartography);
    const rootMetadata = isRecord(context.style) && isRecord(context.style.metadata) ? context.style.metadata : {};
    if (typeof rootMetadata[`${prefix}:spec`] !== 'string') {
      findings.push({
        ruleId: this.id,
        severity: 'warning',
        path: `style.metadata.${prefix}:spec`,
        message: `Style root metadata should point to its CARTOGRAPHY.md using "${prefix}:spec".`,
      });
    }
    const layers = governedLayers(context.style, prefix);
    if (layers.length === 0) {
      findings.push({
        ruleId: this.id,
        severity: 'warning',
        path: 'style.layers',
        message: `No style layers contain ${prefix}:* governance metadata.`,
      });
      return findings;
    }
    const configured = context.cartography.maplibre?.layerMetadata?.required;
    const required = configured && configured.length > 0
      ? configured.map((key) => key.includes(':') ? key : `${prefix}:${key}`)
      : DEFAULT_REQUIRED_METADATA.map((key) => key.replace(/^cartography/, prefix));
    for (const [index, layer] of layers.entries()) {
      const metadata = getMetadata(layer);
      const layerId = typeof layer.id === 'string' ? layer.id : `#${index}`;
      for (const key of required) {
        if (!(key in metadata)) {
          findings.push({
            ruleId: this.id,
            severity: 'warning',
            path: `style.layers.${layerId}.metadata.${key}`,
            message: `Governed layer "${layerId}" is missing required metadata "${key}".`,
          });
        }
      }
    }
    return findings;
  },
};

export const styleSourceRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-source-rule',
  severity: 'error',
  scope: 'style',
  description: 'Governed style layers must agree with their declared cartographic encoding.',
  run(context) {
    if (!context.cartography || context.style === undefined) return [];
    const findings: Finding[] = [];
    const prefix = prefixFor(context.cartography);
    for (const layer of governedLayers(context.style, prefix)) {
      const metadata = getMetadata(layer);
      const layerId = typeof layer.id === 'string' ? layer.id : 'unknown';
      const sourceRule = metadata[`${prefix}:sourceRule`];
      if (typeof sourceRule !== 'string') continue;
      const encoding = context.cartography.encodings[sourceRule];
      if (!encoding) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `style.layers.${layerId}.metadata.${prefix}:sourceRule`,
          message: `Layer "${layerId}" references unknown encoding "${sourceRule}".`,
        });
        continue;
      }
      if (layer.source !== encoding.source) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `style.layers.${layerId}.source`,
          message: `Layer source ${JSON.stringify(layer.source)} differs from encoding source "${encoding.source}".`,
        });
      }
      if (encoding.sourceLayer && layer['source-layer'] !== encoding.sourceLayer) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `style.layers.${layerId}.source-layer`,
          message: `Layer source-layer ${JSON.stringify(layer['source-layer'])} differs from encoding sourceLayer "${encoding.sourceLayer}".`,
        });
      }
    }
    return findings;
  },
};

export const styleTokenRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-token-ref',
  severity: 'error',
  scope: 'style',
  description: 'Layer metadata token references must resolve and literal bindings must not drift.',
  run(context) {
    if (!context.cartography || context.style === undefined) return [];
    const findings: Finding[] = [];
    const prefix = prefixFor(context.cartography);
    for (const layer of governedLayers(context.style, prefix)) {
      const metadata = getMetadata(layer);
      const layerId = typeof layer.id === 'string' ? layer.id : 'unknown';
      const tokenRefs = metadata[`${prefix}:tokenRefs`];
      if (Array.isArray(tokenRefs)) {
        for (const [index, candidate] of tokenRefs.entries()) {
          const reference = exactTokenReference(candidate);
          if (!reference || !getAtPath(context.cartography, reference).found) {
            findings.push({
              ruleId: this.id,
              severity: 'error',
              path: `style.layers.${layerId}.metadata.${prefix}:tokenRefs.${index}`,
              message: `Token reference ${JSON.stringify(candidate)} does not resolve in CARTOGRAPHY.md.`,
            });
          }
        }
      }
      const bindings = metadata[`${prefix}:tokenBindings`];
      if (!isRecord(bindings)) continue;
      for (const [stylePath, candidate] of Object.entries(bindings)) {
        const reference = exactTokenReference(candidate);
        const resolved = resolveTokenValue(context.cartography, candidate);
        if (!reference || !resolved.resolved) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: `style.layers.${layerId}.metadata.${prefix}:tokenBindings.${stylePath}`,
            message: `Binding ${JSON.stringify(candidate)} is not a resolvable exact token reference.`,
          });
          continue;
        }
        const actual = valueAtRelativePath(layer, stylePath);
        if (stableStringify(actual) !== stableStringify(resolved.value)) {
          findings.push({
            ruleId: 'style-token-drift',
            severity: 'warning',
            path: `style.layers.${layerId}.${stylePath}`,
            message: `Style value ${stableStringify(actual)} has drifted from {${reference}} = ${stableStringify(resolved.value)}.`,
            evidence: {actual, expected: resolved.value, reference},
          });
        }
      }
    }
    return findings;
  },
};

export const styleLayerOrderRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-layer-order',
  severity: 'warning',
  scope: 'style',
  description: 'Governed style layers should follow the declared semantic group order.',
  run(context) {
    if (!context.cartography || context.style === undefined) return [];
    const findings: Finding[] = [];
    const prefix = prefixFor(context.cartography);
    const order = new Map(context.cartography.layerOrder.map((item) => [item.id, item.order]));
    let previous = Number.NEGATIVE_INFINITY;
    let previousLayer = '';
    for (const layer of governedLayers(context.style, prefix)) {
      const metadata = getMetadata(layer);
      const group = metadata[`${prefix}:group`];
      const layerId = typeof layer.id === 'string' ? layer.id : 'unknown';
      if (typeof group !== 'string') continue;
      const current = order.get(group);
      if (current === undefined) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `style.layers.${layerId}.metadata.${prefix}:group`,
          message: `Layer "${layerId}" uses undeclared group "${group}".`,
        });
        continue;
      }
      if (current < previous) {
        findings.push({
          ruleId: this.id,
          severity: 'warning',
          path: `style.layers.${layerId}`,
          message: `Layer "${layerId}" (group "${group}") renders above layer "${previousLayer}", but "${group}" has a lower layerOrder value.`,
          suggestion: 'Reorder the governed style layers to match the declared layerOrder sequence.',
        });
      }
      previous = Math.max(previous, current);
      previousLayer = layerId;
    }
    return findings;
  },
};

export const styleFeatureStateRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-stable-feature-id',
  severity: 'warning',
  scope: 'style',
  description: 'Feature-state expressions require stable identifiers in the associated data profile.',
  run(context) {
    if (!context.cartography || !context.dataProfile || context.style === undefined) return [];
    const findings: Finding[] = [];
    const prefix = prefixFor(context.cartography);
    for (const layer of governedLayers(context.style, prefix)) {
      if (!containsFeatureState(layer)) continue;
      const metadata = getMetadata(layer);
      const sourceRule = metadata[`${prefix}:sourceRule`];
      if (typeof sourceRule !== 'string') continue;
      const encoding = context.cartography.encodings[sourceRule];
      if (!encoding) continue;
      const profileLayer = profileLayerForEncoding(context.dataProfile, encoding);
      if (profileLayer && !profileLayer.idField) {
        const layerId = typeof layer.id === 'string' ? layer.id : 'unknown';
        findings.push({
          ruleId: this.id,
          severity: context.cartography.maplibre?.stableFeatureIdRequired ? 'error' : 'warning',
          path: `style.layers.${layerId}`,
          message: `Layer "${layerId}" uses feature-state but the profiled source layer has no stable idField.`,
        });
      }
    }
    return findings;
  },
};


export const stylePortabilityRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'style-portability',
  severity: 'warning',
  scope: 'style',
  description: 'Check portable resource protocols and preferred expression filter syntax.',
  run(context) {
    if (!context.cartography || context.style === undefined || !isRecord(context.style)) return [];
    const findings: Finding[] = [];
    const compatibility = context.cartography.target.compatibility ?? 'portable';
    if (compatibility !== 'renderer-specific') {
      for (const [rootKey, value] of Object.entries({
        glyphs: context.style.glyphs,
        sprite: context.style.sprite,
        sources: context.style.sources,
      })) {
        for (const candidate of allStrings(value)) {
          if (candidate.startsWith('mapbox://')) {
            findings.push({
              ruleId: this.id,
              severity: 'error',
              path: `style.${rootKey}`,
              message: `The portable MapLibre profile does not allow unresolved mapbox:// resources: ${candidate}.`,
            });
          }
        }
      }
    }
    for (const layer of styleLayers(context.style)) {
      if (layer.filter && isLegacyFilter(layer.filter)) {
        findings.push({
          ruleId: 'deprecated-filter-syntax',
          severity: 'warning',
          path: `style.layers.${String(layer.id ?? 'unknown')}.filter`,
          message: 'Generated styles should prefer expression filter syntax over legacy property-filter operands.',
          suggestion: 'Use ["get", field] and ["literal", values] where required.',
        });
      }
    }
    return findings;
  },
};

export const featureStatePlacementRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'feature-state-paint-only',
  severity: 'error',
  scope: 'style',
  description: 'Keep feature-state in paint properties when the contract requires paint-only state styling.',
  run(context) {
    if (!context.cartography?.maplibre?.featureStatePaintOnly || context.style === undefined) return [];
    const findings: Finding[] = [];
    for (const layer of styleLayers(context.style)) {
      if (isRecord(layer.layout) && containsFeatureState(layer.layout)) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `style.layers.${String(layer.id ?? 'unknown')}.layout`,
          message: 'feature-state is used in layout even though featureStatePaintOnly is enabled.',
        });
      }
    }
    return findings;
  },
};

export const STYLE_RULES: LintRule<CartographyConfig, DataProfile>[] = [
  mapLibreStyleSpecRule,
  styleMetadataRule,
  styleSourceRule,
  styleTokenRule,
  styleLayerOrderRule,
  styleFeatureStateRule,
  stylePortabilityRule,
  featureStatePlacementRule,
];

export function validateMapLibreStyle(
  style: unknown,
  cartography: CartographyConfig,
  dataProfile?: DataProfile,
): Finding[] {
  const context = {
    source: '',
    parsed: {source: '', rawFrontmatter: cartography, config: cartography, body: '', sections: [], findings: []},
    cartography,
    ...(dataProfile ? {dataProfile} : {}),
    style,
    maxDocumentBytes: 512_000,
  };
  return STYLE_RULES.flatMap((rule) => rule.run(context));
}
