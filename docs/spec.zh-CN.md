# CARTOGRAPHY.md 格式规范

**状态：** 草案 0.1.0  
**仓库：** `mapseekai/cartography.md`  
**主要目标：** MapLibre Style Specification v8  
**规范文件名：** `CARTOGRAPHY.md`

> **本文件为非规范性中文翻译。** 如与英文原文 [spec.md](spec.md) 冲突，以英文版为准。

CARTOGRAPHY.md 是一种格式，用于向编码 Agent 和地图样式工具描述持久的制图设计契约。它结合机器可读的 YAML 与人类可读的 Markdown，使 Agent 能够理解应使用的精确值及其背后的制图原因。

除非某个章节明确标为信息性内容，否则本文档具有规范性。

## 1. 目的

MapLibre `style.json` 会告诉渲染器如何绘制地图。但它本身不会说明：

- 地图的目的；
- 目标受众和决策任务；
- 哪些数据字段承载语义含义；
- 哪些要素应突出或弱化；
- 表示方式如何随 zoom 级别变化；
- 哪些视觉通道拥有何种含义；
- 哪些颜色保留给警告、选择或不确定性；
- 应如何处理无障碍、隐私和数据质量；
- Agent 应如何保留人工创作的成果；
- 除样式语法外，应如何验证结果。

CARTOGRAPHY.md 填补了这一缺口。它是一份上游设计契约，Agent 可据此生成、修改、审查或解释 MapLibre 样式。

CARTOGRAPHY.md 不是：

- MapLibre Style Specification 的替代品；
- 数据 schema 或矢量瓦片 schema；
- 完整的渲染引擎；
- 无需渲染审查即可保证地图美学成功的保证；
- 嵌入密钥、访问 token 或敏感要素数据的场所。

## 2. 规范性语言

关键词 **MUST**、**MUST NOT**、**REQUIRED**、**SHOULD**、**SHOULD NOT** 和 **MAY** 应解释为规范性要求级别。

## 3. 设计目标

该格式围绕以下特性设计：

1. **Agent 可读性。** 重要决策在会话之间保持明确和稳定。
2. **人类可读性。** 制图师无需专用工具即可审查同一文件。
3. **确定性。** 等效输入产生等效的解析模型和发现结果。
4. **语义正确性。** 样式决策始终关联真实的数据字段和领域。
5. **渲染器可移植性。** 明确声明渲染器特定行为，而非假设其存在。
6. **最小差异。** Agent 可以变更一项决策，而无需重写无关的样式图层。
7. **可追溯性。** 生成的样式图层会记录产生它们的契约规则和 token。
8. **渐进式验证。** 语法、语义、样式一致性和渲染证据分别检查。

## 4. 文件名与发现

规范文件名为 `CARTOGRAPHY.md`。

工具 SHOULD 按以下顺序发现它：

1. 调用方显式提供的路径；
2. 当前工作目录中的 `CARTOGRAPHY.md`；
3. 包含 `CARTOGRAPHY.md` 的最近祖先目录；
4. 项目特定的配置路径。

仓库 MAY 包含多个契约。除非工具定义更具体的作用域，否则契约适用于包含它的目录及其后代目录。

为实现可复现性，文件名匹配 SHOULD 在所有平台上区分大小写。

## 5. 文档结构

文档具有两个层级：

1. 文件开头由 `---` 分隔的 **YAML front matter**；
2. 在规范 `##` 章节中包含原理说明的 **Markdown 正文**。

```md
---
version: 0.1.0
name: Example operational map
target:
  renderer: maplibre
  styleSpecVersion: 8
# ...
---

# Example operational map

## Overview

The map supports operators locating abnormal assets without losing local context.
```

YAML 值具有规范性。Markdown 散文解释意图并消除歧义。它们冲突时，适用第 28 节的优先级规则。

## 6. 确定性 YAML 配置

### 6.1 支持的值

front matter MAY 使用：

- 键为字符串的映射；
- 序列；
- 字符串；
- 有限数字；
- 布尔值；
- `null`；
- 保持明确性的带引号或不带引号普通标量。

### 6.2 禁止的构造

front matter MUST NOT 使用：

- 锚点或别名；
- 自定义标签；
- 合并键；
- 非有限数字；
- 可执行值；
- 隐式环境变量展开；
- 重复的映射键。

禁止这些功能，是因为不同的 YAML 运行时和 Agent 可能会以不同方式解释它们。复用 SHOULD 通过 token 引用表达。

### 6.3 日期与歧义标量

日期、时间戳、带前导零的值，以及可能被解释为布尔值的词 SHOULD 加引号。

```yaml
version: "0.1.0"
generatedAt: "2026-08-28T09:00:00Z"
code: "0012"
```

## 7. Token 引用

形如 `{path.to.value}` 的精确字符串是 token 引用。

```yaml
scales:
  pipeline-status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.semantic.normal}"
      fault: "{tokens.colors.semantic.danger}"
```

规则：

