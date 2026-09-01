# cartography-init 技能设计

**日期:** 2026-09-01
**状态:** 已获用户批准（方案 A + better-sqlite3)
**目标版本线:** cartography.md 0.3.0

## 1. 目标与定位

新增 agent 技能 `cartography-init`：从现有制图样式来源生成 `CARTOGRAPHY.md` **草稿**，让 Agent 把已有地图样式迁移为持久、可 lint 的设计系统文档。

生成深度刻意限定为**骨架 + 待补提示**:Token 与 `elements` 确定性抽取；九个规范章节全量生成，可从来源推断的内容写成事实句，设计意图类内容写显式待补标记，由 Agent 后续补写。不编造设计语义（规范 §16 与本仓库 PHILOSOPHY)。

非目标：不生成运行时样式文件；不把数据绑定（source-layer/filter/字段名）写进文档（§9.5)；不支持 ArcMap 二进制 `.lyr`/`.mxd` 与 `.aprx`。

## 2. 来源与可行性

| 来源 | 格式 | 支持方式 |
|---|---|---|
| MapLibre/Mapbox `style.json` | JSON | 直接解析 |
| QGIS 工程 | `.qgs`(XML)/ `.qgz`(zip+XML) | `fast-xml-parser` + `fflate` |
| ArcGIS `.lyrx` | CIM JSON（文档化） | 直接解析 |
| ArcGIS `.stylx` | SQLite + CIM JSON | `better-sqlite3` |
| SLD(OGC SE 1.0/1.1) | XML | `fast-xml-parser` |

`.aprx` 为 zip 容器但内部结构随 ArcGIS Pro 版本漂移（CIM XML 或 JSON 不定），非稳定交换格式，首版不支持；`.lyr`/`.mxd` 为 ArcMap 二进制，无 ESRI 工具不可解析，不支持。用户需从 ArcGIS Pro 导出 `.lyrx` 或共享 `.stylx`。

## 3. 架构

私有包 `@cartographymd/init-skill`，结构与 `@cartographymd/data-profile-skill` 对齐：

```text
.agents/skills/cartography-init/
  SKILL.md                     agent 工作流：读源 → 生成 → lint → 报告
  package.json                 private,engines node >=20
  tsconfig.json                继承 tsconfig.base.json
  scripts/init.ts              CLI 入口
  fixtures/                    每源最小真实样本
  src/
    ir.ts                      ExtractedStyle 中间表示
    adapters/style.ts          style.json → IR
    adapters/qgis.ts           .qgs/.qgz → IR
    adapters/lyrx.ts           .lyrx → IR
    adapters/stylx.ts          .stylx → IR(复用 lyrx 的 CIM 解释器)
    adapters/sld.ts            .sld → IR
    cim.ts                     CIM JSON → 符号原语(stylx/lyrx 共享)
    consolidate.ts             IR → Token 组去重命名 + elements 归并
    emit.ts                    → CARTOGRAPHY.md 文本
    verify.ts                  调 @mapseekai/cartography.md lint 收敛
    report.ts                  生成报告(抽取/跳过/待补)
  tests/                       vitest
```

数据流：

```text
源文件 → adapter(有界解析) → IR
       → consolidate(去重、命名、归并)
       → emit(YAML front matter + 九章正文草稿)
       → verify(lint 必须 0 错误,否则报告并输出失败)
       → CARTOGRAPHY.md + 生成报告(stdout 或 --report 文件)
```

## 4. 中间表示(IR)

