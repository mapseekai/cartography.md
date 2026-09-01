import type {Finding, LintRule} from '../../model/types.js';
import {maskMarkdownReferenceLiterals} from '../../parser/markdown.js';
import {CANONICAL_SECTIONS, canonicalSectionName} from '../../parser/sections.js';
import {
  exactTokenReference,
  extractTokenReferenceMatches,
  resolveTokenReference,
  walkObject,
} from '../../utils/object.js';

const STANDARD_ROOT_KEYS = [
  'version',
  'name',
  'description',
  'omitted',
  'colors',
  'typography',
  'widths',
  'sizes',
  'opacities',
  'spacing',
  'dashes',
  'elements',
];

function errorFinding(ruleId: string, message: string, path?: string): Finding {
  return {ruleId, severity: 'error', message, ...(path ? {path} : {})};
}

export const documentSizeRule: LintRule = {
  id: 'document-size',
  severity: 'warning',
  scope: 'document',
  description: 'Warns when the document exceeds the configured byte budget for reliable agent ingestion.',
  run({source, maxDocumentBytes}) {
    if (Buffer.byteLength(source) <= maxDocumentBytes) return [];
    return [{
      ruleId: this.id,
      severity: this.severity,
      message: `The document exceeds the ${maxDocumentBytes}-byte limit.`,
    }];
  },
};

export const omittedSectionsRule: LintRule = {
  id: 'omitted-sections',
  severity: 'error',
  scope: 'document',
  description: 'Rejects omitted entries that are unknown, duplicated after normalization, or also present in the body.',
  run({cartography, parsed}) {
    const findings: Finding[] = [];
    const seen = new Set<string>();
    const present = new Set(
      parsed.sections
        .map((section) => canonicalSectionName(section.heading))
        .filter((name): name is string => Boolean(name)),
    );
    for (const [index, item] of (cartography.omitted ?? []).entries()) {
      const declared = typeof item === 'string' ? item : item.section;
      const canonical = canonicalSectionName(declared);
      const path = `omitted.${index}`;
      if (!canonical) {
        findings.push(errorFinding(this.id, `The omitted section "${declared}" is not a recognized standard section.`, path));
        continue;
      }
      if (seen.has(canonical)) {
        findings.push(errorFinding(this.id, `The omitted section "${canonical}" appears more than once.`, path));
      }
      if (present.has(canonical)) {
        findings.push(errorFinding(this.id, `The omitted section "${canonical}" also appears in the document body.`, path));
      }
      seen.add(canonical);
    }
    return findings;
  },
};

export const missingSectionsRule: LintRule = {
  id: 'missing-sections',
  severity: 'info',
  scope: 'document',
  description: 'Notes standard sections that are absent without an omitted declaration.',
  run({cartography, parsed}) {
    const omitted = new Set(
      (cartography.omitted ?? []).map((item) => canonicalSectionName(typeof item === 'string' ? item : item.section)),
    );
    const present = new Set(parsed.sections.map((section) => canonicalSectionName(section.heading)));
    return CANONICAL_SECTIONS.filter((section) => !present.has(section) && !omitted.has(section)).map((section) => ({
      ruleId: this.id,
      severity: this.severity,
      message: `The standard section "${section}" is missing.`,
    }));
  },
};

export const emptySectionRule: LintRule = {
  id: 'empty-section',
  severity: 'warning',
  scope: 'document',
  description: 'Warns when a recognized standard section has no body content.',
  run({parsed}) {
    return parsed.sections
      .filter((section) => canonicalSectionName(section.heading) && !section.body.trim())
      .map((section) => ({
        ruleId: this.id,
        severity: this.severity,
        line: section.line,
        message: `The standard section "${section.canonicalHeading}" is empty.`,
      }));
  },
};

