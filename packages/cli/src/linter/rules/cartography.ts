import type {Finding, LintRule} from '../../model/types.js';
import type {CartographyConfig} from '../../schema/cartography.js';
import type {DataProfile} from '../../schema/data-profile.js';
import {parseMapColor, resolveColor, contrastRatio} from '../../utils/color.js';
import {flattenLeaves, resolveTokenValue, walkObject, isRecord} from '../../utils/object.js';

export const colorTokenRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'color-token',
  severity: 'error',
  scope: 'document',
  description: 'Color tokens must resolve to values understood by the MapLibre style parser.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    const leaves = flattenLeaves(context.cartography.tokens.colors, 'tokens.colors');
    for (const [path, value] of Object.entries(leaves)) {
      if (value !== null && typeof value === 'object') continue;
      const resolved = resolveTokenValue(context.cartography, value);
      if (!resolved.resolved) continue;
      if (!parseMapColor(resolved.value)) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path,
          message: `Color token does not resolve to a valid MapLibre color: ${JSON.stringify(resolved.value)}.`,
        });
      }
    }
    return findings;
  },
};

export const zoomBandRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'zoom-bands',
  severity: 'error',
  scope: 'document',
  description: 'Zoom bands must have increasing bounds and may not overlap.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    const bands = Object.entries(context.cartography.zoom.bands);
    const sorted = [...bands].sort((left, right) => left[1][0] - right[1][0]);
    for (const [name, [minimum, maximum]] of bands) {
      if (minimum >= maximum) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `zoom.bands.${name}`,
          message: `Zoom band ${name} must have minzoom < maxzoom; received [${minimum}, ${maximum}].`,
        });
      }
    }
    let maxEndBand = sorted[0];
    for (const band of sorted.slice(1)) {
      if (maxEndBand && band[1][0] < maxEndBand[1][1]) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `zoom.bands.${band[0]}`,
          message: `Zoom band ${band[0]} overlaps ${maxEndBand[0]}.`,
          evidence: {previous: maxEndBand[1], current: band[1]},
        });
      }
      if (!maxEndBand || band[1][1] > maxEndBand[1][1]) maxEndBand = band;
    }
    return findings;
  },
};

export const layerOrderRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'layer-order',
  severity: 'error',
  scope: 'document',
  description: 'Layer groups require unique identifiers and strictly increasing order values.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    const ids = new Set<string>();
    const orders = new Set<number>();
    let previous = Number.NEGATIVE_INFINITY;
    context.cartography.layerOrder.forEach((item, index) => {
      if (ids.has(item.id)) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `layerOrder.${index}.id`,
          message: `Duplicate layer-order group "${item.id}".`,
        });
      }
      if (orders.has(item.order)) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `layerOrder.${index}.order`,
          message: `Layer-order value ${item.order} is duplicated.`,
        });
      }
      ids.add(item.id);
      orders.add(item.order);
      if (item.order <= previous) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `layerOrder.${index}.order`,
          message: 'layerOrder values must be strictly increasing in document order.',
        });
      }
      previous = item.order;
    });
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      if (!ids.has(encoding.layerGroup)) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `encodings.${encodingId}.layerGroup`,
          message: `Encoding references unknown layer group "${encoding.layerGroup}".`,
        });
      }
    }
    return findings;
  },
};

export const scaleRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'scales',
  severity: 'error',
  scope: 'document',
  description: 'Scales require compatible domains, ranges, fallbacks, and ordered numeric stops.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    for (const [scaleId, scale] of Object.entries(context.cartography.scales)) {
      const path = `scales.${scaleId}`;
      if (['nominal', 'ordinal'].includes(scale.type)) {
        if (!scale.values || Object.keys(scale.values).length === 0) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path,
            message: `Categorical scale "${scaleId}" must define values.`,
          });
        }
        if (!Object.prototype.hasOwnProperty.call(scale, 'fallback')) {
          findings.push({
            ruleId: 'scale-fallback',
            severity: 'warning',
            path,
            message: `Categorical scale "${scaleId}" has no explicit fallback for unknown values.`,
          });
        }
      }
      if (['quantitative', 'diverging'].includes(scale.type)) {
        if (!scale.stops || scale.stops.length < 2) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path,
            message: `Numeric scale "${scaleId}" must define at least two stops.`,
          });
        }
        for (let index = 1; index < (scale.stops?.length ?? 0); index += 1) {
          const previous = scale.stops?.[index - 1]?.[0];
          const current = scale.stops?.[index]?.[0];
          if (previous !== undefined && current !== undefined && current <= previous) {
            findings.push({
              ruleId: this.id,
              severity: 'error',
              path: `${path}.stops.${index}`,
              message: 'Numeric scale stops must be strictly increasing.',
            });
          }
        }
      }
    }
    return findings;
  },
};

