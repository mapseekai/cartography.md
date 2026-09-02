# TypeScript API

**包版本：** 0.3.1-rc.1  
**格式版本：** 0.3.0  
**包：** `@mapseekai/cartography.md`  
**English:** [api.md](api.md)

公共 API 解析、校验、解析引用并比较一份 `CARTOGRAPHY.md` 文档。普通文档无效会以结构化 finding 返回。

## 导入

```ts
import {
  DEFAULT_RULES,
  FORMAT_VERSION,
  VERSION,
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
| `DEFAULT_RULES` | `LintRule[]` | 没有同 ID 自定义覆盖时，`lint` 使用的内置 document rule。 |
| `VERSION` | `"0.3.1-rc.1"` | npm 包与 CLI 发布版本。 |
| `FORMAT_VERSION` | `"0.3.0"` | 受支持的 CARTOGRAPHY.md front matter 与 schema 版本。 |
| `parseCartography` | `(source: string) => ParsedCartography<CartographyConfig>` | 解析 front matter 和 Markdown 章节，并返回 parser finding。 |
| `cartographySchema` | Zod schema | 校验 0.3.0 front-matter 值。 |
| `lint` | `(source: string, options?: LintOptions) => LintReport` | 对源码字符串运行 parser 检查和 document rule。 |
| `lintCartography` | `lint` 的别名 | `lint` 的别名。 |
| `lintFile` | `(file: string, options?: LintFileOptions) => Promise<LintReport>` | 读取并校验文件，在报告中记录其路径。 |
| `resolveReferences` | `(frontmatter: unknown) => unknown` | 返回深拷贝值，并尽可能解析精确引用。 |
| `diffCartography` | `(beforeSource: string, afterSource: string, options?) => CartographyDiffReport` | 比较解析后的叶子值、散文章节和 finding 数量。 |
| `getSpecification` | `() => string` | 返回随包提供的规范。 |
| `getRuleCatalog` | `() => RuleDescriptor[]` | 返回内置规则目录的副本。 |

## `parseCartography(source)`

`parseCartography` 会拒绝禁止的 YAML 表示层特性，以 `cartographySchema` 解析必需 front matter，提取顶层 `##` 章节，规范化已识别标题，并报告重复的规范章节。

```ts
const parsed = parseCartography(`---
version: "0.3.0"
name: Quiet Atlas
colors:
  ink: "#24303A"
---

## Overview

Warm paper and restrained ink.
`);

console.log(parsed.config?.name); // Quiet Atlas
console.log(parsed.sections[0]?.canonicalHeading); // Overview
```

Parser 和 schema 错误位于 `parsed.findings`；普通无效输入不会抛出异常。

## `cartographySchema`

`cartographySchema` 是 0.3.0 front matter 的 Zod 结构模型。它与资料性发布 schema `schema/cartography-front-matter.schema.json` 对齐（`$id`：`urn:cartography-md:schema:front-matter:0.3.0`）。

```ts
const result = cartographySchema.safeParse({
  version: '0.3.0',
  name: 'Quiet Atlas',
  colors: {ink: '#24303A'},
});
```

该对象使用 pass-through：未知根键会被保留。Linter 会另行通过 `unknown-root-key` 报告自定义根键，并通过 `root-key-case-conflict` 报告仅大小写不同的疑似拼写错误。

## `lint(source, options?)`

`lint` 运行 parser finding 和合并后的规则集，对 finding 排序并汇总严重级别，在配置有效时解析精确引用，然后计算 `valid`。

```ts
const report = lint(source, {
  sourcePath: 'CARTOGRAPHY.md',
  strict: true,
  maxDocumentBytes: 256_000,
});
```

### `LintOptions`

```ts
interface LintOptions {
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

`strict` 默认为 `false`；设为 true 时，warning 会阻断有效性。`maxDocumentBytes` 默认为 `512_000`。大小检查是事后 advisory，发生在完整输入已读入后；调用方必须在接收不受信任的流之前实施输入限制。

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
  document: {path?: string; name?: string; version?: string};
}
```

没有 error 时，`valid` 为 true；在严格模式下还要求没有 warning。Info finding 不会阻断有效性。

## `resolveReferences(frontmatter)`

`resolveReferences` 递归解析精确的根级引用，返回新深拷贝值，而不修改输入。

```ts
const resolved = resolveReferences({
  colors: {ink: '#24303A', label: '{colors.ink}'},
  symbols: {facility: {fallbacks: ['circle', 'square']}},
  choice: '{symbols.facility.fallbacks[0]}',
});
```

引用路径要求根段之后至少有一个精确属性或数字索引步骤。元数据根（`version`、`name`、`description` 与 `omitted`）不可引用。缺失路径、非法索引、中间引用、畸形路径和循环在此保持未解析；`lint` 会将它们报告为 finding。

## 规则目录

`getRuleCatalog()` 报告以下内置 ID 与严重级别：

- **错误：** `frontmatter-required`、`frontmatter-unclosed`、`yaml-syntax`、`yaml-bom-prohibited`、`yaml-alias-prohibited`、`yaml-custom-tag-prohibited`、`yaml-merge-key-prohibited`、`yaml-tab-indentation-prohibited`、`yaml-directive-prohibited`、`yaml-document-end-prohibited`、`yaml-non-finite-number-prohibited`、`yaml-non-string-key`、`yaml-reference-unquoted`、`yaml-hex-color-unquoted`、`reference-as-mapping-key`、`schema`、`duplicate-section`、`omitted-sections`、`token-reference`、`color-token`、`known-token-type`、`dash-pattern`、`element-reserved-property`、`resource-limit`、`rule-execution`。
- **警告：** `document-size`、`empty-section`、`section-order`、`root-key-case-conflict`、`data-binding-suspicion`。
- **提示：** `missing-sections`、`unknown-root-key`、`empty-token-group`、`unused-token`、`undocumented-element`、`contract-summary`。

## Schema 推导类型

```ts
type TokenReference = string;
type OmittedSection = string | {section: string; reason?: string};
type TypographyToken = TokenReference | {
  fontFamily: string | string[] | TokenReference;
  fontSize: string | TokenReference;
  fontWeight?: number | 'normal' | 'bold' | TokenReference;
  lineHeight?: number | string | TokenReference;
  letterSpacing?: string | TokenReference;
  fontStyle?: string | TokenReference;
  textTransform?: string | TokenReference;
  fontFeature?: string | TokenReference;
  fontVariation?: string | TokenReference;
  [key: string]: unknown;
};
type MapElement = {geometry: string; [key: string]: unknown};
interface CartographyConfig {
  version: '0.3.0';
  name: string;
  description?: string;
  omitted?: OmittedSection[];
  colors?: Record<string, string>;
  typography?: Record<string, TypographyToken>;
  widths?: Record<string, string>;
  sizes?: Record<string, string>;
  opacities?: Record<string, number | TokenReference>;
  spacing?: Record<string, string>;
  dashes?: Record<string, string[] | TokenReference>;
  elements?: Record<string, MapElement>;
  [key: string]: unknown;
}
```

这些别名由 Zod 推导；此概览不能替代运行时 schema 校验。

## 其他 API 行为

`lintFile` 读取 UTF-8 文本并设置 `document.path`；传入 `-` 会读取标准输入。`diffCartography` 分别列出解析后叶子路径和规范化散文章节的新增、删除与修改项。`getSpecification` 返回包内规范，`DEFAULT_RULES` 按默认顺序包含可执行规则。