1. 引用 MUST 从 YAML 根节点解析。
2. 引用路径使用点分隔的映射键。
3. 引用循环是错误。
4. 数组索引 MAY 写作 `[n]`，并由参考实现规范化为路径段。当同一值可以具有语义名称时，应优先使用对象 token。
5. 版本 0.1.0 仅允许引用占据整个字符串。诸如 `1px solid {tokens.colors.border}` 的嵌入式引用是错误。
6. 未知引用 MUST NOT 静默 fallback 到任意值。
7. MapLibre 样式不会直接解释 CARTOGRAPHY.md 引用。生成器 MUST 将引用编译为具体样式值，并 SHOULD 在图层元数据中记录源引用。

## 8. 根 schema

front matter 具有以下根形状：

```yaml
version: <string>
name: <string>
description: <string?>
target: <Target>
intent: <Intent>
data: <DataContract>
agent: <object?>
zoom: <ZoomModel>
hierarchy: <object?>
tokens: <TokenSet>
scales: <map<string, Scale>>
encodings: <map<string, Encoding>>
layerOrder: <LayerOrderItem[]>
labels: <object?>
states: <object?>
accessibility: <Accessibility?>
security: <object?>
performance: <object?>
maplibre: <MapLibreContract?>
validation: <ValidationContract?>
outputs: <object?>
extensions: <object?>
omitted: <OmittedSection[]?>
```

解析器 MAY 保留未知根键。仅当未知键看起来像规范键的拼写错误时，一致性验证器 SHOULD 报告它们。扩展键 SHOULD 使用命名空间前缀，例如 `acme:`。

## 9. 核心元数据

### 9.1 `version`

`version` 为 REQUIRED，用于标识文档采用的 CARTOGRAPHY.md 格式版本。

```yaml
version: "0.1.0"
```

该值不标识 MapLibre Style Specification 版本；后者属于 `target.styleSpecVersion`。

### 9.2 `name`

`name` 为 REQUIRED，提供人类可读的地图或样式系统名称。

### 9.3 `description`

`description` 为 OPTIONAL，SHOULD 是适合目录或 Agent prompt 的一句简洁描述。

## 10. 目标

`target` 声明渲染器和可移植性预期。

```yaml
target:
  renderer: maplibre
  styleSpecVersion: 8
  platforms: [web, android, ios]
  modes: [light, dark, imagery]
  projection: mercator
  compatibility: portable
```

### 10.1 字段

| 字段 | 必填 | 含义 |
|---|---:|---|
| `renderer` | 是 | 主要渲染系列。版本 0.1.0 专为 `maplibre` 设计。 |
| `styleSpecVersion` | 是 | 目标样式规范。MapLibre 样式当前使用版本 `8`。 |
| `platforms` | 否 | 运行时目标，例如 `web`、`android` 和 `ios`。 |
| `modes` | 否 | 支持的呈现模式，常见为 `light`、`dark` 和 `imagery`。 |
| `projection` | 否 | 预期地图投影或投影系列。 |
| `compatibility` | 否 | `strict`、`portable` 或 `renderer-specific`。 |

### 10.2 兼容性行为

- `strict` 表示生成器 SHOULD 仅使用所有声明平台明确允许的功能。
- `portable` 表示仅可在具有文档化 fallback 时使用渲染器特定功能。
- `renderer-specific` 允许目标特定属性，但 MUST 在散文或扩展元数据中标识它们。

验证器 MAY 在未来版本中使用平台能力表。版本 0.1.0 验证该声明，但不声称完整的跨 SDK 对等性。

## 11. 意图

`intent` 在描述地图外观之前定义地图为何存在。

```yaml
intent:
  mapType: operational
  primaryTask: locate and assess abnormal gas-network assets
  audience: [dispatcher, network-manager]
  subject: gas distribution network
  context: [roads, buildings, administrative areas]
  aesthetic:
    keywords: [technical, calm, precise]
    avoid: [neon, decorative, excessive-saturation]
    contrast: medium
    saturation: low
    density: standard
  successCriteria:
    - abnormal assets are recognizable within two seconds
    - selected objects remain distinguishable from faults
```

### 11.1 地图类型

`mapType` MUST 为以下之一：

- `reference` — 均衡的定向与查找；
- `thematic` — 某个主题或统计主题主导上下文；
- `operational` — 状态、告警和可操作资产主导；
- `navigation` — 路线、位置和转向信息主导；
- `editing` — 可编辑几何、错误、捕捉和选择主导；
- `imagery` — 影像是主要视觉场；
- `hybrid` — 两个已声明目的共享优先级。

混合地图 SHOULD 解释在冲突时哪个目的优先。

### 11.2 主要任务

`primaryTask` 为 REQUIRED。它 SHOULD 描述可观察的用户任务，而不是诸如“显示数据”的模糊目标。

### 11.3 受众

`audience` MUST 至少包含一个角色。受众会影响密度、术语、标注细节和交互状态。

### 11.4 美学方向

