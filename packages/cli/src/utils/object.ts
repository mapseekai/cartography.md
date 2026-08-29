export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface WalkEntry {
  path: string;
  value: unknown;
}

export function walkObject(value: unknown, path = '$'): WalkEntry[] {
  const entries: WalkEntry[] = [{path, value}];
  if (Array.isArray(value)) {
    value.forEach((item, index) => entries.push(...walkObject(item, `${path}.${index}`)));
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      entries.push(...walkObject(child, path === '$' ? key : `${path}.${key}`));
    }
  }
  return entries;
}

const pathPattern = '[A-Za-z0-9_.\\-\\[\\]]+';
const referencePattern = new RegExp(`\\{(${pathPattern})\\}`, 'g');
const exactReferencePattern = new RegExp(`^\\{(${pathPattern})\\}$`);

export function normalizeReferencePath(path: string): string {
  return path.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
}

export function extractTokenReferences(value: string): string[] {
  return Array.from(value.matchAll(referencePattern), (match) => match[1])
    .filter((path): path is string => Boolean(path))
    .map(normalizeReferencePath);
}

export function exactTokenReference(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const matched = exactReferencePattern.exec(value)?.[1];
  return matched ? normalizeReferencePath(matched) : undefined;
}

export function getAtPath(root: unknown, path: string): {found: boolean; value?: unknown} {
  const segments = normalizeReferencePath(path).split('.').filter(Boolean);
  let current: unknown = root;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return {found: false};
      current = current[index];
      continue;
    }
    if (!isRecord(current) || !Object.hasOwn(current, segment)) return {found: false};
    current = current[segment];
  }
  return {found: true, value: current};
}

export function resolveTokenValue(
  root: unknown,
  referenceOrValue: unknown,
  seen = new Set<string>(),
): {resolved: boolean; value?: unknown; path?: string; cycle?: boolean} {
  const reference = exactTokenReference(referenceOrValue);
  if (!reference) return {resolved: true, value: referenceOrValue};
  if (seen.has(reference)) return {resolved: false, path: reference, cycle: true};
  const nextSeen = new Set(seen);
  nextSeen.add(reference);
  const result = getAtPath(root, reference);
  if (!result.found) return {resolved: false, path: reference};
  const nestedReference = exactTokenReference(result.value);
  if (nestedReference) return resolveTokenValue(root, result.value, nextSeen);
  return {resolved: true, value: result.value, path: reference};
}

export function resolveTokenReference(
  root: unknown,
  reference: string,
): {resolved: boolean; value?: unknown; path?: string; cycle?: boolean} {
  return resolveTokenValue(root, `{${normalizeReferencePath(reference)}}`);
}

export function resolveReferencesDeep(
  value: unknown,
  root: unknown = value,
  seen = new Set<string>(),
): unknown {
  const exact = exactTokenReference(value);
  if (exact) {
    if (seen.has(exact)) return value;
    const result = getAtPath(root, exact);
    if (!result.found) return value;
    const nextSeen = new Set(seen);
    nextSeen.add(exact);
    return resolveReferencesDeep(result.value, root, nextSeen);
  }
  if (Array.isArray(value)) return value.map((item) => resolveReferencesDeep(item, root, seen));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, resolveReferencesDeep(child, root, seen)]),
    );
  }
  return value;
}

export function flattenLeaves(value: unknown, path = '$'): Record<string, unknown> {
  if (Array.isArray(value)) {
    if (value.length === 0) return {[path]: []};
    return Object.assign({}, ...value.map((item, index) => flattenLeaves(item, `${path}.${index}`)));
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return {[path]: {}};
    return Object.assign({}, ...entries.map(([key, child]) => flattenLeaves(child, path === '$' ? key : `${path}.${key}`)));
  }
  return {[path]: value};
}

export function valueAtRelativePath(root: unknown, path: string): unknown {
  return getAtPath(root, path.replace(/^\$\.?/, '')).value;
}

export function containsValue(value: unknown, predicate: (candidate: unknown) => boolean): boolean {
  if (predicate(value)) return true;
  if (Array.isArray(value)) return value.some((item) => containsValue(item, predicate));
  if (isRecord(value)) return Object.values(value).some((item) => containsValue(item, predicate));
  return false;
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
