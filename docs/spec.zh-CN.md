# CARTOGRAPHY.md 格式规范

**状态：** 草案 0.2.0  
**仓库：** `mapseekai/cartography.md`  
**规范文件名：** `CARTOGRAPHY.md`  
**English:** [spec.md](spec.md)

CARTOGRAPHY.md 是一种自包含、与渲染器无关的制图设计系统格式。即使数据集、专题、任务、比例尺或实现技术发生变化，它仍能向人类和 Agent 持久说明一组地图应该呈现怎样的视觉身份、感受和行为。

该格式结合两类互补的设计知识：

- YAML front matter 保存精确、可复用的设计值；
- Markdown 说明性正文（prose）保存视觉身份、关系、判断、例外和示例。

设计系统主要通过说明性正文表达。Token 为说明性正文提供精确上下文，但不是渲染指令。本文定义 CARTOGRAPHY.md 应包含什么以及这些内容具有什么含义，不规定某个校验器、渲染器或生成器应如何实现。

除非某段明确标记为资料性内容，否则本文均为规范性内容。

## 目的

地图样式可以列出颜色、宽度、字体、符号和图层属性，却不解释这些选择为何属于同一个体系。它可以复现一次输出，却无法保存指导下一个数据集、任务或比例尺的设计逻辑。CARTOGRAPHY.md 用于补足这一缺口。

一份 CARTOGRAPHY.md 应使读者能够回答：

- 该设计系统希望唤起怎样的视觉世界？
- 什么使不同地图看起来属于同一个家族？
- 哪些品质应跨专题和任务长期保持？
- 什么应该突出、辅助、安静、例外或被禁止？
- 哪些精确设计值会被复用，它们分别承担什么语义角色？
- 标注、几何、符号、密度和构图应如何表现？
- 地图如何随比例尺变化增加或减少细节？
- 交互状态如何增加强调而不改写原有含义？
- 除单次对比度计算外，还需要遵循哪些无障碍原则？
- 将系统应用到新地图时，评审者必须保护什么？

CARTOGRAPHY.md 保存持久设计决策。它不得成为运行时事实的容器，例如当前用户请求、数据集字段、数据源标识、数据值、输出图层 ID、目标格式属性、生成文件路径或临时实现选择。

同一份 CARTOGRAPHY.md 应能用于不同专题。道路图与生态图可以使用完全不同的数据和视觉编码，同时保留相同的纸张底色、字体语气、层级、密度、强调纪律和状态行为。

## 范围与边界

该格式治理制图设计身份，而不是某种数据模型或渲染语言。

它包括：

- 精确视觉 token；
- 设计系统身份与长期受众假设；
- 层级、色彩、字体、标注、几何和符号原则；
- 比例尺渐进表达与制图综合原则；
- 层叠、构图、交互、无障碍和评审指导；
- 明确的正面和反面示例。

它不包括：

- 一次性用户任务或提示词；
- 数据 schema、字段、类别、值域、单位、ID 或采样值；
- 目标格式特有的 source、layer、expression、paint 或 layout 属性；
- 运行时方案、生成产物和适配器接口；
- “语法正确即可证明视觉或专业质量”的主张。

运行时工具可以将 CARTOGRAPHY.md 与当前任务、数据画像、已有产物或目标能力组合使用。这些输入仍位于本格式之外，不得仅因为它们对一次操作有用就写回 CARTOGRAPHY.md。

“自包含”表示仅阅读 CARTOGRAPHY.md 就能理解设计系统身份和规则，并不表示它包含生成某张具体地图所需的全部输入。

可以使用以下持久性判断：

- 如果一项陈述应继续指导多个数据集、专题或任务，它属于 CARTOGRAPHY.md；
- 如果当前数据集或请求变化后该陈述就失效，它属于运行时上下文；
- 如果它描述某种目标技术如何实现决策，它属于目标特有工具或文档。

## 规范性语言

关键词 **MUST（必须）**、**MUST NOT（不得）**、**REQUIRED（必需）**、**SHOULD（应该）**、**SHOULD NOT（不应该）** 和 **MAY（可以）** 表示规范性要求级别。

