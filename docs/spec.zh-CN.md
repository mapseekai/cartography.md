# CARTOGRAPHY.md 格式规范

**状态：** 草案 0.3.0（修订稿）  
**规范文件名：** `CARTOGRAPHY.md`  
**语言：** 中文  

> 本文定义 `CARTOGRAPHY.md` 的文件结构、字段、Token 类型、引用规则、标准 Markdown 章节和消费者行为。设计理念、编写方法和示例库可以由其他文档补充，但不改变本文规定的格式语义。

`CARTOGRAPHY.md` 是一种自包含、与数据和渲染器解耦的制图设计系统格式。它用于向人类和 Agent 描述一套地图风格如何呈现、为何这样呈现，以及可复用的颜色、字体、尺寸、线宽和地图要素样式。

它描述的是**制图设计系统**，不是某一张地图的完整样式文件。具体数据中的图层、字段、类别和值，由外部 `data-profile`、当前任务和目标渲染器负责映射。

---

## 1. 规范性语言

关键词 **MUST（必须）**、**MUST NOT（不得）**、**SHOULD（应该）**、**SHOULD NOT（不应该）** 和 **MAY（可以）** 表示要求级别：

- **MUST / MUST NOT**：决定格式有效性、可移植性或语义一致性的强制要求；
- **SHOULD / SHOULD NOT**：强烈建议，只有存在明确理由时才应偏离；
- **MAY**：可选能力。

本文单独使用中文“必须”“不得”“应该”“不应该”和“可以”时，分别与对应英文关键词具有相同的规范效力。

标记为“资料性”“示例”或“推荐命名”的内容不构成强制要求；其中出现的规范性词语仅用于转述其他规范性条款时，才继承相应约束。普通叙述、术语名称或被引用文本中的“必须”“不得”等词语，不单独产生超出其所在语句的规范要求。

### 1.1 核心术语

- **作者（author）**：创建或维护 `CARTOGRAPHY.md` 的人或系统。
- **消费者（consumer）**：读取、解析、校验或使用 `CARTOGRAPHY.md` 的工具、Agent 或其他实现。
- **写入型消费者（writing consumer）**：会修改、迁移或重新输出 `CARTOGRAPHY.md` 的消费者。
- **适配器（adapter）**：将本格式的 Token 和设计意图转换为某一目标渲染器能力的外部实现。
- **`data-profile`**：描述可用数据图层、字段、类别、值域或其他数据语义的外部上下文。本规范不定义其文件结构，也不允许把其项目数据绑定写入 `CARTOGRAPHY.md`。
- **Unicode 空白（Unicode whitespace）**：Unicode `White_Space` 属性为 Yes 的字符。
- **非空字符串（non-empty string）**：解析后至少包含一个非 Unicode 空白字符的 string；仅由 Unicode 空白组成的字符串视为空。

---

## 2. 格式定位与边界

### 2.1 本格式描述的内容

`CARTOGRAPHY.md` MAY 描述：

- 地图风格的整体视觉身份、气质和受众感受；
- 精确、可复用的制图 Token；
- 色彩、字体与标注、构图与密度、层级与深度、几何与符号等设计原则；
- 随比例尺变化的渐进表达和制图综合原则；
- 具有代表性的地图要素样式，例如基础线型、道路、水体、行政边界、管线或专题符号；
- 明确的正面约束、反面约束和使用边界。

### 2.2 本格式不描述的内容

`CARTOGRAPHY.md` MUST NOT 将以下运行时或项目事实作为设计系统的一部分：

- 数据源地址、数据集 ID、source layer 或输出图层 ID；
- 字段名、字段类型、具体类别值、过滤条件或采样值；
- MapLibre、QGIS、ArcGIS 或其他目标技术的 `paint`、`layout`、`expression`、`filter` 等属性；
- 当前用户提示词、一次性任务、输出路径或生成过程状态；
- 将某个项目数据对象强制绑定到某个设计 Token 或地图要素样式的规则。

外部工具 MAY 将 `CARTOGRAPHY.md` 与 `data-profile`、当前任务和渲染器能力组合使用。该组合过程不属于本格式。

### 2.3 地图要素名称与数据解耦

`CARTOGRAPHY.md` MAY 定义 `road-primary`、`water-area`、`administrative-boundary`、`pipeline-critical` 等地图要素样式。这些名称表示该设计系统长期维护的**视觉组件**，不表示当前项目必须存在对应数据。

是否将某个数据对象映射到这些样式，由外部 `data-profile` 和当前任务决定。

---

## 3. 文档结构

一个 `CARTOGRAPHY.md` 文件 MUST 包含两个逻辑部分：

1. 位于文件开头的 YAML front matter；
2. 紧随其后的 Markdown 正文。

Front matter MUST：

- 从文件第一行开始；
- 使用一行完全等于 `---` 的分隔符开始；
- 使用另一行完全等于 `---` 的分隔符结束；
- 在一个文件中只出现一个 front matter 区块。

文件行结束符 MAY 使用 LF 或 CRLF。判断分隔符时只移除行结束符；前导空白、尾随空白、注释或其他字符都会使该行不再等于 `---`。

Markdown 正文中的 `---` MAY 作为水平分隔线出现，不计作额外的 front matter 区块。

Markdown 正文 SHOULD 使用 `##` 标题组织标准章节。文件 MAY 在标准章节之前包含一个用于显示的 `#` 一级标题；消费者 MUST NOT 将该一级标题识别为标准章节。关闭分隔符后的 Markdown 正文 MAY 为空；空正文不影响格式有效性，但通常会触发 §15.2 的完整性提示。

最小结构示例：

```md
---
version: "0.3.0"
name: Quiet Civic Atlas
colors:
  canvas: "#F7F5EF"
  ink: "#1F2933"
---

## Overview

一套温暖、克制、具有编辑感的公共地图设计系统。
```

### 3.1 Token 与说明性正文的关系

- Front matter 中的 Token 定义精确值和可复用样式组合；
- Markdown 正文解释这些值与组合的设计意图、使用场景、关系、例外和禁忌；
- Token 决定“精确是什么”；正文决定“为何、何时、在哪里以及如何使用”；
- 正文 MUST NOT 通过另一个字面值重新定义同一 Token；发生直接矛盾时，消费者 SHOULD 使用 Token 的精确值并报告一致性警告。

Token 不是渲染器属性。消费者负责将 Token 映射到目标技术。

### 3.2 文件发现与多文件共存

默认查找位置属于互操作约定，不决定单个文件的格式有效性。调用方显式提供文件路径时，消费者 MUST 优先使用该路径，MUST NOT 在未报告的情况下以自动发现结果替代它。

用于自动发现时，单一设计系统项目 SHOULD 将主文件放在项目根目录，并使用大小写精确的文件名 `CARTOGRAPHY.md`。文件内容是否符合本规范与其实际文件名相互独立；非标准文件名通常只能通过显式路径使用。

项目需要维护多套设计系统时，推荐使用以下相对于项目根目录的资料性目录约定：

```text
design/<slug>/CARTOGRAPHY.md
```

其中 `<slug>` 由项目自行管理，不属于本格式的 front matter。

同一项目存在多份 `CARTOGRAPHY.md` 时：

- 每份文件表示一套独立设计系统；
- 消费者 MUST NOT 自动合并多份文件；
- 具体使用哪一份文件 SHOULD 由显式路径、项目配置或外部清单决定；
- 缺少唯一选择依据时，消费者 MUST 报告文件选择歧义，MUST NOT 按目录顺序、文件系统返回顺序或任意“第一份”静默选择；
- 各文件的 `name` SHOULD 在项目范围内保持唯一，但 `name` 不替代文件发现路径，也不是稳定机器标识符。

### 3.3 Markdown 解析基线

标准章节和正文引用的核心识别行为以 CommonMark 的块级与行内语法为基线。消费者 MAY 支持额外 Markdown 扩展，但扩展 MUST NOT 改变 §10.3 和 §11 对标准章节、代码区、HTML、链接目标及转义引用的核心判定。无法解释的扩展内容 MUST 按未知正文保留。

---

## 4. YAML 语法要求

Front matter MUST 使用不带 BOM 的 UTF-8 编码，并采用 YAML 1.2 Core Schema 的受限标量解析 profile。它 MUST 解析为且仅解析为一个 YAML mapping。

该 profile 只允许 mapping、sequence、string、有限 number、boolean 和 null，并禁用 timestamp 及其他实现特有的隐式类型解析。日期或时间形态的普通标量（如 `2026-08-31`）按 string 处理；YAML 1.1 特有的布尔写法（如 `yes`、`no`、`on`、`off`）同样按 string 处理。消费者 MUST NOT 因底层库的默认行为把这些值转换为日期对象或布尔值。

所有 mapping key MUST 解析为 §1.1 定义的非空 string；会被该 profile 解析成 number、boolean 或 null 的 key 必须使用引号。空字符串或仅含 Unicode 空白的 mapping key 是格式错误。重复键在标量解析后按字符串码点精确比较；例如 `name` 与 `"name"` 表示同一个键。

为保证不同工具之间的确定性，Front matter MUST NOT 包含：

- 重复键；
- anchor、alias 或 merge key；
- 任何显式 tag、自定义 tag 或可执行值；
- YAML directive（如 `%YAML`、`%TAG`）、内部 document end marker `...` 或多个 YAML document；
- tab 缩进；
- `.nan`、`.inf`、`-.inf` 等非有限数值；
- 任何必须通过环境变量展开、模板求值、命令替换或其他代码执行才能确定含义的动态值。

除按 §10 识别和解析 `TokenReference` 外，所有其他 string MUST 作为字面数据处理。消费者 MUST NOT 展开环境变量、执行模板或运行命令；`${NAME}`、`{{ value }}`、`$(command)` 等字符序列仅因出现在说明性文本中并不自动构成格式错误，但作者 MUST NOT 依赖消费者对其求值。已知类型中的此类字符串仍须满足相应类型，例如 `${COLOR}` 本身不是有效的核心 `Color`。

日期、时间戳、前导零字符串以及可能被其他 YAML 实现解释为布尔值或空值的普通文本 SHOULD 使用引号，以提高与未正确实现本 profile 的工具之间的兼容性。

以下标量具有额外的表示层要求：

- YAML 中的 Token 引用 MUST 使用单引号或双引号包裹，因为 `{` 是 YAML 流式集合的起始字符；
- 以 `#` 开头的十六进制颜色 MUST 使用单引号或双引号包裹，因为 `#` 是 YAML 注释的起始字符；
- 含单位的 `Dimension`（如 `13px`、`0.3mm`）按 YAML 语义自然解析为字符串，不强制使用引号；
- 无单位数值（如 `1.2`）按 YAML 语义解析为 number，其合法性由具体使用位置决定。

