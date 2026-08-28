import {dirname, resolve} from 'node:path';
import {parseCartography} from '../parser/parse.js';
import type {
  Finding,
  LintContext,
  LintFileOptions,
  LintOptions,
  LintReport,
  LintRule,
} from '../model/types.js';
import type {CartographyConfig} from '../schema/cartography.js';
import type {DataProfile} from '../schema/data-profile.js';
import {readInput, readJson} from '../utils/io.js';
import {sortFindings, summarizeFindings} from '../utils/findings.js';
import {resolveReferencesDeep} from '../utils/object.js';
import {DOCUMENT_RULES} from './rules/document.js';
import {CARTOGRAPHY_RULES} from './rules/cartography.js';
import {parseDataProfile, PROFILE_RULES} from './rules/profile.js';
import {STYLE_RULES, validateMapLibreStyle} from './rules/style.js';

export const DEFAULT_RULES: LintRule<CartographyConfig, DataProfile>[] = [
  ...DOCUMENT_RULES,
  ...CARTOGRAPHY_RULES,
  ...PROFILE_RULES,
  ...STYLE_RULES,
];

function mergeRules(custom: LintRule[] | undefined): LintRule<CartographyConfig, DataProfile>[] {
  const rules = new Map(DEFAULT_RULES.map((rule) => [rule.id, rule]));
  for (const rule of custom ?? []) rules.set(rule.id, rule);
  return [...rules.values()];
}

function reportWithAdditionalFindings(
  report: LintReport,
  additional: Finding[],
  strict: boolean,
): LintReport {
  if (additional.length === 0) return report;
  const findings = sortFindings([...report.findings, ...additional]);
  const summary = summarizeFindings(findings);
  return {
    ...report,
    findings,
    summary,
    valid: summary.errors === 0 && (!strict || summary.warnings === 0),
  };
}

export function lint(source: string, options: LintOptions = {}): LintReport {
  const maxDocumentBytes = options.maxDocumentBytes ?? 512_000;
  const parsed = parseCartography(source);
  const findings: Finding[] = [...parsed.findings];

  let dataProfile: DataProfile | undefined;
  if (options.dataProfile !== undefined) {
    const parsedProfile = parseDataProfile(options.dataProfile);
    findings.push(...parsedProfile.findings);
    dataProfile = parsedProfile.profile;
  }

  const context: LintContext<CartographyConfig, DataProfile> = {
    source: parsed.source,
    parsed,
    ...(parsed.config ? {cartography: parsed.config} : {}),
    ...(dataProfile ? {dataProfile} : {}),
    ...(options.style !== undefined ? {style: options.style} : {}),
    ...(options.sourcePath ? {sourcePath: options.sourcePath} : {}),
    maxDocumentBytes,
  };

  for (const rule of mergeRules(options.rules)) {
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
    artifacts: {
      dataProfileChecked: dataProfile !== undefined,
      styleChecked: options.style !== undefined,
      officialMapLibreValidation: options.style !== undefined,
    },
  };
}

export const lintCartography = lint;

export async function lintFile(file: string, options: LintFileOptions = {}): Promise<LintReport> {
  const source = await readInput(file);
  const preliminary = parseCartography(source);
  const baseDirectory = file === '-' ? process.cwd() : dirname(resolve(file));
  const additional: Finding[] = [];

  let dataProfile: unknown = options.dataProfile;
  const declaredProfile = preliminary.config?.data.profile;
  const profilePath = options.dataProfilePath ?? declaredProfile;
  if (dataProfile === undefined && profilePath) {
    const absoluteProfilePath = options.dataProfilePath
      ? resolve(options.dataProfilePath)
      : resolve(baseDirectory, profilePath);
    try {
      dataProfile = await readJson(absoluteProfilePath);
    } catch (error) {
      additional.push({
        ruleId: 'profile-file',
        severity: preliminary.config?.data.profileRequired ? 'error' : 'warning',
        path: 'data.profile',
        message: error instanceof Error ? error.message : `Unable to read ${absoluteProfilePath}.`,
      });
    }
  }

  let style: unknown = options.style;
  if (style === undefined && options.stylePath) {
    const absoluteStylePath = resolve(options.stylePath);
    try {
      style = await readJson(absoluteStylePath);
    } catch (error) {
      additional.push({
        ruleId: 'style-file',
        severity: 'error',
        path: 'style',
        message: error instanceof Error ? error.message : `Unable to read ${absoluteStylePath}.`,
      });
    }
  }

  const report = lint(source, {
    sourcePath: file,
    ...(dataProfile !== undefined ? {dataProfile} : {}),
    ...(style !== undefined ? {style} : {}),
    ...(options.strict !== undefined ? {strict: options.strict} : {}),
    ...(options.rules ? {rules: options.rules} : {}),
    ...(options.maxDocumentBytes !== undefined ? {maxDocumentBytes: options.maxDocumentBytes} : {}),
  });
  return reportWithAdditionalFindings(report, additional, options.strict ?? false);
}

export function resolveReferences(frontmatter: unknown): unknown {
  return resolveReferencesDeep(frontmatter, frontmatter);
}

export {parseCartography, validateMapLibreStyle};
export type * from '../model/types.js';