- MUST 和 MUST NOT 定义格式有效性或含义保存所必需的要求；
- SHOULD 和 SHOULD NOT 定义强设计指导，只有在存在明确理由时才应覆盖；
- MAY 表示可选能力或表达方式。

规范性要求描述文档及其语义，并不意味着每一项设计判断都能自动检查。

本文保留少量常用制图和设计术语：palette 表示调色体系，casing 表示线状要素外侧的套线，halo 表示文字光晕，outline 表示外轮廓，pattern 表示重复图案，fallback 表示首选方案不可用时的回退方案。术语首次用于具体规则时仍应结合上下文理解。

## 设计理念

### 说明性正文承载设计

精确值本身不能产生一致的地图家族。颜色值无法解释它为何必须稀少、为何某类标注应先于主体线消失，也无法解释为何选择状态不得覆盖警告状态。Markdown 正文必须解释数值背后的关系和判断。

“清晰”“现代”“专业”“美观”等词过于宽泛，不能可靠指导设计。强规范会使用具体参照和取舍，例如：温暖的档案纸而非纯白底、石墨般的文字而非最大黑、安静的上下文而非所有内容都饱和、技术注记而非装饰性标签。

### Token 提供精确上下文

Token 是防止无意漂移的命名值。它使 Agent 能在不同任务中保持相同的画布、墨色、强调色、宽度、尺寸或透明度。名称应该表达 `canvas`、`context`、`subject`、`critical`、`selection` 等角色，而不是 `blue500` 或 `thickLine` 等偶然外观。

Token 不定义目标格式属性。`widths.emphasis` 表示可复用设计值，下游工具自行决定如何将其映射到输出语言。

### 身份稳定，表达适配

可复用不意味着每张地图完全相同。几何类型、数据尺度、信息密度和任务会改变合理的表达方式。设计系统提供稳定的家族感，以及进行适配时必须遵循的原则。

例如，某设计系统使用稀缺的砖红色表示决定性焦点。线状网络可用砖红色外框表达，面状专题图可用边界或注记表达。实现不同，但强调色始终稀缺且语义一致。

### 关系比孤立数值更重要

制图质量产生于关系：图形与背景、主体与上下文、文字与底色、密集与稀疏、默认与选中、概览与细节。文档应该明确描述这些关系，避免修改一个值时悄然破坏整个体系。

### 专业判断必须可见

本格式不会把制图简化为单一分数或算法。它保存专业评审所需的理由：什么应被强调、什么应被克制、哪里允许例外，以及什么会使结果产生误导或失去视觉一致性。

## 发现

规范文件名为 `CARTOGRAPHY.md`。

有显式路径时，消费者应该优先使用该路径；否则可以从当前目录向上搜索最近的规范文件。所有平台都应该使用区分大小写的匹配，以保证可复现性。

仓库可以包含多份 CARTOGRAPHY.md。除非消费者定义更窄的作用域，否则文档适用于所在目录及其后代目录。更深层文档可以为明确边界内的项目部分提供专业化，但除非明确声明新设计家族，否则应该保留父级身份。

版本 0.2.0 只定义作用域选择，不定义文档继承。最近的适用 CARTOGRAPHY.md 会在该作用域内替代父级文档。除非外部工具明确规定并公开自己的合并策略，否则消费者不得自动合并父子文档的 token、说明性正文、`omitted` 或 `extensions`。

## 文档结构

CARTOGRAPHY.md 恰好包含两个结构层：

1. 文件开头由 `---` 包围的 YAML front matter；
2. 由规范 `##` 标题组织的 Markdown 说明性正文。

```md
---
version: "0.2.0"
name: Quiet civic atlas
tokens:
  colors:
    canvas: "#F4F1E8"
    ink: "#24303A"
---

## Overview

一套使用温暖纸张、克制墨色和单一稀缺强调色的档案式城市地图。
```

Front matter 提供精确值和紧凑元数据；Markdown 正文解释这些值为何存在、如何关联、何时适用，以及适配时哪些特征必须保持可识别。

