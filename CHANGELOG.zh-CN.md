# 更新日志

cartography.md 的所有重要变更都将记录在此。

English: [CHANGELOG.md](CHANGELOG.md)

格式与 npm 包遵循语义化版本。`0.1` 开发草案从未发布；`0.2.0` 是第一条公开版本线。

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
