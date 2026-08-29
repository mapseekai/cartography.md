import {readFile} from 'node:fs/promises';
import type {Finding, LintReport} from '../model/types.js';

export class FileReadError extends Error {
  constructor(
    public readonly file: string,
    public readonly friendlyMessage: string,
  ) {
    super(friendlyMessage);
    this.name = 'FileReadError';
  }
}

export async function readInput(file: string): Promise<string> {
  if (file === '-') {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
  }
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new FileReadError(file, `Unable to read ${file}: ${message}`);
  }
}

function formatFinding(finding: Finding): string {
  const location = [finding.path, finding.line ? `line ${finding.line}` : undefined].filter(Boolean).join(' · ');
  const prefix = `${finding.severity.toUpperCase()} ${finding.ruleId}`;
  const suggestion = finding.suggestion ? `\n    Suggestion: ${finding.suggestion}` : '';
  return `${prefix}${location ? ` (${location})` : ''}\n    ${finding.message}${suggestion}`;
}

export function formatReportText(report: LintReport): string {
  const lines = [
    `CARTOGRAPHY.md validation: ${report.valid ? 'PASS' : 'FAIL'}`,
    `Errors: ${report.summary.errors} · Warnings: ${report.summary.warnings} · Info: ${report.summary.infos}`,
  ];
  if (report.findings.length > 0) {
    lines.push('', ...report.findings.map(formatFinding));
  }
  return lines.join('\n');
}

export function formatOutput(value: unknown, format: string): string {
  return format === 'text' && typeof value === 'object' && value !== null && 'summary' in value
    ? formatReportText(value as LintReport)
    : JSON.stringify(value, null, 2);
}
