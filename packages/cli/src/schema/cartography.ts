import * as z from 'zod';
import {FORMAT_VERSION} from '../version.js';

export const NO_LINE_TERMINATOR = /[\r\n\u2028\u2029]/;

/**
 * ECMAScript `$` also matches before a final line terminator, so every
 * full-match pattern needs an explicit terminator exclusion (spec appendix B
 * V43 closes this bypass).
 */
function exact(pattern: RegExp) {
  return z
    .string()
    .regex(pattern)
    .refine((value) => !NO_LINE_TERMINATOR.test(value), 'String must not contain a line terminator.');
}

export const nonEmptyString = z
  .string()
  .min(1)
  .regex(/\P{White_Space}/u, 'String must contain a non-whitespace character.');

export const literalNonEmptyString = nonEmptyString.refine(
  (value) => !/^\s*\{[\s\S]*\}\s*$/.test(value),
  'Token references are not allowed here.',
);

export const tokenIdentifierSchema = exact(/^[A-Za-z0-9_-]+$/);
export const tokenReferenceSchema = exact(
  /^\{[A-Za-z0-9_-]+(?:(?:\.[A-Za-z0-9_-]+)|(?:\[(?:0|[1-9][0-9]*)\]))+\}$/,
);

export const dimensionSchema = exact(
  /^(?:-(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)|(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)(?:px|pt|mm|cm|in|em)$/,
);
export const absoluteDimensionSchema = exact(
  /^(?:-(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)|(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)(?:px|pt|mm|cm|in)$/,
);
export const nonNegativeAbsoluteDimensionSchema = exact(
  /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:px|pt|mm|cm|in)$/,
);
export const positiveAbsoluteDimensionSchema = exact(
  /^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)(?:px|pt|mm|cm|in)$/,
);
export const positiveDimensionSchema = exact(
  /^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)(?:px|pt|mm|cm|in|em)$/,
);

export const opacitySchema = z.number().min(0).max(1);

export const colorSchema = literalNonEmptyString;

export const typographySchema = z
  .looseObject({
    fontFamily: z.union([literalNonEmptyString, z.array(literalNonEmptyString).min(1), tokenReferenceSchema]),
    fontSize: z.union([positiveAbsoluteDimensionSchema, tokenReferenceSchema]),
    fontWeight: z
      .union([z.number().min(1).max(1000), z.enum(['normal', 'bold']), tokenReferenceSchema])
      .optional(),
    lineHeight: z
      .union([z.number().positive(), positiveDimensionSchema, tokenReferenceSchema])
      .optional(),
    letterSpacing: z.union([dimensionSchema, tokenReferenceSchema]).optional(),
    fontStyle: z.union([literalNonEmptyString, tokenReferenceSchema]).optional(),
    textTransform: z.union([literalNonEmptyString, tokenReferenceSchema]).optional(),
    fontFeature: z.union([literalNonEmptyString, tokenReferenceSchema]).optional(),
    fontVariation: z.union([literalNonEmptyString, tokenReferenceSchema]).optional(),
  });

export const dashPatternSchema = z
  .array(z.union([positiveAbsoluteDimensionSchema, tokenReferenceSchema]))
  .min(2);

export const patternSpecSchema = z.union([
  literalNonEmptyString,
  z.array(z.unknown()).min(1),
  z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0),
]);

const colorOrRef = z.union([colorSchema, tokenReferenceSchema]);
const nonNegativeDimensionOrRef = z.union([nonNegativeAbsoluteDimensionSchema, tokenReferenceSchema]);

/** Reserved MapElement property names; rejected outright here, normalized variants by the boundary rule (§9.5). */
export const RESERVED_ELEMENT_PROPERTIES = [
  'source',
  'sourceLayer',
  'source-layer',
  'layerId',
  'field',
  'property',
  'filter',
  'valueMapping',
  'paint',
  'layout',
  'minzoom',
  'maxzoom',
  'outputPath',
] as const;

