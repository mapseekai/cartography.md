# cartography.md

一个面向编码 Agent 的地图制图设计契约格式。

`CARTOGRAPHY.md` 用持续、结构化的方式告诉 Agent：电子地图服务于什么任务、面向什么用户、数据字段具有什么语义、哪些对象应该突出、缩放层级如何变化、标注和交互状态如何处理，以及最终生成的 MapLibre `style.json` 应满足哪些约束。

它借鉴 [`DESIGN.md`](https://github.com/google-labs-code/design.md) 的核心组织方式：

- YAML front matter 保存机器可读、精确且可验证的规范；
- Markdown 正文保存人可以理解的制图理由、例外和判断原则；
- CLI 与 TypeScript API 为 Agent、CI 和产品工具提供确定性验证。

> 当前状态：Draft `0.1.0`，主要面向 MapLibre Style Specification v8。

[格式规范](docs/spec.zh-CN.md) · [API 文档](docs/api.zh-CN.md) · [完整示例](examples/openfreemap-bright/CARTOGRAPHY.md)

## 解决的问题

MapLibre `style.json` 主要回答“如何绘制”，但通常不会回答：

- 地图的主要任务和受众是什么；
- 业务主题与底图背景谁应该更突出；
- 哪个真实字段代表状态、等级、不确定性或质量；
- 同一对象在不同 zoom 下应隐藏、聚合、简化还是显示标注；
- 颜色、线宽、尺寸、透明度分别由哪个语义字段控制；
- 选中态是否会覆盖故障状态；
- 空值和未知类别如何处理；
- Agent 可以修改哪些图层、必须保留哪些人工成果；
- 样式通过语法校验后，是否仍存在制图层级和数据表达问题。

cartography.md 位于 `style.json` 上游：

```text
CARTOGRAPHY.md + DATA_PROFILE.json + 现有 style.json
                         ↓
                   自动制图 Agent
                         ↓
               校验后的 MapLibre style.json
                         ↓
                    渲染场景与评审证据
```

## 文件结构

一个 `CARTOGRAPHY.md` 包含两部分：

1. **YAML front matter**：规范性、机器可读的地图意图、数据绑定、token、比例尺和编码规则；
2. **Markdown 正文**：解释为什么这样设计、冲突如何解决、Agent 应保留什么、最终应检查什么。

```md
---
version: "0.1.0"
name: 城市燃气管网运行图
target:
  renderer: maplibre
  styleSpecVersion: 8
  modes: [light, dark]
intent:
  mapType: operational
  primaryTask: 快速定位异常管线和设施
  audience: [dispatcher, network-manager]
data:
  profile: ./DATA_PROFILE.json
  profileRequired: true
  bindings:
    status: operating_status
    importance: pressure_level
zoom:
  bands:
    city: [8, 12]
    street: [12, 16]
    site: [16, 24]
tokens:
  colors:
    normal: "#2F7D5B"
    danger: "#C63D45"
    unknown: "#7F8A99"
scales:
  status:
    type: nominal
    field: "{data.bindings.status}"
    values:
      active: "{tokens.colors.normal}"
      fault: "{tokens.colors.danger}"
    fallback: "{tokens.colors.unknown}"
encodings:
  pipelines:
    source: gas-network
    geometry: line
    role: primary
    layerGroup: subject-line
    rules:
      - id: status-color
        field: "{data.bindings.status}"
        channel: line-color
        scale: status
        critical: true
        secondaryChannel: line-width
layerOrder:
  - id: background
    order: 0
  - id: subject-line
    order: 50
---

## 概述

该地图应保持克制、清晰，并使异常管线明显高于普通背景。
```

完整规范见 [`docs/spec.zh-CN.md`](docs/spec.zh-CN.md)（[English](docs/spec.md)）。

## 快速使用

```bash
pnpm add -D @mapseekai/cartography.md
```

同时验证制图契约、数据画像和 MapLibre 样式：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json
```

默认输出 JSON，便于 Agent 和 CI 处理。人工查看时可使用：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json \
  --format text
```

Windows 建议使用无点号的 `cartographymd` 命令，避免 `.md` 与系统 Markdown 文件关联发生冲突。

## 四层验证

| 层级 | 主要检查内容 |
|---|---|
| 文档 | front matter、确定性 YAML、schema、章节顺序、token 引用 |
| 数据契约 | source/source-layer、几何类型、字段、类别、单位、zoom、稳定 ID |
| MapLibre 样式 | 官方 Style Specification 校验、资源协议和表达式兼容性 |
| 制图契约 | 图层溯源、数据编码对应关系、token 漂移、图层顺序、feature-state 约束 |

工具不会使用一个含义不明的“美观总分”替代专业评审。规范要求声明高密城区、低密区域、空值、浅色、深色、移动端、桌面端和交互状态等渲染场景，再由具体项目生成截图并验收。

## CLI

```text
cartographymd lint  <file> [--profile file] [--style file] [--strict]
cartographymd parse <file>
cartographymd diff  <before> <after>
cartographymd rules
cartographymd spec  [--output file]
```

退出码：

- `0`：按当前严格度通过；
- `1`：校验执行完成，但存在阻断问题；
- `2`：命令参数、文件读取、JSON 解析或内部执行失败。

## TypeScript API

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {
  dataProfilePath: 'DATA_PROFILE.json',
  stylePath: 'style.json',
  strict: true,
});

if (!report.valid) {
  console.error(report.findings);
}
```

API 还导出了解析器、Zod schema、默认规则、MapLibre 样式契约校验、差异比较、规则目录和内置规范。详见 [`docs/api.zh-CN.md`](docs/api.zh-CN.md)。

## 完整示例

[`examples/openfreemap-bright`](examples/openfreemap-bright) 在真实的 [OpenFreeMap bright](https://tiles.openfreemap.org/styles/bright) 生产样式上叠加治理契约：

- 水系、水域、建筑 → 逐字提升为 token 的填充色；
- 道路等级 → transportation `class` 字段上的名义比例尺；
- 城市标注 → 纸面对比度 4.5:1 的黑字白晕圈；
- 五个代表图层带 `cartography:*` 溯源 metadata，演示样式采纳工作流。

```bash
pnpm install
pnpm lint:example
```

## 仓库组织

```text
cartography.md/
├── docs/spec.md
├── docs/spec.zh-CN.md
├── docs/api.md
├── docs/api.zh-CN.md
├── examples/openfreemap-bright/
├── packages/cli/
├── schema/
├── .agents/skills/cartography-md/SKILL.md
├── PHILOSOPHY.md
├── PHILOSOPHY.zh-CN.md
└── README.md
```

## 开发

需要 Node.js 20 或更高版本。

```bash
pnpm install
pnpm check
pnpm lint:example
pnpm build
```

## 核心原则

- 数据语义先于视觉装饰；
- 视觉层级必须显式并随 zoom 变化；
- 一个视觉通道只保留一个主要语义所有者；
- 关键状态按要求使用冗余视觉信号；
- 选中态采用叠加方式，不破坏业务状态；
- 空值和未知值不得静默处理为正常；
- MapLibre 语法正确不等于地图制图正确；
- Agent 进行最小且连贯的修改，并记录图层来源。

更多设计理由见 [`PHILOSOPHY.zh-CN.md`](PHILOSOPHY.zh-CN.md)（[English](PHILOSOPHY.md)）。

## License

Apache-2.0，见 [`LICENSE`](LICENSE)。