推荐：

```yaml
strokeColor: "{colors.accent}"
canvas: "#F7F5EF"
fontSize: 13px
lineHeight: 1.2
```

错误：

```yaml
strokeColor: {colors.accent}
canvas: #F7F5EF
```

长篇设计理由 SHOULD 写入 Markdown 正文，而不是写入多行 YAML 字符串。

---

## 5. Front matter 根 Schema

版本 0.3.0 定义以下标准根字段和 Token 组：

```yaml
version: "0.3.0"                                      # 必填
name: <非空字符串>                                     # 必填
description: <非空字符串>                              # 可选
omitted: <(string | OmittedSection)[]>                 # 可选

colors: <map<TokenIdentifier, Color | TokenReference>>
typography: <map<TokenIdentifier, Typography | TokenReference>>
widths: <map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>>
sizes: <map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>>
opacities: <map<TokenIdentifier, Opacity | TokenReference>>
spacing: <map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>>
dashes: <map<TokenIdentifier, DashPattern | TokenReference>>
elements: <map<TokenIdentifier, MapElement>>

<custom-field>: <YAML value>                           # 可选
```

除 `version` 和 `name` 外，所有字段均为可选。标准 Token 组出现时 MAY 为空，但作者 SHOULD 省略空组；消费者 MAY 对空的标准 Token 组给出提示。

所有标准字段和标准 Token 组名称区分大小写。核心枚举值和关键字同样区分大小写，MUST 使用本规范列出的精确小写形式。所有根 mapping key MUST 是非空字符串；标准 Token 组中的 Token 名和 `elements` 键必须符合 §6.1 的 `TokenIdentifier` 规则。自定义根字段只有在需要作为 Token 引用路径段时才必须符合该规则。

### 5.1 `version`

| 项目 | 规则 |
|---|---|
| 类型 | 字符串 |
| 必填 | 是 |
| 允许值 | `"0.3.0"` |
| 含义 | 当前文件遵循的 `CARTOGRAPHY.md` 格式版本 |

`version` 不是地图版本、项目版本、样式版本或渲染器版本，也 MUST NOT 使用 Token 引用。

### 5.2 `name`

| 项目 | 规则 |
|---|---|
| 类型 | 去除首尾 Unicode 空白后仍非空的字符串 |
| 必填 | 是 |
| 含义 | 制图设计系统或地图风格家族的名称 |

推荐使用 `Quiet Civic Atlas`、`Technical Utility Map` 一类具有风格辨识度的名称，不推荐使用 `roads-v4`、`project-2026` 等项目或产物名称。

`name` MUST NOT 使用 Token 引用。

### 5.3 `description`

| 项目 | 规则 |
|---|---|
| 类型 | 去除首尾 Unicode 空白后仍非空的字符串 |
| 必填 | 否 |
| 含义 | 适合目录、搜索结果和 Agent 上下文的一句简短摘要 |

`description` 不得替代 `Overview` 正文，也 MUST NOT 使用 Token 引用。

### 5.4 `omitted`

`omitted` 用于记录被有意省略的标准 Markdown 章节，并抑制消费者对相应章节缺失的通用提示。它 MAY 包含任意标准章节，包括 `Overview`。空数组不影响格式有效性，但没有语义作用；没有省略项时，作者 SHOULD 省略整个 `omitted` 字段。

每个条目可以是：

- 标准章节规范名称或 alias 的非空字符串；
- 一个 `OmittedSection` 对象。

#### `OmittedSection`

`OmittedSection` 是封闭对象，只允许以下字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `section` | 非空字符串 | 是 | 标准章节规范名称或 alias |
| `reason` | 非空字符串 | 否 | 有意省略该章节的原因 |

`OmittedSection` MUST NOT 包含其他字段。字符串简写：

```yaml
omitted:
  - Scale & Generalization
```

等价于：

```yaml
omitted:
  - section: Scale & Generalization
```

对象示例：

```yaml
omitted:
  - section: Map Elements
    reason: 该设计系统只定义基础视觉语言，不规定代表性地图要素。
```

`section` MUST 按 §11.3 的统一规则进行规范化和 alias 匹配，并 MUST 唯一解析为一个标准章节。不能解析的值是格式错误。

消费者 MUST 在解析为规范章节名称后检查重复和冲突。因此，同一章节：

- MUST NOT 在 `omitted` 中重复出现，即使条目使用不同 alias；
- MUST NOT 同时出现在 Markdown 正文和 `omitted` 中。

### 5.5 自定义根字段与 Token 组

作者 MAY 在根层级增加本规范未定义的持久元数据或 Token 组，例如：

```yaml
designRevision: "1.2.0"
patterns:
  uncertain: diagonal-hatch
symbols:
  facility: technical-outline
```

自定义根内容 MUST 仍然表示持久、可复用、与数据和渲染器解耦的设计信息，并 MUST NOT 绕过 §2.2 的边界要求。

若自定义根内容需要作为 Token 引用目标，其根字段名和路径中的每个 mapping key MUST 符合 `TokenIdentifier`。不符合该规则的自定义根字段或未知嵌套键 MAY 被保留，但不能通过核心 Token 引用语法寻址。

在未知根字段和未知根组满足名称、YAML、引用及边界等其他核心规则的前提下，消费者 MUST 保留它们，不得仅因其未知而拒绝文件。自定义内容中的 `TokenReference` 仍须通过语法、路径、索引、断链和循环检查；若消费者不了解相应扩展的最终值类型，则只验证可确定的核心规则，不得仅因无法验证扩展类型而拒绝文件。消费者 MAY 对无法解释的自定义内容给出信息提示。未知根字段若仅在大小写上与标准字段冲突，消费者 SHOULD 报告疑似拼写错误警告。

---

## 6. Token 通用规则

### 6.1 开放词汇与受限标识符

本规范不规定固定的 Token 词汇表，但规定机器可寻址名称的字符语法。

`TokenIdentifier` MUST 是非空字符串，并按整个字符串完整匹配以下 ASCII 正则表达式：

```regex
^[A-Za-z0-9_-]+$
```

其中“字母”仅指 ASCII `A-Z` 和 `a-z`。名称可以数字、`_` 或 `-` 开头，区分大小写，不执行 Unicode 大小写折叠或 Unicode 规范化。允许数字开头不会造成路径歧义：`.0` 表示名称为 `0` 的 mapping key，`[0]` 才表示数组索引。`TokenIdentifier` 定义的是解析后的逻辑名称，不保证可安全写成 YAML 普通 key；例如名称 `0`、`true` 或 `null` 必须按照 §4 使用引号，确保 key 解析为 string。

该规则适用于：

- 所有标准 Token 组中的 Token 名；
- `elements` 中的元素键；
- Token 引用路径中的根字段名和每个后续 mapping key。

不参与 Token 引用的未知自定义根字段和未知开放对象属性只需是非空字符串，可以使用其他 Unicode 字符；消费者仍须按 §5.5 和 §14 保留它们。

因此，`label-primary`、`size-2xl`、`2xl`、`road_critical` 和 `-muted` 合法；`关键色`、`road.primary`、`selected color` 和空字符串不能作为核心 Token 标识符。

一个设计系统可以定义任意数量、任意语义名称的颜色、字体级别、线宽、尺寸、虚线节奏和地图要素。本规范不要求所有设计系统都使用 `primary`、`secondary`、`muted` 等固定名称。

### 6.2 语义命名

Token 名 SHOULD 表达稳定用途，而不是偶然外观。

推荐：

```yaml
colors:
  canvas: "#F7F5EF"
  subject: "#1F2933"
  critical: "#A33A2B"
```

不推荐：

```yaml
colors:
  beige-1: "#F7F5EF"
  dark-gray-2: "#1F2933"
  red-500: "#A33A2B"
```

外观命名并非语法错误，但会降低 Token 在风格调整后的稳定性。

### 6.3 精确值、别名与重复

标准 Token 组中的条目 MAY 通过 `TokenReference` 引用另一个值；递归解析后的最终值 MUST 满足当前 Token 组的类型要求。

作者 SHOULD 避免创建用途无法区分、值又近似重复的 Token。消费者 MAY 报告近似重复、无意义别名或未被正文、元素引用的 Token，但不得仅因此判定文件无效。

### 6.4 数据与渲染器中立

Token 名和 Token 值 MUST NOT 依赖：

- 当前数据字段；
- 数据值或数据集 ID；
- 目标图层 ID；
- 某个渲染器的属性路径。

---

## 7. 基础 Token 类型

本节中的字符串约束使用 §1.1 定义的“非空字符串”。

### 7.1 `Color`

`Color` 是解析后类型为 string、且不依赖继承状态、操作系统主题或外部变量的有效 CSS Color Level 4 颜色，包括：

- 十六进制颜色；
- CSS 命名颜色；
- `rgb()`、`hsl()`、`hwb()`；
- Lab/LCH、OKLab/OKLCH；
- `color()` 和其他该标准允许的颜色形式。

为获得更广泛的工具兼容性，作者 SHOULD 优先使用 `#RRGGBB` 或 `#RRGGBBAA`。十六进制颜色在 YAML 中 MUST 使用引号；其他颜色值 SHOULD 统一使用引号以减少 YAML 解析差异。`currentColor`、系统颜色关键字以及依赖外部变量的 `var()` MUST NOT 作为核心 `Color`，因为它们不能自包含地确定最终颜色。

```yaml
colors:
  canvas: "#F7F5EF"
  ink: "#1F2933"
  water: "oklch(82% 0.05 220)"
```

JSON Schema 无法完整证明字符串符合 CSS Color Level 4；完整颜色合法性由语义校验器负责。

### 7.2 `Dimension`

`Dimension` 是按整个字符串完整匹配以下语法的有限十进制字符串：

```regex
^(?:-(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)|(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)(?:px|pt|mm|cm|in|em)$
```

核心单位分为：

- 非相对单位：`px`、`pt`、`mm`、`cm`、`in`；
- 字体相对单位：`em`。

`AbsoluteDimension` 指使用非相对单位的 `Dimension`。单位换算采用 CSS 绝对长度的固定比例：`1in = 2.54cm = 25.4mm = 72pt = 96px`。其中 `px` 是逻辑参考像素，不是物理设备像素；目标渲染器 MAY 按设备像素比缩放输出，但 MUST 保持同一输出上下文中的单位比例。

核心 0.3.0 不支持 `rem`，因为本格式没有定义稳定的根字号基准。

示例：

