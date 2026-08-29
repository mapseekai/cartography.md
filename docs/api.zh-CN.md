# TypeScript API

**版本：** 0.2.0  
**包：** `@mapseekai/cartography.md`  
**English:** [api.md](api.md)

公共 API 解析、校验、解析引用并比较一份 CARTOGRAPHY.md。普通文档无效会以结构化 finding 返回。

## 导入

```ts
import {
  cartographySchema,
  diffCartography,
  getRuleCatalog,
  getSpecification,
  lint,
  lintCartography,
  lintFile,
  parseCartography,
  resolveReferences,
  type CartographyConfig,
  type LintOptions,
  type LintReport,
} from '@mapseekai/cartography.md';
```

## 公共值与函数

| 导出 | 签名 | 用途 |
|---|---|---|
| `parseCartography` | `(source: string) => ParsedCartography<CartographyConfig>` | 解析 front matter 和 Markdown 章节，并返回 parser finding。 |
| `cartographySchema` | Zod schema | 校验版本 0.2.0 front-matter 值。 |
| `lint` | `(source: string, options?: LintOptions) => LintReport` | 对源码字符串运行 parser 检查和 document rule。 |
| `lintCartography` | `lint` 的别名 | `lint` 的兼容名称。 |
| `lintFile` | `(file: string, options?: LintFileOptions) => Promise<LintReport>` | 读取并校验文件，在报告中记录其路径。 |
| `resolveReferences` | `(frontmatter: unknown) => unknown` | 返回深拷贝值，并尽可能解析精确引用。 |
| `diffCartography` | `(beforeSource: string, afterSource: string, options?) => CartographyDiffReport` | 比较解析后的叶子值、散文章节和 finding 数量。 |
| `getSpecification` | `() => string` | 返回随包提供的英文规范。 |
| `getRuleCatalog` | `() => RuleDescriptor[]` | 返回内置 document-rule 目录的副本。 |

## `parseCartography(source)`

`parseCartography` 会规范化 byte-order mark 和换行符，解析必需的 YAML front matter，以 `cartographySchema` 校验它，提取 `##` 章节，规范化已识别标题，并报告重复的规范章节。

```ts
const parsed = parseCartography(`---
version: "0.2.0"
name: Quiet atlas
---

## Overview

Warm paper and restrained ink.
`);

if (parsed.config) {
  console.log(parsed.config.name);
}
console.log(parsed.sections[0]?.canonicalHeading); // Overview
```

Parser 和 schema 错误位于 `parsed.findings`；普通无效输入不会抛出异常。

## `cartographySchema`

`cartographySchema` 是 front matter 的 Zod 权威来源。

```ts
const result = cartographySchema.safeParse({
  version: '0.2.0',
  name: 'Quiet atlas',
});

if (result.success) {
  const config: CartographyConfig = result.data;
}
```

该对象使用 pass-through：未知根键会被保留。Linter 会另行通过 `unknown-root-key` 报告自定义根键。

## `lint(source, options?)`

`lint` 运行 parser finding 和合并后的规则集，对 finding 排序并汇总严重级别，在配置有效时解析精确引用，然后计算 `valid`。

```ts
const report = lint(source, {
  sourcePath: 'CARTOGRAPHY.md',
  strict: true,
  maxDocumentBytes: 256_000,
});

if (!report.valid) {
  for (const finding of report.findings) {
    console.error(finding.ruleId, finding.message);
  }
}
```

`lintCartography` 与 `lint` 是同一个函数对象。

### `LintOptions`

