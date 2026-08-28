import type {CartographyConfig, CartographyEncoding} from '../../schema/cartography.js';
import type {DataProfile, DataProfileLayer} from '../../schema/data-profile.js';
import {isRecord} from '../../utils/object.js';

export function omittedSectionNames(config: CartographyConfig): Set<string> {
  return new Set(
    (config.omitted ?? []).map((item) =>
      typeof item === 'string' ? item : item.section,
    ),
  );
}

export function profileLayerForEncoding(
  profile: DataProfile,
  encoding: CartographyEncoding,
): DataProfileLayer | undefined {
  const source = profile.sources[encoding.source];
  if (!source) return undefined;
  if (encoding.sourceLayer) return source.sourceLayers[encoding.sourceLayer];
  return source.sourceLayers.default ?? Object.values(source.sourceLayers)[0];
}

export function styleLayers(style: unknown): Array<Record<string, unknown>> {
  if (!isRecord(style) || !Array.isArray(style.layers)) return [];
  return style.layers.filter(isRecord);
}

export function styleSources(style: unknown): Record<string, unknown> {
  if (!isRecord(style) || !isRecord(style.sources)) return {};
  return style.sources;
}

export function getMetadata(value: Record<string, unknown>): Record<string, unknown> {
  return isRecord(value.metadata) ? value.metadata : {};
}

export function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (isRecord(value)) return Object.values(value).flatMap(allStrings);
  return [];
}

export function isLegacyFilter(filter: unknown): boolean {
  if (!Array.isArray(filter) || filter.length === 0) return false;
  const operator = filter[0];
  if (typeof operator !== 'string') return false;
  if (['all', 'any', 'none'].includes(operator)) {
    return filter.slice(1).some(isLegacyFilter);
  }
  if (!['==', '!=', '>', '>=', '<', '<=', 'in', '!in', 'has', '!has'].includes(operator)) {
    return false;
  }
  const left = filter[1];
  return typeof left === 'string';
}

export function containsFeatureState(value: unknown): boolean {
  if (!Array.isArray(value)) {
    if (isRecord(value)) return Object.values(value).some(containsFeatureState);
    return false;
  }
  if (value[0] === 'feature-state') return true;
  return value.some(containsFeatureState);
}