```ts
interface ExtractedStyle {
  source: {kind: 'style' | 'qgis' | 'lyrx' | 'stylx' | 'sld'; name?: string};
  colors: ExtractedColor[];       // {value: string; usedBy: string[]}
  widths: ExtractedWidth[];       // {value: AbsoluteDimension; usedBy: string[]}
  dashes: ExtractedDash[];        // {pattern: AbsoluteDimension[]; usedBy: string[]}
  opacities: ExtractedOpacity[];  // {value: number; usedBy: string[]}
  typography: ExtractedType[];    // {fontFamily: string[]; fontSize: ...; ...}
  elements: ExtractedElement[];   // {name, geometry, family?, roleHint?, style props, scaleHints[]}
  scaleHints: ScaleHint[];        // zoom stops / scaleDenominator / visibility ranges
  skipped: SkippedItem[];         // 超出抽取边界的内容 + 原因
  datasources: DatasourceItem[];  // 源数据身份(provider/uri/类型,按图层),仅供报告
  bindings: BindingItem[];        // 字段级绑定(filter/字段引用/覆盖表达式),含 symbolRef 指回生成元素
  unresolved: UnresolvedItem[];   // 生成方无法确定、需转换方补给的待定项
}
```

要点：所有数值在进入 IR 前归一化为规范单位（px/pt/mm/cm/in);ArcGIS CIM 的颜色数组转 CSS 十六进制；SLD CssParameter 直接映射。

## 5. 各源抽取边界

超出边界的内容一律进 `skipped`（写入生成报告），不静默丢弃、不猜测。

### style.json
- 抽取：paint/layout 字面量（颜色、线宽、虚线、透明度、字号字族）、`background`/图层类型 → `geometry`
- zoom stops / interpolate：取默认值进 Token，完整 stops 事实句写入 Scale & Generalization 草稿
- 数据驱动表达式（`["get",…]` 等）: 进 `skipped`;`source-layer`/`filter` 进 `bindings`

### QGIS(.qgs/.qgz)
- 抽取：single/categorized/graduated/rule-based 渲染器；简单符号层（SimpleLine/SimpleFill/SimpleMarker)；标注 text-style（字体、字号、buffer)
- rule-based 每条规则的符号照常进 elements(同一渲染器归为一个 `family`);规则的 filter 表达式与数据驱动覆盖(data-defined properties)的字段/表达式进 `bindings`——符号保留,仅绑定外移
- 跳过:嵌套符号层特效、复杂表达式求值;数据驱动覆盖的属性取静态基础值进 IR
- 图层数据源身份(ogr/postgres/wfs 等 provider 与路径)进 `datasources`,不冒充矢量瓦片 `source-layer`

### ArcGIS(.lyrx/.stylx)
- 抽取：CIMSolidStroke/CIMSolidFill/CIMVectorMarker 基础属性、CIMTextSymbol
- 跳过：CIM 效果链（偏移、晕渲、虚线特效）、比例符号系统
- `.stylx` 读取 SQLite 的 symbol 表，CIM JSON 部分与 `.lyrx` 共用 `cim.ts`

### SLD
- 抽取：Line/Polygon/Point/Text Symbolizer 的 CssParameter、Min/MaxScaleDenominator → scaleHints
- Filter：进 `bindings`，绝不写入文档

## 6. consolidate:命名与归并

- 颜色/宽度/虚线/透明度按值去重；名称优先取来源图层/规则的语义名（slug 化为 `TokenIdentifier`)，冲突加序号，无语义信息时用 `color-1` 等中性名——语义改进留给 Agent 补写
- 元素归并：同族图层/规则归为同一 `family`;`role` 从渲染层级顺序推断（primary/secondary/context);`geometry` 按源类型映射（line/polygon/point/label/background/raster/mixed)
- 每个元素至少产出一个核心样式属性（§9.2 硬性要求）

## 7. emit:文档生成

- front matter:`version: "0.3.0"` + `name`（来源名或 `--name`)+ 抽取出的 Token 组与 `elements`
- 正文：九个规范章节全量、非空。可推断事实写成事实句（如"主要线要素使用 {colors.x} 与 {widths.y}");Scale & Generalization 写入 scaleHints 事实；设计意图段落写待补标记 `> TODO(agent): …`
- 生成后自检：文档必须通过 `lint` 0 错误；待补标记不影响有效性

## 8. CLI 与技能工作流