```text
0.75px
2px
0.3mm
-0.02em
```

规则：

- `widths`、`sizes`、`spacing`、`dashes` 以及 `MapElement` 的宽度、尺寸、偏移和间距属性 MUST 使用 `AbsoluteDimension`；
- `fontSize` MUST 使用正 `AbsoluteDimension`；
- `letterSpacing` MAY 使用 `em`，此时基准是同一 `Typography` 解析后的 `fontSize`；
- `lineHeight` MAY 使用 `em`，此时基准同样是同一 `Typography` 的 `fontSize`；
- 未明确声明字体参照基准的字段 MUST NOT 使用 `em`；
- `%` 不属于核心 `Dimension`，因为其参照对象不明确；
- 核心 `Dimension` 不允许科学计数法、前导 `+` 号或省略整数部分的写法；
- “正”表示数值严格大于 0；“非负”表示数值大于或等于 0；
- 任何 `Dimension` 都 MUST NOT 使用带负号的零（如 `-0px`、`-0.0mm`），即使其数学值等于零。

含单位的普通 YAML 标量（例如 `13px`）自然解析为 string，因此不强制加引号；无单位的 `1.2` 则解析为 number。

消费者将逻辑单位转换到目标设备或印刷介质时 SHOULD 记录或公开设备像素比、输出分辨率等转换上下文，MUST NOT 绕过上述固定单位比例，把 `pt`、`mm`、`cm` 或 `in` 静默当作同数值的 `px`。

### 7.3 `Opacity`

`Opacity` 是 0 到 1 之间的有限 number，包含边界值。

```yaml
opacities:
  solid: 1
  context: 0.58
  hidden: 0
```

### 7.4 `Typography`

`Typography` 是一个开放对象，定义可复用的文字排版级别。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `fontFamily` | 非空字符串、非空字符串数组或引用 | 是 | 字体及 fallback；数组成员均须非空 |
| `fontSize` | 正 `AbsoluteDimension` 或引用 | 是 | 字号，不允许 `em` 或 `rem` |
| `fontWeight` | 1–1000 的有限 number、精确小写字符串 `normal`、`bold`，或引用 | 否 | 推荐使用数值；`normal` 等价于 400，`bold` 等价于 700 |
| `lineHeight` | 正有限 number、正 `Dimension` 或引用 | 否 | 无单位 number 表示字号倍数；`em` 相对于本 Typography 的 `fontSize` |
| `letterSpacing` | `Dimension` 或引用 | 否 | 字间距，可为负；`em` 相对于本 Typography 的 `fontSize` |
| `fontStyle` | 非空字符串或引用 | 否 | 字体样式；核心推荐值为 `normal`、`italic`、`oblique` |
| `textTransform` | 非空字符串或引用 | 否 | 文字转换语义；常见值为 `none`、`uppercase`、`lowercase`、`capitalize` |
| `fontFeature` | 非空字符串或引用 | 否 | 开放的 OpenType 字体特性提示；核心不定义字符串内部语法 |
| `fontVariation` | 非空字符串或引用 | 否 | 开放的可变字体轴提示；核心不定义字符串内部语法 |

上述核心字段 MAY 使用 `TokenReference`；引用递归解析后的最终值 MUST 满足字段自身的非引用类型。必填字段仍要求相应 key 在原始 `Typography` 对象中存在，不能依靠对象合并补入。需要复用整套排版对象时，作者 MAY 让一个 `typography` Token 引用另一个完整 `Typography`，或让 `MapElement.typography` 引用已定义的排版 Token。

```yaml
typography:
  label-primary:
    fontFamily: ["Source Sans 3", "sans-serif"]
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  label-context:
    fontFamily: ["Source Sans 3", "sans-serif"]
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.2
```

`fontFamily` 数组按“首选字体到最后 fallback”的顺序解释，并 SHOULD 避免重复成员。`fontFeature` 和 `fontVariation` 在 0.3.0 中是开放提示：消费者无法解释其内部语法时 MUST 保留原值，MAY 给出能力提示；作者需要跨实现的机器可解释结构时 SHOULD 通过扩展规范另行定义，且不得写入目标渲染器属性路径。

由于 `Typography` 是开放对象，未知字段 MUST 被保留；消费者 MAY 对未知字段给出警告。未知字段不自动获得核心字段语义。

### 7.5 `DashPattern`

`DashPattern` 是表示虚线节奏的数组，具有以下语义：

- MUST 至少包含两个成员；
- 成员数量 MUST 为偶数；
- 成员按“实线长度、间隙长度”交替排列，并从实线长度开始；
- 每个成员 MUST 是正 `AbsoluteDimension` 或 `TokenReference`，且引用解析后的最终值 MUST 是正 `AbsoluteDimension`；
- 全部成员完成引用解析后，MUST 使用相同单位；
- 未设置 `dash` 时表示连续实线。

```yaml
dashes:
  reference: [4px, 2px]
  boundary: [6px, 2px, 1px, 2px]
```

`DashPattern` 表达设计系统中的绝对视觉节奏，不等同于 MapLibre `line-dasharray` 等目标属性；适配器负责换算。

---

## 8. 标准 Token 组

除 `elements` 外，标准 Token 组的每个值 MAY 是该组的具体类型，也 MAY 是 `TokenReference`。引用递归解析后的最终值 MUST 满足该组类型。

### 8.1 `colors`

`colors` 是 `map<TokenIdentifier, Color | TokenReference>`，用于定义设计系统的颜色值。

颜色 Token 可以按视觉角色、表面、文字、状态、自然色或专题强调进行命名。规范不规定固定 palette，也不要求所有设计系统具有相同颜色数量。

```yaml
colors:
  canvas: "#F7F5EF"
  ink: "#1F2933"
  subject: "{colors.ink}"
  context: "#929990"
  water: "#A8C8D4"
  accent: "#A33A2B"
```

颜色的使用范围、稀缺性、组合关系和禁止事项 SHOULD 写在 Markdown `Colors` 章节中。

### 8.2 `typography`

`typography` 是 `map<TokenIdentifier, Typography | TokenReference>`，用于定义地图文字层级。

Token 可以表示：

- 主要地名；
- 次要地名；
- 水系标注；
- 技术标注；
- 注记与元数据；
- 专题重点标注。

这些名称只是示例，不构成固定列表。

字体的语气、标注密度、大小写、halo、碰撞、重复和多语言策略 SHOULD 写在 `Typography & Labels` 章节和相关 `elements` 中。

### 8.3 `widths`

`widths` 是 `map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>`，用于定义可复用的线性宽度，包括：

- 线宽；
- casing 宽度；
- outline 宽度；
- halo 宽度；
- 图框或分隔线宽度。

```yaml
widths:
  hairline: 0.5px
  line-primary: 2.5px
  line-secondary: 1.25px
  casing: 1px
  label-halo: 1.5px
```

所有条目递归解析后的值 MUST 为非负 `AbsoluteDimension`。

### 8.4 `sizes`

`sizes` 是 `map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>`，用于定义点符号、图标、节点、标记和其他非字体视觉对象的尺寸。

```yaml
sizes:
  point-small: 5px
  point-medium: 8px
  point-large: 12px
  focus-marker: 16px
```

所有条目递归解析后的值 MUST 为非负 `AbsoluteDimension`。

### 8.5 `opacities`

`opacities` 是 `map<TokenIdentifier, Opacity | TokenReference>`，用于定义可复用透明度。

```yaml
opacities:
  solid: 1
  subject: 0.92
  context: 0.58
  faint: 0.24
```

透明度 SHOULD NOT 成为弱化信息的唯一方法。正文 SHOULD 说明透明度与明度、线宽和背景之间的关系。

### 8.6 `spacing`

`spacing` 是 `map<TokenIdentifier, NonNegativeAbsoluteDimension | TokenReference>`，用于定义地图内部和外围版式中的重复间距，例如：

- 标注与符号之间的间距；
- 标注 halo、偏移或 padding；
- 图例、比例尺、标题和图框的间距；
- 重复符号或重复标注的设计间距。

```yaml
spacing:
  label-gap: 2px
  symbol-label-gap: 4px
  map-surround-gap: 12px
```

所有条目递归解析后的值 MUST 为非负 `AbsoluteDimension`。目标技术中的碰撞参数和具体换算由适配器决定。

### 8.7 `dashes`

`dashes` 是 `map<TokenIdentifier, DashPattern | TokenReference>`，用于定义可复用的虚线节奏。

```yaml
dashes:
  reference: [4px, 2px]
  boundary: [6px, 2px, 1px, 2px]
```

虚线的设计目的、视觉节奏以及何时使用连续实线 SHOULD 写在 `Geometry & Symbols` 章节中。

---

## 9. `elements`：地图要素组件

### 9.1 定义

`elements` 是 `map<TokenIdentifier, MapElement>`，是 `CARTOGRAPHY.md` 中与 UI 设计系统 `components` 对应的结构。

一个 `MapElement` 表示一项可复用的制图样式组合。它可以是：

- 通用视觉组件，如 `technical-line-primary`、`point-muted`；
- 常见地图要素，如 `road-primary`、`water-area`、`administrative-boundary`；
- 某一设计家族的领域要素，如 `pipeline-primary`、`valve-critical`；
- 状态变体，如 `pipeline-primary-selected`、`road-primary-muted`。

`elements` 不需要穷举地图中的全部要素。作者 SHOULD 只定义高频、核心、具有风格辨识度或需要稳定复用的要素组件。

### 9.2 `MapElement` 结构

