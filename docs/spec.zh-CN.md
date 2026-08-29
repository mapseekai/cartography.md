# CARTOGRAPHY.md 格式规范

**状态：** 草案 0.2.0  
**仓库：** `mapseekai/cartography.md`  
**规范文件名：** `CARTOGRAPHY.md`  
**English:** [spec.md](spec.md)

CARTOGRAPHY.md 是一种用于保存制图设计系统的自包含格式。它将机器可读的 YAML token 与人类可读的 Markdown 判断结合起来，使人和 Agent 能够在不同数据集、主题和任务中应用同一套稳定的视觉身份。

除非某段明确标为信息性内容，否则本文档具有规范性。

## 目的

CARTOGRAPHY.md 文档记录持久的视觉身份和制图判断：

- 设计应唤起的视觉世界；
- 设计长期服务的受众和场景；
- 背景、上下文、主体、焦点与关键状态之间的相对显著性；
- 可复用的精确色彩、字体、宽度、尺寸和透明度值；
- 标注、几何、符号、比例尺变化、构图、交互状态、无障碍和评审原则。

文档不记录单次用户请求、特定数据集的字段或来源，也不记录特定输出系统的指令。这些属于操作时输入。核心解析、校验和比较只接受一份 CARTOGRAPHY.md，并且只评估该文档本身。

## 规范性语言

关键词 **MUST**、**MUST NOT**、**REQUIRED**、**SHOULD**、**SHOULD NOT** 和 **MAY** 表达规范性要求级别。

## 设计目标

本格式具有以下目标：

1. **散文优先。** 散文承载设计判断、边界、取舍与例外。
2. **精确上下文。** 在需要精确性的地方，token 提供可复用值。
3. **可迁移性。** 文档可以跨数据集、主题、任务和输出技术继续使用。
4. **人和 Agent 均可读。** 同一文件同时支持专业评审和 Agent 使用。
5. **确定性。** 等价源码产生等价的解析值和 finding。
6. **开放扩展。** 命名扩展和未知 token 组可以保存项目特定信息，而不改变核心含义。
7. **诚实校验。** lint 成功只证明文档内部有效。

## 发现

规范文件名是 `CARTOGRAPHY.md`。

当调用方提供显式路径时，工具 SHOULD 使用该路径。否则，工具 MAY 从当前目录开始向祖先目录查找最近的规范文件。为保证可复现性，文件名匹配 SHOULD 在所有平台上区分大小写。

一个仓库 MAY 包含多份文档。除非工具定义更窄的作用域，否则文档适用于其所在目录及后代目录。

## 文档结构

文档恰好具有两个结构层：

1. 文件开头由 `---` 分隔的 YAML front matter；
2. 使用规范 `##` 标题组织的 Markdown 散文。

```md
---
version: "0.2.0"
name: Quiet civic atlas
tokens:
  colors:
    ink: "#24303A"
    canvas: "#F4F1E8"
---

## Overview

An archival civic atlas with warm paper, restrained ink, and one scarce accent.
```

front matter 提供精确值。Markdown 正文解释这些值存在的原因、适用时机，以及实现必须保留的关系。

## 确定性 YAML

front matter MUST 使用安全、确定性的 YAML 子集。

它 MAY 包含键为字符串的映射、序列、字符串、有限数字、布尔值和 `null`。日期、时间戳、前导零值和歧义词 SHOULD 加引号。

它 MUST NOT 包含：

- 重复映射键；
- anchor 或 alias；
- merge key；
- 自定义 tag 或可执行值；
- tab 缩进；
- block scalar；
- 隐式环境变量展开；
- 非有限数字。

长篇理由属于 Markdown。可复用的精确值 SHOULD 表达为命名 token 和 token 引用。

## 根 schema

front matter 具有以下根字段。该表是版本 0.2.0 完整的规范性根 schema。

