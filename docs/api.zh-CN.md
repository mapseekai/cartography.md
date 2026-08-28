# Cartography.md CLI 和 TypeScript API

npm 包 `@mapseekai/cartography.md` 基于同一解析器、schema 和确定性规则集，提供命令行界面与类型化 API。

## 安装

```bash
pnpm add -D @mapseekai/cartography.md
```

需要 Node.js 20 或更高版本。

## CLI

该包安装两个等价的二进制文件：

- `cartography.md` — 规范名称；
- `cartographymd` — 推荐在 Windows 上使用的跨平台别名。

### `lint`

```bash
cartographymd lint <CARTOGRAPHY.md> \
  [--profile DATA_PROFILE.json] \
  [--style style.json] \
  [--format json|text] \
  [--strict]
```

示例：

```bash
cartographymd lint CARTOGRAPHY.md
cartographymd lint CARTOGRAPHY.md --profile DATA_PROFILE.json --style style.json
cartographymd lint CARTOGRAPHY.md --strict --format text
cat CARTOGRAPHY.md | cartographymd lint - --profile DATA_PROFILE.json
```

`--strict` 会使警告对 `report.valid` 和退出代码具有阻断作用。它不会改写 finding 严重性。

对于普通文件输入，除非显式提供 `--profile`，否则 CLI 会相对于包含 `CARTOGRAPHY.md` 的目录自动解析 `data.profile`。

### `parse`

```bash
cartographymd parse CARTOGRAPHY.md
```

解析 YAML front matter 和规范 Markdown 节，但不运行语义、数据画像或样式规则。

### `diff`

```bash
cartographymd diff CARTOGRAPHY.md CARTOGRAPHY.next.md
```

比较契约叶节点值和 Markdown 节正文。若变更后的文档引入验证回归，该命令以 `1` 退出。

### `rules`

```bash
cartographymd rules
```

以 JSON 格式输出内置规则目录。

### `spec`

```bash
cartographymd spec
cartographymd spec --output CARTOGRAPHY-SPEC.md
```

输出或复制随附的 `docs/spec.md`。

### 退出代码

| 代码 | 含义 |
|---:|---|
| `0` | 命令已完成，并在所选严格程度下通过。 |
| `1` | 验证或 diff 已完成，且结果具有阻断性。 |
| `2` | 用法、文件访问、JSON 解析或执行失败。 |

## 公共 API

```ts
import {
  DEFAULT_RULES,
  cartographySchema,
  dataProfileSchema,
  diffCartography,
  getRuleCatalog,
  getSpecification,
  lint,
  lintFile,
  parseCartography,
  resolveReferences,
  validateMapLibreStyle,
} from '@mapseekai/cartography.md';
```

## `lint(source, options?)`

同步解析并验证原始 `CARTOGRAPHY.md` 字符串。

```ts
import {lint} from '@mapseekai/cartography.md';

const report = lint(content, {
  sourcePath: '/project/CARTOGRAPHY.md',
  dataProfile,
  style,
  strict: false,
});
```

```ts
interface LintOptions {
  style?: unknown;
  dataProfile?: unknown;
  sourcePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

`lintCartography` 是 `lint` 的别名。

## `lintFile(file, options?)`

异步读取文档和可选的配套文件。

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {
  dataProfilePath: 'DATA_PROFILE.json',
  stylePath: 'style.json',
  strict: true,
});
```

```ts
interface LintFileOptions {
  style?: unknown;
  dataProfile?: unknown;
  stylePath?: string;
  dataProfilePath?: string;
  strict?: boolean;
  rules?: LintRule[];
  maxDocumentBytes?: number;
}
```

预解析的 `style` 和 `dataProfile` 值优先于路径。当省略 `dataProfilePath` 和 `dataProfile` 时，`lintFile` 会相对于文档解析 `data.profile`。

## `parseCartography(source)`

返回已解析的 front matter、可用时已验证的配置、正文、规范节和解析器 finding。