`MapElement` 是开放对象。以下字段具有核心语义：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `geometry` | `background`、`point`、`line`、`polygon`、`label`、`raster`、`mixed` | 是 | 元素的主要绘制原语或视觉类型，不表示源数据的实际几何类型 |
| `family` | 非空字符串 | 否 | 同一表达家族的稳定名称 |
| `role` | 非空字符串 | 否 | 组件在家族中的视觉角色，如 `primary`、`secondary`、`muted` |
| `state` | 非空字符串 | 否 | 状态，如 `default`、`hover`、`selected`、`critical`；省略时视为基础状态 |
| `layerRole` | 非空字符串 | 否 | 概念层级角色，如 `background`、`context`、`subject`、`annotation` |
| `color` | `Color` 或引用 | 否 | 通用主色 |
| `fillColor` | `Color` 或引用 | 否 | 填充色 |
| `strokeColor` | `Color` 或引用 | 否 | 线或边界颜色 |
| `outlineColor` | `Color` 或引用 | 否 | 外轮廓颜色 |
| `casingColor` | `Color` 或引用 | 否 | 线状要素套线颜色 |
| `haloColor` | `Color` 或引用 | 否 | 标注或符号光晕颜色 |
| `strokeWidth` | 非负 `AbsoluteDimension` 或引用 | 否 | 主线宽 |
| `outlineWidth` | 非负 `AbsoluteDimension` 或引用 | 否 | 外轮廓宽度 |
| `casingWidth` | 非负 `AbsoluteDimension` 或引用 | 否 | 套线宽度 |
| `haloWidth` | 非负 `AbsoluteDimension` 或引用 | 否 | 光晕宽度 |
| `size` | 非负 `AbsoluteDimension` 或引用 | 否 | 点符号或图标尺寸 |
| `opacity` | `Opacity` 或引用 | 否 | 整体透明度 |
| `fillOpacity` | `Opacity` 或引用 | 否 | 填充透明度 |
| `strokeOpacity` | `Opacity` 或引用 | 否 | 线透明度 |
| `typography` | `Typography` 对象或引用 | 否 | 标注排版级别 |
| `symbol` | 非空字符串或引用 | 否 | 符号家族或符号语义名称 |
| `pattern` | 非空字符串、非空数组、非空对象或引用 | 否 | 开放的图案语义；核心规范只校验非空并保留内容 |
| `dash` | `DashPattern` 或引用 | 否 | 标准化虚线节奏 |
| `offset` | `AbsoluteDimension` 或引用 | 否 | 相对偏移，可为负 |
| `spacing` | 非负 `AbsoluteDimension` 或引用 | 否 | 内部或重复间距 |

`geometry` 的名称为 0.3.0 兼容字段；其枚举同时包含几何原语与视觉原语，因此 `label`、`background` 和 `mixed` 均合法。

每个 `MapElement` MUST：

1. 包含 `geometry`；
2. 至少包含下列一个核心样式属性：

```text
color
fillColor
strokeColor
outlineColor
casingColor
haloColor
strokeWidth
outlineWidth
casingWidth
haloWidth
size
opacity
fillOpacity
strokeOpacity
typography
symbol
pattern
dash
offset
spacing
```

`geometry`、`family`、`role`、`state` 和 `layerRole` 不计入最低样式属性要求。未知扩展属性即使被保留，也不满足该最低要求，除非未来扩展规范明确赋予其样式属性语义。

若同一 family 存在多个变体，作者 SHOULD 使用 `family`、`role` 和适用时的 `state` 明确它们的关系。

未知属性 MUST 被保留。消费者 MAY 对未知属性或明显不适合当前 `geometry` 的属性组合给出警告，但不得仅因未知属性或可适配的组合差异拒绝文件。

### 9.3 家族、角色与状态

为了表达同一种线型、点型或面型的多个层级，作者 SHOULD 将其定义为多个相关元素，并通过 `family`、`role` 和 `state` 建立关系。

```yaml
elements:
  technical-line-primary:
    geometry: line
    family: technical-line
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.accent}"
    strokeWidth: "{widths.line-primary}"
    casingColor: "{colors.canvas}"
    casingWidth: "{widths.casing}"
    opacity: "{opacities.solid}"

  technical-line-secondary:
    geometry: line
    family: technical-line
    role: secondary
    state: default
    layerRole: context
    strokeColor: "{colors.ink}"
    strokeWidth: "{widths.line-secondary}"
    opacity: "{opacities.context}"

  technical-line-primary-selected:
    geometry: line
    family: technical-line
    role: primary
    state: selected
    layerRole: subject
    strokeColor: "{colors.accent}"
    strokeWidth: "{widths.line-primary}"
    casingColor: "{colors.selection}"
    casingWidth: "{widths.selection-casing}"
```

元素变体 SHOULD 使用不同但相关的键，例如：

```text
road-primary
road-primary-selected
road-secondary
water-area
water-area-highlighted
```

消费者 MUST NOT 假定后缀具有固定含义；其关系由 `family`、`role`、`state` 和正文共同说明。

### 9.4 通用组件与领域组件

以下两种写法都符合规范。

通用组件：

```yaml
colors:
  natural-context: "#DDE7D8"
elements:
  natural-area-context:
    geometry: polygon
    family: natural-area
    role: context
    fillColor: "{colors.natural-context}"
```

领域组件：

```yaml
colors:
  water: "#A8C8D4"
  critical: "#A33A2B"
elements:
  water-area:
    geometry: polygon
    family: water
    role: context
    fillColor: "{colors.water}"

  pipeline-critical:
    geometry: line
    family: pipeline
    role: critical
    strokeColor: "{colors.critical}"
```

第一种更通用，第二种更具体。作者 SHOULD 根据该设计系统是否长期维护某类地图要素决定使用哪种方式。

### 9.5 禁止的数据绑定

以下名称是 `MapElement` 的保留禁用属性名，MUST NOT 作为其直接属性出现：

```text
source
sourceLayer
source-layer
layerId
field
property
filter
valueMapping
paint
layout
minzoom
maxzoom
outputPath
```

上述列表不是绕过边界规则的白名单。检测 `MapElement` 直接属性的常见拼写变体时，消费者 MUST 将属性名执行 ASCII 小写转换并移除 ASCII 空白、`-` 与 `_`，再与上述名称按同样方式规范化后的结果比较；因此 `SourceLayer`、`source_layer`、`source layer` 和 `source-layer` 均视为同一禁用属性。该规范化只用于边界检查，不改变或重写原始属性名。

`MapElement`、其他 front matter 内容或 Markdown 正文确认包含与这些属性等价的项目数据绑定、目标渲染器配置或运行时事实时，属于格式错误，消费者 MUST 拒绝文件。

对于无法确定是否属于边界违规、只能通过启发式识别的疑似内容，消费者 MAY 报告高等级警告；一旦确认违规，不能降级为警告。

比例尺变化的设计原则属于 Markdown `Scale & Generalization`；具体 zoom、过滤器和表达式属于外部适配器与 `data-profile`。

### 9.6 元素属性与 Token 引用

元素属性 SHOULD 优先引用基础 Token，而不是重复字面值。

推荐：

```yaml
elements:
  place-label-primary:
    geometry: label
    typography: "{typography.label-primary}"
    color: "{colors.ink}"
    haloColor: "{colors.canvas}"
    haloWidth: "{widths.label-halo}"
```

允许但不推荐：

```yaml
elements:
  place-label-primary:
    geometry: label
    color: "#1F2933"
    haloColor: "#F7F5EF"
    haloWidth: 1.5px
```

本版本不定义元素继承或自动合并。一个元素 MUST NOT 依赖消费者隐式合并另一个元素。

---

## 10. Token 引用

### 10.1 `TokenReference` 语法

Token 引用使用：

```text
{path.to.token}
```

形式语法：

```text
reference = "{" path "}"
path      = segment (("." segment) | index)+
segment   = TokenIdentifier
index     = "[" ("0" | [1-9][0-9]*) "]"
```

示例：

```text
{colors.ink}
{typography.label-primary}
{widths.line-primary}
{elements.technical-line-primary.strokeColor}
{symbols.facility.fallbacks[0]}
```

路径 MUST 在根字段之后至少再包含一个 mapping 路径段或数组索引。整个引用区分大小写，并且在 `{`、路径、分隔符和 `}` 之间 MUST NOT 出现空白。路径段 MUST 使用 §6.1 定义的 ASCII `TokenIdentifier`，因此不存在“字母是否包括 Unicode 字母”的实现差异。数字形式的点路径段（如 `.0`）是 mapping key；数组索引只使用方括号形式。数组索引从 0 开始，不允许负数、空索引或带前导零的多位索引。

YAML 中的 Token 引用 MUST 使用单引号或双引号包裹：

```yaml
strokeColor: "{colors.accent}"
```

未加引号的 `{colors.accent}` 会被 YAML 解释为 flow mapping，而不是字符串引用。

### 10.2 允许位置与解析规则

1. YAML 中的引用只允许出现在 value 位置，MUST NOT 用作 mapping key；
2. 任意 front matter value 中完整匹配 §10.1 的字符串均视为 `TokenReference`。只有类型明确包含“引用”的标准字段可以使用它；在其他标准字段中出现引用是格式错误。未知自定义内容中的引用同样 MUST 被解析，其最终类型语义由相应扩展定义；
3. YAML 中的引用 MUST 占据整个字符串标量，不支持前缀、后缀或字符串插值；任意 front matter value 去除首尾空白后整体被 `{` 和 `}` 包围时，该字符串保留给引用语法，若位置不允许引用或内容不符合 §10.1，则是格式错误，不能退化为普通字符串；
4. 引用 MUST 在同一 front matter 中解析；
5. `version`、`name`、`description` 和 `omitted` 是元数据，不是 Token 组，MUST NOT 作为引用根；自定义引用根 MUST 是用于组织 Token 的 mapping 或 sequence；
6. 路径中的 mapping key 按原始大小写精确匹配，不执行 §11.3 的章节规范化；消费者 MUST 只访问 mapping 自身的数据项，MUST NOT 解析继承属性、原型链、getter 或可执行路径；
7. 路径遍历 MUST 基于原始 front matter 节点；每一步要求当前节点直接是 mapping 或 sequence。消费者在完整路径定位到目标后，才解析目标值；中间节点若是 `TokenReference`，不得自动解引用后继续遍历；
8. 最终目标本身为 `TokenReference` 时，消费者 MUST 继续解析，直到得到非引用值。最终目标为 mapping 或 sequence 时，消费者 MUST 形成逻辑上的深度解析视图，并递归解析其中所有后代 value 的引用；解析不得修改原始 front matter，也不得以解析结果覆盖作者原文；
9. 引用图包含 front matter 中全部 `TokenReference`，无论其是否被其他 Token 或正文使用。断链、非法索引、试图穿过中间引用，以及直接或通过复合值形成的循环引用都是格式错误；
10. 消费者 MUST NOT 自动编造 fallback；
11. 最终解析值 MUST 满足使用位置要求的类型；未知扩展没有可用类型定义时，只验证核心可确定约束。

标准 Token 组中的别名示例：

```yaml
colors:
  ink: "#1F2933"
  subject: "{colors.ink}"
```

### 10.3 Markdown 中的引用

Markdown 正文 MAY 在可见文本节点中嵌入 Token 引用。链接目标 URL、图片目标 URL、链接标题、引用式链接标签和其他非可见元数据不参与引用扫描。消费者识别正文引用时 MUST：

