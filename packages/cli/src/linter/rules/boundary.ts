import type {Finding, LintRule} from '../../model/types.js';
import {isRecord, walkObject} from '../../utils/object.js';

/** Reserved data-binding property names for MapElement direct properties (§9.5). */
const RESERVED_PROPERTIES = [
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
];

/** ASCII-lowercase and strip ASCII whitespace, `-`, and `_` (§9.5 boundary check only). */
const normalizeReservedName = (key: string) => key.toLowerCase().replace(/[\t\n\f\r _-]/g, '');

const RESERVED_NORMALIZED: Record<string, true> = Object.fromEntries(
  RESERVED_PROPERTIES.map((name) => [normalizeReservedName(name), true]),
);

export const elementReservedPropertyRule: LintRule = {
  id: 'element-reserved-property',
  severity: 'error',
  scope: 'document',
  description: 'Rejects MapElement properties that normalize to a reserved data-binding property name.',
  run({cartography}) {
    const findings: Finding[] = [];
    for (const [element, value] of Object.entries(cartography.elements ?? {})) {
      if (!isRecord(value)) continue;
      for (const key of Object.keys(value)) {
        if (!RESERVED_NORMALIZED[normalizeReservedName(key)]) continue;
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path: `elements.${element}.${key}`,
          message: `The MapElement property "${key}" is a normalized variant of a reserved data-binding property.`,
        });
      }
    }
    return findings;
  },
};

export const dataBindingSuspicionRule: LintRule = {
  id: 'data-binding-suspicion',
  severity: 'warning',
  scope: 'document',
  description: 'Warns when mapping keys outside MapElement properties resemble reserved data-binding names.',
  run({cartography}) {
    const findings: Finding[] = [];
    for (const entry of walkObject(cartography)) {
      if (!isRecord(entry.value)) continue;
      // MapElement direct properties are handled by element-reserved-property.
      if (entry.path === '$.elements' || entry.path.startsWith('$.elements.')) continue;
      for (const key of Object.keys(entry.value)) {
        if (!RESERVED_NORMALIZED[normalizeReservedName(key)]) continue;
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path: `${entry.path}.${key}`,
          message: `The key "${key}" resembles a reserved data-binding property.`,
        });
      }
    }
    return findings;
  },
};

export const BOUNDARY_RULES: LintRule[] = [elementReservedPropertyRule, dataBindingSuspicionRule];
