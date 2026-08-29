import type {CartographyConfig} from '../schema/cartography.js';

export type Severity = 'error' | 'warning' | 'info';
export type RuleScope = 'document';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
  evidence?: unknown;
}

export interface FindingSummary {
  errors: number;
  warnings: number;
  infos: number;
}

export interface MarkdownSection {
  heading: string;
  canonicalHeading: string;
  line: number;
  body: string;
}

export interface ParsedCartography<TConfig = CartographyConfig> {
  source: string;
  rawFrontmatter: unknown;
  config?: TConfig;
  body: string;
  sections: MarkdownSection[];
  findings: Finding[];
}

export interface LintContext {
  source: string;
  parsed: ParsedCartography;
  cartography?: CartographyConfig;
  sourcePath?: string;
  maxDocumentBytes: number;
}

export interface LintRule {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
  run(context: LintContext): Finding[];
}

export interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}

export type LintFileOptions = Omit<LintOptions, 'sourcePath'>;

export interface LintReport {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: FindingSummary;
  cartography?: CartographyConfig;
  resolved?: unknown;
  sections: string[];
  document: {
    path?: string;
    name?: string;
    version?: string;
  };
}

export interface DiffBucket {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface CartographyDiffReport {
  values: DiffBucket;
  sections: DiffBucket;
  findings: {
    before: FindingSummary;
    after: FindingSummary;
    delta: {errors: number; warnings: number; infos: number};
  };
  regression: boolean;
}

export interface RuleDescriptor {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
}