```ts
const parsed = parseCartography(content);

if (parsed.config) {
  console.log(parsed.config.intent.primaryTask);
}

for (const finding of parsed.findings) {
  console.log(finding.ruleId, finding.message);
}
```

```ts
interface ParsedCartography<TConfig = CartographyConfig> {
  source: string;
  rawFrontmatter: unknown;
  config?: TConfig;
  body: string;
  sections: MarkdownSection[];
  findings: Finding[];
}
```

解析以恢复为导向：尽可能返回结构性 finding，而不是抛出异常。文件 I/O 和 JSON 解析由 `lintFile` 和 CLI 处理。

## `resolveReferences(frontmatter)`

返回深拷贝，其中有效的精确 `{path.to.value}` 引用已解析。损坏的引用和循环保持不变；需要 finding 时请调用 `lint`。

```ts
const resolved = resolveReferences(parsed.rawFrontmatter);
```

## `validateMapLibreStyle(style, cartography, dataProfile?)`

针对已解析的契约运行全部内置样式范围规则：

- 官方 MapLibre 样式规范验证；
- Cartography.md 溯源元数据；
- 编码、source 和 source-layer 一致性；
- token 引用和 token 绑定漂移；
- 受治理的图层组顺序；
- 稳定的 feature ID；
- 可移植的资源协议；
- 旧版 filter 警告；
- 仅 paint 的 `feature-state` 约束。

```ts
const findings = validateMapLibreStyle(style, cartography, dataProfile);
```

## `diffCartography(before, after, options?)`

```ts
const diff = diffCartography(beforeContent, afterContent);

if (diff.regression) {
  console.error(diff.findings.delta);
}
```

可选的第三个参数 `{before?: LintOptions; after?: LintOptions}` 为任一侧提供数据画像或样式，使 finding 增量反映对 artifact 感知的验证。

该报告将新增、移除和修改后的已解析路径，与新增、移除和修改后的规范 Markdown 节分开列出。

## Schema

该包导出 Zod schema：

```ts
const contractResult = cartographySchema.safeParse(frontmatter);
const profileResult = dataProfileSchema.safeParse(profileJson);
```

仓库还维护可移植的 JSON schema：

- `schema/cartography.schema.json`；
- `schema/data-profile.schema.json`。

## 规范与规则

```ts
const markdown = getSpecification();
const catalog = getRuleCatalog();
```

`getSpecification()` 读取随附的规范性规范。`getRuleCatalog()` 返回公共规则描述符的副本。

## 自定义规则

```ts
import {
  DEFAULT_RULES,
  lint,
  type LintRule,
} from '@mapseekai/cartography.md';

const reservedDangerColor: LintRule = {
  id: 'acme-danger-color-reserved',
  severity: 'error',
  scope: 'document',
  description: 'Reserve the organizational danger color for operational faults.',
  run(context) {
    if (!context.cartography) return [];

    const danger = context.cartography.tokens.colors;
    // Evaluate a deterministic organization-specific condition.
    return [];
  },
};

const report = lint(content, {
  rules: [...DEFAULT_RULES, reservedDangerColor],
});
```

自定义规则按 ID 合并。具有相同 ID 的自定义规则会在该次调用中替换内置规则。规则应当是确定性的、无副作用的，并且独立于网络。

## 报告类型

```ts
type Severity = 'error' | 'warning' | 'info';
type RuleScope = 'document' | 'profile' | 'style';

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

interface LintReport<TConfig = CartographyConfig> {
  valid: boolean;
  strict: boolean;
  findings: Finding[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
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
```

`officialMapLibreValidation` 表示由于提供了样式值而调用了官方验证器。验证错误会表示为普通 finding。

## API 稳定性

该格式和包均为草案 `0.1.0`。finding ID 和报告形状旨在在 `0.1.x` 版本线内保持稳定。补丁版本中可能会新增警告；严格模式消费者应在 CI 中固定包版本。
