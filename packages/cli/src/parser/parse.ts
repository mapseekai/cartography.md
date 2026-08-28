import {parseDocument} from 'yaml';
import {cartographySchema, type CartographyConfig} from '../schema/cartography.js';
import type {Finding, MarkdownSection, ParsedCartography} from '../model/types.js';
import {normalizeHeading} from './sections.js';

function extractSections(body: string, frontmatterLines: number): MarkdownSection[] {
  const lines = body.split('\n');
  const starts: Array<{index: number; heading: string}> = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^##\s+(.+?)\s*$/.exec(lines[index] ?? '');
    if (match?.[1]) starts.push({index, heading: match[1]});
  }
  return starts.map((start, position) => {
    const next = starts[position + 1];
    const end = next?.index ?? lines.length;
    return {
      heading: start.heading,
      canonicalHeading: normalizeHeading(start.heading),
      line: frontmatterLines + start.index + 1,
      body: lines.slice(start.index + 1, end).join('\n').trim(),
    };
  });
}

export function parseCartography(source: string): ParsedCartography<CartographyConfig> {
  const findings: Finding[] = [];
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    findings.push({
      ruleId: 'frontmatter-required',
      severity: 'error',
      path: '$',
      line: 1,
      message: 'CARTOGRAPHY.md must begin with a YAML front matter fence (`---`).',
      suggestion: 'Place the machine-readable cartographic contract at the top of the file.',
    });
    return {source: normalized, rawFrontmatter: undefined, body: normalized, sections: [], findings};
  }

  const closingIndex = lines.slice(1).findIndex((line) => line === '---');
  if (closingIndex < 0) {
    findings.push({
      ruleId: 'frontmatter-unclosed',
      severity: 'error',
      path: '$',
      line: 1,
      message: 'The YAML front matter has no closing `---` fence.',
    });
    return {source: normalized, rawFrontmatter: undefined, body: '', sections: [], findings};
  }

  const absoluteClosingIndex = closingIndex + 1;
  const yamlSource = lines.slice(1, absoluteClosingIndex).join('\n');
  const body = lines.slice(absoluteClosingIndex + 1).join('\n');
  const sections = extractSections(body, absoluteClosingIndex + 1);
  const yamlDocument = parseDocument(yamlSource, {prettyErrors: true, uniqueKeys: true});

  const yamlFeatureLines = yamlSource.split('\n');
  yamlFeatureLines.forEach((line, index) => {
    const code = line.replace(/#.*$/, '');
    if (/^\s*\t/.test(line)) {
      findings.push({
        ruleId: 'yaml-tab-indentation-prohibited',
        severity: 'error',
        path: '$',
        line: index + 2,
        message: 'Tabs may not be used for YAML indentation.',
      });
    }
    if (/^\s*<<\s*:/.test(code)) {
      findings.push({
        ruleId: 'yaml-merge-key-prohibited',
        severity: 'error',
        path: '$',
        line: index + 2,
        message: 'YAML merge keys are prohibited.',
      });
    }
    if (/:[ \t]*[|>][+-]?[0-9]*[ \t]*$/.test(code)) {
      findings.push({
        ruleId: 'yaml-block-scalar-prohibited',
        severity: 'error',
        path: '$',
        line: index + 2,
        message: 'YAML block scalars are prohibited; place long rationale in the Markdown body.',
      });
    }
    if (/(^|\s)[&*][A-Za-z0-9_-]+/.test(code)) {
      findings.push({
        ruleId: 'yaml-alias-prohibited',
        severity: 'error',
        path: '$',
        line: index + 2,
        message: 'YAML anchors and aliases are prohibited by the deterministic CARTOGRAPHY.md profile.',
        suggestion: 'Repeat the value explicitly or use a {path.to.token} reference.',
      });
    }
    if (/(^|\s)!{1,2}[A-Za-z<]/.test(code)) {
      findings.push({
        ruleId: 'yaml-custom-tag-prohibited',
        severity: 'error',
        path: '$',
        line: index + 2,
        message: 'Custom YAML tags are prohibited.',
      });
    }
  });

  for (const error of yamlDocument.errors) {
    const line = error.linePos?.[0]?.line;
    findings.push({
      ruleId: 'yaml-syntax',
      severity: 'error',
      path: '$',
      ...(line ? {line: line + 1} : {}),
      message: error.message,
    });
  }

  let rawFrontmatter: unknown;
  if (yamlDocument.errors.length === 0) {
    try {
      rawFrontmatter = yamlDocument.toJS({maxAliasCount: 0});
    } catch (error) {
      findings.push({
        ruleId: 'yaml-syntax',
        severity: 'error',
        path: '$',
        message: error instanceof Error ? error.message : 'Unable to parse YAML front matter.',
      });
    }
  }

  let config: CartographyConfig | undefined;
  if (rawFrontmatter !== undefined) {
    const result = cartographySchema.safeParse(rawFrontmatter);
    if (result.success) {
      config = result.data as CartographyConfig;
    } else {
      for (const issue of result.error.issues as Array<{path: Array<string | number>; message: string}>) {
        findings.push({
          ruleId: 'schema',
          severity: 'error',
          path: issue.path.length > 0 ? issue.path.join('.') : '$',
          message: issue.message,
        });
      }
    }
  }

  const seen = new Map<string, number>();
  for (const section of sections) {
    const count = (seen.get(section.canonicalHeading) ?? 0) + 1;
    seen.set(section.canonicalHeading, count);
    if (count > 1) {
      findings.push({
        ruleId: 'duplicate-section',
        severity: 'error',
        path: `sections.${section.canonicalHeading}`,
        line: section.line,
        message: `Section "${section.canonicalHeading}" appears more than once.`,
      });
    }
  }

  return {
    source: normalized,
    rawFrontmatter,
    ...(config ? {config} : {}),
    body,
    sections,
    findings,
  };
}