```bash
pnpm --filter @cartographymd/init-skill init -- \
  --input path/to/style.json \        # 或 .qgs/.qgz/.lyrx/.stylx/.sld
  --name "My Atlas" \
  --output CARTOGRAPHY.md \
  --report INIT_REPORT.md \
  --report-json INIT_REPORT.json
```

- 输入格式按扩展名 + 内容嗅探双重判定；无法识别 → 退出码 2 + 用法错误
- 解析失败 → 退出码 2;lint 未过 → 退出码 1 且不写文档（避免留下无效产物)
- SKILL.md 规定 Agent 流程：生成 → 阅读生成报告 → 补写待补段落（语义命名、设计意图）→ 复跑 `cartographymd lint`

bindings 分诊为必经步骤，每条三选一并在报告 JSON 中记录归处，不允许"未处理"残留：

1. **设计意图**——绑定表达持久语义 → 翻译为正文 prose（如"主干道以 {colors.road-primary} 强调")
2. **运行时保留**——纯字段映射细节 → 留在报告 JSON，供下游转换 Agent 或适配器使用
3. **显式丢弃**——源样式中的临时/偶然规则 → 在报告中标注丢弃原因

转换场景（如 QGIS → style.json）的资料链：

| 产物 | 来自 | 回答的问题 |
|---|---|---|
| `CARTOGRAPHY.md` | cartography-init | 视觉长什么样、为什么(Token/elements/意图) |
| `INIT_REPORT.json` | cartography-init | 原样式曾如何绑定数据(filter/字段/覆盖,含 symbolRef) |
| `DATA_PROFILE.json` | data-profile | 目标数据里实际有什么(字段、值域) |

bindings 是转换的必要而非充分条件：QGIS 图层的数据源可能是 Shapefile/PostGIS/WFS 而非矢量瓦片 source-layer;目标侧的瓦片源 URL/类型、坐标与切片方案、图层顺序、glyphs/sprites 等仍需转换方补给。报告必须在 `unresolved` 中显式列出这些待供给项，不得暗示可由三份资料自动重建。

## 9. 测试

- 每适配器：最小 fixture → IR 快照；边界样本（含 zoom stops、数据驱动、Filter)→ skipped/bindings 断言
- consolidate：去重、命名冲突、family 归并
- emit+verify 端到端：各源 fixture 各产出文档,`lint` 0 错误、九章非空
- boundary 测试（跟随 data-profile 惯例）：产物不含 source-layer/filter/字段名；包不依赖渲染器库
- stylx fixture：测试钩子用 better-sqlite3 现场生成最小库
- report:`--report-json` 的 bindings/datasources/unresolved 结构与 symbolRef 对应关系;bindings 分诊三归处的记录格式

## 10. 依赖与边界

- 新依赖仅进该私有包：`fast-xml-parser`、`fflate`、`better-sqlite3`;lint 复用 `@mapseekai/cartography.md`(workspace)
- 核心包 `packages/cli` 零改动；本技能不进入发布产物
- 生成物是草稿：报告必须列出 `skipped` 与待补段落；Agent 不得在补写前宣称迁移完成
- bindings/datasources 只进报告与 sidecar JSON,绝不进 `CARTOGRAPHY.md`;sidecar 是一次迁移的任务级资料,不进入发布产物

## 11. 验收标准

1. 五种来源(fixture)各自生成通过 `cartographymd lint` 的 CARTOGRAPHY.md（0 错误）
2. 生成报告(md + JSON)列出全部 skipped、datasources、bindings 与 unresolved;文档内无任何数据绑定痕迹
3. 九章齐全非空；待补标记位置明确
4. `pnpm check` 与 data-profile 既有验证保持全绿；新包自身 typecheck+test 纳入根脚本（跟随 data-profile 先例）
5. 每条 binding 在补写工作流中有显式三选一归处(设计意图 prose / 运行时保留 / 显式丢弃),分诊步骤写入 SKILL.md 且可由报告 JSON 核验
6. 报告显式列出目标源供给等 unresolved 项;任何文档不暗示转换可由资料自动重建