| 字段 | 必填 | 类型 | 含义 |
|---|---:|---|---|
| `version` | 是 | 字面量 `"0.2.0"` | 文档采用的格式版本。 |
| `name` | 是 | 非空字符串 | 设计系统的人类可读名称。 |
| `description` | 否 | 字符串 | 简洁的目录描述。 |
| `locale` | 否 | 非空字符串 | 文档的主要语言或 locale。 |
| `tokens` | 否 | `TokenSet` | 精确、可复用设计值的开放集合。 |
| `accessibility` | 否 | `Accessibility` | 显式的文档内部对比关系。 |
| `omitted` | 否 | `OmittedSection[]` | 有意省略的规范 Markdown 章节。 |
| `extensions` | 否 | object | 核心不解释的项目特定结构化数据。 |

未知根键会被保留。validator MAY 对其给出 warning，尤其是键名与规范键相似时。有意的自定义数据 SHOULD 放在 `extensions` 下、使用 `x-` 前缀，或使用 `acme:review` 这样的命名空间键。

`version` 和 `name` 是仅有的必填根字段。版本 0.2.0 不定义用于操作时任务、数据集、输出技术、生成文件或溯源的根字段。

## Token 类型

`tokens` 是开放映射。文档 MAY 定义任何额外 token 组，consumer MUST 保留未知组。以下组具有核心校验语义。

| 组 | 值类型 | 要求 |
|---|---|---|
| `colors` | 字符串映射 | 每个值 MUST 是非空的通用 CSS color，或解析到该值的精确引用。 |
| `typography` | `TypographyToken` 映射 | 每个值是精确引用或开放的字体对象。 |
| `widths` | `DimensionToken` 映射 | 每个值是非负数字、受支持的尺寸字符串或精确引用。 |
| `sizes` | `DimensionToken` 映射 | 每个值是非负数字、受支持的尺寸字符串或精确引用。 |
| `opacities` | 数字或引用映射 | 每个数字 MUST 位于闭区间 0–1。 |

这些要求在精确引用解析后适用。已知组 token MAY 引用另一个组，但解析值必须匹配目标组类型。断链和循环引用仅由 `token-reference` 报告，不再产生第二个类型 finding。

尺寸字符串是非负十进制数，后接 `px`、`pt`、`mm`、`cm`、`in`、`em`、`rem` 或 `%`。

字体对象是开放对象，MAY 包含：

| 字段 | 类型 |
|---|---|
| `fontFamily` | 非空字符串，或由非空字符串组成的非空数组 |
| `fontSize` | `DimensionToken` |
| `fontWeight` | 1 至 1000 的数字，或非空字符串 |
| `lineHeight` | 正数或 `DimensionToken` |
| `letterSpacing` | 有限数字或非空字符串 |

Token 名称 SHOULD 描述语义角色，而不是偶然的外观。强语义颜色 SHOULD 只有一种稳定含义。当交互强调和底层业务含义都必须可见时，前者 SHOULD 保留后者。

## Token 引用

Token 引用使用 `{path.to.value}` 形式。每个由点分隔的名称段都必须非空，且只包含字母、数字、`_` 或 `-`；数字数组索引紧接名称并写成 `[n]`。前导、尾随或连续的点、空或非数字 bracket，以及索引后直接拼接名称都无效。

```yaml
tokens:
  colors:
    ink: "#24303A"
    label: "{tokens.colors.ink}"
```

规则：

1. 每个引用 MUST 在同一 front matter 内解析。
2. YAML 中的引用 MUST 占据整个字符串。
3. Markdown 散文 MAY 在句子中嵌入引用。
4. `[0]` 等数组索引只解析数组自身的数字属性；继承的稀疏索引会被忽略。
5. 断链引用和引用循环是错误。
6. consumer MUST NOT 为未解析引用静默替换 fallback。

## 无障碍

`accessibility.contrastPairs` 声明核心 validator 可以计算的精确颜色关系。

```yaml
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
```

