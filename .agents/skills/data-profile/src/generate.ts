import {readFile} from 'node:fs/promises';

import {mergeFragments} from './merge.js';
import type {FieldFact, GeneratedProfile, LayerFact, ProfileFragment, SourceFact, UnresolvedItem} from './types.js';
import {DEFAULT_SAMPLER_OPTIONS, sampleTiles, type SamplingResult, type TileFetcher} from './sampling.js';
import {discoverStyle} from './style.js';
import {discoverTileJson} from './tilejson.js';

export interface GenerateOptions {
  stylePath?: string;
  tileJsonPath?: string;
  sourceId?: string;
  tileTemplate?: string;
  bounds?: [number, number, number, number];
  zooms?: number[];
  maxRequests?: number;
  allowPrivateNetwork?: boolean;
  observedAt: string;
}

export interface GenerateDependencies {
  readText(path: string): Promise<string>;
  fetchTile?: TileFetcher;
  now(): Date;
}

const defaultDependencies: GenerateDependencies = {
  readText: (path) => readFile(path, 'utf8'),
  now: () => new Date(),
};

function record<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function parseDocument(text: string, kind: 'style' | 'TileJSON'): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Unable to parse the ${kind} input as JSON.`);
  }
}

async function readDiscoveryText(
  dependencies: GenerateDependencies,
  path: string,
  kind: 'style' | 'TileJSON',
): Promise<string> {
  try {
    return await dependencies.readText(path);
  } catch {
    throw new Error(`Unable to read the ${kind} input.`);
  }
}

function safeTemplate(template: string): string {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(template)) {
    try {
      const url = new URL(template);
      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';
      return url.toString().replace(/%7B/gi, '{').replace(/%7D/gi, '}');
    } catch {
      return 'invalid-url-template';
    }
  }
  return template.split(/[?#]/, 1)[0] ?? 'invalid-local-template';
}

function sampledFragment(
  sourceId: string,
  template: string,
  observedAt: string,
  sampling: SamplingResult,
): ProfileFragment[] {
  const input = safeTemplate(template);
  const fragments: ProfileFragment[] = sampling.observations.map(({coordinate, observation}) => {
    const evidence = {
      kind: 'tile-sampled' as const,
      input,
      location: `#/tiles/${coordinate.z}/${coordinate.x}/${coordinate.y}`,
      observedAt,
    };
    const layers = record<LayerFact>();
    for (const [layerId, observedLayer] of Object.entries(observation.layers)) {
      const fields = record<FieldFact>();
      for (const [fieldId, observedField] of Object.entries(observedLayer.fields)) {
        const field: FieldFact = {
          types: [...observedField.types],
          categories: [...observedField.categories],
          missingObserved: observedField.missingObserved,
          nullObserved: observedField.nullObserved,
          evidence: [evidence],
        };
        if (observedField.minimum !== undefined) field.minimum = observedField.minimum;
        if (observedField.maximum !== undefined) field.maximum = observedField.maximum;
        fields[fieldId] = field;
      }
      layers[layerId] = {
        geometries: [...observedLayer.geometries],
        stableIdObserved: observedLayer.stableIdObserved,
        fields,
        evidence: [evidence],
      };
    }
    const source: SourceFact = {
      type: 'vector',
      tileTemplates: [input],
      layers,
      evidence: [evidence],
    };
    const sources = record<SourceFact>();
    sources[sourceId] = source;
    return {inputs: [input], sources, unresolved: []};
  });

  const unresolved = sampling.unresolved.map((item) => ({
    ...item,
    evidence: item.evidence.map((evidence) => ({...evidence, observedAt})),
  }));
  if (input !== template) {
    unresolved.push({
      code: 'credential-redacted',
      location: '#/tiles',
      message: 'Credentials or sensitive URL data was redacted before this tile template was retained.',
      evidence: [{kind: 'tile-sampled', input, location: '#/tiles', observedAt}],
    });
  }
  fragments.push({
    inputs: [input],
    sources: record<SourceFact>(),
    sampling: sampling.summary,
    unresolved,
  });
  return fragments;
}

function inferredSourceId(fragments: ProfileFragment[], requested?: string): string {
  if (requested !== undefined) return requested;
  const sourceIds = [...new Set(fragments.flatMap((fragment) => Object.keys(fragment.sources)))];
  return sourceIds.length === 1 ? sourceIds[0]! : 'default';
}

function sourceHints(fragments: ProfileFragment[], sourceId: string): SourceFact[] {
  return fragments.flatMap((fragment) => {
    const source = fragment.sources[sourceId];
    return source === undefined ? [] : [source];
  });
}

function samplingBounds(options: GenerateOptions, sources: SourceFact[]): [number, number, number, number] {
  if (options.bounds !== undefined) return options.bounds;
  return sources.find((source) => source.bounds !== undefined)?.bounds ?? [-180, -85.05112878, 180, 85.05112878];
}