当精确 front matter 值与说明性正文冲突时，该精确值在其值域内优先。仍应修复矛盾，因为矛盾会使人类和 Agent 对系统产生不同理解。

## 确定性 YAML

Front matter 必须使用安全、确定性的 YAML 子集。

它可以包含字符串键映射、序列、字符串、有限数值、布尔值和 `null`。

它不得包含重复键、anchor 或 alias、merge key、自定义 tag 或可执行值、tab 缩进、block scalar、隐式环境变量展开，以及 `.nan`、`.inf`、`-.inf` 等非有限数值。

日期、时间戳、前导零值和可能被解释为布尔值的词应该加引号。长篇理由必须写入 Markdown，而不是隐藏在多行 YAML 中。

YAML 的语法类似配置，但其含义属于设计系统。它应该足够紧凑，使说明性正文显然成为专业判断的主要来源。

## 根 schema

版本 0.2.0 的 front matter 包含八个规范根字段：

```yaml
version: "0.2.0"
name: <非空字符串>
description: <字符串?>
locale: <非空字符串?>
tokens: <TokenSet?>
accessibility: <Accessibility?>
omitted: <OmittedSection[]?>
extensions: <对象?>
```

`?` 后缀表示字段可选，不表示允许 `null`。规范根键和已知 token 组名称区分大小写。

### `version`

`version` 为必填，且必须等于 `"0.2.0"`。它标识 CARTOGRAPHY.md 格式版本，不是某套设计的修订号，也不是目标技术版本。

### `name`

`name` 为必填，且必须至少包含一个非空白字符。它标识设计家族，而不是单张地图、数据集或任务。应优先使用 `Quiet Civic Atlas` 这样的名称，而不是 `roads-v4`。

### `description`

`description` 可选。它应该是适合目录、仓库摘要或 Agent 上下文的一句简短描述，用于概括身份和范围，但不能替代正文。

### `locale`

`locale` 可选，存在时不得只包含空白。它标识文档自身的主要语言，而不是当前数据中可用的标注语言。标注语言原则属于 `Typography & Labels`。

### `tokens`

`tokens` 可选，用于保存精确的可复用设计值。它是开放对象：已知组拥有规定语义，未知组会被保留。仅包含说明性正文的文档也可以有效，但成熟系统应该为需要跨产物保持一致的值提供 token。

### `accessibility`

`accessibility` 可选。版本 0.2.0 定义精确的 `contrastPairs`；更广泛的无障碍判断属于 Markdown 章节。

### `omitted`

`omitted` 可选，用于记录被有意省略的规范 Markdown 章节。省略是一项文档化设计决策，不是未完成内容的捷径。

### `extensions`

`extensions` 可选，用于保存没有核心语义的项目结构化信息。扩展不得以冲突方式重新定义规范字段。

扩展值使用与其他 front matter 相同的确定性 YAML 值类型。扩展所有者应该使用命名空间键，在说明性正文或外部文档中解释含义，并定义自己的冲突处理规则。

### 未知根键

未知根键会被保留。自定义数据通常应该放在 `extensions` 下，或使用 `x-` 前缀、`acme:review` 等命名空间。与规范字段相似的未知键很可能是拼写错误，应该暴露歧义而不是猜测含义。

根 schema 有意不定义数据集、source layer、用户任务、目标格式、输出文件、适配器或溯源字段。

## Token 类型

### 通用 Token 原则

`tokens` 是开放映射。Token 名应该描述用途而非外观，在字面值变化时保持稳定，避免数据集名称和目标属性名称，并显式体现 `context`、`subject`、`focus`、`critical` 等关系。

设计系统应该避免无法解释差异的近似重复 token。

五个已知组为：

| 组 | 核心值语义 |
|---|---|
| `colors` | 通用 CSS Color Level 4 值，或解析为该值的精确引用。 |
| `typography` | 开放字体对象，或解析为该对象的精确引用。 |
| `widths` | `DimensionToken`。 |
| `sizes` | `DimensionToken`。 |
| `opacities` | 0–1 的有限数值，或解析为该数值的精确引用。 |