function isColorChannel(channel: string): boolean {
  return ['color', 'hue', 'fill-color', 'line-color', 'text-color', 'circle-color'].includes(channel);
}

export const encodingRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'encodings',
  severity: 'error',
  scope: 'document',
  description: 'Encodings must reference valid scales and avoid ambiguous channel ownership.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    for (const [encodingId, encoding] of Object.entries(context.cartography.encodings)) {
      if (encoding.minzoom !== undefined && encoding.maxzoom !== undefined && encoding.minzoom >= encoding.maxzoom) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `encodings.${encodingId}`,
          message: 'Encoding minzoom must be less than maxzoom.',
        });
      }
      const ids = new Set<string>();
      const channelOwners = new Map<string, string[]>();
      for (const [index, rule] of encoding.rules.entries()) {
        const path = `encodings.${encodingId}.rules.${index}`;
        if (ids.has(rule.id)) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: `${path}.id`,
            message: `Duplicate rule id "${rule.id}" within encoding ${encodingId}.`,
          });
        }
        ids.add(rule.id);
        if (rule.scale && !(rule.scale in context.cartography.scales)) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: `${path}.scale`,
            message: `Unknown scale "${rule.scale}".`,
          });
        }
        if (!rule.scale && rule.value === undefined) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path,
            message: 'An encoding rule must define either scale or value.',
          });
        }
        if (rule.field !== undefined) {
          const resolved = resolveTokenValue(context.cartography, rule.field);
          if (!resolved.resolved) continue;
          if (resolved.value === null) {
            findings.push({
              ruleId: 'unbound-semantic',
              severity: 'error',
              path: `${path}.field`,
              message: `Rule "${rule.id}" resolves to a null semantic binding.`,
            });
          } else if (typeof resolved.value !== 'string') {
            findings.push({
              ruleId: this.id,
              severity: 'error',
              path: `${path}.field`,
              message: `Rule field must resolve to a field-name string; received ${JSON.stringify(resolved.value)}.`,
            });
          }
        }
        const owners = channelOwners.get(rule.channel) ?? [];
        owners.push(rule.id);
        channelOwners.set(rule.channel, owners);
        if (
          rule.critical &&
          context.cartography.accessibility?.requireSecondaryChannelForCriticalSemantics &&
          !rule.secondaryChannel
        ) {
          findings.push({
            ruleId: 'critical-secondary-channel',
            severity: 'error',
            path,
            message: `Critical rule "${rule.id}" needs secondaryChannel; color alone may not carry the meaning.`,
          });
        }
        if (rule.critical && isColorChannel(rule.channel) && !rule.secondaryChannel) {
          findings.push({
            ruleId: 'critical-color-only',
            severity: 'warning',
            path,
            message: `Critical rule "${rule.id}" uses color without an explicit redundant visual channel.`,
          });
        }
      }
      for (const [channel, owners] of channelOwners) {
        if (owners.length < 2) continue;
        const rules = encoding.rules.filter((rule) => rule.channel === channel);
        if (rules.every((rule) => rule.composite === true)) continue;
        findings.push({
          ruleId: 'channel-conflict',
          severity: 'warning',
          path: `encodings.${encodingId}.rules`,
          message: `Visual channel "${channel}" has multiple semantic owners: ${owners.join(', ')}.`,
          suggestion: 'Assign one primary owner or mark every deliberately combined rule as composite and explain the combination in prose.',
        });
      }
      const alert = encoding.states?.alert;
      if (isRecord(alert) && Array.isArray(alert.channels)) {
        const channels = alert.channels.filter((value): value is string => typeof value === 'string');
        if (channels.length === 1 && channels.some(isColorChannel)) {
          findings.push({
            ruleId: 'critical-color-only',
            severity: 'warning',
            path: `encodings.${encodingId}.states.alert.channels`,
            message: 'Alert state relies on color alone.',
          });
        }
      }
    }
    return findings;
  },
};

