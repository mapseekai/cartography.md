import type {
  CoreStyleProps,
  Dimension,
  ExtractedElement,
  ExtractedStyle,
  ExtractedType,
  Geometry,
  LayerRole,
  ScaleHint,
} from './ir.js';

/** consolidate 后元素样式: 原字面量值替换为 Token 名。 */
export type ConsolidatedStyle = Partial<Record<keyof CoreStyleProps, string | string[]>>;

/** consolidate 阶段与 ir.ts 的 ExtractedType 同形，但不保留抽取元数据。 */
export type TypographyToken = Omit<ExtractedType, 'nameHint' | 'usedBy'>;

export interface ConsolidatedElement {
  name: string;
  geometry: Geometry;
  family?: string;
  role: 'primary' | 'secondary' | 'context';
  state: string;
  layerRole?: LayerRole;
  style: ConsolidatedStyle;
  scaleHints: ScaleHint[];
}

export interface Consolidated {
  tokens: {
    colors: Record<string, string>;
    widths: Record<string, Dimension>;
    dashes: Record<string, Dimension[]>;
    opacities: Record<string, number>;
    typography: Record<string, TypographyToken>;
  };
  elements: ConsolidatedElement[];
  nameMap: Map<string, string>;
  notes: string[];
}

type TokenKind = 'color' | 'width' | 'dash' | 'opacity' | 'typography';

interface NamedValue<T> {
  value: T;
  nameHint?: string | undefined;
}

const colorProperties: (keyof CoreStyleProps)[] = [
  'color', 'fillColor', 'strokeColor', 'outlineColor', 'casingColor', 'haloColor',
];
const widthProperties: (keyof CoreStyleProps)[] = [
  'strokeWidth', 'outlineWidth', 'casingWidth', 'haloWidth', 'size', 'offset', 'spacing',
];
const opacityProperties: (keyof CoreStyleProps)[] = ['opacity', 'fillOpacity', 'strokeOpacity'];

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function dimensionKey(value: Dimension): string {
  return `${value.value}${value.unit}`;
}

function dashKey(value: Dimension[]): string {
  return value.map(dimensionKey).join('|');
}

function typographyKey(value: TypographyToken): string {
  return `${value.fontFamily.join('|')}${dimensionKey(value.fontSize)}${String(value.fontWeight)}`;
}

function addTokens<T>(
  entries: NamedValue<T>[],
  kind: TokenKind,
  key: (value: T) => string,
): { tokens: Record<string, T>; names: Map<string, string> } {
  const tokens: Record<string, T> = {};
  const names = new Map<string, string>();
  const usedNames = new Set<string>();
  let anonymous = 0;

  for (const entry of entries) {
    const valueKey = key(entry.value);
    if (names.has(valueKey)) continue;

    const hinted = entry.nameHint ? slugify(entry.nameHint) : '';
    const base = hinted || `${kind}-${++anonymous}`;
    let name = base;
    let suffix = 2;
    while (usedNames.has(name)) name = `${base}-${suffix++}`;

    usedNames.add(name);
    names.set(valueKey, name);
    tokens[name] = entry.value;
  }

  return { tokens, names };
}

function typeToken(value: ExtractedType): TypographyToken {
  const { nameHint: _nameHint, usedBy: _usedBy, ...token } = value;
  return token;
}

function styleValues(elements: ExtractedElement[], properties: (keyof CoreStyleProps)[]): unknown[] {
  return elements.flatMap(({ style }) => properties.flatMap(property => {
    const value = style[property];
    return value === undefined ? [] : [value];
  }));
}