- 忽略 fenced code、缩进代码块、inline code、原始 HTML block 和 HTML comment 中的匹配文本；
- 忽略 inline HTML 标签、属性和其他语法 Token 自身包含的匹配文本；位于成对 inline HTML 标签之间、被 CommonMark 解析为普通可见文本的内容仍参与扫描；
- 按 CommonMark 反斜杠转义规则，忽略其起始 `{` 被有效转义的 `\{path.to.token}`；连续反斜杠的奇偶含义由 CommonMark 解析结果决定，消费者需要保留源位置或等价的转义信息，不能只扫描已丢失转义信息的纯文本；
- 将其余符合 §10.1 完整语法的文本视为引用；
- 要求识别出的正文引用同样在当前 front matter 中成功解析；断链或循环同样是格式错误。

需要显示引用字面量时，作者 SHOULD 使用 inline code：

```md
写作 `{colors.ink}` 可显示语法本身。
```

Markdown 引用用于建立语义联系，不要求消费者把复杂对象序列化后插入句子。

### 10.4 复合引用

大多数属性引用 SHOULD 指向原始值。仅当属性明确接受复合类型时，才可以引用整个对象或数组，例如：

```yaml
typography: "{typography.label-primary}"
dash: "{dashes.reference}"
```

本版本不规定通过引用实现对象展开、继承、部分覆盖或自动合并。

---

## 11. Markdown 标准章节

### 11.1 章节顺序

`CARTOGRAPHY.md` 定义九个标准 Markdown 章节：

1. `Overview`
2. `Colors`
3. `Typography & Labels`
4. `Composition & Density`
5. `Layering & Depth`
6. `Geometry & Symbols`
7. `Scale & Generalization`
8. `Map Elements`
9. `Do's and Don'ts`

标准章节 MUST 使用文档顶层的 ATX `##` 标题。位于 blockquote、列表项、HTML 或代码区中的 `##`，以及 Setext 二级标题，均不识别为标准章节。一个标准章节的内容从其标题结束后开始，到下一个文档顶层 ATX `##` 标题之前结束；未知 `##` 标题同样结束前一章节，`###` 及更深标题则属于当前章节内部。

章节可以省略；出现时 SHOULD 按上述顺序排列。顺序检查只比较已识别标准章节之间的相对位置，未知顶层 `##` 章节不参与排序。顺序不正确不使文件无效，但消费者 SHOULD 报告结构警告。

`Overview` SHOULD 出现在完整的设计系统中。任一标准章节不适用时 MAY 省略，并 SHOULD 在 `omitted` 中说明。

标准章节 MUST NOT 重复出现。使用不同 alias 重复同一章节仍属于重复。

### 11.2 标题 alias

| 规范章节 | 英文 alias | 中文 alias |
|---|---|---|
| `Overview` | `overview`, `brand & style`, `brand and style` | `概述`, `品牌与风格` |
| `Colors` | `color`, `colors` | `色彩`, `颜色` |
| `Typography & Labels` | `typography`, `labels`, `typography and labels`, `typography & labels` | `字体`, `标注`, `字体与标注` |
| `Composition & Density` | `composition`, `density`, `composition and density`, `composition & density` | `构图`, `密度`, `构图与密度` |
| `Layering & Depth` | `layering`, `depth`, `layering and depth`, `layering & depth` | `层级`, `深度`, `层级与深度` |
| `Geometry & Symbols` | `geometry`, `symbols`, `geometry and symbols`, `geometry & symbols` | `几何`, `符号`, `几何与符号` |
| `Scale & Generalization` | `scale`, `generalization`, `scale and generalization`, `scale & generalization` | `比例尺`, `制图综合`, `比例尺与制图综合` |
| `Map Elements` | `elements`, `map elements`, `map components` | `地图要素`, `地图组件`, `要素样式` |
| `Do's and Don'ts` | `do's and don'ts`, `dos and donts`, `dos and don'ts`, `do's & don'ts` | `应该与不应该`, `正反例`, `设计禁忌` |

未知 `##` 章节 MUST 被保留，不构成格式错误。

### 11.3 章节匹配规范化

消费者在匹配标准章节标题、alias 和 `omitted` 条目之前，MUST 对待匹配文本执行同一套规范化：

1. 从 Markdown 标题中提取去除 inline markup 后的纯文本；
2. 按 Unicode 标准定义执行 `toNFKC_Casefold`，完成兼容规范化、默认大小写折叠及该算法规定的默认可忽略字符处理；
3. 将 `‘`、`’`、`ʼ` 统一替换为 ASCII `'`；
4. 裁剪首尾 §1.1 定义的 Unicode 空白；
5. 将连续内部 Unicode 空白折叠为一个 U+0020 SPACE。

alias 表中的规范名称和 alias MUST 使用相同流程预处理后再比较。字符串形式的 `omitted` 条目及 `OmittedSection.section` MUST 使用同一流程。

该规范化仅用于 Markdown 章节和 `omitted` 匹配，MUST NOT 用于 YAML 根字段、Token 名、元素键或 Token 引用路径；后者始终区分大小写并按 ASCII 标识符精确匹配。

---

## 12. 标准章节语义

### 12.1 `Overview`

`Overview` 提供设计系统的整体外观与感受，是 Agent 在缺少具体规则时进行设计判断的基础上下文。

本节 SHOULD 描述：

- 地图风格的整体气质和视觉世界；
- 目标受众和期望的阅读感受；
- 具体的设计参照、材料感、出版物感或地图传统；
- 信息密度、克制程度和强调方式；
- 该设计系统明确拒绝成为的样子。

本节 SHOULD NOT 写成当前项目简介、数据说明或通用形容词列表。

### 12.2 `Colors`

`Colors` 解释颜色体系和颜色 Token 的使用规则。

本节 SHOULD 描述：

- 画布、文字、主体、背景、强调、状态和自然色之间的关系；
- 哪些颜色承担核心品牌或主题身份；
- 强调色的使用范围和稀缺性；
- 不同颜色在点、线、面和标注中的适配原则；
- 颜色组合、对比度和需要避免的配色方式；
- 色觉差异、灰度显示和复杂背景下的可辨识策略。

关键文字标注与其有效背景 SHOULD 以 WCAG 2.2 为参考目标：普通文字至少 4.5:1，大号文字至少 3:1。带 halo 的标注 SHOULD 按文字、halo 与代表性背景组合后的实际效果评估。对理解地图必需的非文字边界、符号或状态标记，在适用时 SHOULD 以相邻颜色间至少 3:1 作为参考目标。

关键类别、状态和风险等级 SHOULD NOT 仅依赖颜色区分；SHOULD 同时使用线宽、线型、pattern、symbol、outline、文字或其他冗余视觉通道。

本节不要求固定使用 `primary`、`secondary` 等名称。

### 12.3 `Typography & Labels`

`Typography & Labels` 解释字体体系、标注层级和文字行为。

本节 SHOULD 描述：

- 字体家族、fallback 和整体文字性格；
- 主要、次要、上下文和专题标注的层级；
- 字号、字重、字距、大小写和行距；
- 文字颜色、halo、偏移和符号关系；
- 密度、碰撞、重复、缩写和隐藏顺序；
- 多语言、不同文字系统和小尺寸显示原则；
- 无法满足对比度或字号要求时的降级策略。

精确字体参数 SHOULD 定义在 `typography` 中；具体标注组合 MAY 定义在 `elements` 中。

### 12.4 `Composition & Density`

`Composition & Density` 对应一般设计系统中的 Layout，描述地图整体构图、留白和信息密度。

本节 SHOULD 描述：

- 地图的视觉重心和主要阅读路径；
- 主体、上下文和空白区域之间的平衡；
- 密集与稀疏区域的节奏；
- 标题、图例、比例尺、指北针、经纬网、署名和图框的布局原则；
- 不同屏幕、纸张和观看距离下的构图适配。

本节 MUST NOT 写入目标技术的容器尺寸、widget ID 或 CSS 布局代码。

### 12.5 `Layering & Depth`

`Layering & Depth` 对应一般设计系统中的 Elevation & Depth，描述地图的图底关系、概念层叠和深度表达。

本节 SHOULD 描述：

- 背景、上下文、主体、标注和交互状态的概念顺序；
- 通过明度、饱和度、线宽、casing、outline、阴影或色调层建立深度的方法；
- 哪些内容应该浮现，哪些内容应该保持平面或退后；
- 状态叠加时如何保留原有语义；
- 不允许出现的层级冲突。

本节 MUST NOT 列出具体 layer ID 或数值 z-index。

### 12.6 `Geometry & Symbols`

`Geometry & Symbols` 对应一般设计系统中的 Shapes，描述点、线、面和符号的几何语言。

本节 SHOULD 描述：

- 点符号的轮廓、尺寸关系和简化方式；
- 线条的端点、连接、线宽、casing、dash 和节奏；
- 面填充、边界、纹理和 pattern；
- 自定义符号与熟悉地图惯例之间的关系；
- 不同几何类型如何保持同一家族感；
- 小尺寸和高密度下需要移除的细节。

### 12.7 `Scale & Generalization`

`Scale & Generalization` 描述设计系统随阅读尺度变化时的行为，而不规定某个渲染器的 zoom 值。

本规范推荐使用以下语义尺度词汇：

| 中文 | 标准词汇 | 语义目标 |
|---|---|---|
| 概览 | `overview` | 强调整体格局、主要形态和极少量核心结构 |
| 区域 | `regional` | 强调主要层级、区域关系和关键联系 |
| 局部 | `local` | 展示主体网络、常用对象和主要标注 |
| 细节 | `detail` | 展示对象级技术信息、次要节点和精细标注 |

这些词汇表示相对阅读阶段，不对应固定 zoom、比例尺分母或目标渲染器层级，也不要求每个设计系统必须使用全部四个阶段。

本节 SHOULD 描述：

- 各语义尺度阶段的视觉目标；
- 哪些内容先出现、后出现、先隐藏或聚合；
- 线宽、符号尺寸、标注密度和几何细节如何变化；
- 哪些结构、关系和识别特征需要在各尺度阶段保持；
- 如何避免尺度切换时产生突变。

若某一固定比例尺范围是设计家族长期不可分割的一部分，正文 MAY 说明该范围，但 MUST NOT 使用 MapLibre 专属属性表达。

### 12.8 `Map Elements`

`Map Elements` 对应一般设计系统中的 Components，详细说明 `elements` 中具有代表性的地图要素组件。

本节 SHOULD：

- 说明每个核心元素的设计目的和使用场景；
- 解释同一 `family` 中不同 `role` 和 `state` 的关系；
- 说明哪些元素最能代表该地图风格；
- 说明如何将基础 Token 组合为点、线、面和标注样式；
- 说明适用边界和需要避免的场景。

本节不需要覆盖所有可能的地图对象。常见要素和领域要素都可以出现，只要它们属于该设计系统的持久组成部分。

