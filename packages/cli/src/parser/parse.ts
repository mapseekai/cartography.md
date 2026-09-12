import {isAlias, isMap, isScalar, LineCounter, parseDocument, visit, type Document} from 'yaml';
import {cartographySchema, RESERVED_ELEMENT_PROPERTIES, type CartographyConfig} from '../schema/cartography.js';
import type {Finding, MarkdownSection, ParsedCartography} from '../model/types.js';
import {isRecord, walkObject} from '../utils/object.js';
import {scanTopLevelSections} from './markdown.js';
import {canonicalSectionName} from './sections.js';
import {FORMAT_VERSION} from '../version.js';

const RESERVED_ELEMENT_PROPERTY_SET: Record<string, true> = Object.fromEntries(
  RESERVED_ELEMENT_PROPERTIES.map((name) => [name, true]),
);

function errorFinding(ruleId: string, message: string, line?: number): Finding {
  return {ruleId, severity: 'error', message, ...(line ? {line} : {})};
}

/** Line-level representation checks for the deterministic YAML profile (§4). */
function checkYamlLines(yamlSource: string, findings: Finding[]): void {
  for (const [index, line] of yamlSource.split('\n').entries()) {
    const lineNumber = index + 2;
    if (/^[ \t]*\t/.test(line)) {
      findings.push(errorFinding('yaml-tab-indentation-prohibited', 'Tab indentation is not permitted in front matter.', lineNumber));
    }
    if (/^%(?:YAML|TAG)\b/.test(line)) {
      findings.push(errorFinding('yaml-directive-prohibited', 'YAML directives are not permitted.', lineNumber));
    }
    if (/^\.\.\.$/.test(line)) {
      findings.push(errorFinding('yaml-document-end-prohibited', 'YAML document end markers are not permitted.', lineNumber));
    }
  }
}