export const contrastRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'contrast-pairs',
  severity: 'error',
  scope: 'document',
  description: 'Declared foreground/background token pairs must meet their minimum contrast ratio.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    for (const [index, pair] of (context.cartography.accessibility?.contrastPairs ?? []).entries()) {
      const foreground = resolveColor(context.cartography, pair.foreground);
      const background = resolveColor(context.cartography, pair.background);
      if (!foreground.color || !background.color) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `accessibility.contrastPairs.${index}`,
          message: `Contrast pair ${pair.id} contains an unresolved or invalid color.`,
        });
        continue;
      }
      const ratio = contrastRatio(foreground.color, background.color);
      if (ratio + Number.EPSILON < pair.minimum) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: `accessibility.contrastPairs.${index}`,
          message: `Contrast ratio ${ratio.toFixed(2)}:1 is below the declared minimum ${pair.minimum}:1.`,
          evidence: {ratio, foreground: foreground.resolvedValue, background: background.resolvedValue},
        });
      }
    }
    return findings;
  },
};

export const contractSummaryRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'contract-summary',
  severity: 'info',
  scope: 'document',
  description: 'Summarize the machine-readable contract for agent logs.',
  run(context) {
    if (!context.cartography) return [];
    const tokenLeaves = walkObject(context.cartography.tokens).filter(
      (entry) => !isRecord(entry.value) && !Array.isArray(entry.value),
    ).length;
    return [{
      ruleId: this.id,
      severity: 'info',
      path: '$',
      message: `Loaded ${tokenLeaves} token leaves, ${Object.keys(context.cartography.scales).length} scales, ${Object.keys(context.cartography.encodings).length} encodings, and ${context.cartography.layerOrder.length} layer groups.`,
    }];
  },
};


export const validationFixtureRule: LintRule<CartographyConfig, DataProfile> = {
  id: 'validation-fixtures',
  severity: 'warning',
  scope: 'document',
  description: 'Require representative render fixtures for density, missing data, modes, and viewport classes.',
  run(context) {
    if (!context.cartography) return [];
    const required = new Set(['dense-urban', 'sparse-suburban', 'null-and-unknown', 'mobile', 'desktop']);
    const modes = context.cartography.target.modes ?? ['light'];
    if (modes.includes('light')) required.add('light-mode');
    if (modes.includes('dark')) required.add('dark-mode');
    if (modes.includes('imagery')) required.add('imagery-mode');
    const hasStates = Boolean(context.cartography.states && Object.keys(context.cartography.states).length > 0)
      || Object.values(context.cartography.encodings).some((encoding) => Boolean(encoding.states && Object.keys(encoding.states).length > 0));
    if (hasStates) required.add('interaction-states');
    const declared = new Set(
      (context.cartography.validation?.fixtures ?? [])
        .filter((fixture) => fixture.required !== false)
        .map((fixture) => fixture.id),
    );
    const missing = [...required].filter((fixture) => !declared.has(fixture)).sort();
    if (missing.length === 0) return [];
    return [{
      ruleId: this.id,
      severity: this.severity,
      path: 'validation.fixtures',
      message: `Recommended render fixtures are missing: ${missing.join(', ')}.`,
      suggestion: 'Declare the scenarios now and connect them to screenshot automation in the consuming project.',
    }];
  },
};

export const CARTOGRAPHY_RULES: LintRule<CartographyConfig, DataProfile>[] = [
  colorTokenRule,
  zoomBandRule,
  layerOrderRule,
  scaleRule,
  encodingRule,
  contrastRule,
  contractSummaryRule,
  validationFixtureRule,
];