示例：

```md
## Map Elements

### Technical Line

`technical-line-primary` 是技术网络中的主要表达。它使用
{colors.accent}、{widths.line-primary} 和浅色 casing，在复杂背景上保持清晰。

`technical-line-secondary` 与主线属于同一 family，但降低线宽和透明度，
用于建立网络层次，不与主线竞争。

该 family 可以由外部 data-profile 映射到道路、管线、线路或其他线状数据；
本设计系统不规定具体字段和数据类别。
```

### 12.9 `Do's and Don'ts`

本节提供具体、可执行的设计护栏。

每条规则 SHOULD 指向真实的设计决策或失败模式，例如：

- 应该将饱和强调色保留给少量核心主体；不应该把它分配给所有普通类别；
- 应该通过 family 与 role 形成点线面层级；不应该为每个对象随意创建不相关样式；
- 应该先移除低优先级标注；不应该把全部文字缩小到不可读；
- 应该使用 casing 或 outline 增加选中状态；不应该覆盖原有关键状态；
- 应该保持背景和上下文安静；不应该让所有边界拥有相同对比度；
- 应该为关键状态提供颜色之外的第二视觉通道；不应该让色觉差异导致语义丢失。

“让地图更美观”“保持现代感”等无法执行的表述 SHOULD NOT 单独作为规则。

---

## 13. 推荐 Token 与元素命名（资料性）

以下名称仅用于提高不同设计系统之间的可读性，不构成固定词汇表，但仍须符合 `TokenIdentifier` 语法。

### 13.1 Colors

```text
canvas
ink
primary
secondary
neutral
context
subject
accent
critical
selection
water
land
```

### 13.2 Typography

```text
label-primary
label-secondary
label-context
label-small
label-emphasis
annotation
metadata
```

### 13.3 Widths

```text
hairline
line-primary
line-secondary
outline
casing
label-halo
selection-casing
```

### 13.4 Sizes

```text
point-small
point-medium
point-large
symbol-primary
symbol-secondary
focus-marker
```

### 13.5 Opacities

```text
solid
strong
subject
context
muted
faint
```

### 13.6 Dashes

```text
reference
boundary
secondary
uncertain
planned
```

### 13.7 Elements

推荐采用以下键形式：

```text
<family>-<role>
<family>-<role>-<state>
```

例如：

```text
technical-line-primary
technical-line-secondary
technical-line-primary-selected
water-area-context
pipeline-critical
place-label-primary
```

作者也可以使用更适合自身设计系统的命名方式，但必须符合 §6.1。

---

## 14. 消费者诊断与未知内容行为

本节中的“错误”表示文件不满足格式要求，消费者 MUST 拒绝将其报告为格式有效；“警告”“提示”和“能力或适配警告”不改变格式有效性。消费者 MAY 使用自己的诊断代码，但不得降低本节规定的最低严重级别。

| 场景 | 消费者行为 |
|---|---|
| 名称合法且满足其他核心规则的未知根字段或未知根 Token 组 | 保留，不报错；可以提示 |
| 未知根字段仅在大小写上与标准字段相同 | 保留，并 SHOULD 报告疑似拼写错误警告 |
| 已知 Token 组中名称合法的未知 Token 名 | 最终值类型合法则接受 |
| 未知 Markdown `##` 章节 | 保留，不报错 |
| 未知 `Typography` 或 `MapElement` 属性 | 保留，并可以警告；未知 `MapElement` 属性不满足最低样式属性要求 |
| `OmittedSection` 出现未知字段 | 错误，拒绝文件 |
| 重复 YAML 键 | 错误，拒绝文件 |
| YAML 引用未加引号或十六进制颜色未加引号 | 表示层错误，拒绝文件 |
| 重复标准章节 | 错误，拒绝文件 |
| 标准章节顺序不正确 | 报告结构警告，不影响格式有效性 |
| `omitted` 条目无效、重复或与正文冲突 | 错误，拒绝文件 |
| 断链、非法索引或循环引用 | 错误，拒绝文件 |
| 已知 Token 组中的非法值 | 错误，拒绝文件 |
| `MapElement` 缺少 `geometry` 或核心样式属性 | 错误，拒绝文件 |
| 出现保留禁用属性，或确认存在项目数据绑定、目标渲染器配置 | 边界错误，拒绝文件 |
| 仅启发式怀疑存在边界违规，尚不能确认 | MAY 报告高等级警告；确认后必须升级为错误 |
| 格式允许的值无法由当前目标渲染器直接实现 | 报告能力或适配警告；MUST NOT 因此把 `CARTOGRAPHY.md` 判为格式无效 |
| 标准 Token 组为空 | 可以提示，不影响格式有效性 |
| Token 未被正文或元素使用 | 可以提示，不影响格式有效性 |
| `elements` 条目没有在 `Map Elements` 中说明 | 可以提示，不影响格式有效性 |
| 标准章节缺失且未在 `omitted` 中声明 | 可以提示，不影响格式有效性 |

消费者 MUST 保留自己无法解释但不违反格式的未知内容，MUST NOT 在读取过程中静默删除、改名或重写这些内容。这里的“保留”至少指保留未知 YAML 节点的逻辑键和值，以及未知 Markdown 章节的文本内容和相对位置；写入型消费者 SHOULD 同时保持 YAML mapping 的原有顺序。除非消费者明确声明提供保真 round-trip，规范不要求逐字节保留引号风格、空白或注释。任何会重新输出文件的写入型消费者 MUST NOT 因无法解释而丢弃未知内容。

---

## 15. 符合性

### 15.1 格式有效

一份格式有效的 `CARTOGRAPHY.md` MUST：

- 以符合 §3 和 §4 的合法 front matter 开头，且根值为单一 mapping；
- 声明 `version: "0.3.0"`；
- 声明非空 `name`；
- 使用非空字符串根字段名，以及合法的 Token 名和元素键；
- 满足标准 Token 组、`OmittedSection`、`Typography`、`DashPattern` 和 `MapElement` 的类型要求；
- 满足 YAML 引用和十六进制颜色的引号要求；
- 不包含重复键、断链引用、非法索引或循环引用；
- 不重复标准 Markdown 章节；
- 不包含无效、重复或与正文冲突的 `omitted` 条目；
- 不包含项目数据绑定、目标渲染器配置或运行时事实；
- 为每个 `MapElement` 提供 `geometry` 和至少一个核心样式属性。

资料性 JSON Schema 只能验证其中一部分条件；完整符合性还需要 YAML 表示层、受限标量 profile、引用图、Markdown 结构和语义边界校验。消费者只有实现全部适用的 MUST 检查时，才可以无保留地报告“格式有效”；只执行 Schema 或部分检查时，MUST 将结果标记为“部分验证”或明确列出未检查项。

### 15.2 设计系统完整

一份格式有效的文件仍可能缺少足够设计信息。消费者 MAY 对以下情况报告警告：

- 标准章节缺失且未在 `omitted` 中声明；
- Token 只有数值，没有正文解释其关系和用途；
- `elements` 只有属性，没有 `Map Elements` 说明；
- 说明性正文空泛、互相矛盾或直接复述 Token；
- 元素之间缺少 family、role 或状态关系；
- 大量重复 Token 无法解释差异；
- 说明过度依赖未随文件提供的外部上下文，但尚未形成 §2.2 所禁止的明确项目数据绑定；
- 标准 Token 组为空；
- 关键视觉语义只依赖颜色表达。

若 `Overview` 已在 `omitted` 中声明，则消费者 SHOULD NOT 再报告通用的“章节未声明缺失”警告；但 MAY 根据任务需要提示该文件缺少整体设计上下文。

格式校验不能证明地图一定美观、专业、无障碍或适合某一任务。

### 15.3 安全与资源限制

消费者 MUST 将 YAML、Token 路径和未知扩展内容作为纯数据处理，MUST NOT 执行其中的代码、模板、getter、命令或网络请求。

消费者 MAY 设置文件大小、YAML 嵌套深度、Token 数量、数组长度和引用解析深度等资源上限。超过实现资源上限时，消费者 MAY 停止处理并报告资源限制错误，但 SHOULD 将该错误与“文件违反格式规范”区分。

---

## 16. Agent 与生成器行为

Agent 或生成器在使用 `CARTOGRAPHY.md` 时 SHOULD：

1. 完整读取 front matter 和 Markdown 正文；
2. 解析 Token 引用；
3. 将 `elements` 视为可选的样式组件库，而不是数据图层清单；
4. 根据用户意图和外部 `data-profile` 选择合适的 family、role 和 state；
5. 在目标渲染器中实现设计意图，但不把目标属性写回本文件；
6. 保留未知 Token 组、未知章节和人工编写的正文；
7. 在普通制图任务中保持 `CARTOGRAPHY.md` 不变，除非用户明确要求修改设计系统。

Agent MUST NOT：

- 从元素名称推断不存在的数据字段；
- 将 `road-primary` 自动绑定到任意名为 `road` 的图层；
- 把 Token 路径直接当作 MapLibre 属性路径；
- 因当前任务需要而把一次性数据映射写入设计系统；
- 在缺少依据时自动新增设计家族或改变原有 Token 含义。

---

## 17. 版本管理

本格式使用语义化版本：

- Patch 版本：兼容性澄清和错误修正；
- Minor 版本：增加可选字段、Token 组或语义；
- Major 版本：改变必填结构、既有字段含义或兼容行为。

在 1.0.0 之前，Minor 版本 MAY 包含不兼容调整，但 MUST 在迁移说明中明确列出。标记为“草案”的同一版本在正式发布前 MAY 继续修订；一旦某版本被标记为正式发布，任何改变既有文件有效性或消费者强制行为的规范性修改都 MUST 使用新的格式版本。

消费者 SHOULD 拒绝自己不支持的格式版本，不得静默按其他版本解析。

`version` 不记录某套设计系统自身的修订号。设计系统如需记录自身版本，可以使用符合 §5.5 的自定义根字段，例如：

```yaml
designRevision: "1.2.0"
```

---

## 18. 完整示例