美学关键词是约束，而不是装饰。Agent SHOULD 将其转化为可度量的选择，例如饱和度、对比度、线宽范围、标注密度和背景突出程度。

## 12. 数据契约

`data` 将制图语义绑定到真实属性。

```yaml
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    id: asset_id
    label: name
    category: asset_type
    importance: pressure_level
    magnitude: diameter_mm
    status: operating_status
    uncertainty: position_accuracy
    time: updated_at
    quality: qc_status
  fallbackLabels: [name, asset_code]
  nullPolicy: neutral-and-visible
  unknownCategoryPolicy: neutral-fallback-and-warning
  zeroIsNotNull: true
  preserveUnits: true
  sensitiveDataPolicy: aggregate-or-omit
```

### 12.1 语义绑定

绑定为 Agent 创建稳定的词汇。常见角色包括：

| 角色 | 典型用途 |
|---|---|
| `id` | 稳定的要素标识和 feature-state |
| `label` | 主要文本标注 |
| `category` | 名义类别或资产类型 |
| `importance` | 层级、优先级或网络级别 |
| `magnitude` | 定量尺寸或强度 |
| `status` | 运行或生命周期状态 |
| `uncertainty` | 位置、时间或分类置信度 |
| `time` | 新近度和时间筛选 |
| `quality` | 质量控制或验证状态 |

项目 MAY 添加角色。映射为 `null` 的角色是有意不可用的，Agent MUST NOT 猜测它。

### 12.2 空值、未知与零

生成器 MUST 区分：

- 缺失/null；
- 显式的未知类别；
- 数字零；
- 空文本；
- 超出声明域的值。

当 `zeroIsNotNull` 为 true 时，零 MUST 保留其定量含义。未知类别 SHOULD 获得中性 fallback 和验证发现结果，而非被分配随机调色板颜色。

### 12.3 单位

当 `preserveUnits` 为 true 时，生成器 MUST NOT 在未记录转换的情况下静默重新解释或归一化数值。

### 12.4 敏感数据

契约 MAY 声明隐私和安全约束。它 MUST NOT 包含凭证或原始敏感要素值。样式 MUST NOT 通过隐藏图层、标注、元数据、过滤器或客户端表达式暴露受限类别。

## 13. DATA_PROFILE.json

可选的配套数据画像使语义验证成为可能，而无需嵌入数据本身。

```json
{
  "version": "0.1.0",
  "name": "Urban gas network sample",
  "generatedAt": "2026-08-28T09:00:00Z",
  "sources": {
    "gas-network": {
      "type": "geojson",
      "sourceLayers": {
        "default": {
          "geometry": "line",
          "idField": "asset_id",
          "minzoom": 10,
          "maxzoom": 24,
          "density": "dense",
          "fields": {
            "asset_id": {"type": "string", "nullable": false},
            "operating_status": {
              "type": "string",
              "categories": ["active", "maintenance", "fault", "unknown"]
            }
          }
        }
      }
    }
  }
}
```

### 13.1 根字段

| 字段 | 必填 | 含义 |
|---|---:|---|
| `version` | 是 | 数据画像格式版本。 |
| `name` | 否 | 人类可读的画像名称。 |
| `generatedAt` | 否 | 带引号的时间戳。 |
| `sources` | 是 | 源标识符映射。 |

### 13.2 源

一个源声明：

- `type`：`vector`、`geojson`、`raster`、`raster-dem` 或 `other`；
- `sourceLayers`：源图层标识符到画像的映射。

GeoJSON 源 SHOULD 使用合成源图层键 `default`。

### 13.3 源图层画像

图层画像声明：

- `geometry`：`point`、`line`、`polygon`、`mixed` 或 `raster`；
- 可选的 `minzoom` 和 `maxzoom` 可用性；
- 可选的稳定 `idField`；
- 可选的 `featureCount` 和密度类别；
- 一个 `fields` 映射。

### 13.4 字段画像

字段画像包含：

```json
{
  "type": "number",
  "nullable": true,
  "unit": "mm",
  "minimum": 0,
  "maximum": 1400,
  "description": "Nominal pipe diameter"
}
```

名义字段 SHOULD 声明 `categories`。定量字段 SHOULD 在已知时声明单位和观测边界。

画像描述已观测和预期的数据；它不能替代源授权或服务端验证。

## 14. 缩放模型

`zoom` 定义信息如何被引入和制图综合。

```yaml
zoom:
  strategy: progressive-disclosure
  bands:
    regional: [4, 8]
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
  referenceZooms: [8, 12, 15, 18]
  visibility:
    pipelines:
      regional: hidden
      city: primary-only
      street: all-operational
      site: all-with-labels
  generalization:
    geometry: upstream
    labels: runtime-collision
```

### 14.1 区间

每个区间均为 `[minzoom, maxzoom]`，其中 `minzoom < maxzoom`。zoom 区间不得重叠。相邻区间可以共享边界，因为在 MapLibre 图层中，按惯例 `maxzoom` 为排他值。

