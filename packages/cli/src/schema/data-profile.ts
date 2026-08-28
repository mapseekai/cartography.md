import {z} from 'zod';

const nonEmptyString = z.string().trim().min(1);

export const dataProfileFieldSchema = z.object({
  type: z.enum(['string', 'number', 'integer', 'boolean', 'date', 'datetime', 'json', 'unknown']),
  nullable: z.boolean().optional(),
  unit: nonEmptyString.optional(),
  categories: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  minimum: z.number().finite().optional(),
  maximum: z.number().finite().optional(),
  description: z.string().optional(),
}).passthrough();

export const dataProfileLayerSchema = z.object({
  geometry: z.enum(['point', 'line', 'polygon', 'mixed', 'raster']),
  minzoom: z.number().finite().min(0).max(24).optional(),
  maxzoom: z.number().finite().min(0).max(24).optional(),
  idField: nonEmptyString.optional(),
  featureCount: z.number().int().nonnegative().optional(),
  density: z.enum(['sparse', 'standard', 'dense', 'extreme']).optional(),
  fields: z.record(z.string(), dataProfileFieldSchema),
}).passthrough();

export const dataProfileSourceSchema = z.object({
  type: z.enum(['vector', 'geojson', 'raster', 'raster-dem', 'other']),
  sourceLayers: z.record(z.string(), dataProfileLayerSchema).default({}),
}).passthrough();

export const dataProfileSchema = z.object({
  version: nonEmptyString,
  name: nonEmptyString.optional(),
  generatedAt: z.string().optional(),
  sources: z.record(z.string(), dataProfileSourceSchema),
}).passthrough();

export interface DataProfileField {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'json' | 'unknown';
  nullable?: boolean;
  unit?: string;
  categories?: Array<string | number | boolean | null>;
  minimum?: number;
  maximum?: number;
  description?: string;
  [key: string]: unknown;
}

export interface DataProfileLayer {
  geometry: 'point' | 'line' | 'polygon' | 'mixed' | 'raster';
  minzoom?: number;
  maxzoom?: number;
  idField?: string;
  featureCount?: number;
  density?: 'sparse' | 'standard' | 'dense' | 'extreme';
  fields: Record<string, DataProfileField>;
  [key: string]: unknown;
}

export interface DataProfileSource {
  type: 'vector' | 'geojson' | 'raster' | 'raster-dem' | 'other';
  sourceLayers: Record<string, DataProfileLayer>;
  [key: string]: unknown;
}

export interface DataProfile {
  version: string;
  name?: string;
  generatedAt?: string;
  sources: Record<string, DataProfileSource>;
  [key: string]: unknown;
}
