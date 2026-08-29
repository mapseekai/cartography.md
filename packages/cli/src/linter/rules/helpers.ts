import type {CartographyConfig} from '../../schema/cartography.js';
import {normalizeHeading} from '../../parser/sections.js';

export function omittedSectionNames(config: CartographyConfig): Set<string> {
  return new Set(
    (config.omitted ?? []).map((item) =>
      normalizeHeading(typeof item === 'string' ? item : item.section),
    ),
  );
}
