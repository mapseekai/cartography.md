import {parseCartography} from '../parser/parse.js';
import type {CartographyConfig} from '../schema/cartography.js';
import type {
  Finding,
  LintContext,
  LintFileOptions,
  LintOptions,
  LintReport,
  LintRule,
} from '../model/types.js';
import {readInput} from '../utils/io.js';
import {sortFindings, summarizeFindings} from '../utils/findings.js';
import {resolveReferencesDeep} from '../utils/object.js';
import {DOCUMENT_RULES} from './rules/document.js';
import {CARTOGRAPHY_RULES} from './rules/cartography.js';
import {BOUNDARY_RULES} from './rules/boundary.js';

export const DEFAULT_RULES: LintRule[] = [
  ...DOCUMENT_RULES,
  ...CARTOGRAPHY_RULES,
  ...BOUNDARY_RULES,
];

function mergeRules(custom: LintRule[] | undefined): LintRule[] {
  const rules = new Map(DEFAULT_RULES.map((rule) => [rule.id, rule]));
  for (const rule of custom ?? []) rules.set(rule.id, rule);
  return [...rules.values()];
}

export function lint(source: string, options: LintOptions = {}): LintReport {
  const maxDocumentBytes = options.maxDocumentBytes ?? 512_000;
  const parsed = parseCartography(source);
  const findings: Finding[] = [...parsed.findings];
  const context: LintContext = {
    source: parsed.source,
    parsed,
    cartography: parsed.config as CartographyConfig,
    ...(options.sourcePath ? {sourcePath: options.sourcePath} : {}),
    maxDocumentBytes,
  };

  for (const rule of mergeRules(options.rules)) {
    if (!parsed.config && rule.id !== 'document-size') continue;
    try {
      findings.push(...rule.run(context));
    } catch (error) {
      findings.push({
        ruleId: 'rule-execution',
        severity: 'error',
        path: rule.id,
        message: `Rule "${rule.id}" failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const sorted = sortFindings(findings);
  const summary = summarizeFindings(sorted);
  const strict = options.strict ?? false;
  return {
    valid: summary.errors === 0 && (!strict || summary.warnings === 0),
    strict,
    findings: sorted,
    summary,
    ...(parsed.config ? {cartography: parsed.config, resolved: resolveReferencesDeep(parsed.config, parsed.config)} : {}),
    sections: parsed.sections.map((section) => section.canonicalHeading),
    document: {
      ...(options.sourcePath ? {path: options.sourcePath} : {}),
      ...(parsed.config?.name ? {name: parsed.config.name} : {}),
      ...(parsed.config?.version ? {version: parsed.config.version} : {}),
    },
  };
}

export const lintCartography = lint;

export async function lintFile(file: string, options: LintFileOptions = {}): Promise<LintReport> {
  return lint(await readInput(file), {
    ...options,
    sourcePath: file,
  });
}

export function resolveReferences(frontmatter: unknown): unknown {
  return resolveReferencesDeep(frontmatter, frontmatter);
}

export {parseCartography};
export type * from '../model/types.js';
