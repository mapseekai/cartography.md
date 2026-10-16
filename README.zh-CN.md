# cartography.md

**用 Markdown 定义地图设计系统，让人和 Agent 共享制图规则。**

`CARTOGRAPHY.md` 将地图的视觉风格、设计原则、可复用 Token 和地图要素样式保存在一份文档中。YAML front matter 记录精确值，Markdown 正文解释视觉层级、标注策略、尺度变化和状态表达，使同一套设计规则能够用于不同的制图任务。

仓库提供格式规范、命令行工具、TypeScript API、设计示例和 Agent 工作流，覆盖设计系统的编写、解析、校验、比较与应用。

[English](README.md) · [格式规范](docs/spec.zh-CN.md) · [编写指南](docs/authoring.zh-CN.md) · [API 参考](docs/api.zh-CN.md)

## 核心能力

| 能力 | 说明 |
| --- | --- |
| 设计系统表达 | 组织颜色、字体、线宽、尺寸、透明度、间距、虚线和地图要素组件，并以正文说明它们的用途与关系。 |
| 文档校验 | 检查 YAML 表示、front matter 结构、章节组织、Token 类型、引用关系和地图要素属性，输出分级诊断。 |
| 引用解析 | 解析 Token 别名、嵌套路径、数组索引以及对象和数组中的引用，返回深度解析后的值。 |
| 语义比较 | 按 front matter 叶子路径和 Markdown 章节列出新增、删除、修改项，并比较诊断数量。 |
| 工具集成 | 提供 CLI、ES module 形式的 TypeScript API、运行时 Schema、JSON Schema 和自定义校验规则接口。 |

## 快速开始

运行环境为 **Node.js 20 或更新版本**。使用 pnpm 安装工具；可从[示例库](#设计示例)选择一份 `CARTOGRAPHY.md` 放入工作目录。

```bash
pnpm add -D @mapseekai/cartography.md
pnpm exec cartographymd lint CARTOGRAPHY.md --format text
```

也可以直接运行：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md --format text
```

当前包版本为 `0.4.1`，文档采用 `0.4.0` 格式：

```yaml
version: "0.4.0"
```

## 文档格式

### 精确值与设计说明

YAML front matter 保存设计系统名称、格式版本和 Token。Markdown 正文说明这些值如何组成一套地图风格，以及在不同场景中的使用方式。

下面以技术管网为例，展示颜色、线宽与地图要素之间的引用关系：

```markdown
---
version: "0.4.0"
name: Technical Network
colors:
  canvas: "#F4F6F8"
  primary: "#236A85"
widths:
  primary: 4px
  casing: 1px
elements:
  pipeline-primary:
    geometry: line
    family: pipeline
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.primary}"
    strokeWidth: "{widths.primary}"
    casingColor: "{colors.canvas}"
    casingWidth: "{widths.casing}"
---

## Overview

以连续的网络结构、清晰的节点和明确的视觉层级组织技术管网。

## Colors

{colors.primary} 表达主体网络，{colors.canvas} 用于浅色背景与套线。
```

`{colors.primary}` 引用颜色，`{widths.primary}` 引用线宽。引用也可以指向完整的排版对象、虚线数组或数组中的某一项。完整技术管网示例见 [Technical Network](examples/technical-network/CARTOGRAPHY.md)。

### Token 与地图要素

| 根级组 | 内容 |
| --- | --- |
| `colors` | 颜色值及颜色别名。 |
| `typography` | 字体、字号、字重、行高和字间距。 |
| `widths` | 描边、套线、轮廓和光晕宽度。 |
| `sizes` | 点符号、图标和其他视觉对象的尺寸。 |
| `opacities` | 透明度。 |
| `spacing` | 标注、符号及地图版式的间距。 |
| `dashes` | 由实线长度与间隙长度组成的虚线节奏。 |
| `elements` | 组合 Token 的地图要素样式。 |

地图要素通过 `geometry` 表示视觉类型，通过 `family`、`role`、`state` 和 `layerRole` 表达家族、职责、状态与概念层级。格式还允许增加持久元数据、自定义 Token 组和扩展属性。

### 标准章节

正文按九个主题组织：Overview、Colors、Typography & Labels、Composition & Density、Layering & Depth、Geometry & Symbols、Scale & Generalization、Map Elements、Do's and Don'ts。

章节支持规范定义的中英文标题别名。作者可以用 `omitted` 记录有意省略的章节，也可以增加自定义章节。详细写法见[编写指南](docs/authoring.zh-CN.md)。

## 命令行使用

安装包后，通过 `pnpm exec cartographymd` 调用以下命令：

| 命令 | 用途 |
| --- | --- |
| `lint CARTOGRAPHY.md` | 校验文档，默认输出 JSON 报告。 |
| `lint CARTOGRAPHY.md --format text` | 输出便于阅读的文本报告。 |
| `lint CARTOGRAPHY.md --strict` | 将警告纳入通过条件。 |
| `parse CARTOGRAPHY.md` | 输出 front matter、章节和解析诊断。 |
| `diff before.md after.md` | 比较两份文档的值、章节和诊断变化。 |
| `rules` | 输出内置规则目录。 |
| `spec` | 输出随包提供的格式规范。 |
| `spec --output cartography-spec.md` | 将格式规范保存到文件。 |

`lint` 和 `parse` 可以使用 `-` 读取标准输入：

```bash
cat CARTOGRAPHY.md | pnpm exec cartographymd lint - --format text
```

### 校验报告

报告包含 `valid`、`summary`、`findings`、`sections` 和文档信息。解析得到配置时，还提供 `cartography` 与引用解析结果 `resolved`。诊断按 `error`、`warning`、`info` 分级，并附带规则 ID、说明及适用的位置、建议或证据。

普通模式以零错误作为通过条件；严格模式同时要求零警告。`diff` 在错误数或警告数增加时将 `regression` 标记为 `true`，便于在设计变更流程中检查诊断变化。

## TypeScript API

在应用中安装包：

```bash
pnpm add @mapseekai/cartography.md
```

读取文件并获取校验结果：

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {strict: true});

console.log(report.valid);
console.log(report.summary);

for (const finding of report.findings) {
  console.log(finding.severity, finding.ruleId, finding.message);
}
```

