# 更新日志

cartography.md 的所有重要变更都将记录在此。

English: [CHANGELOG.md](CHANGELOG.md)

格式与 npm 包遵循语义化版本。`0.1` 与 `0.2.0` 均为内部草案，从未发布或存档；`0.3.0` 是第一条公开版本线。

## 0.3.0 - 2026-09-01

### 破坏性变更

- 以根级 `colors`、`typography`、`widths`、`sizes`、`opacities`、`spacing`、`dashes` 和 `elements` 组取代 `tokens` 包装层。
- 新增 `spacing`、`dashes` 与可复用 `elements`；MapElement 现要求 `geometry` 和至少一个核心样式属性。
- Typography 增加 `fontStyle`、`textTransform`、`fontFeature` 与 `fontVariation`；新增 `DashPattern`，其解析后成员须为偶数并保持单位一致。
- 收紧 Dimension 语法：核心尺寸不再接受 `rem` 或 `%`。
- 以 `{colors.ink}` 等根级引用取代旧引用路径；引用现支持数组索引、禁止元数据根，并进行深度解析。
- 规范 Markdown 章节由十二个缩减为九个：Overview、Colors、Typography & Labels、Composition & Density、Layering & Depth、Geometry & Symbols、Scale & Generalization、Map Elements 与 Do's and Don'ts。
- `omitted` 对象改为封闭对象；删除 `locale`、`accessibility` 和 `extensions` 的标准字段地位。取消 contrast pair 的机器校验；对比度与包容性设计指引应写入正文。
- 发布 schema 改名为 `schema/cartography-front-matter.schema.json`，其 `$id` 为 `urn:cartography-md:schema:front-matter:0.3.0`。
- 新增覆盖 0.3.0 格式的附录 B 符合性测试集。
- 本次为破坏性升级：不保留 `0.2.0` 兼容层、字段别名或旧规则 ID。

## 0.2.0 - 2026-08-29

### 新增

- 面向持久制图视觉身份的自包含 `CARTOGRAPHY.md` 格式，把确定性 YAML front matter 与 prose-first Markdown 章节结合起来。
- 开放设计 token、精确 `{path.to.token}` 引用、声明式无障碍对比关系、有理由的章节省略，以及未知扩展保留。
- 覆盖意图、层级、色彩、字体与标注、几何与符号、比例尺与综合、构图、交互状态、无障碍、评审原则和 Do's and Don'ts 的规范章节。
- TypeScript 解析器、Zod schema、生成式 JSON Schema、文档 linter、引用解析、语义 diff、规则目录和包内规范。
- `parse`、`lint`、`diff`、`rules` 和 `spec` CLI 命令，以及结构化 finding、严格模式和稳定退出码。
- 可独立 lint 的 Quiet Atlas 示例、双语公共与规范文档，以及 Agent 工作流指引。

### 边界

- 核心验证只覆盖单份 `CARTOGRAPHY.md` 及其可确定的内部关系。
- 当前任务、数据检查、目标专属生产和输出评审仍属于核心包之外的运行时职责。
- 核心包不包含目标专属生产依赖，也不为从未发布的 `0.1` 草案提供兼容层。
