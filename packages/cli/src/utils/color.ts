import {Color} from '@maplibre/maplibre-gl-style-spec';
import {resolveTokenValue} from './object.js';

export function parseMapColor(value: unknown): Color | undefined {
  if (typeof value !== 'string') return undefined;
  return Color.parse(value) ?? undefined;
}

function luminanceChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: Color): number {
  const [red, green, blue] = color.rgb;
  return 0.2126 * luminanceChannel(red) + 0.7152 * luminanceChannel(green) + 0.0722 * luminanceChannel(blue);
}

export function contrastRatio(foreground: Color, background: Color): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function resolveColor(root: unknown, value: unknown): {color?: Color; resolvedValue?: unknown} {
  const resolved = resolveTokenValue(root, value);
  if (!resolved.resolved) return {};
  const color = parseMapColor(resolved.value);
  return {
    ...(color ? {color} : {}),
    ...(resolved.value !== undefined ? {resolvedValue: resolved.value} : {}),
  };
}
