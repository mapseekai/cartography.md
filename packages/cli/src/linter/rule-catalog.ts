import type {RuleDescriptor} from '../model/types.js';

function descriptor(
  id: string,
  severity: RuleDescriptor['severity'],
  description: string,
): RuleDescriptor {
  return {id, severity, scope: 'document', description};
}

export const RULE_CATALOG: RuleDescriptor[] = [
  descriptor('frontmatter-required', 'error', 'Requires YAML front matter at the beginning of the file.'),
  descriptor('frontmatter-unclosed', 'error', 'Detects an unclosed YAML front matter fence.'),
  descriptor('yaml-syntax', 'error', 'Reports YAML parsing errors and duplicate keys.'),
  descriptor('yaml-bom-prohibited', 'error', 'Rejects a UTF-8 BOM ahead of the front matter.'),
  descriptor('yaml-alias-prohibited', 'error', 'Rejects YAML anchors and aliases.'),
  descriptor('yaml-custom-tag-prohibited', 'error', 'Rejects explicit or custom YAML tags.'),
  descriptor('yaml-merge-key-prohibited', 'error', 'Rejects YAML merge keys.'),
  descriptor('yaml-tab-indentation-prohibited', 'error', 'Rejects tab indentation in YAML.'),
  descriptor('yaml-directive-prohibited', 'error', 'Rejects YAML directives such as %YAML or %TAG.'),
  descriptor('yaml-document-end-prohibited', 'error', 'Rejects a YAML document end marker inside the front matter.'),
  descriptor('yaml-non-finite-number-prohibited', 'error', 'Rejects non-finite YAML numbers at every front-matter depth.'),
  descriptor('yaml-non-string-key', 'error', 'Rejects mapping keys that are empty or resolve to a non-string scalar.'),
  descriptor('yaml-reference-unquoted', 'error', 'Rejects unquoted token references that YAML parses as flow mappings.'),
  descriptor('yaml-hex-color-unquoted', 'error', 'Rejects unquoted hexadecimal colors that YAML parses as comments.'),
  descriptor('reference-as-mapping-key', 'error', 'Rejects token reference syntax used as a mapping key.'),
  descriptor('schema', 'error', 'Validates the 0.3.0 front matter against the runtime schema.'),
  descriptor('duplicate-section', 'error', 'Rejects duplicate standard Markdown sections, including alias duplicates.'),
  descriptor('omitted-sections', 'error', 'Rejects omitted entries that are unknown, duplicated, or also present in the body.'),
  descriptor('token-reference', 'error', 'Requires every token reference to have valid syntax and resolve without cycles.'),
  descriptor('color-token', 'error', 'Requires resolved colors to be self-contained CSS Color 4 colors.'),
  descriptor('known-token-type', 'error', 'Requires resolved token values to satisfy the type of their use position.'),
  descriptor('dash-pattern', 'error', 'Requires even, positive, unit-consistent resolved dash patterns.'),
  descriptor('element-reserved-property', 'error', 'Rejects MapElement properties that normalize to reserved data-binding names.'),
  descriptor('resource-limit', 'error', 'Reports resource limits such as the reference resolution depth cap.'),
  descriptor('rule-execution', 'error', 'Contains unexpected validator rule failures.'),
  descriptor('document-size', 'warning', 'Warns when the document exceeds the configured byte budget.'),
  descriptor('empty-section', 'warning', 'Warns when a recognized standard section has no body content.'),
  descriptor('section-order', 'warning', 'Warns when standard sections appear out of canonical order.'),
  descriptor('root-key-case-conflict', 'warning', 'Warns when an unknown root key differs from a standard key only by case.'),
  descriptor('data-binding-suspicion', 'warning', 'Warns about keys outside MapElements that resemble reserved data-binding names.'),
  descriptor('missing-sections', 'info', 'Notes standard sections that are absent without an omitted declaration.'),
  descriptor('unknown-root-key', 'info', 'Notes unknown root keys that are preserved as custom content.'),
  descriptor('empty-token-group', 'info', 'Notes standard token groups that are present but empty.'),
  descriptor('unused-token', 'info', 'Notes standard-group tokens that neither prose nor other values reference.'),
  descriptor('undocumented-element', 'info', 'Notes elements that the Map Elements section does not mention.'),
  descriptor('contract-summary', 'info', 'Summarizes loaded token leaves, token groups, and prose sections.'),
];
