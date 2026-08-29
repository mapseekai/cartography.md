import {gunzipSync} from 'node:zlib';

import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';

import type {Evidence, FieldType, GeometryType} from './types.js';

type Category = string | number | boolean | null;

const MAX_CATEGORIES = 256;

export interface FieldObservation {
  types: FieldType[];
  categories: Category[];
  minimum?: number;
  maximum?: number;
  presentCount: number;
  missingCount: number;
  missingObserved: boolean;
  nullObserved: boolean;
  categoriesTruncated?: boolean;
}

export interface TileObservation {
  layers: Record<
    string,
    {
      geometries: GeometryType[];
      featureCount: number;
      stableIdObserved: boolean;
      fields: Record<string, FieldObservation>;
    }
  >;
}

export class TileDecodeError extends Error {
  readonly evidence: Evidence;
  readonly cause: unknown;

  constructor(message: string, evidence: Evidence, cause: unknown) {
    super(message);
    this.name = 'TileDecodeError';
    this.evidence = evidence;
    this.cause = cause;
  }
}

function record<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function fieldType(value: unknown): FieldType {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return 'json';
  return 'unknown';
}

function category(value: unknown): Category | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function geometryType(type: number): GeometryType {
  if (type === 1) return 'point';
  if (type === 2) return 'line';
  if (type === 3) return 'polygon';
  return 'unknown';
}

function includesCategory(categories: Category[], value: Category): boolean {
  return categories.some((categoryValue) => Object.is(categoryValue, value));
}

function appendCategory(field: FieldObservation, value: Category): void {
  if (includesCategory(field.categories, value)) return;
  if (field.categories.length >= MAX_CATEGORIES) {
    field.categoriesTruncated = true;
    return;
  }
  field.categories.push(value);
}

function appendType(field: FieldObservation, type: FieldType): void {
  if (!field.types.includes(type)) field.types.push(type);
}

function observeInto(field: FieldObservation, value: unknown): void {
  appendType(field, fieldType(value));
  field.presentCount += 1;
  if (value === null) field.nullObserved = true;

  const observedCategory = category(value);
  if (observedCategory !== undefined) appendCategory(field, observedCategory);

  if (typeof value === 'number' && Number.isFinite(value)) {
    field.minimum = field.minimum === undefined ? value : Math.min(field.minimum, value);
    field.maximum = field.maximum === undefined ? value : Math.max(field.maximum, value);
  }
}

export function observeValue(value: unknown): FieldObservation {
  const observation: FieldObservation = {
    types: [],
    categories: [],
    presentCount: 0,
    missingCount: 0,
    missingObserved: false,
    nullObserved: false,
  };
  observeInto(observation, value);
  return observation;
}

function invalidPbf(): never {
  throw new Error('PBF contains a truncated or invalid wire value.');
}

function readVarintEnd(bytes: Uint8Array, offset: number): number {
  for (let index = 0; index < 10; index += 1) {
    if (offset >= bytes.length) invalidPbf();
    const byte = bytes[offset]!;
    offset += 1;
    if (byte < 0x80) {
      if (index === 9 && byte > 1) invalidPbf();
      return offset;
    }
  }
  return invalidPbf();
}

function readBoundedVarint(bytes: Uint8Array, offset: number): {value: number; offset: number} {
  const end = readVarintEnd(bytes, offset);
  let value = 0;
  for (let index = offset; index < end; index += 1) {
    value += (bytes[index]! & 0x7f) * 2 ** (7 * (index - offset));
  }
  if (!Number.isSafeInteger(value)) invalidPbf();
  return {value, offset: end};
}

function validatePackedVarints(bytes: Uint8Array): void {
  let offset = 0;
  while (offset < bytes.length) offset = readVarintEnd(bytes, offset);
}

function requireWireType(actual: number, expected: number): void {
  if (actual !== expected) invalidPbf();
}

function requirePayload(payload: Uint8Array | undefined): Uint8Array {
  if (!payload) invalidPbf();
  return payload;
}

