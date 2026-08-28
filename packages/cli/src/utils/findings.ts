import type {Finding, FindingSummary} from '../model/types.js';

const severityOrder = {error: 0, warning: 1, info: 2} as const;

export function summarizeFindings(findings: Finding[]): FindingSummary {
  return findings.reduce<FindingSummary>(
    (summary, finding) => {
      if (finding.severity === 'error') summary.errors += 1;
      else if (finding.severity === 'warning') summary.warnings += 1;
      else summary.infos += 1;
      return summary;
    },
    {errors: 0, warnings: 0, infos: 0},
  );
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((left, right) => {
    const severity = severityOrder[left.severity] - severityOrder[right.severity];
    if (severity !== 0) return severity;
    const line = (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER);
    if (line !== 0) return line;
    return (left.path ?? '').localeCompare(right.path ?? '');
  });
}