```md
---
version: "0.3.0"
name: Quiet Civic Atlas
description: 一套温暖、克制、适合公共地图和技术专题的制图设计系统。

colors:
  canvas: "#F7F5EF"
  ink: "#1F2933"
  context: "#8A938B"
  water: "#A8C8D4"
  accent: "#A33A2B"
  selection: "#F2C94C"

typography:
  label-primary:
    fontFamily: ["Source Sans 3", "sans-serif"]
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  label-context:
    fontFamily: ["Source Sans 3", "sans-serif"]
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.2

widths:
  hairline: 0.5px
  line-primary: 2.5px
  line-secondary: 1.25px
  casing: 1px
  selection-casing: 2px
  label-halo: 1.5px

sizes:
  point-small: 5px
  point-medium: 8px
  point-large: 12px

opacities:
  solid: 1
  subject: 0.92
  context: 0.58
  faint: 0.24

spacing:
  label-gap: 2px
  symbol-label-gap: 4px

dashes:
  reference: [4px, 2px]

elements:
  technical-line-primary:
    geometry: line
    family: technical-line
    role: primary
    state: default
    layerRole: subject
    strokeColor: "{colors.accent}"
    strokeWidth: "{widths.line-primary}"
    casingColor: "{colors.canvas}"
    casingWidth: "{widths.casing}"
    opacity: "{opacities.subject}"

  technical-line-secondary:
    geometry: line
    family: technical-line
    role: secondary
    state: default
    layerRole: context
    strokeColor: "{colors.ink}"
    strokeWidth: "{widths.line-secondary}"
    opacity: "{opacities.context}"
    dash: "{dashes.reference}"

  technical-line-primary-selected:
    geometry: line
    family: technical-line
    role: primary
    state: selected
    layerRole: subject
    strokeColor: "{colors.accent}"
    strokeWidth: "{widths.line-primary}"
    casingColor: "{colors.selection}"
    casingWidth: "{widths.selection-casing}"

  water-area:
    geometry: polygon
    family: water
    role: context
    layerRole: context
    fillColor: "{colors.water}"
    fillOpacity: "{opacities.context}"

  place-label-primary:
    geometry: label
    family: place-label
    role: primary
    layerRole: annotation
    typography: "{typography.label-primary}"
    color: "{colors.ink}"
    haloColor: "{colors.canvas}"
    haloWidth: "{widths.label-halo}"
---

## Overview

一套印在温暖档案纸上的安静地图。石墨色文字和线条承担主要结构，浅冷水体与灰绿色上下文退后，砖红色只用于少量决定性焦点。整体应具有编辑感和公共性，而不是霓虹、玻璃、仪表盘或高饱和科技风格。

## Colors

{colors.canvas} 是所有地图的稳定画布；{colors.ink} 承载文字和核心结构；{colors.water} 只承担安静的自然背景；{colors.accent} 是稀缺强调色，不得成为普通类别色。选中状态使用 {colors.selection} 增加外层强调，不替换对象原有颜色。关键状态还必须通过 casing、线宽或符号形态提供颜色之外的视觉通道。

## Typography & Labels

标注使用紧凑的人文主义无衬线字体。主要标注使用 {typography.label-primary}，上下文标注使用 {typography.label-context}。低优先级标注应先隐藏，而不是缩小到不可读。Halo 只用于从复杂背景中分离文字，不作为装饰。

## Composition & Density

地图保持一条清晰的主要阅读路径。主体周围应保留足够安静区域，图例、标题和注记不得争夺地图中心。密度增加时优先减少上下文标注和细碎边界。

## Layering & Depth

画布和自然背景位于最底层，上下文网络位于主体下方，主体和关键标注位于其上，选中与交互强调只增加外层视觉通道。深度主要通过明度、线宽和 casing 建立，不使用厚重阴影。

## Geometry & Symbols

线条采用有限而明确的宽度关系。主要技术线具有浅色 casing，次要线降低宽度和透明度，并使用 {dashes.reference} 表示参考性表达。面填充保持安静，只有有意义的边界才加强。点符号使用能在紧凑尺寸下保持识别的简单轮廓。

## Scale & Generalization

概览（overview）阶段只保留整体结构；区域（regional）阶段增加主要联系；局部（local）阶段展示完整主体网络；细节（detail）阶段增加技术标注和次要节点。每次转换应逐步发生，不得同时引入大量低优先级信息。

## Map Elements

`technical-line-primary` 是该风格中最主要的技术线型，可由外部 data-profile 映射到道路、管线、线路或其他需要突出表达的线状数据。

`technical-line-secondary` 与主线属于同一 family，但通过较小线宽、较低透明度和参考性 dash 退后。

`technical-line-primary-selected` 保留主线原有颜色，并通过黄色 casing 增加选中状态。

`water-area` 只承担安静背景，不得比技术主体更饱和。

`place-label-primary` 使用主要标注字体和窄 halo，优先级高于上下文标注。

## Do's and Don'ts

- 应该保持温暖画布、克制墨色和稀缺砖红强调；不应该把砖红变成通用类别 palette。
- 应该用 family、role 和 state 管理相关样式；不应该为每个数据值创建独立且无关系的样式。
- 应该通过 casing 增加选中状态；不应该覆盖对象原有语义颜色。
- 应该先减少低优先级标注；不应该把所有文字等比例缩小。
- 应该让上下文退后；不应该给所有边界、线和标签相同视觉重量。
- 应该让关键状态同时具有颜色和结构差异；不应该只依赖红、黄、绿区分风险。
```

---

## 19. 最终原则

`CARTOGRAPHY.md` 保存一套可迁移的制图视觉身份。基础 Token 提供精确值，`elements` 将这些值组合为具有代表性的地图要素样式，Markdown 正文解释设计意图和使用边界。具体数据、字段、图层和渲染器实现始终位于本格式之外。

---

## 附录 A：Front matter JSON Schema（资料性）

本附录提供 YAML 1.2 front matter 解析后数据结构的 JSON Schema Draft 2020-12 表达。它是资料性实现辅助，不替代规范正文；若 Schema 与正文冲突，以正文为准。

该 Schema 可以验证根字段、基础类型、`OmittedSection`、标准 Token 组、`Typography`、`DashPattern` 和 `MapElement` 的大部分结构约束，但不能单独验证：

- YAML 重复键、anchor、alias、tag、BOM、引号、任意自定义嵌套对象的非空 key，以及受限标量解析 profile 等表示层规则；
- CSS Color Level 4 字符串的完整合法性；
- `DashPattern` 的偶数成员和统一单位；
- Token 引用的断链、深度递归解析、循环、嵌套字段和最终类型；
- Markdown 章节、alias、顺序、重复及 `omitted` 冲突；
- 禁用属性的大小写与分隔符变体、项目数据绑定、目标渲染器配置和说明性正文质量。