function validateMessage(
  bytes: Uint8Array,
  validateField: (field: number, wireType: number, payload: Uint8Array | undefined) => void,
): void {
  let offset = 0;
  while (offset < bytes.length) {
    const tag = readBoundedVarint(bytes, offset);
    offset = tag.offset;
    const field = Math.floor(tag.value / 8);
    const wireType = tag.value & 7;
    if (field === 0) invalidPbf();

    if (wireType === 0) {
      offset = readVarintEnd(bytes, offset);
      validateField(field, wireType, undefined);
      continue;
    }
    if (wireType === 1 || wireType === 5) {
      const end = offset + (wireType === 1 ? 8 : 4);
      if (end > bytes.length) invalidPbf();
      offset = end;
      validateField(field, wireType, undefined);
      continue;
    }
    if (wireType !== 2) invalidPbf();

    const length = readBoundedVarint(bytes, offset);
    offset = length.offset;
    const end = offset + length.value;
    if (!Number.isSafeInteger(end) || end > bytes.length) invalidPbf();
    const payload = bytes.subarray(offset, end);
    offset = end;
    validateField(field, wireType, payload);
  }
}

function validateFeature(bytes: Uint8Array): void {
  validateMessage(bytes, (field, wireType, payload) => {
    if (field === 1 || field === 3) {
      requireWireType(wireType, 0);
      return;
    }
    if (field === 2 || field === 4) {
      requireWireType(wireType, 2);
      validatePackedVarints(requirePayload(payload));
    }
  });
}

function validateValue(bytes: Uint8Array): void {
  validateMessage(bytes, (field, wireType) => {
    if (field === 1) requireWireType(wireType, 2);
    else if (field === 2) requireWireType(wireType, 5);
    else if (field === 3) requireWireType(wireType, 1);
    else if (field >= 4 && field <= 7) requireWireType(wireType, 0);
  });
}

function validateLayer(bytes: Uint8Array): void {
  validateMessage(bytes, (field, wireType, payload) => {
    if (field === 1 || field === 3) {
      requireWireType(wireType, 2);
      return;
    }
    if (field === 2) {
      requireWireType(wireType, 2);
      validateFeature(requirePayload(payload));
      return;
    }
    if (field === 4) {
      requireWireType(wireType, 2);
      validateValue(requirePayload(payload));
      return;
    }
    if (field === 5 || field === 15) requireWireType(wireType, 0);
  });
}

function validateTile(bytes: Uint8Array): void {
  validateMessage(bytes, (field, wireType, payload) => {
    if (field === 3) {
      requireWireType(wireType, 2);
      validateLayer(requirePayload(payload));
    }
  });
}

function parseTile(bytes: Uint8Array): VectorTile {
  const source = bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
  validateTile(source);
  return new VectorTile(new PbfReader(source));
}

/**
 * Observes the fields represented in one PBF/MVT tile without inferring
 * values for properties absent from an individual feature.
 */
export function decodeMvt(bytes: Uint8Array, evidence: Evidence): TileObservation {
  try {
    const tile = parseTile(bytes);
    const layers = record<TileObservation['layers'][string]>();

    for (const [layerName, layer] of Object.entries(tile.layers)) {
      const fields = record<FieldObservation>();
      const geometries: GeometryType[] = [];
      let stableIdObserved = false;

      for (let index = 0; index < layer.length; index += 1) {
        const feature = layer.feature(index);
        const geometry = geometryType(feature.type);
        if (!geometries.includes(geometry)) geometries.push(geometry);
        if (feature.id !== undefined) stableIdObserved = true;

        for (const [fieldName, value] of Object.entries(feature.properties)) {
          const field = fields[fieldName] ?? observeValue(value);
          if (fields[fieldName] !== undefined) observeInto(field, value);
          fields[fieldName] = field;
        }
      }

      for (const field of Object.values(fields)) {
        field.missingCount = layer.length - field.presentCount;
        field.missingObserved = field.missingCount > 0;
      }

      layers[layerName] = {
        geometries: geometries.sort(),
        featureCount: layer.length,
        stableIdObserved,
        fields,
      };
    }

    return {layers};
  } catch (error) {
    if (error instanceof TileDecodeError) throw error;
    throw new TileDecodeError('Unable to decode MVT tile bytes.', evidence, error);
  }
}
