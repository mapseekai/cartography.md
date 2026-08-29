import type {
  Evidence,
  FieldFact,
  LayerFact,
  ProfileFragment,
  SourceFact,
  UnresolvedItem,
} from './types.js';

const legacyFieldOperators = new Set(['==', '!=', '>', '>=', '<', '<=', 'in', '!in', '!has']);
const templateFieldPattern = /\{([^{}]+)\}/g;

interface FieldReferences {
  fields: string[];
  dynamic: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function styleEvidence(input: string, location: string): Evidence {
  return {kind: 'style-inferred', input, location};
}

function addFieldReference(references: FieldReferences, field: string): void {
  if (!references.fields.includes(field)) {
    references.fields.push(field);
  }
}

function collectReferences(value: unknown, references: FieldReferences, textField = false): void {
  if (Array.isArray(value)) {
    const [operator, field] = value;

    if (operator === 'get' || operator === 'has') {
      if (typeof field === 'string') {
        addFieldReference(references, field);
      } else {
        references.dynamic = true;
      }
    } else if (typeof operator === 'string' && legacyFieldOperators.has(operator)) {
      if (typeof field === 'string') {
        addFieldReference(references, field);
      }
    }

    for (const item of value) {
      collectReferences(item, references);
    }
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, property] of Object.entries(value)) {
      collectReferences(property, references, textField || key === 'text-field');
    }
    return;
  }

  if (textField && typeof value === 'string') {
    for (const match of value.matchAll(templateFieldPattern)) {
      const field = match[1]?.trim();
      if (field) {
        addFieldReference(references, field);
      }
    }
  }
}

function discoverFieldReferences(value: unknown): FieldReferences {
  const references: FieldReferences = {fields: [], dynamic: false};
  collectReferences(value, references);
  return references;
}

/**
 * Collects field names used by supported MapLibre expressions and legacy filters.
 * Arbitrary string literals are intentionally ignored.
 */
export function collectReferencedFields(value: unknown): string[] {
  return discoverFieldReferences(value).fields;
}

function emptyLayerFact(evidence: Evidence): LayerFact {
  return {
    geometries: ['unknown'],
    stableIdObserved: false,
    fields: {},
    evidence: [evidence],
  };
}

function fieldFact(evidence: Evidence): FieldFact {
  return {
    types: ['unknown'],
    categories: [],
    missingObserved: false,
    nullObserved: false,
    evidence: [evidence],
  };
}

function sourceFact(type: string, tileTemplates: string[], evidence: Evidence): SourceFact {
  return {type, tileTemplates, layers: {}, evidence: [evidence]};
}

function addUnresolved(
  unresolved: UnresolvedItem[],
  code: string,
  input: string,
  location: string,
  message: string,
): void {
  unresolved.push({code, location, message, evidence: [styleEvidence(input, location)]});
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function mergeMinzoom(layer: LayerFact, minzoom: unknown): void {
  if (typeof minzoom !== 'number' || !Number.isFinite(minzoom)) {
    return;
  }
  layer.minzoom = layer.minzoom === undefined ? minzoom : Math.min(layer.minzoom, minzoom);
}

function mergeMaxzoom(layer: LayerFact, maxzoom: unknown): void {
  if (typeof maxzoom !== 'number' || !Number.isFinite(maxzoom)) {
    return;
  }
  layer.maxzoom = layer.maxzoom === undefined ? maxzoom : Math.max(layer.maxzoom, maxzoom);
}

function sourceTiles(source: Record<string, unknown>): string[] {
  const tiles: string[] = [];
  if (typeof source.url === 'string') {
    tiles.push(source.url);
  }
  if (Array.isArray(source.tiles)) {
    for (const tile of source.tiles) {
      if (typeof tile === 'string') {
        tiles.push(tile);
      }
    }
  }
  return tiles;
}

/**
 * Discovers only evidence available in a style document. It never fetches a
 * source and deliberately does not derive field values, categories, or types.
 */
export function discoverStyle(style: unknown, input: string): ProfileFragment {
  const fragment: ProfileFragment = {inputs: [input], sources: {}, unresolved: []};

  if (!isPlainObject(style)) {
    addUnresolved(
      fragment.unresolved,
      'style-not-plain-object',
      input,
      '#',
      'The style document is not a plain object and cannot be inspected.',
    );
    return fragment;
  }

  if (isPlainObject(style.sources)) {
    for (const [sourceId, source] of Object.entries(style.sources)) {
      if (!isPlainObject(source)) {
        continue;
      }

      const location = `#/sources/${sourceId}`;
      const type = typeof source.type === 'string' ? source.type : 'unknown';
      fragment.sources[sourceId] = sourceFact(type, sourceTiles(source), styleEvidence(input, location));

      if (typeof source.url === 'string' && !isHttpUrl(source.url)) {
        addUnresolved(
          fragment.unresolved,
          'source-url-not-inspectable',
          input,
          `${location}/url`,
          'The non-HTTP source URL cannot be inspected without a provider-specific fetcher.',
        );
      }
    }
  }

  if (!Array.isArray(style.layers)) {
    return fragment;
  }

  for (const [index, candidate] of style.layers.entries()) {
    if (!isPlainObject(candidate) || typeof candidate.source !== 'string') {
      continue;
    }

    const location = `#/layers/${index}`;
    const sourceId = candidate.source;
    const source =
      fragment.sources[sourceId] ??
      sourceFact('unknown', [], styleEvidence(input, `${location}/source`));
    fragment.sources[sourceId] = source;

    const sourceLayer = typeof candidate['source-layer'] === 'string' ? candidate['source-layer'] : 'default';
    if (source.type === 'vector' && typeof candidate['source-layer'] !== 'string') {
      addUnresolved(
        fragment.unresolved,
        'vector-layer-missing-source-layer',
        input,
        location,
        'A vector style layer has no string source-layer, so its data layer remains unresolved.',
      );
    }

    const layer = source.layers[sourceLayer] ?? emptyLayerFact(styleEvidence(input, location));
    source.layers[sourceLayer] = layer;
    mergeMinzoom(layer, candidate.minzoom);
    mergeMaxzoom(layer, candidate.maxzoom);

    const references = discoverFieldReferences({
      filter: candidate.filter,
      layout: candidate.layout,
      paint: candidate.paint,
    });
    for (const field of references.fields) {
      if (!layer.fields[field]) {
        layer.fields[field] = fieldFact(styleEvidence(input, location));
      }
    }
    if (references.dynamic) {
      addUnresolved(
        fragment.unresolved,
        'dynamic-field-reference',
        input,
        location,
        'A get or has expression uses a dynamic field position that cannot be profiled.',
      );
    }
  }

  return fragment;
}
