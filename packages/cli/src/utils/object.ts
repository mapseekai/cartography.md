export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export interface WalkEntry { path: string; value: unknown; }
export function walkObject(value: unknown, path = '$'): WalkEntry[] {
  const entries: WalkEntry[] = [{path, value}];
  if (Array.isArray(value)) value.forEach((item, index) => entries.push(...walkObject(item, `${path}[${index}]`)));
  else if (isRecord(value)) Object.keys(value).forEach((key) => entries.push(...walkObject(value[key], `${path}.${key}`)));
  return entries;
}
export const TOKEN_IDENTIFIER_SOURCE = '[A-Za-z0-9_-]+';
export const INDEX_SOURCE = '\\[(?:0|[1-9][0-9]*)\\]';
export const REFERENCE_PATH_SOURCE = `${TOKEN_IDENTIFIER_SOURCE}(?:(?:\\.${TOKEN_IDENTIFIER_SOURCE})|(?:${INDEX_SOURCE}))+`;
export const REFERENCE_PATTERN = new RegExp(`^\\{(${REFERENCE_PATH_SOURCE})\\}$`);
const candidatePattern = /\{([^{}\r\n]*)\}/g;
const metadataRoots = new Set(['version', 'name', 'description', 'omitted']);
type Step = {kind: 'key'; name: string} | {kind: 'index'; index: number};
export function validReferencePath(path: string): boolean { return new RegExp(`^${REFERENCE_PATH_SOURCE}$`).test(path); }
export function parseReferencePath(path: string): Step[] | undefined {
  if (!validReferencePath(path)) return undefined;
  const root = /^[A-Za-z0-9_-]+/.exec(path)?.[0]; if (!root) return undefined;
  const steps: Step[] = [{kind: 'key', name: root}]; let cursor = root.length;
  const part = /(?:\.([A-Za-z0-9_-]+)|\[([0-9]+)\])/y;
  while (cursor < path.length) { part.lastIndex = cursor; const match = part.exec(path); if (!match) return undefined; const key = match[1]; const index = match[2]; if (key !== undefined) steps.push({kind: 'key', name: key}); else if (index !== undefined) steps.push({kind: 'index', index: Number(index)}); else return undefined; cursor = part.lastIndex; }
  return steps;
}
export function exactTokenReference(value: unknown): string | undefined { if (typeof value !== 'string') return undefined; const match = REFERENCE_PATTERN.exec(value.trim()); return match?.[1]; }
export function extractTokenReferenceCandidates(value: string): string[] { return [...value.matchAll(candidatePattern)].flatMap((match) => match[1] === undefined ? [] : [match[1]]); }
export function extractTokenReferences(value: string): string[] { return extractTokenReferenceCandidates(value).filter(validReferencePath); }
export interface TokenReferenceMatch { path: string; index: number; }
/** Reference-shaped brace spans with their offsets in the scanned text. */
export function extractTokenReferenceMatches(value: string): TokenReferenceMatch[] {
  return [...value.matchAll(candidatePattern)].flatMap((match) => {
    const path = match[1];
    return path !== undefined && typeof match.index === 'number' && validReferencePath(path) ? [{path, index: match.index}] : [];
  });
}
export function extractInvalidTokenReferences(value: string): string[] { return extractTokenReferenceCandidates(value).filter((path) => (/^[A-Za-z0-9_-]+(?:\.|\[)/.test(path) || !/\s/u.test(path)) && !validReferencePath(path)); }
export function getAtPath(root: unknown, path: string): {found: boolean; value?: unknown} {
  const steps = parseReferencePath(path); if (!steps) return {found: false}; let current = root;
  for (const step of steps) { if (step.kind === 'index') { if (!Array.isArray(current) || step.index >= current.length || !Object.hasOwn(current, step.index)) return {found: false}; current = current[step.index]; } else { if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, step.name)) return {found: false}; current = current[step.name]; } }
  return {found: true, value: current};
}
export type ResolutionReason = 'broken' | 'illegal-index' | 'traverses-reference' | 'metadata-root' | 'invalid-syntax' | 'cycle' | 'depth-limit';
export interface Resolution { resolved: boolean; value?: unknown; path?: string; cycle?: boolean; reason?: ResolutionReason; }
export function resolveTokenReference(root: unknown, path: string): Resolution { return resolvePath(root, path, new Set(), 0); }
function resolvePath(root: unknown, path: string, seen: Set<string>, depth: number): Resolution {
  if (depth >= 100) return {resolved: false, reason: 'depth-limit'};
  const steps = parseReferencePath(path); if (!steps) return {resolved: false, reason: 'invalid-syntax'};
  const first = steps[0];
  if (!first || first.kind !== 'key') return {resolved: false, reason: 'invalid-syntax'};
  if (metadataRoots.has(first.name)) return {resolved: false, reason: 'metadata-root'};
  let current = root;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!step) return {resolved: false, reason: 'invalid-syntax'};
    if (index > 0 && exactTokenReference(current)) return {resolved: false, reason: 'traverses-reference'};
    if (step.kind === 'index') { if (!Array.isArray(current)) return {resolved: false, reason: 'illegal-index'}; if (step.index >= current.length || !Object.hasOwn(current, step.index)) return {resolved: false, reason: 'broken'}; current = current[step.index]; }
    else { if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, step.name)) return {resolved: false, reason: 'broken'}; current = current[step.name]; }
  }
  const next = exactTokenReference(current); if (!next) return {resolved: true, value: current, path};
  if (seen.has(next)) return {resolved: false, path: next, cycle: true, reason: 'cycle'};
  const nextSeen = new Set(seen); nextSeen.add(path); return resolvePath(root, next, nextSeen, depth + 1);
}
export function resolveTokenValue(root: unknown, valueOrRef: unknown): Resolution { const ref = exactTokenReference(valueOrRef); return ref ? resolveTokenReference(root, ref) : {resolved: true, value: valueOrRef}; }
export function resolveReferencesDeep(value: unknown, root: unknown = value, seen = new Set<string>()): unknown {
  const ref = exactTokenReference(value); if (ref) { if (seen.has(ref)) return value; const result = resolveTokenReference(root, ref); return result.resolved ? resolveReferencesDeep(result.value, root, new Set([...seen, ref])) : value; }
  if (Array.isArray(value)) return value.map((item) => resolveReferencesDeep(item, root, seen));
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveReferencesDeep(item, root, seen)]));
  return value;
}
export function flattenLeaves(value: unknown, path = '$'): Record<string, unknown> { if (Array.isArray(value)) return Object.assign({}, ...value.map((item, index) => flattenLeaves(item, `${path}[${index}]`))); if (isRecord(value)) return Object.assign({}, ...Object.entries(value).map(([key, item]) => flattenLeaves(item, `${path}.${key}`))); return {[path]: value}; }
export function valueAtRelativePath(root: unknown, path: string): unknown { return getAtPath(root, path.replace(/^\$\.?/, '')).value; }
export function containsValue(value: unknown, predicate: (candidate: unknown) => boolean): boolean { return walkObject(value).some((entry) => predicate(entry.value)); }
export function stableStringify(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`; if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`; return JSON.stringify(value); }