`DimensionToken` 是非负有限数值、受支持的 dimension 字符串，或解析为其中一种形式的精确引用。受支持字符串由非负十进制数和 `px`、`pt`、`mm`、`cm`、`in`、`em`、`rem` 或 `%` 组成。

### `colors`

`tokens.colors` 将名称映射到通用 CSS Color Level 4 字符串，或解析为该颜色的精确引用。支持的形式包括该标准定义的 hexadecimal、named、`rgb()`、`hsl()`、`hwb()`、Lab/LCH、OKLab/OKLCH 和 `color()`。

```yaml
tokens:
  colors:
    canvas: "#F7F5EF"
    ink: "#1F2933"
    water: "oklch(82% 0.05 220)"
    label: "{tokens.colors.ink}"
```

颜色 token 应拥有持久语义角色；palette 关系和例外属于说明性正文中的 `Color` 章节。

### `typography`

`tokens.typography` 将名称映射到开放字体对象，或解析为字体对象的精确引用。

| 字段 | 含义和约束 |
|---|---|
| `fontFamily` | 非空字符串或非空 fallback 名称数组。 |
| `fontSize` | `DimensionToken`。 |
| `fontWeight` | 1–1000 的有限数值或非空字符串。 |
| `lineHeight` | 正的无单位数值，或 `DimensionToken`。结构上允许零 dimension 字符串，但可读文字不应该使用它。 |
| `letterSpacing` | 有限数值或非空字符串。 |

字体 token 提供精确值；层级、密度、碰撞、语言和 halo 行为仍属于说明性正文中的设计判断。

### `widths` 与 `sizes`

`tokens.widths` 和 `tokens.sizes` 将名称映射到 `DimensionToken` 值。

宽度通常描述线宽、casing、halo 或 outline；尺寸通常描述符号和其他可复用尺度。名称应该表达层级或用途。

### `opacities`

`tokens.opacities` 将名称映射到 0–1 范围内的有限数值或精确引用。透明度可以弱化上下文，也可能在变化背景上意外消失。说明性正文应该说明其含义及必须保留的最低可见性。

### 未知 Token 组

项目可以定义 pattern、dash rhythm、symbol family 等额外组。未知组会被保留但没有核心解释。它们仍应该使用语义命名、持久含义、目标无关表达和说明性正文。

### 跨组引用

当解析后的值满足目标组类型时，token 可以引用其他组。宽度可以复用 dimension，但不得仅因为路径存在就解析为颜色。

## Token 引用

Token 引用使用 `{path.to.value}`。每个点分隔名称段必须非空，并只能包含字母、数字、`_` 或 `-`；数组数字索引使用 `[n]`。

`n` 由一个或多个十进制数字组成，并解释为非负整数。括号内不得出现符号、空白、名称或算术表达式。允许前导零，但不应该使用，因为它会模糊目标索引。

有效示例：

```text
{tokens.colors.ink}
{tokens.typography.fallbacks[0]}
{extensions.acme-review.palette.primary}
```

无效示例：

```text
{tokens..colors.ink}
{tokens.colors.ink[ ]}
{tokens.colors.ink[+1]}
{tokens.colors.ink[name]}
{tokens.colors.ink.}
```

规则：

1. 每个引用都必须在同一 front matter 内解析；
2. YAML 引用必须占据整个标量字符串；
3. 可见 Markdown 说明性正文可以在句子中嵌入引用；
4. fenced code、inline code 或 HTML comment 中的引用仅为示例，不会被应用；
5. 数组索引必须指向被引用 YAML 序列中真实存在的元素；缺失或稀疏索引无法解析；
6. 断链和循环是错误；
7. 消费者不得编造或静默替换 fallback。

引用应提升一致性而不是隐藏含义，应避免过深的引用链。

说明性正文中的嵌入引用是指向 front matter 精确值的语义交叉链接。Agent 应用设计时会解析它，以理解命名值及其关系；这不要求在显示或序列化 Markdown 时替换可见文本。消费者可以继续向读者显示字面 `{path}` 形式。

## 无障碍

### 精确对比关系