const CORE_STYLE_PROPERTIES = [
  'color',
  'fillColor',
  'strokeColor',
  'outlineColor',
  'casingColor',
  'haloColor',
  'strokeWidth',
  'outlineWidth',
  'casingWidth',
  'haloWidth',
  'size',
  'opacity',
  'fillOpacity',
  'strokeOpacity',
  'typography',
  'symbol',
  'pattern',
  'dash',
  'offset',
  'spacing',
] as const;

const reservedElementShape = Object.fromEntries(
  RESERVED_ELEMENT_PROPERTIES.map((name) => [name, z.never().optional()]),
);

export const mapElementSchema = z
  .looseObject({
    geometry: z.enum(['background', 'point', 'line', 'polygon', 'label', 'raster', 'mixed']),
    family: literalNonEmptyString.optional(),
    role: literalNonEmptyString.optional(),
    state: literalNonEmptyString.optional(),
    layerRole: literalNonEmptyString.optional(),
    color: colorOrRef.optional(),
    fillColor: colorOrRef.optional(),
    strokeColor: colorOrRef.optional(),
    outlineColor: colorOrRef.optional(),
    casingColor: colorOrRef.optional(),
    haloColor: colorOrRef.optional(),
    strokeWidth: nonNegativeDimensionOrRef.optional(),
    outlineWidth: nonNegativeDimensionOrRef.optional(),
    casingWidth: nonNegativeDimensionOrRef.optional(),
    haloWidth: nonNegativeDimensionOrRef.optional(),
    size: nonNegativeDimensionOrRef.optional(),
    opacity: z.union([opacitySchema, tokenReferenceSchema]).optional(),
    fillOpacity: z.union([opacitySchema, tokenReferenceSchema]).optional(),
    strokeOpacity: z.union([opacitySchema, tokenReferenceSchema]).optional(),
    typography: z.union([typographySchema, tokenReferenceSchema]).optional(),
    symbol: z.union([literalNonEmptyString, tokenReferenceSchema]).optional(),
    pattern: z.union([patternSpecSchema, tokenReferenceSchema]).optional(),
    dash: z.union([dashPatternSchema, tokenReferenceSchema]).optional(),
    offset: z.union([absoluteDimensionSchema, tokenReferenceSchema]).optional(),
    spacing: nonNegativeDimensionOrRef.optional(),
    ...reservedElementShape,
  })
  .superRefine((value, context) => {
    if (!CORE_STYLE_PROPERTIES.some((key) => Object.hasOwn(value, key))) {
      context.addIssue({
        code: 'custom',
        message: 'MapElement must contain at least one core style property.',
      });
    }
  });

export const omittedSectionSchema = z.union([
  literalNonEmptyString,
  z.object({section: literalNonEmptyString, reason: literalNonEmptyString.optional()}).strict(),
]);

const tokenGroup = <T extends z.ZodType>(value: T) => z.record(tokenIdentifierSchema, value).optional();

export const cartographySchema = z
  .looseObject({
    version: z.literal(FORMAT_VERSION),
    name: literalNonEmptyString,
    description: literalNonEmptyString.optional(),
    omitted: z.array(omittedSectionSchema).optional(),
    colors: tokenGroup(colorOrRef),
    typography: tokenGroup(z.union([typographySchema, tokenReferenceSchema])),
    widths: tokenGroup(nonNegativeDimensionOrRef),
    sizes: tokenGroup(nonNegativeDimensionOrRef),
    opacities: tokenGroup(z.union([opacitySchema, tokenReferenceSchema])),
    spacing: tokenGroup(nonNegativeDimensionOrRef),
    dashes: tokenGroup(z.union([dashPatternSchema, tokenReferenceSchema])),
    elements: tokenGroup(mapElementSchema),
  });

export type TokenReference = z.infer<typeof tokenReferenceSchema>;
export type DimensionToken = z.infer<typeof dimensionSchema>;
export type TypographyToken = z.infer<typeof typographySchema>;
export type OmittedSection = z.infer<typeof omittedSectionSchema>;
export type MapElement = z.infer<typeof mapElementSchema>;
export type CartographyConfig = z.infer<typeof cartographySchema>;