| 导出 | 用途 |
| --- | --- |
| `parseCartography(source)` | 解析文档源码。 |
| `lint(source, options)` / `lintFile(file, options)` | 校验字符串或文件。 |
| `resolveReferences(frontmatter)` | 返回经过引用解析的深拷贝。 |
| `diffCartography(beforeSource, afterSource)` | 比较两份文档源码。 |
| `cartographySchema` | 校验 front matter 数据结构。 |
| `getRuleCatalog()` / `getSpecification()` | 读取规则目录和格式规范。 |

`LintOptions.rules` 用于添加规则，或按相同规则 ID 替换默认实现。导出类型和完整签名见 [TypeScript API 参考](docs/api.zh-CN.md)。

## Agent 工作流

仓库的 `.agents/skills` 提供三项制图工作流。设计规则保存在 `CARTOGRAPHY.md` 中，数据上下文通过 `DATA_PROFILE.json` 组织，当前任务由 Agent 结合两者执行。

| Skill | 能力与产物 |
| --- | --- |
| [cartography-md](.agents/skills/cartography-md/SKILL.md) | 指导 Agent 读取设计系统、选择组件、解析 Token、应用尺度与状态规则，并分项开展格式校验、设计评审、目标验证和视觉评审。 |
| [cartography-init](.agents/skills/cartography-init/SKILL.md) | 从 `style.json`、QGIS `.qgs` / `.qgz`、ArcGIS `.lyrx` / `.stylx` 和 SLD `.sld` 提取样式信息，生成可编辑的 `CARTOGRAPHY.md` 草稿，以及 Markdown、JSON 形式的初始化报告。 |
| [data-profile](.agents/skills/data-profile/SKILL.md) | 从样式引用、TileJSON 元数据和 MVT 采样生成 `DATA_PROFILE.json`，分别记录声明、采样与样式推断证据。 |

初始化和数据画像脚本通过仓库工作区运行，各 Skill 文档提供调用方式与产物说明。

## 设计示例

| 示例 | 主要内容 |
| --- | --- |
| [Quiet Atlas](examples/quiet-atlas/CARTOGRAPHY.md) | 暖纸色背景、浅色水体、道路层级与克制的标注表达。 |
| [Technical Network](examples/technical-network/CARTOGRAPHY.md) | 管线、阀门、设施和技术标注；包含尺度变化、选中状态与风险状态组合。 |
| [Thematic Evidence](examples/thematic-map/CARTOGRAPHY.md) | 定性、顺序与发散配色，以及缺失、未知、零值和不适用状态的表达。 |

## 仓库开发与验证

仓库使用 pnpm 工作区，`packageManager` 固定为 `pnpm@10.34.5`。

```bash
git clone https://github.com/mapseekai/cartography.md.git
cd cartography.md
pnpm install --frozen-lockfile
pnpm check
pnpm lint:example
```

`pnpm check` 执行 Schema 一致性检查、类型检查、构建、核心测试、数据画像与初始化工作流测试、发布元数据测试及包产物检查。`pnpm lint:example` 校验 Quiet Atlas 示例。

```text
cartography.md/
├── docs/          格式规范、API、编写指南与迁移说明
├── schema/        front matter JSON Schema
├── packages/cli/  命令行工具与 TypeScript API
├── examples/      三套制图设计系统示例
├── .agents/skills/  制图应用、样式初始化与数据画像工作流
└── scripts/       发布元数据校验脚本与测试
```

## 文档与贡献

设计理念见[设计哲学](docs/PHILOSOPHY.zh-CN.md)，尺寸、套线和透明度等属性的含义见[视觉语义](docs/visual-semantics.md)。版本变化记录在[更新日志](CHANGELOG.zh-CN.md)，格式升级步骤见 [0.3 → 0.4 迁移指南](docs/migrations/0.3-to-0.4.zh-CN.md)。

格式、规则、工具、示例和文档的贡献流程见[贡献指南](CONTRIBUTING.md)。

## 许可证

本项目采用 [Apache-2.0](LICENSE) 许可证。
