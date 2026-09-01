import Color from 'colorjs.io';
import {resolveTokenValue} from './object.js';
const blocked = /^(?:currentcolor|initial|inherit|unset|revert|revert-layer|accentcolor|accentcolortext|activetext|buttonborder|buttonface|buttontext|canvas|canvastext|field|fieldtext|graytext|highlight|highlighttext|linktext|mark|marktext|selecteditem|selecteditemtext|visitedtext)$/i;
export function parseCssColor(value: string): Color | undefined { try { return new Color(value); } catch { return undefined; } }
export function isCoreColor(value: string): boolean { return !blocked.test(value.trim()) && !/var\s*\(/i.test(value) && parseCssColor(value) !== undefined; }
export function resolveColor(root: unknown, value: unknown): string | undefined { const resolved = resolveTokenValue(root, value); return resolved.resolved && typeof resolved.value === 'string' ? resolved.value : undefined; }
