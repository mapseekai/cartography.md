import type {CartographyDiffReport, DiffBucket, LintOptions} from '../model/types.js';
import {parseCartography} from '../parser/parse.js';
import {flattenLeaves, stableStringify} from '../utils/object.js';
import {lint} from './index.js';

function compareRecords(before: Record<string, unknown>, after: Record<string, unknown>): DiffBucket {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));
  return {
    added: [...afterKeys].filter((key) => !beforeKeys.has(key)).sort(),
    removed: [...beforeKeys].filter((key) => !afterKeys.has(key)).sort(),
    modified: [...beforeKeys]
      .filter((key) => afterKeys.has(key) && stableStringify(before[key]) !== stableStringify(after[key]))
      .sort(),
  };
}

function sectionRecord(source: string): Record<string, unknown> {
  const parsed = parseCartography(source);
  return Object.fromEntries(parsed.sections.map((section) => [section.canonicalHeading, section.body]));
}

export function diffCartography(
  beforeSource: string,
  afterSource: string,
  options: {before?: LintOptions; after?: LintOptions} = {},
): CartographyDiffReport {
  const beforeParsed = parseCartography(beforeSource);
  const afterParsed = parseCartography(afterSource);
  const beforeValues = beforeParsed.config ? flattenLeaves(beforeParsed.config) : {};
  const afterValues = afterParsed.config ? flattenLeaves(afterParsed.config) : {};
  const beforeReport = lint(beforeSource, options.before);
  const afterReport = lint(afterSource, options.after);
  const delta = {
    errors: afterReport.summary.errors - beforeReport.summary.errors,
    warnings: afterReport.summary.warnings - beforeReport.summary.warnings,
    infos: afterReport.summary.infos - beforeReport.summary.infos,
  };
  return {
    values: compareRecords(beforeValues, afterValues),
    sections: compareRecords(sectionRecord(beforeSource), sectionRecord(afterSource)),
    findings: {
      before: beforeReport.summary,
      after: afterReport.summary,
      delta,
    },
    regression: delta.errors > 0 || delta.warnings > 0,
  };
}
