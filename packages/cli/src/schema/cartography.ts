import * as z from 'zod';
import {REFERENCE_PATH_SOURCE} from '../utils/object.js';

const nonEmptyString = z.string().regex(/\S/, 'String must contain at least one non-whitespace character.');

export const tokenReferenceSchema = z.string().regex(new RegExp(`^\\{${REFERENCE_PATH_SOURCE}\\}$`));

export const dimensionSchema = z.union([
  z.number().finite().nonnegative(),
  z.string().regex(/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|pt|mm|cm|in|em|rem|%)$/),
  tokenReferenceSchema,
]);

export const typographyTokenSchema = z.union([
  tokenReferenceSchema,
  z.object({
    fontFamily: z.union([nonEmptyString, z.array(nonEmptyString).min(1)]).optional(),
    fontSize: dimensionSchema.optional(),
    fontWeight: z.union([z.number().finite().min(1).max(1000), nonEmptyString]).optional(),
    lineHeight: z.union([z.number().finite().positive(), dimensionSchema]).optional(),
    letterSpacing: z.union([z.number().finite(), nonEmptyString]).optional(),
  }).passthrough(),
]);

export const omittedSectionSchema = z.union([
  nonEmptyString,
  z.object({section: nonEmptyString, reason: nonEmptyString.optional()}).passthrough(),
]);

export const contrastPairSchema = z.object({
  id: nonEmptyString,
  foreground: nonEmptyString,
  background: nonEmptyString,
  minimum: z.number().finite().positive(),
  kind: z.enum(['text', 'large-text', 'graphic']).optional(),
}).passthrough();

export const cartographySchema = z.object({
  version: z.literal('0.2.0'),
  name: nonEmptyString,
  description: z.string().optional(),
  locale: nonEmptyString.optional(),
  tokens: z.object({
    colors: z.record(z.string(), nonEmptyString).optional(),
    typography: z.record(z.string(), typographyTokenSchema).optional(),
    widths: z.record(z.string(), dimensionSchema).optional(),
    sizes: z.record(z.string(), dimensionSchema).optional(),
    opacities: z.record(z.string(), z.union([z.number().finite().min(0).max(1), tokenReferenceSchema])).optional(),
  }).catchall(z.unknown()).optional(),
  accessibility: z.object({
    contrastPairs: z.array(contrastPairSchema).optional(),
  }).passthrough().optional(),
  omitted: z.array(omittedSectionSchema).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type TokenReference = z.infer<typeof tokenReferenceSchema>;
export type DimensionToken = z.infer<typeof dimensionSchema>;
export type TypographyToken = z.infer<typeof typographyTokenSchema>;
export type ContrastPair = z.infer<typeof contrastPairSchema>;
export type OmittedSection = z.infer<typeof omittedSectionSchema>;
export type CartographyConfig = z.infer<typeof cartographySchema>;