`accessibility.contrastPairs` 声明设计系统关心的精确关系。

```yaml
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
```

| 字段 | 必填 | 含义 |
|---|---:|---|
| `id` | 是 | 稳定的非空标识符。 |
| `foreground` | 是 | CSS color 或解析为颜色的精确引用。 |
| `background` | 是 | CSS color 或解析为颜色的精确引用。 |
| `minimum` | 是 | 正有限 WCAG 2.1 比值。 |
| `kind` | 否 | `text`、`large-text` 或 `graphic`。 |

两种颜色必须完全不透明。半透明颜色的对比度取决于合成结果，不能由孤立值确定。

WCAG 2.1 的相对亮度定义在 sRGB 色彩空间中。计算声明关系时，消费者必须先以确定性方式把两种已解析的不透明颜色转换到 sRGB，再计算比值。为获得可移植的精确关系，作者应该优先使用位于 sRGB gamut（色域）内的颜色。如果超出色域的颜色需要 gamut mapping（色域映射），必须说明映射方式，因为不同方式可能产生不同结果。

有意义的 WCAG 2.1 对比度范围为 1:1–21:1。超出该范围的 `minimum` 不能描述有效 WCAG 阈值，不应该使用。同一文档中的 contrast-pair ID 应该唯一。

`accessibility` 是开放对象。它可以在没有 `contrastPairs` 时存在，并会保留项目特有的其他无障碍键。这些键没有核心语义，应该在 Markdown `Accessibility` 章节中解释。

### 无障碍不只是对比度

一组 contrast pair 不能证明影像、混合填充、变化背景、密集标注、交互状态或色觉差异上的无障碍。Markdown 章节应该解释冗余通道、灰度表现、最小可读文字和符号、小屏行为、困难背景，以及需要渲染评审的风险。

## Markdown 章节

Markdown 正文是核心设计叙事，按顺序使用以下规范 `##` 章节：

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

每个规范章节都必须被且仅被说明一次：要么出现在 Markdown 正文中，要么列入 `omitted`。未知章节会被保留。同一规范章节即使使用不同 alias 也不得出现两次。已出现章节应该遵循上述顺序。没有正文也没有省略声明的章节意味着文档内容不完整。

标题规范化会去除首尾空白和末尾冒号、统一弯引号、折叠重复空白，并以不区分大小写的方式匹配 alias。完整识别表为：

| 规范章节 | 英文 alias | 中文 alias |
|---|---|---|
| `Overview` | `overview`, `purpose` | `概述`, `目的` |
| `Intent & Audience` | `map intent`, `intent`, `intent and audience`, `intent & audience` | `地图意图`, `意图与受众` |
| `Visual Hierarchy` | `hierarchy`, `visual hierarchy` | `视觉层级` |
| `Color` | `color`, `colors` | `色彩`, `颜色` |
| `Typography & Labels` | `labels`, `typography`, `typography and labels`, `typography & labels` | `字体与标注`, `标注` |
| `Geometry & Symbols` | `geometry`, `symbols`, `geometry and symbols`, `geometry & symbols` | `几何与符号` |
| `Scale & Generalization` | `scale`, `generalization`, `scale and generalization`, `scale & generalization` | `比例尺与制图综合` |
| `Layering & Composition` | `layering`, `composition`, `layering and composition`, `layering & composition` | `层叠与构图` |
| `Interaction States` | `states`, `interaction states` | `交互状态` |
| `Accessibility` | `accessibility` | `无障碍` |
| `Review Principles` | `review`, `review principles` | `评审原则` |
| `Do's and Don'ts` | `do's and don'ts`, `dos and donts` | `正反例`, `应该与不应该` |

### `Overview`

`Overview` 用足够具体的语言建立视觉世界，以指导没有显式 token 的选择。它应该描述具体参照、语气、家族感、克制与强调，以及系统拒绝变成什么。它不应该是当前项目 brief、数据描述、通用形容词列表或 token 复述。

可提问：即使数值改变，什么仍使系统可识别？哪种出版物、材料、仪器或地图传统最接近目标？读者在阅读文字前应感受什么？必须抵制哪些视觉诱惑？