区间名称由项目定义。常见区间包括 `global`、`regional`、`city`、`street` 和 `site`。

### 14.2 参考 zoom

参考 zoom 是应当进行自动化截图和人工审查的缩放级别。

### 14.3 渐进式披露

一个要素族可以按如下表示形式逐步呈现：

`hidden → aggregate → simplified → complete geometry → geometry + label → editing detail`

生成器应避免在同一 zoom 阈值引入大量互不相关的图层。

### 14.4 制图综合边界

样式可以控制可见性、宽度、不透明度、过滤、聚类和标注。真正的几何简化、位移、聚合和保持拓扑的制图综合应在数据或切片生产管线中进行。样式不得声称已经解决几何制图综合，若其仅隐藏了要素。

## 15. 视觉层级

`hierarchy` 描述相对显著性。其内部键可扩展，但项目应定义一套小型有序系统。

```yaml
hierarchy:
  levels:
    background: 10
    context: 30
    primary: 60
    focus: 80
    critical: 100
  principles:
    - establish hierarchy with lightness and size before saturated hue
    - preserve one dominant visual focus per map state
    - ordinary status must not look like an alarm
```

视觉层级应无需仅依赖颜色名称即可理解。尺寸、线宽、对比度、字母大小写、不透明度和标注优先级均是有效的层级机制。

## 16. Token

`tokens` 存储精确的可复用值。仅版本 0.1.0 要求 `tokens.colors`；强烈建议提供额外的系列。

```yaml
tokens:
  colors:
    light:
      canvas: "#F5F7FA"
      contextLine: "#C7CED8"
      text: "#27313D"
    semantic:
      normal: "#2F7D5B"
      maintenance: "#D18B19"
      danger: "#C63D45"
      unknown: "#8A94A3"
      selection: "#2F6FED"
  typography:
    label:
      fontStack: [Noto Sans Regular, Arial Unicode MS Regular]
      size: 12
      haloWidth: 1.5
  lineWidth:
    thin: 1
    regular: 2
    strong: 4
  opacity:
    context: 0.55
    subject: 0.95
```

### 16.1 颜色语法

颜色值必须被 MapLibre 样式颜色解析器接受。可以使用目标样式包支持的十六进制和函数式 CSS 风格颜色。项目应优先采用一致的表示法。

### 16.2 语义颜色

强语义颜色应当稀少。危险、警告、选中和编辑颜色必须具有不同含义。当保留底层业务状态很重要时，选中应采用附加轮廓、描边、光晕或尺寸变化。

### 16.3 模式

浅色、深色和影像模式应分别设计。不得通过盲目反转每种浅色模式颜色来生成深色模式。影像覆盖层通常需要更强的描边、光晕或局部背景衬底。

### 16.4 Token 命名

Token 键应描述角色而非外观。当该值为语义决策时，应优先使用 `semantic.danger` 而非 `red500`。原始调色板比例尺可以与语义别名共存。

## 17. 比例尺

比例尺将字段或值域映射到视觉范围。

```yaml
scales:
  pipeline-status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.semantic.normal}"
      maintenance: "{tokens.colors.semantic.maintenance}"
      fault: "{tokens.colors.semantic.danger}"
      unknown: "{tokens.colors.semantic.unknown}"
    fallback: "{tokens.colors.semantic.unknown}"
  pressure-width:
    type: ordinal
    field: pressure_level
    values:
      low: "{tokens.lineWidth.thin}"
      medium: "{tokens.lineWidth.regular}"
      high: "{tokens.lineWidth.strong}"
  diameter-size:
    type: quantitative
    field: diameter_mm
    stops:
      - [50, 1]
      - [300, 2]
      - [1000, 5]
    clamp: true
    unit: mm
```

### 17.1 类型

- `nominal`：无序类别；
- `ordinal`：有序类别；
- `quantitative`：连续或分级数值；
- `diverging`：围绕有意义中心点的数值；
- `identity`：已匹配输出域的值。

### 17.2 域覆盖

名义比例尺应覆盖 DATA_PROFILE.json 报告的所有类别，且在值可能未知时必须定义 fallback。生成器不得基于不稳定的类别迭代顺序分配颜色。

### 17.3 分类

定量分类断点应根据已声明的领域知识或可复现的数据画像方法导出。Agent 在无法访问分布时不得虚构“自然断点”，然后将其表述为数据驱动的结果。

## 18. 编码

`encodings` 描述要素族和视觉通道的所有权。

```yaml
encodings:
  pipelines:
    source: gas-network
    geometry: line
    role: primary
    layerGroup: subject-line
    minzoom: 10
    maxzoom: 24
    rules:
      - id: pipeline-status-color
        field: operating_status
        channel: line-color
        scale: pipeline-status
        critical: true
        secondaryChannel: line-pattern
      - id: pressure-level-width
        field: pressure_level
        channel: line-width
        scale: pressure-width
    labels:
      field: name
      fallbacks: [asset_code]
      minzoom: 16
      priority: 60
      allowOverlap: false
    states:
      selected:
        channel: casing
        token: "{tokens.colors.semantic.selection}"
```