```ts
interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

- `sourcePath` 会复制到 `report.document.path` 并提供给规则。
- `strict` 默认为 `false`。设为 true 时，warning 会阻断有效性。
- `rules` 按 ID 添加自定义规则。与现有 ID 相同的自定义规则会替换对应内置规则。
- `maxDocumentBytes` 默认为 `512_000`。

### `LintReport`

```ts
interface LintReport {
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
```

只有 front matter 通过 `cartographySchema` 时，`cartography` 和 `resolved` 才存在。`sections` 按源码顺序包含规范化标题。`document.name` 和 `document.version` 来自解析后的配置。

没有 error 时，`valid` 为 true；在严格模式下还要求没有 warning。Info finding 不会阻断有效性。该结果只证明 CARTOGRAPHY.md 文档及其可确定内部关系有效。

## `lintFile(file, options?)`

```ts
type LintFileOptions = Omit<LintOptions, 'sourcePath'>;

const report = await lintFile('CARTOGRAPHY.md', {strict: true});
```

`lintFile` 读取 UTF-8 文本，调用 `lint`，并将 `document.path` 设为所提供路径。传入 `-` 会读取标准输入。文件读取失败会 reject promise。

## `resolveReferences(frontmatter)`

`resolveReferences` 使用所提供值作为根，递归替换精确的 `{path.to.value}` 字符串。

```ts
const resolved = resolveReferences({
  tokens: {
    colors: {
      ink: '#24303A',
      label: '{tokens.colors.ink}',
    },
  },
});
```

数组和对象会被递归复制。缺失引用和循环仍保留为未解析字符串；需要将这些情况报告为 finding 时，请调用 `lint`。

## `diffCartography(beforeSource, afterSource, options?)`

```ts
const report = diffCartography(before, after, {
  before: {strict: false},
  after: {strict: true},
});
```

可选的第三个参数是：

```ts
{
  before?: LintOptions;
  after?: LintOptions;
}
```

结果分别列出解析后叶子路径和规范化散文章节的新增、删除与修改项。当新报告的 error 或 warning 数量高于旧报告时，`regression` 为 true。

## `getSpecification()` 与 `getRuleCatalog()`

```ts
const specification: string = getSpecification();
const rules: RuleDescriptor[] = getRuleCatalog();
```

`getSpecification` 返回随包提供的 `docs/spec.md`。`getRuleCatalog` 返回包含内置描述符的新数组；当前每个描述符都具有 `scope: 'document'`。

## 导出的 schema 类型

包会导出以下从 schema 推导的类型：

```ts
type TokenReference = string;

type DimensionToken =
  | number
  | string; // 经过校验的尺寸字符串或精确引用

type TypographyToken =
  | TokenReference
  | {
      fontFamily?: string | string[];
      fontSize?: DimensionToken;
      fontWeight?: number | string;
      lineHeight?: number | DimensionToken;
      letterSpacing?: number | string;
      [key: string]: unknown;
    };

interface ContrastPair {
  id: string;
  foreground: string;
  background: string;
  minimum: number;
  kind?: 'text' | 'large-text' | 'graphic';
  [key: string]: unknown;
}

type OmittedSection =
  | string
  | {
      section: string;
      reason?: string;
      [key: string]: unknown;
    };

interface CartographyConfig {
  version: '0.2.0';
  name: string;
  description?: string;
  locale?: string;
  tokens?: {
    colors?: Record<string, string>;
    typography?: Record<string, TypographyToken>;
    widths?: Record<string, DimensionToken>;
    sizes?: Record<string, DimensionToken>;
    opacities?: Record<string, number | TokenReference>;
    [group: string]: unknown;
  };
  accessibility?: {
    contrastPairs?: ContrastPair[];
    [key: string]: unknown;
  };
  omitted?: OmittedSection[];
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}
```

这些别名由 Zod 推导；上面的注释概括其运行时约束，但不能替代 schema 校验。

## 导出的 model 类型

### Finding 与解析后的文档

```ts
type Severity = 'error' | 'warning' | 'info';
type RuleScope = 'document';

interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
  evidence?: unknown;
}

interface FindingSummary {
  errors: number;
  warnings: number;
  infos: number;
}

interface MarkdownSection {
  heading: string;
  canonicalHeading: string;
  line: number;
  body: string;
}

interface ParsedCartography<TConfig = CartographyConfig> {
  source: string;
  rawFrontmatter: unknown;
  config?: TConfig;
  body: string;
  sections: MarkdownSection[];
  findings: Finding[];
}
```

### 规则

```ts
interface LintContext {
  source: string;
  parsed: ParsedCartography;
  cartography?: CartographyConfig;
  sourcePath?: string;
  maxDocumentBytes: number;
}

interface LintRule {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
  run(context: LintContext): Finding[];
}

interface RuleDescriptor {
  id: string;
  severity: Severity;
  scope: RuleScope;
  description: string;
}
```

### Diff 报告

```ts
interface DiffBucket {
  added: string[];
  removed: string[];
  modified: string[];
}

interface CartographyDiffReport {
  values: DiffBucket;
  sections: DiffBucket;
  findings: {
    before: FindingSummary;
    after: FindingSummary;
    delta: {errors: number; warnings: number; infos: number};
  };
  regression: boolean;
}
```

`LintOptions`、`LintFileOptions` 和 `LintReport` 也会按上文所示完整导出。