> 示例：一套印在温暖档案纸上的安静城市地图——精确墨色、浅冷水体、紧凑人文主义标注，以及只用于决定性焦点的砖红色；绝不呈现霓虹、光泽或仪表盘感。

### `Intent & Audience`

本节记录长期使用场景和受众特征。它应该描述反复出现的阅读方式、地图素养、领域熟悉程度、阅读环境、信息密度、语气，以及专家与普通读者之间的平衡。

持久意图不是当前任务。“支持平静的公共定位与谨慎比较”属于此处；“突出本月故障”不属于此处。

可提问：谁应该无需培训就能理解地图？谁需要更高精度？地图是被慢速阅读，还是在压力下快速扫描？受众能理解多高的信息密度？

持久媒介指导也属于本节，例如屏幕与印刷、预期物理尺寸、观看距离、色彩管理假设，以及野外或演示环境。设备特有实现参数仍位于格式之外。

### `Visual Hierarchy`

本节定义 **background**、**context**、**subject**、**focus** 和 **critical** 信息之间的稳定显著性。这些是角色，而不是规定的图层名。

它应该解释先用哪些通道建立顺序、允许多少焦点、上下文如何有用但不竞争、关键状态如何区别于普通强调，以及角色重叠时如何处理。层级不应该只依赖色相。

### `Color`

本节解释 palette 角色，而不是漂亮色板。它应该描述 canvas、ink、context、subject、accent、critical、unknown、selection 等角色，明度与饱和度范围，强调稀缺性，稳定含义，以及不同背景上的家族感。

先用明度和重量建立层级，再使用饱和色。不得把关键色当装饰，不得按不稳定输入顺序分配类别色。Unknown 与 normal 应保持可区分。Selection 应增加强调，而不是替换有意义的颜色。

### `Typography & Labels`

本节定义文字语气和行为：字体性格与 fallback；按语义角色建立的层级；字号、字重、大小写、间距和 halo；语言与文字系统；密度、碰撞、重复和缩写；减少顺序；困难背景和小屏行为。

低优先级标注应该先消失，而不是把重要文字缩小到不可读。不得把拉丁字母规则盲目应用到其他文字系统。Halo 用于分离，而不是装饰。

当它们是设计系统的持久部分时，本节还应该说明从右到左（RTL）排版、复杂文字 shaping、本地化数字与日期格式，以及混合文字系统的字体 fallback。

### `Geometry & Symbols`

本节定义点、线、面、边界、纹理、pattern 和 symbol 的家族语言。它应该解释线条性格和宽度关系、填充与边界、符号轮廓、熟悉惯例与自定义符号、跨几何家族感，以及小尺寸下应去除的细节。

同一含义可以跨几何适配：关键点可使用形状和 outline，关键线可使用 casing 和 pattern，关键面可使用边界和纹理。

当投影或坐标参考系会持久影响几何外形、方向、变形或视觉世界时，可以在此说明偏好。数据集特有 CRS 事实和转换参数仍属于运行时上下文。

### `Scale & Generalization`

本节说明表达如何随阅读比例尺变化，而不绑定目标特有的数值级别。它应该描述 overview、regional、local、detail 等语义阶段，内容进入与退出、标注密度、宽度和尺寸、聚合或简化、必须保留的关系，以及如何避免突变。

视觉渐进披露不等同于几何简化、聚合、移位或拓扑保护，文档应该诚实区分这些边界。

### `Layering & Composition`

本节描述图形与背景、概念层叠、留白、密度、节奏、平衡、重叠和比例适配。它不得列出目标图层 ID 或具体排序值，而应解释某类信息为何位于另一类信息之上或之下。

构图应该有明确主角。临时 focus 可以位于主体之上，但不应该抹除主体含义。

当标题、图例、比例尺、指北针、经纬网、注记、插图、署名、图框等版式元素属于地图家族时，本节也应该说明它们的视觉角色和布局原则，而不是规定目标技术中的 widget。

### `Interaction States`