每个 contrast pair 具有以下形状：

| 字段 | 必填 | 类型 | 含义 |
|---|---:|---|---|
| `id` | 是 | 非空字符串 | 所声明关系的稳定标识符。 |
| `foreground` | 是 | 非空字符串 | CSS color 或解析到颜色的精确引用。 |
| `background` | 是 | 非空字符串 | CSS color 或解析到颜色的精确引用。 |
| `minimum` | 是 | 有限正数 | 最低 WCAG 2.1 对比度。 |
| `kind` | 否 | `text`、`large-text` 或 `graphic` | 该关系的信息性分类。 |

该对象是开放对象，因此会保留额外的项目键。

Contrast pair MUST 解析到两个完全不透明的颜色。透明或半透明值属于 error，因为 WCAG 2.1 对比度需要实际渲染后的合成结果。Contrast-pair 检查通过只证明已声明的不透明颜色值达到已声明的数值下限。它不证明所有构图、背景、比例尺、状态、设备或使用场景都已实现无障碍。Markdown `Accessibility` 章节 MUST 承载更广泛的设计判断。

## Markdown 章节

Markdown 正文按以下顺序使用规范 `##` 章节：

1. `Overview`
2. `Intent & Audience`
3. `Visual Hierarchy`
4. `Color`
5. `Typography & Labels`
6. `Geometry & Symbols`
7. `Scale & Generalization`
8. `Layering & Composition`
9. `Interaction States`
10. `Accessibility`
11. `Review Principles`
12. `Do's and Don'ts`

各章节职责如下：

| 章节 | 职责 |
|---|---|
| `Overview` | 建立具体、可辨识的视觉世界，而不是罗列通用形容词。 |
| `Intent & Audience` | 描述设计系统长期服务的场景和人群，而不是单次请求。 |
| `Visual Hierarchy` | 定义背景、上下文、主体、焦点和关键状态之间的稳定显著性关系。 |
| `Color` | 解释 palette 角色、强调稀缺性，以及明度和饱和度取舍。 |
| `Typography & Labels` | 定义字体性格、标注层级、密度、冲突处理和可读性。 |
| `Geometry & Symbols` | 定义点、线、面、纹理、图案和符号的家族语言，但不绑定特定数据。 |
| `Scale & Generalization` | 描述与输出技术无关的渐进披露和制图综合阶段，不使用数字视图级别。 |
| `Layering & Composition` | 解释层叠、留白、密度、平衡和焦点构图，不使用具体标识符或顺序值。 |
| `Interaction States` | 定义 hover、selection、alert、invalid 等状态之间的视觉关系，同时保留底层语义。 |
| `Accessibility` | 涵盖冗余通道、色觉、对比度、小屏标注和关键状态可读性。 |
| `Review Principles` | 声明长期适用的专业评审维度和问题。 |
| `Do's and Don'ts` | 用强约束的正反例保护视觉家族。 |

英文标题和已识别的中文别名会规范化为相同名称。未知 `##` 章节会被保留。同一规范章节 MUST NOT 出现多次。已出现的规范章节 SHOULD 遵循上述顺序。空白规范章节会产生 warning。缺失章节会产生 finding，除非在 `omitted` 中声明。

## 省略章节与扩展

省略条目可以是非空的规范章节名或已识别别名，也可以是包含 `section` 和可选非空 `reason` 字段的开放对象。别名规范化后，omitted 条目 MUST 唯一，并且 MUST NOT 指向 Markdown 正文中已经出现的规范章节。

```yaml
omitted:
  - section: Interaction States
    reason: The design system has no interactive use context.
```

省略是一项显式设计决策。当缺失原因可能含糊时，文档 SHOULD 提供理由。省略 MUST NOT 用于隐藏影响设计系统但尚未解决的决策。

`extensions` 对象和未知 token 组会被保留，但核心不解释它们。扩展 MUST NOT 以不兼容含义重新定义规范字段。未知 Markdown 章节同样会被保留，并且 MUST NOT 通过别名重复规范章节。