### 18.1 编码字段

| 字段 | 必填 | 含义 |
|---|---:|---|
| `source` | 是 | MapLibre 源标识符。 |
| `sourceLayer` | 仅矢量 | 矢量切片源图层。 |
| `geometry` | 是 | `point`、`line`、`polygon`、`raster`、`model` 或 `mixed`。 |
| `role` | 是 | `background`、`context`、`primary`、`focus` 或 `critical`。 |
| `layerGroup` | 是 | 来自 `layerOrder` 的标识符。 |
| `minzoom`, `maxzoom` | 否 | 可见范围。 |
| `filter` | 否 | 可选数据子集。 |
| `rules` | 是 | 视觉通道分配。 |
| `labels` | 否 | 标注源和优先级。 |
| `states` | 否 | 悬停、选中、警告、编辑或验证状态。 |

### 18.2 编码规则

一条规则必须定义：

- 其编码内唯一的 `id`；
- 一个 `channel`；
- `scale` 或 `value` 之一。

其可以定义：

- `field`；
- `composite`；
- `critical`；
- `secondaryChannel`；
- `priority`。

### 18.3 通道所有权

在一个编码内，一个视觉通道应有一个主要语义所有者。只有在后续规则声明 `composite: true` 且以文字说明该组合时，两条规则才可以共享同一通道。

推荐的网络地图词汇如下：

- 宽度 → 网络重要性或压力等级；
- 色相 → 运行状态；
- 虚线／图案 → 生命周期或不确定性；
- 不透明度 → 置信度或时效性；
- 描边／光晕 → 选中；
- 符号形状 → 资产类别；
- 标注优先级 → 运营重要性。

### 18.4 关键语义

当 `accessibility.requireSecondaryChannelForCriticalSemantics` 为 true 时，标记为 `critical: true` 的规则必须定义 `secondaryChannel`。关键状态不得仅通过颜色传达。

### 18.5 数据验证

使用数据画像时，验证器应验证：

- 源是否存在；
- 源图层是否存在；
- 几何兼容性；
- 字段是否存在；
- 类别域覆盖；
- 源 zoom 可用性；
- 用于 feature-state 的稳定标识符。

## 19. 图层顺序

`layerOrder` 是从底到顶的规范图层组堆叠。

```yaml
layerOrder:
  - id: background
    order: 0
  - id: context-fill
    order: 10
  - id: context-line
    order: 20
  - id: subject-casing
    order: 50
  - id: subject-line
    order: 60
  - id: subject-point
    order: 70
  - id: subject-label
    order: 80
  - id: interaction
    order: 100
```

图层组标识符必须唯一。顺序值必须在文档顺序中严格递增。每个编码必须引用一个已声明的图层组。

生成的 `style.layers` 数组应按这些图层组单调排序。图层组内的图层可以使用项目特定优先级排序。

## 20. 标注

`labels` 可扩展。它应定义不由每个编码重复的全局标注行为。

```yaml
labels:
  language:
    primary: zh-Hans
    fallbacks: [name:zh, name, name:en]
  collision:
    defaultAllowOverlap: false
    preserveCriticalLabels: true
  typography:
    minimumSize: 11
    maximumSize: 18
    defaultHaloWidth: 1.5
  lineLabels:
    minimumScreenLengthPx: 80
    repeatDistancePx: 300
```

规则：

- 标注优先级必须遵循语义重要性，而非源顺序。
- 碰撞通常应通过隐藏较低优先级的标注解决。
- Agent 应在将文本缩小到声明的可读最小值之前降低标注密度。
- 中文标注不应自动转换为大写，也不应采用面向拉丁字母的字间距。
- 必须在每个声明的平台上审查字体和字形行为。
- 允许重叠的关键标注应当很少，并明确说明理由。

## 21. 交互状态

`states` 描述悬停、选中、编辑、警告、禁用和验证状态的全局行为。

```yaml
states:
  selected:
    strategy: additive-casing
    color: "{tokens.colors.semantic.selection}"
    preserveBusinessColor: true
  hover:
    strategy: width-and-opacity
  invalid:
    strategy: color-plus-pattern
```

当底层业务颜色具有意义时，选中应保留该颜色。悬停不应看起来像选中或警报。编辑控制柄和拓扑错误应使用专用符号或图案。

使用 feature-state 时：

- 源要素必须具有稳定标识符；
- 应记录 `promoteId` 或要素 `id` 的行为；
- 若 `maplibre.featureStatePaintOnly` 为 true，则 feature-state 不得出现在布局表达式中；
- 应测试状态清理和源刷新行为。

## 22. 无障碍

```yaml
accessibility:
  textContrast:
    normal: 4.5
    large: 3
  nonTextGraphicContrast: 3
  requireSecondaryChannelForCriticalSemantics: true
  contrastPairs:
    - id: primary-label-on-canvas
      foreground: "{tokens.colors.light.text}"
      background: "{tokens.colors.light.canvas}"
      minimum: 4.5
      kind: text
```