/** Check YAML nodes so syntax-like text in strings and comments stays literal. */
function checkYamlKeys(document: Document, findings: Finding[], lineCounter: LineCounter): void {
  visit(document, {
    Pair(_, pair) {
      const key = pair.key;
      if (!key) {
        findings.push(errorFinding('yaml-non-string-key', 'Every mapping key must be a non-empty string.'));
        return;
      }
      if (!isScalar(key) || typeof key.value !== 'string' || !/\P{White_Space}/u.test(key.value)) {
        findings.push(errorFinding('yaml-non-string-key', 'Every mapping key must be a non-empty string.'));
        return;
      }
      if (/^\{[\s\S]*\}$/.test(key.value.trim())) {
        findings.push(errorFinding('reference-as-mapping-key', 'Token references are not allowed as mapping keys.'));
      }
      const line = key.range ? lineCounter.linePos(key.range[0]).line + 1 : undefined;
      if (key.type === 'PLAIN' && key.value === '<<') {
        findings.push(errorFinding('yaml-merge-key-prohibited', 'YAML merge keys are not permitted.', line));
      }
      const value = pair.value;
      if (isScalar(value) && value.source === '' && /^[0-9A-Fa-f]{3,8}(?:[ \t]*(?:#.*)?)$/.test(value.comment ?? '') &&
          value.range && lineCounter.linePos(value.range[0]).line + 1 === line) {
        findings.push(errorFinding('yaml-hex-color-unquoted', 'Hex colors beginning with # must be quoted.', line));
      }
    },
    Node(_, node) {
      const line = node.range ? lineCounter.linePos(node.range[0]).line + 1 : undefined;
      if (isAlias(node) || ('anchor' in node && node.anchor !== undefined)) {
        findings.push(errorFinding('yaml-alias-prohibited', 'YAML anchors and aliases are not permitted.', line));
      }
      if (node.tag !== undefined) {
        findings.push(errorFinding('yaml-custom-tag-prohibited', 'YAML tags are not permitted.', line));
      }
      // An unquoted `{path.to.token}` parses as a single-pair flow mapping with a null value.
      const pair = isMap(node) && node.flow && node.items.length === 1 ? node.items[0] : undefined;
      if (pair && pair.value == null) {
        findings.push(errorFinding('yaml-reference-unquoted', 'Token references must be quoted YAML strings.'));
      }
    },
  });
}

export function parseCartography(source: string): ParsedCartography<CartographyConfig> {
  const findings: Finding[] = [];
  const bom = source.startsWith('\uFEFF');
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (bom) {
    findings.push(errorFinding('yaml-bom-prohibited', 'A UTF-8 BOM is not permitted.'));
  }
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    return {
      source: normalized,
      rawFrontmatter: undefined,
      body: normalized,
      bodyStartLine: 1,
      findings: [
        ...findings,
        errorFinding('frontmatter-required', 'The document must begin with an exact front matter delimiter.', 1),
      ],
      sections: [],
    };
  }

  const closeIndex = lines.slice(1).findIndex((line) => line === '---');
  if (closeIndex < 0) {
    return {
      source: normalized,
      rawFrontmatter: undefined,
      body: '',
      bodyStartLine: 1,
      findings: [
        ...findings,
        errorFinding('frontmatter-unclosed', 'The front matter opening delimiter has no matching closing delimiter.', 1),
      ],
      sections: [],
    };
  }

  const closing = closeIndex + 1;
  const yamlSource = lines.slice(1, closing).join('\n');
  const body = lines.slice(closing + 1).join('\n');

  checkYamlLines(yamlSource, findings);

  // The yaml package defaults to the YAML 1.2 core schema: timestamps and
  // YAML 1.1 booleans stay strings, matching the restricted profile in §4.
  const lineCounter = new LineCounter();
  const document = parseDocument(yamlSource, {prettyErrors: true, uniqueKeys: true, lineCounter});
  for (const error of document.errors) {
    const line = error.linePos?.[0]?.line;
    findings.push(errorFinding('yaml-syntax', error.message, line !== undefined ? line + 1 : undefined));
  }

  checkYamlKeys(document, findings, lineCounter);

  let rawFrontmatter: unknown;
  try {
    rawFrontmatter = document.toJS({maxAliasCount: 0});
  } catch (error) {
    findings.push(errorFinding('yaml-alias-prohibited', error instanceof Error ? error.message : String(error)));
  }

  if (rawFrontmatter !== undefined && !isRecord(rawFrontmatter)) {
    findings.push(errorFinding('yaml-syntax', 'Front matter must parse to a single mapping.'));
  }
  if (rawFrontmatter !== undefined) {
    for (const entry of walkObject(rawFrontmatter)) {
      if (typeof entry.value === 'number' && !Number.isFinite(entry.value)) {
        findings.push(errorFinding('yaml-non-finite-number-prohibited', 'Non-finite numbers are not permitted.'));
      }
    }
  }

  let config: CartographyConfig | undefined;
  if (rawFrontmatter !== undefined) {
    const result = cartographySchema.safeParse(rawFrontmatter);
    if (result.success) {
      config = result.data;
    } else {
      for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : '$';
        if (path === 'version') {
          findings.push({ruleId: 'schema', severity: 'error', path,
            message: `Unsupported format version. Expected ${FORMAT_VERSION}; older documents require semantic migration, not just a version edit.`});
          continue;
        }
        const lastKey = issue.path[issue.path.length - 1];
        // Exact reserved MapElement property names are rejected by the schema;
        // re-tag them with the dedicated boundary diagnostic for clarity (§9.5).
        if (issue.path[0] === 'elements' && typeof lastKey === 'string' && Object.hasOwn(RESERVED_ELEMENT_PROPERTY_SET, lastKey)) {
          findings.push({
            ruleId: 'element-reserved-property',
            severity: 'error',
            path,
            message: `The MapElement property "${lastKey}" is a reserved data-binding property name.`,
          });
          continue;
        }
        findings.push({ruleId: 'schema', severity: 'error', path, message: issue.message});
      }
    }
  }

  const sections: MarkdownSection[] = scanTopLevelSections(body, closing + 1).map((item) => ({
    heading: item.heading,
    canonicalHeading: canonicalSectionName(item.heading) ?? item.heading,
    line: item.line,
    body: item.body,
  }));

  const seen = new Set<string>();
  for (const section of sections) {
    const canonical = canonicalSectionName(section.heading);
    if (!canonical) continue;
    if (seen.has(canonical)) {
      findings.push(errorFinding('duplicate-section', `The standard section "${canonical}" appears more than once.`, section.line));
    }
    seen.add(canonical);
  }

  return {
    source: normalized,
    rawFrontmatter,
    ...(config ? {config} : {}),
    body,
    bodyStartLine: closing + 2,
    sections,
    findings,
  };
}
