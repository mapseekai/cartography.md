import type {Finding, LintRule} from '../../model/types.js';
import {CANONICAL_SECTIONS, SECTION_SEVERITY} from '../../parser/sections.js';
import {exactTokenReference, extractTokenReferences, getAtPath, walkObject} from '../../utils/object.js';
import {omittedSectionNames} from './helpers.js';

const RECOGNIZED_ROOT_KEYS = new Set([
  'version',
  'name',
  'description',
  'locale',
  'tokens',
  'accessibility',
  'extensions',
  'omitted',
]);

function editDistance(left: string, right: string): number {
  const rows = Array.from({length: left.length + 1}, () => Array<number>(right.length + 1).fill(0));
  for (let index = 0; index <= left.length; index += 1) rows[index]![0] = index;
  for (let index = 0; index <= right.length; index += 1) rows[0]![index] = index;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row]![column] = Math.min(
        rows[row - 1]![column]! + 1,
        rows[row]![column - 1]! + 1,
        rows[row - 1]![column - 1]! + cost,
      );
    }
  }
  return rows[left.length]![right.length]!;
}

function closestRootKey(key: string): string | undefined {
  let closest: string | undefined;
  let score = Number.POSITIVE_INFINITY;
  for (const candidate of RECOGNIZED_ROOT_KEYS) {
    const distance = editDistance(key.toLowerCase(), candidate.toLowerCase());
    if (distance < score) {
      closest = candidate;
      score = distance;
    }
  }
  return score <= 3 ? closest : undefined;
}

export const documentSizeRule: LintRule = {
  id: 'document-size',
  severity: 'warning',
  scope: 'document',
  description: 'Keep the contract small enough for reliable agent ingestion.',
  run(context) {
    const bytes = Buffer.byteLength(context.source, 'utf8');
    if (bytes <= context.maxDocumentBytes) return [];
    return [{
      ruleId: this.id,
      severity: this.severity,
      path: '$',
      message: `CARTOGRAPHY.md is ${bytes.toLocaleString()} bytes; the configured maximum is ${context.maxDocumentBytes.toLocaleString()} bytes.`,
      suggestion: 'Move large evidence tables and screenshots to linked files while keeping normative decisions in CARTOGRAPHY.md.',
    }];
  },
};

export const requiredSectionsRule: LintRule = {
  id: 'required-sections',
  severity: 'warning',
  scope: 'document',
  description: 'Require the canonical prose sections unless explicitly omitted.',
  run(context) {
    if (!context.cartography) return [];
    const present = new Set(context.parsed.sections.map((section) => section.canonicalHeading));
    const omitted = omittedSectionNames(context.cartography);
    const findings: Finding[] = [];
    for (const section of CANONICAL_SECTIONS) {
      if (present.has(section) || omitted.has(section)) continue;
      findings.push({
        ruleId: this.id,
        severity: SECTION_SEVERITY[section],
        path: `sections.${section}`,
        message: `Canonical section "${section}" is missing.`,
        suggestion: `Add a "## ${section}" section or list it under omitted with a reason.`,
      });
    }
    for (const section of context.parsed.sections) {
      if (section.body.length === 0) {
        findings.push({
          ruleId: 'empty-section',
          severity: 'warning',
          path: `sections.${section.canonicalHeading}`,
          line: section.line,
          message: `Section "${section.heading}" is empty.`,
        });
      }
    }
    return findings;
  },
};

export const sectionOrderRule: LintRule = {
  id: 'section-order',
  severity: 'warning',
  scope: 'document',
  description: 'Keep canonical sections in a stable order for human and agent readers.',
  run(context) {
    const order = new Map(CANONICAL_SECTIONS.map((section, index) => [section, index]));
    let previous = -1;
    const findings: Finding[] = [];
    for (const section of context.parsed.sections) {
      const index = order.get(section.canonicalHeading as (typeof CANONICAL_SECTIONS)[number]);
      if (index === undefined) continue;
      if (index < previous) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          path: `sections.${section.canonicalHeading}`,
          line: section.line,
          message: `Section "${section.heading}" is out of canonical order.`,
          suggestion: `Use this order: ${CANONICAL_SECTIONS.join(' → ')}.`,
          autoFixable: true,
        });
      }
      previous = Math.max(previous, index);
    }
    return findings;
  },
};

export const unknownRootKeyRule: LintRule = {
  id: 'unknown-root-key',
  severity: 'warning',
  scope: 'document',
  description: 'Preserve extensions while flagging likely misspellings of standard root keys.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    for (const key of Object.keys(context.cartography)) {
      if (RECOGNIZED_ROOT_KEYS.has(key) || key.includes(':') || key.startsWith('x-')) continue;
      const suggestion = closestRootKey(key);
      findings.push({
        ruleId: this.id,
        severity: this.severity,
        path: key,
        message: `Unknown root key "${key}" is preserved as an extension.`,
        ...(suggestion ? {suggestion: `Did you mean "${suggestion}"? Use extensions or a namespaced key for intentional extensions.`} : {}),
      });
    }
    return findings;
  },
};

export const tokenReferenceRule: LintRule = {
  id: 'token-reference',
  severity: 'error',
  scope: 'document',
  description: 'Every exact token reference must resolve; embedded references and cycles are forbidden.',
  run(context) {
    if (!context.cartography) return [];
    const findings: Finding[] = [];
    const root = context.cartography;
    for (const entry of walkObject(root)) {
      if (typeof entry.value !== 'string') continue;
      const references = extractTokenReferences(entry.value);
      if (references.length === 0) continue;
      const exact = exactTokenReference(entry.value);
      if (!exact) {
        findings.push({
          ruleId: this.id,
          severity: 'error',
          path: entry.path,
          message: 'A YAML token reference must occupy the entire string.',
          suggestion: 'Move surrounding syntax into a structured value or define a complete token value.',
        });
        continue;
      }
      const seen = new Set<string>();
      let current = exact;
      while (true) {
        if (seen.has(current)) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: entry.path,
            message: `Token reference cycle detected at {${current}}.`,
          });
          break;
        }
        seen.add(current);
        const resolved = getAtPath(root, current);
        if (!resolved.found) {
          findings.push({
            ruleId: this.id,
            severity: 'error',
            path: entry.path,
            message: `Broken token reference {${current}}.`,
            suggestion: 'Define the referenced path or correct the reference spelling.',
          });
          break;
        }
        const nested = exactTokenReference(resolved.value);
        if (!nested) break;
        current = nested;
      }
    }
    return findings;
  },
};

export const DOCUMENT_RULES: LintRule[] = [
  documentSizeRule,
  requiredSectionsRule,
  sectionOrderRule,
  unknownRootKeyRule,
  tokenReferenceRule,
];
