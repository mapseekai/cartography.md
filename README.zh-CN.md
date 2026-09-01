# cartography.md

**为 Agent 保存持久、可迁移的制图视觉身份。**

`CARTOGRAPHY.md` 是面向地图设计系统、可移植且便于 Agent 阅读的格式。它把一个地图家族的视觉身份和长期制图判断保存在一份自包含 Markdown 文档中，使 Agent 能跨数据集、任务、工具和输出持续应用同一种视觉性格。

核心包只负责解析、lint、比较和解释这份文档。它仅验证文档结构与可确定的内部关系；当前任务输入、数据检查、目标专属生产和输出评审都在核心验证之外进行。

English: [README.md](README.md) · [规范](docs/spec.zh-CN.md) · [TypeScript API](docs/api.zh-CN.md) · [设计哲学](docs/PHILOSOPHY.zh-CN.md)

## 为什么需要它

制图决策常常消失在一次性实现中：哪些标记应获得注意、层级如何随比例尺变化、标注应该呈现怎样的气质、交互状态如何保留原始含义，以及怎样让结果始终属于同一个可辨识的家族。

`CARTOGRAPHY.md` 让这些判断能够长期保存。prose 承载专业判断，根级 token 组提供准确、可复用的值；Agent 因而既能理解视觉系统是什么，也能理解其约束为何重要。

## 双层格式

每份文档都有两个互补层次：

1. YAML front matter 保存身份、版本、可选省略项，以及根级 `colors`、`typography`、`widths`、`sizes`、`opacities`、`spacing`、`dashes` 和 `elements` 组。
2. Markdown 解释九个规范章节：Overview、Colors、Typography & Labels、Composition & Density、Layering & Depth、Geometry & Symbols、Scale & Generalization、Map Elements 与 Do's and Don'ts。

```markdown
---
version: "0.3.0"
name: Quiet Atlas
description: "A restrained editorial atlas family for clear orientation and unhurried reading."
colors:
  paper: "#f8f4f0"
  water: "#aecfe2"
  ink: "#000000"
widths:
  route: 2px
elements:
  route-primary:
    geometry: line
    family: route
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.ink}"
    strokeWidth: "{widths.route}"
---

## Overview

Quiet Atlas is a restrained editorial map family: warm paper, pale blue water,
and near-black ink make the page feel calmly printed rather than brightly lit.

## Colors

Use {colors.paper} as the warm canvas and reserve {colors.ink} for essential names.
```

当需要确定值时，YAML token 值具有规范性；prose 解释其角色、边界、取舍和例外。两个层次都可以使用 `{colors.ink}` 或 `{symbols.facility.fallbacks[0]}` 这样的引用。

## 快速开始

要求 Node.js 20 或更新版本。

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md
```

需要 warning 阻断成功时使用严格模式：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint CARTOGRAPHY.md --strict
```

比较两份设计系统文档：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd diff before.md after.md
```

读取包内规范：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd spec
```

CLI 还提供输出结构化文档的 `parse`，以及列出内置规则的 `rules`。退出码 `0` 表示文档通过，`1` 表示存在阻断 finding，`2` 表示用法、文件读取或内部操作失败。

## Quiet Atlas 示例

[`examples/quiet-atlas/CARTOGRAPHY.md`](examples/quiet-atlas/CARTOGRAPHY.md) 是一份完整、可独立 lint 的示例。温暖纸色、浅淡水色、节制墨色、从容字体与克制强调共同形成了具体的视觉家族，同时文档不绑定当前数据或生产目标。

在本仓库中运行：

```bash
pnpm install
pnpm lint:example
```

## TypeScript API

```ts
import {diffCartography, lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {strict: true});

if (!report.valid) {
  for (const finding of report.findings) {
    console.error(finding.ruleId, finding.message);
  }
}

const changes = diffCartography(previousSource, currentSource);
console.log(changes.values, changes.sections);
```

公共 API 包括解析、运行时 schema、文档 lint、引用解析、语义 diff、规范文本和规则目录。准确签名与导出类型见 [docs/api.zh-CN.md](docs/api.zh-CN.md)。

## 核心验证保证什么

核心 lint 检查单份 `CARTOGRAPHY.md` 的可确定属性，包括：

- 安全、确定的 YAML 表示层规则；
- `0.3.0` front matter schema；
- 九个规范章节的存在、省略、重复与顺序；
- 完整引用，包括数组索引路径与深度解析；
- 标准 token 类型、虚线模式与根级组边界；
- 地图要素的 geometry、必需核心样式和数据绑定边界；
- 文档大小以及未知或疑似拼写错误的根键。

报告通过只表示文档及其内部关系有效。它不证明当前数据正确、输出满足用户任务、目标专属产物有效，也不代表视觉和无障碍评审已经完成。

## 仓库结构

```text
docs/spec.md                                  规范性格式说明
docs/api.md                                   TypeScript API 参考
docs/PHILOSOPHY.zh-CN.md                     设计哲学
schema/cartography-front-matter.schema.json  随发布提供的编辑器与工具 schema
packages/cli                                  CLI 与 TypeScript 包
examples/quiet-atlas                          自包含设计系统示例
.agents/skills                                可选 Agent 工作流
```

## 状态与许可证

`0.3.0` 是当前公开格式版本线，且不为 `0.2.0` 提供兼容层。

Apache-2.0，见 [LICENSE](LICENSE)。
