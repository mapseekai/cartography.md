import {z} from 'zod';

const nonEmptyString = z.string().trim().min(1);
const stringArray = z.array(nonEmptyString);
const zoomRange = z.tuple([
  z.number().finite().min(0).max(24),
  z.number().finite().min(0).max(24),
]);

export const omittedSectionSchema = z.union([
  nonEmptyString,
  z.object({section: nonEmptyString, reason: z.string().optional()}).passthrough(),
]);

export const targetSchema = z.object({
  renderer: z.literal('maplibre'),
  styleSpecVersion: z.union([z.literal(8), z.literal('8')]),
  platforms: stringArray.optional(),
  modes: stringArray.optional(),
  projection: nonEmptyString.optional(),
  compatibility: z.enum(['strict', 'portable', 'renderer-specific']).optional(),
}).passthrough();

export const intentSchema = z.object({
  mapType: z.enum([
    'reference',
    'thematic',
    'operational',
    'navigation',
    'editing',
    'imagery',
    'hybrid',
  ]),
  primaryTask: nonEmptyString,
  audience: stringArray.min(1),
  subject: nonEmptyString.optional(),
  context: stringArray.optional(),
  aesthetic: z.object({
    keywords: stringArray.optional(),
    avoid: stringArray.optional(),
    contrast: z.enum(['low', 'medium', 'high']).optional(),
    saturation: z.enum(['low', 'medium', 'high']).optional(),
    density: z.enum(['sparse', 'standard', 'dense']).optional(),
  }).passthrough().optional(),
  successCriteria: stringArray.optional(),
}).passthrough();

export const dataSchema = z.object({
  profile: nonEmptyString.optional(),
  profileRequired: z.boolean().optional(),
  bindings: z.record(z.string(), z.union([nonEmptyString, z.null()])),
  fallbackLabels: stringArray.optional(),
  nullPolicy: nonEmptyString.optional(),
  unknownCategoryPolicy: nonEmptyString.optional(),
  zeroIsNotNull: z.boolean().optional(),
  preserveUnits: z.boolean().optional(),
  sensitiveDataPolicy: nonEmptyString.optional(),
}).passthrough();

export const scaleSchema = z.object({
  type: z.enum(['nominal', 'ordinal', 'quantitative', 'diverging', 'identity']),
  field: nonEmptyString.optional(),
  values: z.record(z.string(), z.unknown()).optional(),
  stops: z.array(z.tuple([z.number().finite(), z.unknown()])).optional(),
  fallback: z.unknown().optional(),
  clamp: z.boolean().optional(),
  unit: nonEmptyString.optional(),
  description: z.string().optional(),
}).passthrough();

export const encodingRuleSchema = z.object({
  id: nonEmptyString,
  field: nonEmptyString.optional(),
  channel: nonEmptyString,
  scale: nonEmptyString.optional(),
  value: z.unknown().optional(),
  composite: z.boolean().optional(),
  critical: z.boolean().optional(),
  secondaryChannel: nonEmptyString.optional(),
  priority: z.number().finite().optional(),
}).passthrough();