## 优先级

指令冲突时，consumer SHOULD 按以下顺序应用：

1. 适用的安全、法律和组织要求；
2. 当前操作的显式人工约束；
3. front matter 中的精确值；
4. Markdown 正文中的规范性陈述；
5. consumer 默认值。

当前操作约束不会自动成为持久的设计系统内容。consumer MUST NOT 仅为解决操作时需要而把任务特定事实写入 CARTOGRAPHY.md。

当 front matter 精确值与散文冲突时，精确值优先。工具在可以确定性判断时 MAY 报告矛盾，但 MUST NOT 假装能够理解所有自然语言冲突。

## Agent 使用

使用 CARTOGRAPHY.md 的 Agent SHOULD：

1. 查找并完整阅读文档；
2. 运行核心 linter 并检查每个 finding；
3. 应用值之前解析精确 token 引用；
4. 从散文理解设计家族、受众、层级和已声明例外；
5. 将稳定指南与当前任务及操作时提供的事实结合；
6. 对请求的交付物做最小且连贯的变更；
7. 保留人工拥有的工作和尚未解决的含义；
8. 报告仍需专业评审或缺少事实的部分。

Agent MUST NOT：

- 编造数据事实或业务含义；
- 把单次任务转换成持久 front matter；
- 把无法理解的散文当成确定性规则；
- 声称 lint 成功证明了文档内部有效性之外的任何事项；
- 用临时交互状态覆盖稳定语义角色。

## Validator 模型

参考 linter 接受一个源码字符串或一个文件，并返回结构化报告：

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

Finding 具有以下形状：

```ts
interface Finding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  line?: number;
  suggestion?: string;
  autoFixable?: boolean;
  evidence?: unknown;
}
```

普通模式在报告没有 error 时有效。严格模式在既没有 error 也没有 warning 时有效。Info finding 永不阻断有效性。

普通文档无效会作为 finding 返回。文件访问、命令用法和意外的内部失败属于操作错误。

命令行退出码如下：

| 代码 | 含义 |
|---:|---|
| `0` | 操作完成，并且校验在所选严格度下通过。 |
| `1` | 校验完成但存在阻断 finding，或 diff 增加了 error 或 warning。 |
| `2` | 命令用法、文件访问或内部执行失败。 |

Lint 只证明 CARTOGRAPHY.md 满足其 schema 和可确定的内部关系。它不证明外部事实正确、任何生成交付物有效、当前任务已满足，或专业制图与无障碍评审已经完成。

内置 `maxDocumentBytes` 检查是事后 advisory：它只在完整输入已经读取和解析后运行；调用方必须在把不受信任的输入传给 `lint`、`lintFile` 或标准输入之前实施字节数或流式限制。

## 规则目录

每个内置规则的 scope 都是 `document`。

