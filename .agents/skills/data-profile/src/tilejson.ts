import type {
  Evidence,
  FieldFact,
  FieldType,
  LayerFact,
  ProfileFragment,
  SourceFact,
  UnresolvedItem,
} from './types.js';

interface SanitizedTemplate {
  value: string;
  credentialRedacted: boolean;
  validHttpUrl: boolean;
  explicitLocalTemplate: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function evidence(input: string, location: string): Evidence {
  return {kind: 'tilejson-declared', input, location};
}

function addUnresolved(
  unresolved: UnresolvedItem[],
  input: string,
  code: string,
  location: string,
  message: string,
): void {
  unresolved.push({code, location, message, evidence: [evidence(input, location)]});
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function declaredTuple<T extends number>(value: unknown, length: number): T[] | undefined {
  return Array.isArray(value) && value.length === length && value.every(isFiniteNumber)
    ? (value as T[])
    : undefined;
}

function isExplicitLocalTemplate(value: string): boolean {
  return !/[?#]/.test(value) && /^(?:\.(?:\.|\/)|\/(?!\/)|file:\/\/)/.test(value);
}

function hasHttpScheme(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function removeOpaqueUrlParts(value: string): {value: string; credentialRedacted: boolean} {
  const hashIndex = value.indexOf('#');
  const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const authorityMatch = base.match(/^((?:[a-z][a-z\d+.-]*:)?\/\/)([^/?#]*)/i);
  const authorityPrefix = authorityMatch?.[1];
  const authority = authorityMatch?.[2];
  const matchedAuthority = authorityMatch?.[0];
  const sanitizedBase =
    authorityPrefix && authority && matchedAuthority && authority.includes('@')
      ? `${authorityPrefix}${authority.slice(authority.lastIndexOf('@') + 1)}${base.slice(
          matchedAuthority.length,
        )}`
      : base;

  return {
    value: sanitizedBase,
    credentialRedacted: hashIndex >= 0 || queryIndex >= 0 || sanitizedBase !== base,
  };
}

function preserveTemplateBraces(value: string): string {
  return value.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
}

function sanitizeTemplate(value: string): SanitizedTemplate {
  if (hasHttpScheme(value)) {
    try {
      const url = new URL(value);
      const credentialRedacted =
        url.username !== '' || url.password !== '' || value.includes('?') || value.includes('#');
      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';
      return {
        value: preserveTemplateBraces(url.toString()),
        credentialRedacted,
        validHttpUrl: true,
        explicitLocalTemplate: false,
      };
    } catch {
      // Retain the redacted form below so invalid declarations remain reportable.
    }
  }

  const redacted = removeOpaqueUrlParts(value);
  return {
    ...redacted,
    validHttpUrl: false,
    explicitLocalTemplate: isExplicitLocalTemplate(value),
  };
}

function sourceFact(type: string, input: string): SourceFact {
  return {type, tileTemplates: [], layers: {}, evidence: [evidence(input, '#')]};
}

function layerFact(input: string, location: string): LayerFact {
  return {
    geometries: ['unknown'],
    stableIdObserved: false,
    fields: {},
    evidence: [evidence(input, location)],
  };
}

function normalizeFieldType(declaration: unknown): FieldType | undefined {
  if (typeof declaration !== 'string') {
    return undefined;
  }

  const normalized = declaration.toLowerCase();
  if (normalized.includes('integer')) return 'integer';
  if (normalized.includes('number')) return 'number';
  if (normalized.includes('string')) return 'string';
  if (normalized.includes('boolean')) return 'boolean';
  if (normalized.includes('json')) return 'json';
  return undefined;
}

function fieldFact(input: string, location: string, type: FieldType): FieldFact {
  return {
    types: [type],
    categories: [],
    missingObserved: false,
    nullObserved: false,
    evidence: [evidence(input, location)],
  };
}

/**
 * Discovers metadata explicitly declared by a plain TileJSON document. It does
 * not fetch tiles and never represents declarations as observed tile values.
 */
export function discoverTileJson(tileJson: unknown, sourceId: string, input: string): ProfileFragment {
  const fragment: ProfileFragment = {inputs: [input], sources: {}, unresolved: []};
  if (!isPlainObject(tileJson)) {
    addUnresolved(
      fragment.unresolved,
      input,
      'tilejson-not-plain-object',
      '#',
      'The TileJSON document is not a plain object and cannot be inspected.',
    );
    return fragment;
  }

  const vectorLayers = tileJson.vector_layers;
  const hasVectorLayers = Array.isArray(vectorLayers);
  const source = sourceFact(hasVectorLayers ? 'vector' : 'unknown', input);
  fragment.sources[sourceId] = source;

  const bounds = declaredTuple<number>(tileJson.bounds, 4);
  if (bounds) source.bounds = [bounds[0]!, bounds[1]!, bounds[2]!, bounds[3]!];
  const center = declaredTuple<number>(tileJson.center, 3);
  if (center) source.center = [center[0]!, center[1]!, center[2]!];
  if (isFiniteNumber(tileJson.minzoom)) source.minzoom = tileJson.minzoom;
  if (isFiniteNumber(tileJson.maxzoom)) source.maxzoom = tileJson.maxzoom;

  if (Array.isArray(tileJson.tiles)) {
    for (const [index, template] of tileJson.tiles.entries()) {
      if (typeof template !== 'string') continue;
      const location = `#/tiles/${index}`;
      const sanitized = sanitizeTemplate(template);
      source.tileTemplates.push(sanitized.value);
      if (sanitized.credentialRedacted) {
        addUnresolved(
          fragment.unresolved,
          input,
          'credential-redacted',
          location,
          'Credentials or sensitive URL data was redacted before this tile template was retained.',
        );
      }
      if (!sanitized.validHttpUrl && !sanitized.explicitLocalTemplate) {
        addUnresolved(
          fragment.unresolved,
          input,
          'tile-template-not-inspectable',
          location,
          'The tile template is neither HTTP(S) nor an explicit local path and cannot be inspected.',
        );
      }
    }
  }

  if (!hasVectorLayers) return fragment;
  for (const [index, vectorLayer] of vectorLayers.entries()) {
    const location = `#/vector_layers/${index}`;
    if (!isPlainObject(vectorLayer) || typeof vectorLayer.id !== 'string' || vectorLayer.id.length === 0) {
      addUnresolved(
        fragment.unresolved,
        input,
        'tilejson-vector-layer-invalid',
        location,
        'A TileJSON vector layer needs a non-empty string id to be profiled.',
      );
      continue;
    }

    const layer = layerFact(input, location);
    source.layers[vectorLayer.id] = layer;
    if (isFiniteNumber(vectorLayer.minzoom)) layer.minzoom = vectorLayer.minzoom;
    if (isFiniteNumber(vectorLayer.maxzoom)) layer.maxzoom = vectorLayer.maxzoom;
    if (!isPlainObject(vectorLayer.fields)) continue;

    for (const [fieldName, declaration] of Object.entries(vectorLayer.fields)) {
      const fieldLocation = `${location}/fields/${fieldName}`;
      const type = normalizeFieldType(declaration) ?? 'unknown';
      layer.fields[fieldName] = fieldFact(input, fieldLocation, type);
      if (type === 'unknown') {
        addUnresolved(
          fragment.unresolved,
          input,
          'tilejson-field-type-unknown',
          fieldLocation,
          'A TileJSON field type declaration is not recognized by the profile model.',
        );
      }
    }
  }

  return fragment;
}
