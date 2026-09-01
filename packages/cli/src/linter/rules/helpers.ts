import type {CartographyConfig} from '../../schema/cartography.js';
import {normalizeSectionText} from '../../parser/sections.js';

export function omittedSectionNames(config: CartographyConfig): Set<string> {
  return new Set(
    (config.omitted ?? []).map((item) =>
      normalizeSectionText(typeof item === 'string' ? item : item.section),
    ),
  );
}