本节在适用时定义 default、hover、selection、focus、alert、invalid、disabled、uncertain 和 editing 状态。交互是强调，不是重新分类；被选中的关键对象仍然关键。

它应该解释状态共存优先级、允许使用的通道、hover/selection/alert 的差异、无障碍 invalid/uncertain 状态，以及目标无法表达首选状态时的 fallback。

### `Accessibility`

本节涵盖真实合成中的对比度、关键含义冗余、灰度和色觉表现、最小可读文字与符号、小屏与密集场景、影像背景、状态区分，以及适用时的动态克制。

颜色不得成为关键含义的唯一载体。冗余可以使用形状、pattern、文字、重量、outline 或位置。

对于交互地图，持久指导还可以涵盖键盘焦点、文字替代、状态播报，以及地图与外围界面的屏幕阅读器关系。CARTOGRAPHY.md 说明设计意图，应用代码负责真正暴露这些语义。

### `Review Principles`

本节告诉评审者必须保护什么。它应该涵盖 identity、hierarchy、legibility、density、consistency、accessibility、adaptation 和 honesty。评审应判断结果是否属于该家族、是否可读、是否在适配后仍保留身份，以及是否避免暗示事实不支持的确定性或重要性。

可以列出反复使用的评审场景，但不能替代渲染检查或专业判断。

### `Do's and Don'ts`

本节使用具体配对示例保护设计家族：

- 应该只把砖红色用于决定性焦点；不应该把它变成通用类别 palette。
- 应该在密度上升时移除低优先级标注；不应该把所有文字缩小到不可读。
- 应该用 casing 或 outline 添加 selection；不应该覆盖有意义的状态。
- 应该保持安静上下文；不应该给每条边界相同对比度。

避免“让它更美观”等模糊指令，每条规则都应该指出真实决策或失败模式。

## 跨章节设计关系

这些章节不是独立检查表。

- `Overview` 定义世界，`Intent & Audience` 限制应用方式；
- `Visual Hierarchy`、`Color`、`Typography & Labels`、`Geometry & Symbols` 共享有限视觉通道；同一表达中的一个通道应该只有一个主要语义所有者；
- `Scale & Generalization` 决定何时出现信息，`Layering & Composition` 决定已出现信息如何分配注意力；
- `Interaction States` 定义组合，`Accessibility` 保证组合可区分；
- Token 给出数值，说明性正文给出含义；同一 token 被赋予冲突含义会使系统失去一致性。

## 省略章节与扩展

`omitted` 条目可以是规范名称/alias，也可以是包含 `section` 和可选非空 `reason` 的开放对象。

```yaml
omitted:
  - section: Interaction States
    reason: 该设计系统只用于静态印刷地图。
```

规范化后，条目必须唯一，且不得指向已存在章节。当缺失可能看起来像未完成工作时，应该提供理由。省略不得隐藏对设计产生实质影响的决策。

`extensions`、未知 token 组和未知 Markdown 章节用于保存项目特有含义。它们应该有明确所有者，不重新定义核心字段，不依赖自定义工具才能被基本理解，并被消费者保留。

持久专业模式可以作为相关规范章节的说明性正文子章节；一次性模式仍属于运行时输入。

## 优先级与冲突处理

发生冲突时，消费者应该依次应用：

1. 安全、法律和组织要求；
2. 当前操作的显式人工约束；
3. 精确 front matter 值；
4. 规范 Markdown 陈述；
5. 消费者默认值。

当前操作约束不会自动成为设计系统内容。互相冲突的说明性正文应该由文档所有者解决，而不是反复交给消费者猜测。

## Agent 使用

Agent 应该完整读取文档，理解身份、受众、层级、token、比例尺、状态、无障碍和禁止事项，解析引用，区分持久指导与当前事实，在保持家族感的前提下适配几何，做最小一致变更，保留人工成果和不确定性，报告能力缺口，并在普通数据集任务中保持 CARTOGRAPHY.md 不变。

Agent 不得编造数据含义、把 token 当成目标属性、未经明确指令把当前 prompt 转为设计身份、只用颜色表达关键含义、用交互覆盖有意义状态，或声称文档有效即可证明渲染质量。