| Rule ID | 严重级别 | 用途 |
|---|---|---|
| `frontmatter-required` | error | 要求文件开头存在 YAML front-matter fence。 |
| `frontmatter-unclosed` | error | 检测缺失的 front-matter 结束 fence。 |
| `yaml-syntax` | error | 报告 YAML 语法错误和重复键。 |
| `yaml-alias-prohibited` | error | 拒绝 anchor 和 alias。 |
| `yaml-custom-tag-prohibited` | error | 拒绝自定义 YAML tag。 |
| `yaml-merge-key-prohibited` | error | 拒绝 merge key。 |
| `yaml-block-scalar-prohibited` | error | 将长篇理由保留在 Markdown。 |
| `yaml-tab-indentation-prohibited` | error | 拒绝 YAML 中的 tab 缩进。 |
| `yaml-non-finite-number-prohibited` | error | 拒绝 YAML front matter 任意深度的非有限数字。 |
| `schema` | error | 校验版本 0.2.0 front-matter schema。 |
| `duplicate-section` | error | 拒绝重复的规范 Markdown 章节。 |
| `document-size` | warning | 报告超过配置字节限制的文档。 |
| `omitted-sections` | error | 拒绝未知、重复或正文中已出现的规范章节省略项。 |
| `required-sections` | warning 或 info | 报告既未出现也未省略的规范章节。 |
| `empty-section` | warning | 报告空白叙述章节。 |
| `section-order` | warning | 检查规范章节顺序。 |
| `unknown-root-key` | warning | 保留自定义根键，同时识别可能的错误。 |
| `token-reference` | error | 检查精确引用、嵌入式 YAML 引用、断链路径和循环。 |
| `color-token` | error | 将已知 color token 校验为通用 CSS color。 |
| `known-token-type` | error | 校验解析后的 width、size、opacity 和 typography token 值。 |
| `contrast-pairs` | error | 要求不透明颜色并计算已声明的 WCAG 2.1 对比度下限。 |
| `contract-summary` | info | 汇总 token 叶子、token 组和散文章节。 |
| `rule-execution` | error | 将意外的自定义规则失败包含为 finding。 |

自定义规则 MAY 替换 ID 相同的内置规则。它们 SHOULD 具有确定性、无副作用、不依赖网络，并且 scope 为 `document`。

## 版本管理

本格式采用语义化版本。

- Patch 版本澄清措辞或进行向后兼容修正。
- Minor 版本可以新增可选字段、token 语义、章节或 finding。
- Major 版本可以改变必需结构或已有含义。

Consumer SHOULD 拒绝不支持的版本，而不是静默重新解释。该规范的参考 schema 接受精确字面量 `"0.2.0"`。

## 最小示例

以下完整文档使用所有规范章节，并且在普通模式下通过文档内部校验。

```md
---
version: "0.2.0"
name: Quiet civic atlas
description: A warm, restrained visual system for public-interest maps.
locale: en
tokens:
  colors:
    canvas: "#F7F5EF"
    ink: "#1F2933"
    context: "#8A938B"
    accent: "#A33A2B"
  typography:
    label:
      fontFamily: ["Source Sans 3", "sans-serif"]
      fontSize: 12px
      fontWeight: 500
      lineHeight: 1.35
  widths:
    hairline: 0.75px
    emphasis: 2px
  sizes:
    compact-symbol: 6px
  opacities:
    context: 0.58
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
extensions:
  acme:reviewCycle: annual
---

## Overview

A quiet civic atlas: warm paper, precise dark ink, soft context, and a scarce brick accent.

## Intent & Audience

The system serves broad public audiences who need calm orientation before detailed comparison.

## Visual Hierarchy

Canvas recedes, context supports, the subject leads, and the accent is reserved for decisive focus.

## Color

Lightness establishes order before hue. The brick accent never becomes a general category palette.

## Typography & Labels

Labels are plainspoken and compact, with density reduced before type becomes too small to read.

## Geometry & Symbols

Lines use restrained weight changes; symbols share simple silhouettes and avoid decorative detail.

## Scale & Generalization

The system moves from broad structure to local detail in deliberate stages, preserving identity as detail changes.

## Layering & Composition

Whitespace and soft context frame one primary subject; focus marks sit above but do not erase its meaning.

## Interaction States

Hover is subtle, selection is additive, and critical states retain a redundant cue beyond color.

## Accessibility

Important differences use shape, weight, text, or pattern as well as color and remain legible on small screens.

## Review Principles

Review hierarchy, label collisions, semantic consistency, density, contrast, and honest treatment of uncertainty.

## Do's and Don'ts

Do preserve warm restraint and scarce emphasis. Don't introduce unrelated saturated accents or ornamental symbols.
```

## 最终原则

> CARTOGRAPHY.md 保存可迁移的制图身份和持久设计判断。核心工具只校验文档自身；操作时任务和事实位于格式之外。