机器可直接使用的同内容文件 SHOULD 随规范发布为 `schema/cartography-front-matter.schema.json`。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:cartography-md:schema:front-matter:0.3.0",
  "title": "CARTOGRAPHY.md front matter 0.3.0",
  "description": "Informative schema for the parsed YAML front matter. It does not validate YAML representation or the restricted scalar-resolution profile, Markdown sections, deep reference graphs, complete CSS Color Level 4 syntax, same-unit dash rules, normalized reserved-key variants, or data-binding semantics.",
  "type": "object",
  "required": [
    "version",
    "name"
  ],
  "propertyNames": {
    "$ref": "#/$defs/NonEmptyString"
  },
  "properties": {
    "version": {
      "const": "0.3.0"
    },
    "name": {
      "$ref": "#/$defs/LiteralNonEmptyString"
    },
    "description": {
      "$ref": "#/$defs/LiteralNonEmptyString"
    },
    "omitted": {
      "type": "array",
      "items": {
        "oneOf": [
          {
            "$ref": "#/$defs/LiteralNonEmptyString"
          },
          {
            "$ref": "#/$defs/OmittedSection"
          }
        ]
      }
    },
    "colors": {
      "$ref": "#/$defs/ColorGroup"
    },
    "typography": {
      "$ref": "#/$defs/TypographyGroup"
    },
    "widths": {
      "$ref": "#/$defs/AbsoluteDimensionGroup"
    },
    "sizes": {
      "$ref": "#/$defs/AbsoluteDimensionGroup"
    },
    "opacities": {
      "$ref": "#/$defs/OpacityGroup"
    },
    "spacing": {
      "$ref": "#/$defs/AbsoluteDimensionGroup"
    },
    "dashes": {
      "$ref": "#/$defs/DashGroup"
    },
    "elements": {
      "$ref": "#/$defs/ElementGroup"
    }
  },
  "additionalProperties": true,
  "$defs": {
    "NonEmptyString": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S",
      "$comment": "The prose definition uses the Unicode White_Space property; regex behavior may depend on the JSON Schema implementation."
    },
    "TokenIdentifier": {
      "type": "string",
      "pattern": "^[A-Za-z0-9_-]+$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "TokenReference": {
      "type": "string",
      "pattern": "^\\{[A-Za-z0-9_-]+(?:(?:\\.[A-Za-z0-9_-]+)|(?:\\[(?:0|[1-9][0-9]*)\\]))+\\}$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "LiteralNonEmptyString": {
      "allOf": [
        {
          "$ref": "#/$defs/NonEmptyString"
        },
        {
          "not": {
            "pattern": "^\\s*\\{[\\s\\S]*\\}\\s*$"
          }
        }
      ]
    },
    "Color": {
      "allOf": [
        {
          "$ref": "#/$defs/NonEmptyString"
        },
        {
          "not": {
            "pattern": "^\\s*\\{[\\s\\S]*\\}\\s*$"
          }
        }
      ],
      "$comment": "CSS Color Level 4 syntax requires semantic validation."
    },
    "Dimension": {
      "type": "string",
      "pattern": "^(?:-(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)|(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?)(?:px|pt|mm|cm|in|em)$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "AbsoluteDimension": {
      "type": "string",
      "pattern": "^(?:-(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)|(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?)(?:px|pt|mm|cm|in)$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "NonNegativeAbsoluteDimension": {
      "type": "string",
      "pattern": "^(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:px|pt|mm|cm|in)$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "PositiveAbsoluteDimension": {
      "type": "string",
      "pattern": "^(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)(?:px|pt|mm|cm|in)$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "PositiveDimension": {
      "type": "string",
      "pattern": "^(?:[1-9][0-9]*(?:\\.[0-9]+)?|0\\.[0-9]*[1-9][0-9]*)(?:px|pt|mm|cm|in|em)$",
      "not": {
        "pattern": "[\\r\\n\\u2028\\u2029]"
      },
      "$comment": "The additional not-pattern closes the end-before-final-line-terminator behavior of ECMAScript-style $ anchors."
    },
    "Opacity": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "Typography": {
      "type": "object",
      "required": [
        "fontFamily",
        "fontSize"
      ],
      "properties": {
        "fontFamily": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "type": "array",
              "minItems": 1,
              "items": {
                "$ref": "#/$defs/LiteralNonEmptyString"
              }
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fontSize": {
          "oneOf": [
            {
              "$ref": "#/$defs/PositiveAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fontWeight": {
          "oneOf": [
            {
              "type": "number",
              "minimum": 1,
              "maximum": 1000
            },
            {
              "enum": [
                "normal",
                "bold"
              ]
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "lineHeight": {
          "oneOf": [
            {
              "type": "number",
              "exclusiveMinimum": 0
            },
            {
              "$ref": "#/$defs/PositiveDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "letterSpacing": {
          "oneOf": [
            {
              "$ref": "#/$defs/Dimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fontStyle": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "textTransform": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fontFeature": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fontVariation": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        }
      },
      "additionalProperties": true,
      "propertyNames": {
        "$ref": "#/$defs/NonEmptyString"
      }
    },
    "DashPattern": {
      "type": "array",
      "minItems": 2,
      "items": {
        "oneOf": [
          {
            "$ref": "#/$defs/PositiveAbsoluteDimension"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      },
      "$comment": "Semantic validation must resolve member references, require an even item count, and require one common final unit."
    },
    "PatternSpec": {
      "oneOf": [
        {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        {
          "type": "array",
          "minItems": 1
        },
        {
          "type": "object",
          "minProperties": 1,
          "propertyNames": {
            "$ref": "#/$defs/NonEmptyString"
          }
        }
      ]
    },
    "OmittedSection": {
      "type": "object",
      "required": [
        "section"
      ],
      "properties": {
        "section": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        "reason": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "ColorGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "oneOf": [
          {
            "$ref": "#/$defs/Color"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      }
    },
    "TypographyGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "oneOf": [
          {
            "$ref": "#/$defs/Typography"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      }
    },
    "AbsoluteDimensionGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "oneOf": [
          {
            "$ref": "#/$defs/NonNegativeAbsoluteDimension"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      }
    },
    "OpacityGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "oneOf": [
          {
            "$ref": "#/$defs/Opacity"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      }
    },
    "DashGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "oneOf": [
          {
            "$ref": "#/$defs/DashPattern"
          },
          {
            "$ref": "#/$defs/TokenReference"
          }
        ]
      }
    },
    "MapElement": {
      "type": "object",
      "required": [
        "geometry"
      ],
      "properties": {
        "geometry": {
          "enum": [
            "background",
            "point",
            "line",
            "polygon",
            "label",
            "raster",
            "mixed"
          ]
        },
        "family": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        "role": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        "state": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        "layerRole": {
          "$ref": "#/$defs/LiteralNonEmptyString"
        },
        "color": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fillColor": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "strokeColor": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "outlineColor": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "casingColor": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "haloColor": {
          "oneOf": [
            {
              "$ref": "#/$defs/Color"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "strokeWidth": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "outlineWidth": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "casingWidth": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "haloWidth": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "size": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "opacity": {
          "oneOf": [
            {
              "$ref": "#/$defs/Opacity"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "fillOpacity": {
          "oneOf": [
            {
              "$ref": "#/$defs/Opacity"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "strokeOpacity": {
          "oneOf": [
            {
              "$ref": "#/$defs/Opacity"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "typography": {
          "oneOf": [
            {
              "$ref": "#/$defs/Typography"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "symbol": {
          "oneOf": [
            {
              "$ref": "#/$defs/LiteralNonEmptyString"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "pattern": {
          "oneOf": [
            {
              "$ref": "#/$defs/PatternSpec"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "dash": {
          "oneOf": [
            {
              "$ref": "#/$defs/DashPattern"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "offset": {
          "oneOf": [
            {
              "$ref": "#/$defs/AbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "spacing": {
          "oneOf": [
            {
              "$ref": "#/$defs/NonNegativeAbsoluteDimension"
            },
            {
              "$ref": "#/$defs/TokenReference"
            }
          ]
        },
        "source": false,
        "sourceLayer": false,
        "source-layer": false,
        "layerId": false,
        "field": false,
        "property": false,
        "filter": false,
        "valueMapping": false,
        "paint": false,
        "layout": false,
        "minzoom": false,
        "maxzoom": false,
        "outputPath": false
      },
      "allOf": [
        {
          "anyOf": [
            {
              "required": [
                "color"
              ]
            },
            {
              "required": [
                "fillColor"
              ]
            },
            {
              "required": [
                "strokeColor"
              ]
            },
            {
              "required": [
                "outlineColor"
              ]
            },
            {
              "required": [
                "casingColor"
              ]
            },
            {
              "required": [
                "haloColor"
              ]
            },
            {
              "required": [
                "strokeWidth"
              ]
            },
            {
              "required": [
                "outlineWidth"
              ]
            },
            {
              "required": [
                "casingWidth"
              ]
            },
            {
              "required": [
                "haloWidth"
              ]
            },
            {
              "required": [
                "size"
              ]
            },
            {
              "required": [
                "opacity"
              ]
            },
            {
              "required": [
                "fillOpacity"
              ]
            },
            {
              "required": [
                "strokeOpacity"
              ]
            },
            {
              "required": [
                "typography"
              ]
            },
            {
              "required": [
                "symbol"
              ]
            },
            {
              "required": [
                "pattern"
              ]
            },
            {
              "required": [
                "dash"
              ]
            },
            {
              "required": [
                "offset"
              ]
            },
            {
              "required": [
                "spacing"
              ]
            }
          ]
        }
      ],
      "additionalProperties": true,
      "propertyNames": {
        "$ref": "#/$defs/NonEmptyString"
      }
    },
    "ElementGroup": {
      "type": "object",
      "propertyNames": {
        "$ref": "#/$defs/TokenIdentifier"
      },
      "additionalProperties": {
        "$ref": "#/$defs/MapElement"
      }
    }
  }
}
```

---

## 附录 B：最低符合性测试集（资料性）

规范实现 SHOULD 至少覆盖以下测试：

| 编号 | 场景 | 期望结果 |
|---|---|---|
| V01 | 最小合法文件 | 通过 |
| V02 | 标准 Token 组使用合法别名引用 | 通过 |
| V03 | 合法 `DashPattern` | 通过 |
| V04 | 中文或含点号的 Token 名 | 拒绝 |
| V05 | YAML Token 引用未加引号 | 拒绝 |
| V06 | 十六进制颜色未加引号 | 拒绝 |
| V07 | `OmittedSection` 缺少 `section` 或含未知字段 | 拒绝 |
| V08 | `omitted` 使用不同 alias 重复同一章节 | 拒绝 |
| V09 | 正文与 `omitted` 同时声明同一章节 | 拒绝 |
| V10 | `MapElement` 只有 `geometry`、`family`、`role` | 拒绝 |
| V11 | `DashPattern` 为奇数长度、含零值或混合单位 | 拒绝 |
| V12 | 断链引用或循环引用 | 拒绝 |
| V13 | 标准章节仅大小写、空白或全半角不同 | 按同一章节匹配 |
| V14 | 重复标准章节使用不同 alias | 拒绝 |
| V15 | 标准章节顺序不正确 | 通过并警告 |
| V16 | 确认存在项目数据绑定或 `paint`、`filter` 等目标属性 | 拒绝 |
| V17 | 未知根组或未知 `MapElement` 属性 | 保留；按规则提示 |
| V18 | Markdown 代码区和反斜杠转义中的引用字面量 | 不解析为引用 |
| V19 | mapping key 被 YAML 解析为 number、boolean 或 null | 拒绝 |
| V20 | 在不允许引用的标准字段中使用完整引用语法 | 拒绝 |
| V21 | 使用 `currentColor`、系统颜色或外部 `var()` | 拒绝 |
| V22 | 引用路径试图穿过一个中间 `TokenReference` | 拒绝 |
| V23 | blockquote、列表、HTML、代码区或 Setext 中出现章节名 | 不识别为标准章节 |
| V24 | 数字开头的 Token 名（如 `2xl`）及 `.0` mapping 路径段 | 通过 |
| V25 | 任意位置使用 `-0px` 或 `-0.0mm` | 拒绝 |
| V26 | 未加引号的日期形态普通标量 | 按 string 处理，不隐式转换为日期对象 |
| V27 | 引用复合值的后代再次引用祖先，形成深层循环 | 拒绝 |
| V28 | `SourceLayer`、`source_layer` 等禁用属性拼写变体 | 拒绝 |
| V29 | `OmittedSection` 缺少 `section`，或可选 `reason` 仅含空白 | 拒绝 |
| V30 | 任意核心 Dimension 使用 `rem` | 拒绝 |
| V31 | `geometry: Line`、`fontWeight: Bold` 等大小写错误的核心枚举或关键字 | 拒绝 |
| V32 | Token 引用可解析，但最终值不满足使用位置类型 | 拒绝 |
| V33 | 引用以元数据为根、只引用根组，或数组索引含前导零 | 拒绝 |
| V34 | YAML 重复键、anchor、alias 或显式 tag | 拒绝 |
| V35 | 必填非空字符串仅含 Unicode 空白 | 拒绝 |
| V36 | `Typography.fontSize` 等明确允许引用的核心字段使用引用，且最终类型正确 | 通过 |
| V37 | `pattern` 使用空字符串、空数组或空对象 | 拒绝 |
| V38 | CSS 颜色通过嵌套 `var()` 依赖外部变量 | 拒绝 |
| V39 | `MapElement` 只有未知扩展样式属性，没有核心样式属性 | 拒绝 |
| V40 | 合法引用自定义组中的数组成员，或使用加引号的 `true`、`null` 等 Token key | 通过 |
| V41 | 任意 mapping 使用空字符串或仅含 Unicode 空白的 key | 拒绝 |
| V42 | 将完整 `TokenReference` 用作 mapping key | 拒绝 |
| V43 | Token 标识符、引用或 Dimension 通过尾随换行绕过完整匹配 | 拒绝 |

Schema、解析器和 CLI SHOULD 共享同一组 fixtures，以避免不同语言实现产生行为漂移。

---

## 附录 C：引用标准（资料性）

本规范使用以下外部标准术语。实现者应以相应标准的正式定义为准：

| 标准 | 本规范中的用途 |
|---|---|
| YAML 1.2 Core Schema | Front matter 基础语法与标量解析基线；本规范另行禁用隐式 timestamp |
| CommonMark | Markdown 块级、行内、代码、HTML、链接和反斜杠转义识别基线 |
| Unicode Normalization 与 Default Case Folding | `toNFKC_Casefold` 章节匹配 |
| CSS Color Module Level 4 | `Color` 合法值语法 |
| CSS Values and Units | 绝对长度单位比例与参考像素语义 |
| Web Content Accessibility Guidelines 2.2 | 文字和关键非文字内容的对比度参考目标 |
| JSON Schema Draft 2020-12 | 附录 A 的资料性 front matter Schema |

