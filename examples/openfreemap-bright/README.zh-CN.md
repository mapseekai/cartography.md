# openfreemap-bright 示例

[English](README.md) | 中文

本示例在公开的 [OpenFreeMap bright](https://tiles.openfreemap.org/styles/bright) 生产样式（OpenMapTiles 底图）之上，用一个 `CARTOGRAPHY.md` 契约治理其中具有代表性的子集：

| 治理图层 | 编码 | 决策 |
|---|---|---|
| `water`、`waterway-river`、`building` | `water-area`、`waterway-line`、`building-fill` | 填充色逐字提升为 token |
| `highway-primary` | `road-primary` | 在 `class` 字段上施加名义比例尺 `roadClass` |
| `label_city` | `place-label` | 黑字白晕圈，对纸面保持 4.5:1 对比度 |

五个图层带有 `cartography:*` 溯源 metadata（group、role、priority、owner、
tokenRefs、sourceRule 以及 tokenBindings）。bright 的其余图层保持原样、不受
治理——后续采纳它们只需各加一段 metadata 和一条编码。

## 验证

```bash
pnpm install
pnpm lint:example
```

或直接运行：

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md \
  --profile DATA_PROFILE.json \
  --style style.json \
  --format text
```

## 文件

- `CARTOGRAPHY.md` —— 治理契约（英文，规范章节顺序）；
- `DATA_PROFILE.json` —— 受治理子集的 OpenMapTiles 源图层与字段事实；
- `style.json` —— bright 原始样式，附加治理 metadata 与 `cartography:spec` 根指针。

瓦片服务为公开访问；渲染该样式需访问 `tiles.openfreemap.org`（字体、sprite
与矢量瓦片）。

## 许可

`style.json` 是 OpenFreeMap / OSM Bright 的上游作品，本项目以修改副本形式再分发，适用 MIT（OpenFreeMap）、
BSD-3-Clause（样式代码）与 CC BY 4.0（样式设计）。详见
[THIRD_PARTY_LICENSES.zh-CN.md](THIRD_PARTY_LICENSES.zh-CN.md)（[English](THIRD_PARTY_LICENSES.md)）。