## 符合性

一份符合规范的文档以确定性 YAML 开头，声明 `version: "0.2.0"` 和非空名称，按类型使用已知 token 组，包含有效引用，一致使用或省略规范章节，并保持持久设计与运行时事实的边界。

具体而言，十二个规范章节都必须出现一次或在 `omitted` 中声明一次；不得静默缺失、重复出现，或同时存在和省略。

结构符合性是必要条件，但不是充分条件。文档可以结构有效却仍然空泛、矛盾、通用或专业性不足。上述设计章节定义了一份有用 CARTOGRAPHY.md 应达到的内容质量。

## 版本管理

本格式使用语义化版本。Patch 版本提供兼容澄清或修正；minor 版本可以增加可选字段或语义；major 版本可以改变必填结构或含义。消费者应该拒绝不支持的版本。

格式版本不记录某套设计系统自身的修订；项目可以在命名空间扩展中记录自己的版本。

## 完整示例

```md
---
version: "0.2.0"
name: Quiet civic atlas
description: 一套用于公共利益地图的温暖、克制视觉系统。
locale: zh-CN
tokens:
  colors:
    canvas: "#F7F5EF"
    ink: "#1F2933"
    context: "#8A938B"
    water: "#A8C8D4"
    accent: "#A33A2B"
  typography:
    primary-label:
      fontFamily: ["Source Sans 3", "sans-serif"]
      fontSize: 12px
      fontWeight: 500
      lineHeight: 1.35
  widths:
    hairline: 0.75px
    subject: 2px
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
---

## Overview

一套印在温暖纸张上的安静城市地图。精确深色墨线承载文字和结构，浅冷水体与灰绿色上下文退后，单一砖红色标记决定性焦点。它应该经过编辑、具有公共性，而不是霓虹、光泽或仪表盘风格。

## Intent & Audience

该系统服务于地图素养不同的读者，支持定位、公共解释和谨慎比较。它优先保证平静层级和直白语言，同时保留专业评审所需的精度。

## Visual Hierarchy

画布安静、上下文次要、主体明确。先用明度和重量建立顺序，再使用饱和色。关键状态必须强于普通 focus。

## Color

温暖灰白替代纯白，石墨色替代最大黑，水体保持浅冷色。砖红是唯一饱和强调色，绝不成为通用类别 palette。

## Typography & Labels

标注使用紧凑的人文主义无衬线字体和普通句式大小写。上下文标注应先消失，而不是缩小到不可读。Halo 只在必要时使用且保持窄小。

## Geometry & Symbols

线条使用小而可解释的宽度范围。面保持安静，只有有意义的分隔才加强边界。点符号使用能在紧凑尺寸下保持可读的简单轮廓。

## Scale & Generalization

Overview 展示大结构，regional 增加重要联系，local 展示完整主体几何，detail 增加注记。每次转换都保持身份，避免同时引入大量无关元素。

## Layering & Composition

安静区域为细节提供呼吸空间。背景和上下文位于主体下方，标注和交互标记位于主体上方。构图保持一条主要阅读路径。

## Interaction States

Hover 保持细微；selection 添加 casing 或 outline，同时保留基础含义；alert 将强强调与冗余 pattern 或 symbol 结合。

## Accessibility

重要差异除颜色外还使用形状、pattern、文字、重量或 outline。应该先降低密度，绝不以牺牲文字可读性为代价。对比度在真实合成中评审。

## Review Principles

评审家族感、主体显著性、上下文克制、标注碰撞、比例尺渐进、状态组合、色觉韧性和对不确定性的诚实表达。

## Do's and Don'ts

应该保持温暖克制和稀缺强调；不应该用砖红表示普通类别、等比例缩小所有标注、用 selection 覆盖有意义状态，或添加在地图尺度下失效的装饰符号。
```

## 最终原则

> CARTOGRAPHY.md 保存可迁移的制图身份和应用它所需的持久判断。精确 token 保持数值稳定，说明性正文保持设计含义，运行时任务和数据位于格式之外。