export function consolidate(ir: ExtractedStyle): Consolidated {
  const colorEntries: NamedValue<string>[] = [
    ...ir.colors.map(({ value, nameHint }) => ({ value, nameHint })),
    ...styleValues(ir.elements, colorProperties).filter((value): value is string => typeof value === 'string').map(value => ({ value })),
  ];
  const widthEntries: NamedValue<Dimension>[] = [
    ...ir.widths.map(({ value, nameHint }) => ({ value, nameHint })),
    ...styleValues(ir.elements, widthProperties).filter((value): value is Dimension => typeof value === 'object' && value !== null && 'unit' in value && 'value' in value).map(value => ({ value })),
  ];
  const dashEntries: NamedValue<Dimension[]>[] = [
    ...ir.dashes.map(({ pattern, nameHint }) => ({ value: pattern, nameHint })),
    ...styleValues(ir.elements, ['dash']).filter((value): value is Dimension[] => Array.isArray(value)).map(value => ({ value })),
  ];
  const opacityEntries: NamedValue<number>[] = [
    ...ir.opacities.map(({ value, nameHint }) => ({ value, nameHint })),
    ...styleValues(ir.elements, opacityProperties).filter((value): value is number => typeof value === 'number').map(value => ({ value })),
  ];
  const typographyEntries: NamedValue<TypographyToken>[] = [
    ...ir.typography.map(value => ({ value: typeToken(value), nameHint: value.nameHint })),
    ...ir.elements.flatMap(element => element.rawTypography ? [{ value: typeToken(element.rawTypography), nameHint: element.rawTypography.nameHint }] : []),
  ];

  const colors = addTokens(colorEntries, 'color', value => value);
  const widths = addTokens(widthEntries, 'width', dimensionKey);
  const dashes = addTokens(dashEntries, 'dash', dashKey);
  const opacities = addTokens(opacityEntries, 'opacity', String);
  const typography = addTokens(typographyEntries, 'typography', typographyKey);
  const nameMap = new Map<string, string>();
  const elementNames = new Set<string>();
  let anonymousElements = 0;
  const familySizes = new Map<string, number>();

  for (const element of ir.elements) {
    if (element.family) familySizes.set(element.family, (familySizes.get(element.family) ?? 0) + 1);
  }

  const elements = ir.elements.map(element => {
    const base = slugify(element.name) || `element-${++anonymousElements}`;
    let name = base;
    let suffix = 2;
    while (elementNames.has(name)) name = `${base}-${suffix++}`;
    elementNames.add(name);
    nameMap.set(element.name, name);

    const style: ConsolidatedStyle = {};
    for (const [property, value] of Object.entries(element.style) as [keyof CoreStyleProps, CoreStyleProps[keyof CoreStyleProps]][]) {
      if (value === undefined) continue;
      if (colorProperties.includes(property) && typeof value === 'string') style[property] = colors.names.get(value) ?? value;
      else if (widthProperties.includes(property) && typeof value === 'object' && value !== null && !Array.isArray(value)) style[property] = widths.names.get(dimensionKey(value as Dimension)) ?? '';
      else if (opacityProperties.includes(property) && typeof value === 'number') style[property] = opacities.names.get(String(value)) ?? '';
      else if (property === 'dash' && Array.isArray(value)) style[property] = dashes.names.get(dashKey(value as Dimension[])) ?? [];
      else if (property === 'typography' && typeof value === 'string') style[property] = value;
      else if (typeof value === 'string') style[property] = value;
    }
    if (element.rawTypography) style.typography = typography.names.get(typographyKey(typeToken(element.rawTypography))) ?? '';

    return {
      name,
      geometry: element.geometry,
      ...(element.family === undefined ? {} : { family: element.family }),
      role: element.roleHint ?? (element.family && familySizes.get(element.family) === 1 ? 'primary' : 'context'),
      state: 'default',
      ...(element.layerRole === undefined ? {} : { layerRole: element.layerRole }),
      style,
      scaleHints: element.scaleHints,
    };
  });

  return {
    tokens: {
      colors: colors.tokens,
      widths: widths.tokens,
      dashes: dashes.tokens,
      opacities: opacities.tokens,
      typography: typography.tokens,
    },
    elements,
    nameMap,
    notes: [
      `Deduplicated ${ir.colors.length} color facts into ${Object.keys(colors.tokens).length} tokens.`,
      `Assigned roles and default state to ${elements.length} elements.`,
    ],
  };
}