声明的对比度对是确定性的 token 检查。它们不能替代在影像、栅格数据、抗锯齿、不透明度、混合或可变几何上的实际渲染检查。

符合要求的工作流还应审查：

- 常见色觉缺陷；
- 灰度可区分性；
- 小屏幕可读性；
- 高密度标注碰撞；
- 不依赖颜色的关键符号；
- 适用时，周边 UI 的键盘和屏幕阅读器行为。

## 23. 安全与隐私

`security` 可扩展，并且可以描述：

- 受限图层；
- 最小聚合级别；
- 脱敏规则；
- 客户端／服务器端强制边界；
- 禁止的标注或元数据；
- 导出限制。

需要时，必须在数据和服务层级强制执行安全规则。隐藏 MapLibre 图层不是授权机制。不得仅因为敏感要素默认不可见，就将其交付给未获授权的客户端。

## 24. 性能

`performance` 可以定义如下预算：

```yaml
performance:
  maximumStyleLayers: 120
  maximumSymbolLayers: 30
  maximumExpressionDepth: 16
  preferSharedSources: true
  avoidUnboundedAllowOverlap: true
```

预算应被视为审查阈值，而非普遍真理。性能取决于切片密度、源数量、表达式复杂度、符号布局、设备能力、俯仰角、地形和运行时 SDK。

Agent 应优先考虑清晰度和正确性，而非过早的微优化，但当一个表达式可在不损害可维护性的情况下表达相同设计时，必须避免生成冗余图层。

## 25. MapLibre 契约

```yaml
maplibre:
  rootMetadataPrefix: "cartography"
  layerIdPattern: "^[a-z0-9]+(?:[._-][a-z0-9]+)*$"
  layerMetadata:
    required:
      - "cartography:group"
      - "cartography:role"
      - "cartography:owner"
      - "cartography:sourceRule"
    optional:
      - "cartography:tokenRefs"
      - "cartography:ruleIds"
  featureStatePaintOnly: true
  stableFeatureIdRequired: true
  runtimeOptions:
    localIdeographFontFamily: "Noto Sans CJK SC"
```

### 25.1 样式版本

为版本 0.1.0 生成的 MapLibre 样式必须使用样式版本 `8`，除非目标渲染器明确支持另一已声明版本。

### 25.2 源和源图层

- 每个非背景图层必须引用一个现有源。
- 使用矢量源的图层必须标识有效的 `source-layer`。
- GeoJSON 编码应省略 `sourceLayer`，并使用数据画像键 `default`。
- 提供数据画像时，源和源图层名称必须与之匹配。

### 25.3 图层元数据

MapLibre 元数据不影响渲染，用于溯源。

```json
{
  "metadata": {
    "cartography:group": "subject-line",
    "cartography:role": "primary",
    "cartography:owner": "agent",
    "cartography:sourceRule": "pipelines",
    "cartography:ruleIds": ["pipeline-status-color", "pressure-level-width"],
    "cartography:tokenRefs": [
      "{tokens.colors.semantic.normal}",
      "{tokens.lineWidth.regular}"
    ]
  }
}
```

生成器应保留未更改图层上的元数据。不得使用溯源元数据代替实际样式验证。

### 25.4 过滤器

生成的样式应优先使用表达式过滤器语法。生成器应避免在同一过滤器中混用旧式属性过滤器操作数和表达式操作数。

### 25.5 表达式

- 连续变化在插值有意义时应使用 `interpolate`。
- 离散类别或阈值变化应使用 `match` 或 `step`。
- 表达式应包含显式 fallback。
- 深度重复的表达式应在生成器层级进行提取，或予以记录。
- 生成器必须根据数据契约区分 `null`、未知和零。
### 25.6 协议可移植性

在 `portable` 或 `strict` 模式下，除非已声明的运行时适配器能够解析 `mapbox://` URL，否则它们均为错误。公共或自托管的字形、sprite、tile 和资源 URL SHOULD 明确声明。

## 26. 验证契约

```yaml
validation:
  checks:
    - document
    - token-references
    - data-profile
    - maplibre-style-spec
    - style-contract
    - accessibility
    - render-fixtures
  fixtures:
    - id: dense-urban
      required: true
    - id: sparse-suburban
      required: true
    - id: null-and-unknown
      required: true
    - id: light-mode
      required: true
    - id: dark-mode
      required: true
    - id: mobile
      required: true
    - id: desktop
      required: true
  report:
    format: json
    includeResolvedContract: true
```

### 26.1 验证层级

完整工作流包含五个层级：

1. **文档验证** — front matter、schema、章节、引用、顺序。
2. **数据验证** — source、源图层、字段、domain、单位、ID。
3. **样式验证** — 官方 MapLibre Style Specification 验证。
4. **契约验证** — 样式溯源、图层组、编码、语义、可移植性。
5. **渲染验证** — 截图、碰撞行为、密度、模式、状态及任务审查。

