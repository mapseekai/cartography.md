import type {CartographyConfig} from '../schema/cartography.js';
import type {DataProfile} from '../schema/data-profile.js';

export type Severity = 'error' | 'warning' | 'info';
export type RuleScope = 'document' | 'profile' | 'style';

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

export interface LintContext<
  TConfig = CartographyConfig,
  TProfile = DataProfile,
> {
  source: string;
  parsed: ParsedCartography<TConfig>;
  cartography?: TConfig;
  dataProfile?: TProfile;
  style?: unknown;
  sourcePath?: string;
  maxDocumentBytes: number;
}

export interface LintRule<
  TConfig = CartographyConfig,
  TProfile = DataProfile,
> {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
  run(context: LintContext<TConfig, TProfile>): Finding[];
}

export interface LintOptions {
  style?: unknown;
  dataProfile?: unknown;
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}

export interface LintFileOptions {
  style?: unknown;
  dataProfile?: unknown;
  stylePath?: string;
  dataProfilePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}

export interface LintReport<TConfig = CartographyConfig> {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: FindingSummary;
  cartography?: TConfig;
  resolved?: unknown;
  sections: string[];
  document: {
    path?: string;
    name?: string;
    version?: string;
  };
  artifacts: {
    dataProfileChecked: boolean;
    styleChecked: boolean;
    officialMapLibreValidation: boolean;
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
