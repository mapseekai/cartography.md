# 更新日志

cartography.md 的所有重要变更都将记录在此。

English: [CHANGELOG.md](CHANGELOG.md)

本项目的格式与 npm 包遵循语义化版本。

## 0.1.0 - 2026-08-28

### 新增

- `CARTOGRAPHY.md` 草案规范初版。
- 确定性 YAML front matter 加规范 Markdown 章节。
- 地图意图、数据绑定、zoom 区间、token、比例尺、编码、图层顺序、无障碍、MapLibre、验证与 Agent 行为契约。
- 可选的 `DATA_PROFILE.json` 伴随格式。
- TypeScript 解析器、schema、linter API、样式契约校验器与 diff API。
- CLI 命令：`lint`、`parse`、`diff`、`rules` 和 `spec`。
- 集成官方 MapLibre Style Specification 校验。
- 采纳 OpenFreeMap Bright 公开生产样式的完整示例，含治理 metadata、数据画像与第三方许可说明。
- JSON Schema、CI 工作流与 Agent 技能指引。