本仓库提供的 CLI 实现了确定性的第 1–4 层，并检查是否已声明渲染场景 fixture。它不声称能在版本 0.1.0 中自动评判截图。

### 26.2 推荐的渲染场景 fixture

至少，生产地图 SHOULD 包含以下渲染场景 fixture：

- 密集城市数据；
- 稀疏郊区或农村数据；
- null 和未知类别；
- 浅色模式；
- 已声明时的深色模式；
- 已声明时的影像模式；
- 移动端视口；
- 桌面端视口；
- 存在这些状态时的默认、悬停、选中、关键和无效状态；
- 文本和符号敏感时的 1× 和 2× 设备像素比。

### 26.3 任务审查

地图 SHOULD 分别就以下方面进行审查：

- 任务契合度；
- 视觉层级；
- 易读性；
- 一致性；
- 数据诚实性；
- 无障碍；
- 技术正确性。

单一的平均“美观评分”MUST NOT 允许数据诚实性或安全性失败通过。

## 27. 输出

`outputs` MAY 声明预期生成的工件。

```yaml
outputs:
  style: ./dist/style.json
  report: ./dist/cartography-report.json
  screenshots: ./dist/screenshots
```

除非明确请求，生成器 SHOULD 避免写入未声明的文件。报告 SHOULD 包含工具版本、契约版本、发现项以及检查过哪些配套工件。

## 28. Markdown 正文

### 28.1 规范章节顺序

Markdown 正文使用 `##` 标题。规范章节按顺序如下：

1. `Overview`
2. `Intent & Audience`
3. `Data Semantics`
4. `Visual Hierarchy`
5. `Color`
6. `Typography & Labels`
7. `Geometry & Symbols`
8. `Zoom & Generalization`
9. `Layer Order`
10. `Interaction States`
11. `Accessibility`
12. `MapLibre Implementation`
13. `Validation`
14. `Do's and Don'ts`

工具 MAY 识别 `概述`、`意图与受众`、`数据语义`、`视觉层级`、`色彩`、`字体与标注`、`几何与符号`、`缩放与制图综合`、`图层顺序`、`交互状态`、`无障碍`、`MapLibre 实现`、`验证` 和 `正反例` 等中文别名。

未知章节 MUST 被保留。重复的规范章节为错误。已存在的规范章节 SHOULD 保持顺序。

### 28.2 省略的章节

章节 MAY 被有意省略：

```yaml
omitted:
  - section: Interaction States
    reason: Static export only; no interactive states exist.
```

不得使用省略声明来掩盖相关的未解决决策。

### 28.3 文本质量

文本 SHOULD 说明：

- 决策为何存在；
- 哪些情况属于例外；
- 如何解决冲突；
- Agent 必须保留什么；
- 必须在渲染输出中验证什么。

文本 SHOULD NOT 仅重复 YAML 中已有的 token 值。

## 29. 优先级与冲突解决

当指令冲突时，消费者 MUST 按以下顺序应用：

1. 安全和隐私约束；
2. 为当前操作提供的明确人工指令；
3. 规范性 YAML 值；
4. Markdown 正文中的规范性声明；
5. DATA_PROFILE.json 事实；
6. 现有样式溯源和受保护的所有权；
7. 生成器默认值。

如果 YAML 与文本冲突，YAML 值优先，但验证器 SHOULD 在能够确定性检测时报告该不一致。

Agent MUST NOT 通过编造业务含义来静默解决高影响歧义。它 SHOULD 保留当前样式并报告该歧义。

## 30. Agent 行为

符合要求的 Agent SHOULD：

1. 在编辑样式图层前阅读完整契约；
2. 在需要时加载 DATA_PROFILE.json；
3. 识别主要任务和视觉焦点；
4. 将真实字段映射至已声明的语义；
5. 确定性地解析 token 引用；
6. 保留人工拥有或受保护的图层；
7. 做出最小且一致的样式变更；
8. 记录溯源元数据；
9. 运行 CLI 和官方 MapLibre 验证；
10. 检查已声明的渲染场景 fixture；
11. 报告未解决的数据、兼容性和美观风险。

符合要求的 Agent MUST NOT：

- 在需要画像时编造源图层或字段名称；
- 基于不稳定的迭代顺序分配名义颜色；
- 在被禁止时将零视为 null；
- 在需要辅助通道时，使用颜色作为关键语义的唯一信号；
- 在要求保留时用选中颜色覆盖业务状态颜色；
- 通过客户端样式暴露受限 feature；
- 声称语法验证能够证明美观质量。

## 31. 验证器模型

参考 API 返回：

```ts
interface LintReport {
  valid: boolean;
  strict: boolean;
  document: {
    name?: string;
    version?: string;
    path?: string;
  };
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
  findings: Finding[];
  cartography?: CartographyConfig;
  resolved?: unknown;
  sections: string[];
  artifacts: {
    dataProfileChecked: boolean;
    styleChecked: boolean;
    officialMapLibreValidation: boolean;
  };
}
```