export const sectionOrderRule: LintRule = {
  id: 'section-order',
  severity: 'warning',
  scope: 'document',
  description: 'Warns when recognized standard sections appear out of canonical order.',
  run({parsed}) {
    const findings: Finding[] = [];
    let previous = -1;
    for (const section of parsed.sections) {
      const canonical = canonicalSectionName(section.heading);
      if (!canonical) continue;
      const order = CANONICAL_SECTIONS.indexOf(canonical as (typeof CANONICAL_SECTIONS)[number]);
      if (order < previous) {
        findings.push({
          ruleId: this.id,
          severity: this.severity,
          line: section.line,
          message: `The section "${canonical}" is out of canonical order.`,
        });
      }
      previous = Math.max(previous, order);
    }
    return findings;
  },
};

export const unknownRootKeyRule: LintRule = {
  id: 'unknown-root-key',
  severity: 'info',
  scope: 'document',
  description: 'Notes unknown root keys that are preserved as custom content.',
  run({cartography}) {
    return Object.keys(cartography)
      .filter((key) => !STANDARD_ROOT_KEYS.includes(key))
      .map((key) => ({
        ruleId: this.id,
        severity: this.severity,
        path: key,
        message: `The root key "${key}" is preserved as unknown content.`,
      }));
  },
};

export const rootKeyCaseConflictRule: LintRule = {
  id: 'root-key-case-conflict',
  severity: 'warning',
  scope: 'document',
  description: 'Warns when an unknown root key differs from a standard key only by letter case.',
  run({cartography}) {
    return Object.keys(cartography)
      .filter(
        (key) =>
          !STANDARD_ROOT_KEYS.includes(key) &&
          STANDARD_ROOT_KEYS.some((root) => root.toLowerCase() === key.toLowerCase()),
      )
      .map((key) => ({
        ruleId: this.id,
        severity: this.severity,
        path: key,
        message: `The root key "${key}" differs from a standard key only by case.`,
      }));
  },
};

export const tokenReferenceRule: LintRule = {
  id: 'token-reference',
  severity: 'error',
  scope: 'document',
  description: 'Requires every whole-scalar or visible-prose token reference to have valid syntax and resolve without cycles.',
  run({cartography, parsed}) {
    const findings: Finding[] = [];
    for (const entry of walkObject(cartography)) {
      if (typeof entry.value !== 'string') continue;
      const trimmed = entry.value.trim();
      if (/^\{[\s\S]*\}$/.test(trimmed) && !exactTokenReference(entry.value)) {
        findings.push(errorFinding(this.id, `The token reference "${trimmed}" has invalid syntax.`, entry.path));
        continue;
      }
      const reference = exactTokenReference(entry.value);
      if (!reference) continue;
      const result = resolveTokenReference(cartography, reference);
      if (!result.resolved) {
        findings.push(
          errorFinding(
            result.reason === 'depth-limit' ? 'resource-limit' : this.id,
            `The token reference "{${reference}}" cannot be resolved (${result.reason}).`,
            entry.path,
          ),
        );
      }
    }
    // §10.3: scan the whole Markdown body once — preamble, heading text, and
    // every section — so references outside section bodies are still checked.
    const masked = maskMarkdownReferenceLiterals(parsed.body);
    for (const match of extractTokenReferenceMatches(masked)) {
      const result = resolveTokenReference(cartography, match.path);
      if (result.resolved) continue;
      const line = parsed.bodyStartLine + (masked.slice(0, match.index).match(/\n/g)?.length ?? 0);
      findings.push({
        ruleId: result.reason === 'depth-limit' ? 'resource-limit' : this.id,
        severity: this.severity,
        line,
        message: `The token reference "{${match.path}}" cannot be resolved (${result.reason}).`,
      });
    }
    return findings;
  },
};

export const DOCUMENT_RULES: LintRule[] = [
  documentSizeRule,
  omittedSectionsRule,
  missingSectionsRule,
  emptySectionRule,
  sectionOrderRule,
  unknownRootKeyRule,
  rootKeyCaseConflictRule,
  tokenReferenceRule,
];
