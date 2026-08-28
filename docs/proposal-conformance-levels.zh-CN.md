# 提案：契约分层与 schema 收敛

**状态：** 提案（待决策）
**日期：** 2026-08-28
**目标版本：** 0.2（0.1 尚未发布，破坏性变更免费）
**背景：** 对比 [google-labs-code/design.md](https://github.com/google-labs-code/design.md) 后，对 cartography.md "限制多、难迁移、似乎必须有数据基础才能用" 的问题所做的分析。

## 1. 问题陈述

使用者的真实痛点不是"验证太严"，而是三件被捆绑在一起的事：

1. **冷启动成本**：即使只想声明地图意图，也必须写全套 YAML 脚手架；
2. **渲染器锁死**：`target.renderer` 为字面量 `maplibre`、`styleSpecVersion` 锁定 8；
3. **规范文本厚重**：37 个章节、14 个规范 Markdown 节、大量确定性禁令，观感上"必须全套照做"。

## 2. 与 design.md 的对比：范围差异，而非松紧差异

design.md 同样有确定性验证（token 引用、WCAG 对比度、结构、diff 回归），**它并不"宽松"**。真正的差异是**范围**：

| | design.md | cartography.md |
|---|---|---|
| 验证对象 | 自包含的视觉标识工件（tokens/components） | 意图 + 数据语义 + 渲染器目标 + 样式治理的捆绑体 |
| 语义来源 | 内在（button 就是 button，无需外部事实） | 外来（一条黄线可以是路、管线或边界，必须由数据语义定义） |
| 外部依赖 | 无 | 字段名（L2 起必需）、画像（L3 起可选） |

地图样式若脱离数据语义，只是任意色块——"数据语义先于视觉处理"是本项目存在的理由，不应放弃。需要修的是**捆绑与必填集**，不是放松验证。

## 3. 实证：当前 schema 的真实约束（含双 schema 漂移）

契约有两套形式化定义，且**两者不一致**：

**A. Zod 运行时**（lint 的实际执行者，`packages/cli/src/schema/cartography.ts`）——对仅含 `version/name/target/intent` 的文档做运行时验证：

```
data : Required
encodings : Required
layerOrder : Required
tokens : Required
zoom : Required
```

即 Zod 层面：`data/zoom/tokens/encodings` 四键必填（值允许空容器）、`layerOrder` 至少 1 项、`scales` 可省略（`.default({})`）。"只写意图"的文档无法通过 lint。

**B. JSON Schema**（对外发布，`schema/cartography.schema.json`）——比 Zod 更严格：

- root `required` 额外包含 **`scales`**（Zod 却允许省略）；
- `encodings`、`zoom.bands`、`tokens.colors` 均声明 **`minProperties: 1`**（Zod 允许空容器）；
- `layerOrder` `minItems: 1`（与 Zod 一致）。

**漂移记录**：`scales` 的可选性，以及三个 record 的空容器合法性，在两套规范中不一致——同一份 front matter 可能被 lint 判为通过、被 JSON Schema 判为不通过。收敛时必须同时统一两者，并新增等价性测试防止再次漂移。

**可选与必填的准确边界（以 Zod 为准）：**

| 内容 | 现状 |
|---|---|
| `DATA_PROFILE.json` 文件 | 可选；仅当 `data.profileRequired: true` 时缺失才报错误 |
| `style.json` 文件 | 可选；不提供则跳过样式层规则 |
| 五个脚手架键 + 非空 `layerOrder` | Zod 必填（JSON Schema 更严格：`scales` 也必填，且三个 record 不允许为空） |
| 字段名知识（L2 语义绑定） | 使用绑定时不可避免——这是领域本质，不是文件要求 |

## 4. 提案：契约分级（conformance levels）

| 级别 | 名称 | 内容 | 对应验证层 |
|---|---|---|---|
| **L0** | intent 意图 | `version/name/target/intent` + prose | 文档结构 |
| **L1** | visual 纯视觉 | + `tokens`、encodings（仅 `value:`，不绑字段） | 文档 + token 引用 + 对比度 |
| **L2** | semantic 语义绑定 | + `bindings`、`scale.field`（需要字段名） | + 数据契约一致性 |
| **L3** | profiled 画像 | + `DATA_PROFILE.json`（可由 TileJSON 派生） | + 画像事实校验 |
| — | 样式校验 | + `style.json`（任意级别均可附加） | 官方 MapLibre 校验 |

配套调整：

- `data`、`zoom`、`tokens`、`encodings` 转为可选；`layerOrder` 改为"声明了 encodings 才要求非空"；
- `data.profileRequired` 仅在 L2+ 有意义；
- 工具按文档实际达到的级别输出 findings，并在报告中声明级别；
- spec 增加"分级"章节，`omitted` 机制与级别映射。

## 5. 工程清单（若采纳）

1. `packages/cli/src/schema/cartography.ts`：五个键转可选 / 条件必填（zod `superRefine` 处理 layerOrder 条件）；
2. `schema/cartography.schema.json`（仅此一份需要改；`data-profile.schema.json` 描述的是 DATA_PROFILE.json，不涉及本次收敛）：root `required` 收敛、移除三处 `minProperties: 1`，或按分级用 `allOf` 条件表达；
3. 新增 Zod ↔ JSON Schema 等价性测试（构造边界样例双向断言），消除 §3 记录的漂移并防止复发；
4. 规则守卫：`cartography.ts` 中 `zoom.bands`、`tokens.colors`、`layerOrder`、`encodings` 的直接访问改为条件化（现有 `!context.cartography` 早退不够用）；
5. 测试：新增 L0/L1 通过用例 + L2 缺画像用例（注意：现有 `example.test.ts` 第二用例断言 `dataProfileChecked === true`，因契约声明了 `data.profile` 且 `lintFile` 自动加载——不要误引为"无画像可用"的证据）；
6. spec：新增分级章节（en/zh-CN）、必填集表格修订。

## 6. 路线图建议

| 优先级 | 事项 | 理由 |
|---|---|---|
| 1 | schema 收敛 + 分级（本提案） | 免费破坏窗口；让后续产物有级别可标 |
| 2 | `cartographymd init` 生成器 | style.json + TileJSON → L2 草稿；收敛后生成物更干净（bright 示例已手工验证该流水线） |
| 3（推迟） | target pack 拆分 | 解决渲染器迁移，但 0.1 只有 maplibre 一个 pack，现在做是过度设计 |

**明确不做：** 学习 design.md 的"通用性"。它验证的是自包含工件，我们验证的是数据语义真实性——确定性验证与漂移检测是本项目的差异化本体。改进方向是拆捆绑、降必填、给分级，不是放松验证。

## 7. 决策点

1. **是否采纳分级提案**并趁 0.1 未发布执行 schema 收敛？
2. **收敛边界确认**：`data/zoom/tokens/encodings` 转可选、`layerOrder` 条件必填——这个集合对吗？`target.renderer` 是否保留字面量约束（建议保留到 pack 拆分时再放宽）？

## 附：讨论中的实证记录

```
$ lint(仅 version/name/target/intent 的文档)
L0-only doc -> schema findings:
 - data : Required
 - encodings : Required
 - layerOrder : Required
 - tokens : Required
 - zoom : Required

$ lint(补齐五个脚手架键, 值为空容器)
with scaffolding keys: errors = 0 | valid = true
```