export const encodingSchema = z.object({
  source: nonEmptyString,
  sourceLayer: nonEmptyString.optional(),
  geometry: z.enum(['point', 'line', 'polygon', 'raster', 'model', 'mixed']),
  role: z.enum(['background', 'context', 'primary', 'focus', 'critical']),
  layerGroup: nonEmptyString,
  minzoom: z.number().finite().min(0).max(24).optional(),
  maxzoom: z.number().finite().min(0).max(24).optional(),
  filter: z.unknown().optional(),
  rules: z.array(encodingRuleSchema).default([]),
  labels: z.object({
    field: nonEmptyString.optional(),
    fallbacks: stringArray.optional(),
    minzoom: z.number().finite().min(0).max(24).optional(),
    priority: z.number().finite().optional(),
    allowOverlap: z.boolean().optional(),
  }).passthrough().optional(),
  states: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const layerOrderItemSchema = z.object({
  id: nonEmptyString,
  order: z.number().finite(),
}).passthrough();

export const contrastPairSchema = z.object({
  id: nonEmptyString,
  foreground: nonEmptyString,
  background: nonEmptyString,
  minimum: z.number().finite().positive(),
  kind: z.enum(['text', 'large-text', 'graphic']).optional(),
}).passthrough();

export const cartographySchema = z.object({
  version: z.literal('0.1.0'),
  name: nonEmptyString,
  description: z.string().optional(),
  locale: nonEmptyString.optional(),
  target: targetSchema,
  intent: intentSchema,
  data: dataSchema,
  agent: z.record(z.string(), z.unknown()).optional(),
  zoom: z.object({
    strategy: nonEmptyString.optional(),
    bands: z.record(z.string(), zoomRange),
    referenceZooms: z.array(z.number().finite().min(0).max(24)).optional(),
    visibility: z.record(z.string(), z.unknown()).optional(),
    generalization: z.record(z.string(), z.unknown()).optional(),
  }).passthrough(),
  hierarchy: z.record(z.string(), z.unknown()).optional(),
  tokens: z.object({
    colors: z.record(z.string(), z.unknown()),
  }).passthrough(),
  scales: z.record(z.string(), scaleSchema).default({}),
  encodings: z.record(z.string(), encodingSchema),
  layerOrder: z.array(layerOrderItemSchema).min(1),
  labels: z.record(z.string(), z.unknown()).optional(),
  states: z.record(z.string(), z.unknown()).optional(),
  accessibility: z.object({
    textContrast: z.record(z.string(), z.number().finite().positive()).optional(),
    nonTextGraphicContrast: z.number().finite().positive().optional(),
    requireSecondaryChannelForCriticalSemantics: z.boolean().optional(),
    contrastPairs: z.array(contrastPairSchema).optional(),
  }).passthrough().optional(),
  security: z.record(z.string(), z.unknown()).optional(),
  performance: z.record(z.string(), z.unknown()).optional(),
  maplibre: z.object({
    rootMetadataPrefix: nonEmptyString.optional(),
    layerIdPattern: nonEmptyString.optional(),
    layerMetadata: z.object({
      required: stringArray.optional(),
      optional: stringArray.optional(),
    }).passthrough().optional(),
    featureStatePaintOnly: z.boolean().optional(),
    stableFeatureIdRequired: z.boolean().optional(),
    runtimeOptions: z.record(z.string(), z.unknown()).optional(),
  }).passthrough().optional(),
  validation: z.object({
    fixtures: z.array(z.object({
      id: nonEmptyString,
      required: z.union([z.boolean(), nonEmptyString]).optional(),
    }).passthrough()).optional(),
    checks: stringArray.optional(),
    report: z.record(z.string(), z.unknown()).optional(),
  }).passthrough().optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
  omitted: z.array(omittedSectionSchema).optional(),
}).passthrough();

export type ZoomRange = [number, number];

export interface CartographyTarget {
  renderer: 'maplibre';
  styleSpecVersion: 8 | '8';
  platforms?: string[];
  modes?: string[];
  projection?: string;
  compatibility?: 'strict' | 'portable' | 'renderer-specific';
  [key: string]: unknown;
}

export interface CartographyIntent {
  mapType: 'reference' | 'thematic' | 'operational' | 'navigation' | 'editing' | 'imagery' | 'hybrid';
  primaryTask: string;
  audience: string[];
  subject?: string;
  context?: string[];
  aesthetic?: {
    keywords?: string[];
    avoid?: string[];
    contrast?: 'low' | 'medium' | 'high';
    saturation?: 'low' | 'medium' | 'high';
    density?: 'sparse' | 'standard' | 'dense';
    [key: string]: unknown;
  };
  successCriteria?: string[];
  [key: string]: unknown;
}

export interface CartographyDataContract {
  profile?: string;
  profileRequired?: boolean;
  bindings: Record<string, string | null>;
  fallbackLabels?: string[];
  nullPolicy?: string;
  unknownCategoryPolicy?: string;
  zeroIsNotNull?: boolean;
  preserveUnits?: boolean;
  sensitiveDataPolicy?: string;
  [key: string]: unknown;
}

export interface CartographyScale {
  type: 'nominal' | 'ordinal' | 'quantitative' | 'diverging' | 'identity';
  field?: string;
  values?: Record<string, unknown>;
  stops?: Array<[number, unknown]>;
  fallback?: unknown;
  clamp?: boolean;
  unit?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CartographyEncodingRule {
  id: string;
  field?: string;
  channel: string;
  scale?: string;
  value?: unknown;
  composite?: boolean;
  critical?: boolean;
  secondaryChannel?: string;
  priority?: number;
  [key: string]: unknown;
}

export interface CartographyEncoding {
  source: string;
  sourceLayer?: string;
  geometry: 'point' | 'line' | 'polygon' | 'raster' | 'model' | 'mixed';
  role: 'background' | 'context' | 'primary' | 'focus' | 'critical';
  layerGroup: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: unknown;
  rules: CartographyEncodingRule[];
  labels?: {
    field?: string;
    fallbacks?: string[];
    minzoom?: number;
    priority?: number;
    allowOverlap?: boolean;
    [key: string]: unknown;
  };
  states?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CartographyLayerOrderItem {
  id: string;
  order: number;
  [key: string]: unknown;
}

export interface CartographyContrastPair {
  id: string;
  foreground: string;
  background: string;
  minimum: number;
  kind?: 'text' | 'large-text' | 'graphic';
  [key: string]: unknown;
}

export type OmittedSection = string | {
  section: string;
  reason?: string;
  [key: string]: unknown;
};

export interface CartographyConfig {
  version: '0.1.0';
  name: string;
  description?: string;
  locale?: string;
  target: CartographyTarget;
  intent: CartographyIntent;
  data: CartographyDataContract;
  agent?: Record<string, unknown>;
  zoom: {
    strategy?: string;
    bands: Record<string, ZoomRange>;
    referenceZooms?: number[];
    visibility?: Record<string, unknown>;
    generalization?: Record<string, unknown>;
    [key: string]: unknown;
  };
  hierarchy?: Record<string, unknown>;
  tokens: {
    colors: Record<string, unknown>;
    [key: string]: unknown;
  };
  scales: Record<string, CartographyScale>;
  encodings: Record<string, CartographyEncoding>;
  layerOrder: CartographyLayerOrderItem[];
  labels?: Record<string, unknown>;
  states?: Record<string, unknown>;
  accessibility?: {
    textContrast?: Record<string, number>;
    nonTextGraphicContrast?: number;
    requireSecondaryChannelForCriticalSemantics?: boolean;
    contrastPairs?: CartographyContrastPair[];
    [key: string]: unknown;
  };
  security?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  maplibre?: {
    rootMetadataPrefix?: string;
    layerIdPattern?: string;
    layerMetadata?: {
      required?: string[];
      optional?: string[];
      [key: string]: unknown;
    };
    featureStatePaintOnly?: boolean;
    stableFeatureIdRequired?: boolean;
    runtimeOptions?: Record<string, unknown>;
    [key: string]: unknown;
  };
  validation?: {
    fixtures?: Array<{
      id: string;
      required?: boolean | string;
      [key: string]: unknown;
    }>;
    checks?: string[];
    report?: Record<string, unknown>;
    [key: string]: unknown;
  };
  outputs?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
  omitted?: OmittedSection[];
  [key: string]: unknown;
}