一个发现项包含：

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

### 31.1 严重性

- `error`：确定性无效、不安全行为、破损的契约或缺失的必要证据；
- `warning`：可能存在的质量、可移植性、完整性或可维护性问题；
- `info`：非阻塞观察项。

当没有错误时，普通模式有效。只有既无错误也无警告时，严格模式才有效。

### 31.2 退出代码

| 代码 | 含义 |
|---:|---|
| `0` | 验证在所选严格级别下通过。 |
| `1` | 验证已完成，但发现项具有阻塞性。 |
| `2` | CLI 使用、文件访问、JSON 解析或内部执行失败。 |

## 32. 核心规则目录

参考实现包含以下确定性规则：

- front matter 存在性和 YAML 语法；
- 被禁止的别名和自定义标签；
- schema 一致性；
- 重复、缺失和顺序错误的 Markdown 章节；
- 断裂和循环的 token 引用；
- 有效的 MapLibre 颜色 token；
- zoom 区间的排序和重叠；
- 图层组的唯一性和顺序；
- 编码规则标识和通道所有权；
- 关键辅助通道；
- 已声明的对比度配对；
- 数据画像 schema；
- source、source-layer、geometry 和字段契约；
- 名义 domain 覆盖范围；
- 稳定的 feature 标识符；
- 官方 MapLibre Style Specification 验证；
- 图层溯源元数据和组顺序；
- 可移植的资源协议；
- 已弃用的 filter 语法；
- 已声明的渲染场景 fixture 覆盖范围。

项目 MAY 通过 TypeScript API 添加规则。自定义规则 SHOULD 具有确定性、无副作用且不依赖网络。

## 33. 一致性类别

工具 MAY 声明一个或多个类别：

- **解析器一致** — 解析确定性的 YAML profile 和 Markdown 章节。
- **文档验证器一致** — 验证 schema、引用和规范结构。
- **数据契约一致** — 验证 DATA_PROFILE.json 和编码语义。
- **MapLibre 契约一致** — 运行官方样式验证和契约检查。
- **渲染工作流一致** — 生成并审查所有必需的渲染场景 fixture。
- **Agent 一致** — 遵循本规范中的行为和优先级规则。

工具 MUST 声明它实现了哪些类别。

## 34. 扩展模型

未知 YAML 键和 Markdown 章节 SHOULD 被保留。扩展 SHOULD 使用命名空间键：

```yaml
acme:qualityGates:
  maximumUnknownStatusPercent: 0.5
```

扩展 MUST NOT 以不兼容的含义重新定义规范性键。验证器 MAY 对无法评估的扩展发出警告，但 MUST NOT 删除它。

## 35. 版本控制

该格式采用语义化版本控制。

- 补丁版本澄清措辞或增加向后兼容的验证。
- 次要版本增加可选字段、规则或一致性行为。
- 主要版本可能更改必需结构或语义。

消费者 SHOULD 拒绝不受支持的未来主要版本，或者仅在明确的尽力而为模式下继续。

## 36. 最小一致性示例

```md
---
version: "0.1.0"
name: Minimal operational network map
target:
  renderer: maplibre
  styleSpecVersion: 8
  platforms: [web]
  modes: [light]
  compatibility: portable
intent:
  mapType: operational
  primaryTask: locate abnormal network segments
  audience: [operator]
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    id: asset_id
    label: name
    status: operating_status
zoom:
  bands:
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
tokens:
  colors:
    canvas: "#F5F7FA"
    active: "#2F7D5B"
    fault: "#C63D45"
    unknown: "#8A94A3"
scales:
  status:
    type: nominal
    field: operating_status
    values:
      active: "{tokens.colors.active}"
      fault: "{tokens.colors.fault}"
    fallback: "{tokens.colors.unknown}"
encodings:
  pipelines:
    source: gas-network
    geometry: line
    role: primary
    layerGroup: subject-line
    rules:
      - id: status-color
        field: operating_status
        channel: line-color
        scale: status
layerOrder:
  - id: background
    order: 0
  - id: subject-line
    order: 50
---

## Overview

A calm operational map in which abnormal segments dominate neutral context.

## Intent & Audience

Operators must identify faults quickly without mistaking selection for status.

## Data Semantics

`operating_status` is nominal. Unknown values use the neutral fallback.

## Visual Hierarchy

Background is subordinate; network segments are primary; faults are critical.

## Zoom & Generalization

The full network appears at street zoom. Labels are introduced only at site zoom.

## Layer Order

Context remains below subject lines and interaction overlays.

## MapLibre Implementation

Generated layers carry `cartography:*` provenance metadata.

## Validation

Validate the contract, profile, style specification, and representative screenshots.
```

## 37. 最终原则

CARTOGRAPHY.md 的存在，是为了使制图意图持久且可执行。token 提供精确值；数据绑定提供真实性；文本提供判断；验证提供证据。成功的实现会让这四者始终相互连接。