function samplingZooms(options: GenerateOptions, sources: SourceFact[]): number[] {
  if (options.zooms !== undefined) return options.zooms;
  const source = sources.find((candidate) => candidate.minzoom !== undefined || candidate.maxzoom !== undefined);
  if (!source) return [0];
  return [...new Set([source.minzoom ?? 0, source.maxzoom ?? source.minzoom ?? 0])].sort((left, right) => left - right);
}

function pointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}

function coverageUnresolved(sources: Record<string, SourceFact>): UnresolvedItem[] {
  const unresolved: UnresolvedItem[] = [];
  for (const [sourceId, source] of Object.entries(sources)) {
    if (!source.evidence.some((evidence) => evidence.kind === 'tile-sampled')) {
      unresolved.push({
        code: 'tile-contents-unobserved',
        location: `#/sources/${pointer(sourceId)}`,
        message: 'No actual tile contents were observed for this source.',
        evidence: source.evidence,
      });
    }
    for (const [layerId, layer] of Object.entries(source.layers)) {
      for (const [fieldId, field] of Object.entries(layer.fields)) {
        if (field.evidence.some((evidence) => evidence.kind === 'tile-sampled')) continue;
        unresolved.push({
          code: 'field-domain-unobserved',
          location: `#/sources/${pointer(sourceId)}/layers/${pointer(layerId)}/fields/${pointer(fieldId)}`,
          message: 'No sampled values were observed for this field, so its data domain remains unresolved.',
          evidence: field.evidence,
        });
      }
    }
  }
  return unresolved;
}

/** Discovers, samples, and evidence-preservingly merges one deterministic profile run. */
export async function generateProfile(
  options: GenerateOptions,
  dependencies: GenerateDependencies = defaultDependencies,
): Promise<GeneratedProfile> {
  if (options.stylePath === undefined && options.tileJsonPath === undefined && options.tileTemplate === undefined) {
    throw new Error('Profile generation requires at least one discovery input.');
  }
  if (!Number.isFinite(new Date(options.observedAt).getTime())) {
    throw new Error('Profile generation requires a valid observedAt timestamp.');
  }

  const fragments: ProfileFragment[] = [];
  if (options.stylePath !== undefined) {
    const style = parseDocument(
      await readDiscoveryText(dependencies, options.stylePath, 'style'),
      'style',
    );
    const retainedInput = safeTemplate(options.stylePath);
    const fragment = discoverStyle(style, retainedInput);
    if (retainedInput !== options.stylePath) {
      fragment.unresolved.push({
        code: 'credential-redacted',
        location: '#',
        message: 'Credentials or sensitive URL data was redacted before this input was retained.',
        evidence: [{kind: 'style-inferred', input: retainedInput, location: '#'}],
      });
    }
    fragments.push(fragment);
  }

  if (options.tileJsonPath !== undefined) {
    const tileJson = parseDocument(
      await readDiscoveryText(dependencies, options.tileJsonPath, 'TileJSON'),
      'TileJSON',
    );
    fragments.push(discoverTileJson(tileJson, inferredSourceId(fragments, options.sourceId), options.tileJsonPath));
  }

  if (options.tileTemplate !== undefined) {
    const sourceId = inferredSourceId(fragments, options.sourceId);
    const hints = sourceHints(fragments, sourceId);
    const sampling = await sampleTiles(
      {
        template: options.tileTemplate,
        bounds: samplingBounds(options, hints),
        zooms: samplingZooms(options, hints),
        concurrency: Math.min(DEFAULT_SAMPLER_OPTIONS.concurrency, options.maxRequests ?? DEFAULT_SAMPLER_OPTIONS.maxRequests),
        maxRequests: options.maxRequests ?? DEFAULT_SAMPLER_OPTIONS.maxRequests,
        maxNonEmpty: DEFAULT_SAMPLER_OPTIONS.maxNonEmpty,
        stableStop: DEFAULT_SAMPLER_OPTIONS.stableStop,
        timeoutMs: DEFAULT_SAMPLER_OPTIONS.timeoutMs,
        retries: DEFAULT_SAMPLER_OPTIONS.retries,
        maxResponseBytes: DEFAULT_SAMPLER_OPTIONS.maxResponseBytes,
        maxTotalBytes: DEFAULT_SAMPLER_OPTIONS.maxTotalBytes,
        allowPrivateNetwork: options.allowPrivateNetwork === true,
      },
      dependencies.fetchTile,
    );
    fragments.push(...sampledFragment(sourceId, options.tileTemplate, options.observedAt, sampling));
  }

  const discovered = mergeFragments(fragments);
  const merged = mergeFragments([
    ...fragments,
    {
      inputs: [],
      sources: record<SourceFact>(),
      unresolved: coverageUnresolved(discovered.sources),
    },
  ]);
  return {
    format: 'cartography-data-profile/1',
    generatedAt: options.observedAt,
    ...merged,
  };
}
