import type {CartographyConfig} from '../../schema/cartography.js';

export function omittedSectionNames(config: CartographyConfig): Set<string> {
  return new Set(
    (config.omitted ?? []).map((item) =>
      typeof item === 'string' ? item : item.section,
    ),
  );
}
