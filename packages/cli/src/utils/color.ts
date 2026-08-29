import Color from 'colorjs.io';
import {resolveTokenValue} from './object.js';

export function parseCssColor(value: unknown): Color | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return new Color(value);
  } catch {
    return undefined;
  }
}

export function contrastRatio(foreground: Color, background: Color): number {
  return foreground.contrastWCAG21(background);
}

export function resolveColor(root: unknown, value: unknown): {color?: Color; resolvedValue?: unknown} {
  const resolved = resolveTokenValue(root, value);
  if (!resolved.resolved) return {};
  const color = parseCssColor(resolved.value);
  return {
    ...(color ? {color} : {}),
    ...(resolved.value !== undefined ? {resolvedValue: resolved.value} : {}),
  };
}
