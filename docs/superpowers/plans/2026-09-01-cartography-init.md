# cartography-init 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增私有技能包 `@cartographymd/init-skill`(.agents/skills/cartography-init),从 style.json / .qgs / .qgz / .lyrx / .stylx / .sld 抽取可复用视觉语言，生成通过 `cartographymd lint` 的 CARTOGRAPHY.md 草稿 + 人读报告 + 机器可读 JSON sidecar。

**Architecture:** 五个源适配器（纯函数）→ 统一 IR(`ExtractedStyle`)→ consolidate（去重、命名、family 归并）→ emit（九章非空草稿，事实句 + `> TODO(agent):` 待补标记）→ report(md + json,bindings/datasources/unresolved 结构化）→ verify(lint 0 错误否则不写文档）。数据绑定绝不进文档；补写由 Agent 按 SKILL.md 完成，bindings 逐条三选一分诊。

**Tech Stack:** TypeScript(ESM)+ tsx + vitest（跟随 data-profile 先例）；新依赖 `fast-xml-parser`、`fflate`、`better-sqlite3`；lint 复用 workspace 包 `@mapseekai/cartography.md`。

**设计文档:** `docs/superpowers/specs/2026-09-01-cartography-init-design.md`（权威；本计划不重复其论证）

## Global Constraints

- 输出文档 `version: "0.3.0"`,Token 名与元素键匹配 `^[A-Za-z0-9_-]+$`（中文层名 slug 化为 ASCII，无语义信息时用 `color-1` 等中性名，原名写入报告）
- 长度单位只出 `{px, pt, mm, cm, in}`;QGIS `MapUnits`/`Percentage`、SLD 相对 uom 等不可表示者进 `skipped`（写原因），不做猜测换算
- 每个 `elements` 条目必须含 `geometry` + 至少一个核心样式属性（规范 §9.2)
- bindings/datasources 绝不写入 `CARTOGRAPHY.md`；只进 `INIT_REPORT.md` / `INIT_REPORT.json`
- `dataProfile` 根字段绝不生成（规范 §5.4 保留）
- engines `node>=20`;ESM;ES2022
- 核心包 `packages/cli` 零改动；新包 private 不发布；`pnpm check` 与 data-profile 既有验证保持全绿
- 提交纪律：本仓库要求验证全绿后再提交；每个 Task 末尾仅当该 Task 测试全绿时提交

## File Structure

```
.agents/skills/cartography-init/
├── package.json            # @cartographymd/init-skill, private
├── tsconfig.json           # extends ../../../tsconfig.base.json, rootDir ".", noEmit, types:["node"]
├── SKILL.md                # Agent 工作流(触发时机/命令/补写/分诊/复跑 lint)
├── src/
│   ├── ir.ts               # ExtractedStyle 及全部子类型(唯一类型来源)
│   ├── cli.ts              # 参数解析(init / --check-report)+ 退出码
│   ├── detect.ts           # 扩展名 + 内容嗅探 → SourceKind
│   ├── adapters/
│   │   ├── style-json.ts   # MapLibre style.json
│   │   ├── qgis.ts         # .qgs(XML) / .qgz(zip+XML)
│   │   ├── arcgis.ts       # .lyrx / .stylx(共用 cim.ts)
│   │   ├── cim.ts          # CIM 符号解释器(JSON → IR 样式事实)
│   │   └── sld.ts          # SLD 1.0/1.1 XML
│   ├── consolidate.ts      # 去重、命名(slug)、family/role 归并 → DesignTokens+elements
│   ├── emit.ts             # → CARTOGRAPHY.md 文本(九章非空 + TODO 标记)
│   ├── report.ts           # → INIT_REPORT.md / INIT_REPORT.json;分诊记录核验
│   ├── verify.ts           # 调 @mapseekai/cartography.md lint;0 错误才算通过
│   └── init.ts             # 主流程编排:detect→parse→consolidate→emit→verify→写盘→report
├── scripts/
│   └── init.ts             # #!/usr/bin/env node 薄封装,import 并运行 src/cli.ts
├── fixtures/               # 每适配器最小样本 + 边界样本(见各 Task)
└── tests/
    ├── helpers.ts          # loadFixture、tempdir 输出、断言工具
    ├── detect.test.ts
    ├── adapter-style-json.test.ts
    ├── adapter-qgis.test.ts
    ├── adapter-arcgis.test.ts
    ├── adapter-sld.test.ts
    ├── consolidate.test.ts
    ├── emit.test.ts
    ├── report.test.ts
    ├── cli.test.ts
    └── boundary.test.ts    # 产物不含 source-layer/filter/字段名;包不依赖渲染器库
```

---

### Task 1: 包脚手架 + IR 类型

**Files:**
- Create: `.agents/skills/cartography-init/package.json`
- Create: `.agents/skills/cartography-init/tsconfig.json`
- Create: `.agents/skills/cartography-init/src/ir.ts`
- Create: `.agents/skills/cartography-init/tests/helpers.ts`
- Modify: `pnpm-workspace.yaml`(加 `- .agents/skills/cartography-init` 与 `onlyBuiltDependencies: [- esbuild, - better-sqlite3]`)

**Interfaces:**
- Produces（全部后续 Task 依赖）:`ExtractedStyle`、`ExtractedColor`、`ExtractedWidth`、`ExtractedDash`、`ExtractedOpacity`、`ExtractedType`、`ExtractedElement`、`ScaleHint`、`SkippedItem`、`DatasourceItem`、`BindingItem`、`UnresolvedItem`、`SourceKind`、`Dimension`、`Geometry`、`CoreStyleProps`

- [ ] **Step 1: 写 package.json 与 tsconfig.json**

```json
// .agents/skills/cartography-init/package.json
{
  "name": "@cartographymd/init-skill",
  "version": "0.1.0",
  "private": true,
  "description": "Generate a CARTOGRAPHY.md draft from existing map styles (style.json, QGIS, ArcGIS, SLD).",
  "type": "module",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "init": "tsx scripts/init.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@mapseekai/cartography.md": "workspace:*",
    "better-sqlite3": "^12.4.1",
    "fast-xml-parser": "^5.3.2",
    "fflate": "^0.8.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.15.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.3",
    "vitest": "^4.1.10"
  }
}
```

```json
// .agents/skills/cartography-init/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "noEmit": true, "types": ["node"] },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts"]
}
```

修改 `pnpm-workspace.yaml`:

```yaml
packages:
  - packages/*
  - .agents/skills/data-profile
  - .agents/skills/cartography-init

onlyBuiltDependencies:
  - esbuild
  - better-sqlite3
```

- [ ] **Step 2: 写 ir.ts（全量类型，一次性给出）**

```ts
// .agents/skills/cartography-init/src/ir.ts

/** 规范允许的长度单位(spec §7.2)。不可表示的单位不进 IR,由适配器写入 skipped。 */
export type DimensionUnit = 'px' | 'pt' | 'mm' | 'cm' | 'in';

export interface Dimension {
  value: number;
  unit: DimensionUnit;
}

export type SourceKind = 'style' | 'qgis' | 'lyrx' | 'stylx' | 'sld';

/** 规范 §9.2 geometry 枚举 */
export type Geometry = 'point' | 'line' | 'polygon' | 'label' | 'background' | 'raster' | 'mixed';

export type LayerRole = 'background' | 'context' | 'subject' | 'overlay' | 'annotation' | 'control';

/** 一个去重后的颜色事实。value 为 CSS 颜色字符串(hex 或 rgba())。 */
export interface ExtractedColor {
  value: string;
  /** 语义名提示(来源图层/规则名 slug 化结果),可为空 */
  nameHint?: string;
  usedBy: string[];
}

export interface ExtractedWidth {
  value: Dimension;
  nameHint?: string;
  usedBy: string[];
}

export interface ExtractedDash {
  pattern: Dimension[]; // 非空、同单位(适配器保证)
  nameHint?: string;
  usedBy: string[];
}

export interface ExtractedOpacity {
  value: number; // 0..1
  nameHint?: string;
  usedBy: string[];
}

export interface ExtractedType {
  fontFamily: string[]; // 非空
  fontSize: Dimension;
  fontWeight?: number | 'normal' | 'bold';
  letterSpacing?: Dimension;
  lineHeight?: number | Dimension;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  nameHint?: string;
  usedBy: string[];
}

/** 元素级样式属性;全部值保持抽取原样(引用在 emit 阶段替换)。 */
export interface CoreStyleProps {
  color?: string;
  fillColor?: string;
  strokeColor?: string;
  outlineColor?: string;
  casingColor?: string;
  haloColor?: string;
  strokeWidth?: Dimension;
  outlineWidth?: Dimension;
  casingWidth?: Dimension;
  haloWidth?: Dimension;
  size?: Dimension;
  opacity?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  typography?: string; // 指向 consolidate 产出的 typography Token 名;适配器阶段由 ExtractedElement.rawTypography 携带
  symbol?: string;
  dash?: Dimension[];
  offset?: Dimension;
  spacing?: Dimension;
}

export interface ExtractedElement {
  name: string; // 已完成 slug 的 TokenIdentifier
  geometry: Geometry;
  family?: string;
  roleHint?: 'primary' | 'secondary' | 'context'; // consolidate 决定最终 role/state
  layerRole?: LayerRole;
  style: CoreStyleProps;
  rawTypography?: ExtractedType; // 标注元素携带,consolidate 转 Token
  scaleHints: ScaleHint[];
}

export interface ScaleHint {
  /** 机器来源的事实,如 "zoom 8–12 可见"、"scaleDenominator 50000"、"0–10 仅高速" */
  fact: string;
  /** 可解析时给出语义尺度建议 */
  stage?: 'overview' | 'regional' | 'local' | 'detail';
}

export interface SkippedItem {
  source: SourceKind;
  layer?: string; // 原始图层/规则名(未 slug)
  reason: string; // 人类可读原因
  detail?: string; // 原始片段摘要(截断 200 字符)
}

export interface DatasourceItem {
  source: SourceKind;
  layer: string;
  /** 如 "ogr:/data/roads.shp"、"postgres:dbname=gis"、"vector:https://tiles.example.com/{z}/{x}/{y}.pbf" */
  identity: string;
  providerType?: string; // ogr / postgres / wfs / vector / raster / ...
}

export interface BindingItem {
  source: SourceKind;
  layer: string;
  family?: string;
  kind: 'filter' | 'source-layer' | 'field-ref' | 'field-override';
  expression: string; // 原始表达式/字段名
  /** 指回 consolidate 后 elements 中的元素名(emit 前填充) */
  symbolRef?: string;
  /** 补写阶段由 Agent 填写;生成时缺省 */
  triage?: BindingTriage;
}

export interface BindingTriage {
  decision: 'prose' | 'runtime' | 'discard';
  note?: string;
}

export interface UnresolvedItem {
  topic: string; // 如 "target tile source url/type"、"glyphs"、"sprites"、"layer order"、"crs/tiling"
  detail: string;
}

export interface ExtractedStyle {
  source: { kind: SourceKind; name?: string };
  colors: ExtractedColor[];
  widths: ExtractedWidth[];
  dashes: ExtractedDash[];
  opacities: ExtractedOpacity[];
  typography: ExtractedType[];
  elements: ExtractedElement[];
  scaleHints: ScaleHint[];
  skipped: SkippedItem[];
  datasources: DatasourceItem[];
  bindings: BindingItem[];
  unresolved: UnresolvedItem[];
}

export function emptyExtracted(source: ExtractedStyle['source']): ExtractedStyle {
  return {
    source,
    colors: [], widths: [], dashes: [], opacities: [], typography: [],
    elements: [], scaleHints: [], skipped: [], datasources: [], bindings: [], unresolved: [],
  };
}
```

- [ ] **Step 3: 写 tests/helpers.ts**

```ts
// .agents/skills/cartography-init/tests/helpers.ts
import { readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

export function loadFixture(rel: string): Buffer {
  return readFileSync(path.join(fixturesDir, rel));
}

export function loadFixtureText(rel: string): string {
  return readFileSync(path.join(fixturesDir, rel), 'utf8');
}

export function makeTempDir(prefix = 'cartography-init-'): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}
```

- [ ] **Step 4: 安装并验证类型通过**

Run: `pnpm install && pnpm --filter @cartographymd/init-skill typecheck`
Expected: 依赖安装成功（better-sqlite3 使用预编译二进制）,typecheck 0 错误

- [ ] **Step 5: 提交**

```bash
git add pnpm-workspace.yaml .agents/skills/cartography-init
git commit -m "feat(init-skill): scaffold package and IR types"
```

---

### Task 2: style.json 适配器

**Files:**
- Create: `.agents/skills/cartography-init/src/adapters/style-json.ts`
- Create: `.agents/skills/cartography-init/src/detect.ts`
- Create: `.agents/skills/cartography-init/fixtures/style-min.json`
- Create: `.agents/skills/cartography-init/fixtures/style-boundary.json`
- Test: `.agents/skills/cartography-init/tests/adapter-style-json.test.ts`
- Test: `.agents/skills/cartography-init/tests/detect.test.ts`

**Interfaces:**
- Consumes: Task 1 的 IR 类型
- Produces: `parseStyleJson(text: string, fileName?: string): ExtractedStyle`；`detectSource(absPath: string, head: Buffer): SourceKind`(Task 4/5 扩展其嗅探分支）

**抽取规则（映射表，实现时逐行落实）:**

| style.json 来源 | IR 去向 |
|---|---|
| `paint.*-color` 字面量 | `colors`(hex/rgba 原样） |
| `paint.line-width`/`circle-radius`/`text-size` 字面量 | `widths`（或标注元素 `rawTypography.fontSize`) |
| `paint.line-dasharray [a,b]` | `dashes`(px) |
| `paint.*-opacity` 字面量 | `opacities` |
| `layout.text-font` + `layout.text-size` | `typography` |
| 图层 `type` | `geometry`:line→line, fill→polygon, circle/symbol→point（含文字→label), background→background, raster→raster |
| `minzoom`/`maxzoom` 与 paint zoom stops | `scaleHints`（事实句） |
| `filter`、`source-layer` | `bindings`(kind: filter / source-layer) |
| `["get",…]`、表达式值 | `skipped`(reason: 数据驱动表达式） |
| `sources` 各项 | `datasources`(identity: `type:urlOrTiles`) |

- [ ] **Step 1: 写失败测试（detect + 最小解析）**

```ts
// tests/detect.test.ts
import { describe, expect, it } from 'vitest';
import { detectSource } from '../src/detect.js';
import { loadFixture } from './helpers.js';

describe('detectSource', () => {
  it('detects style.json by extension and content', () => {
    expect(detectSource('/tmp/a.json', loadFixture('style-min.json'))).toBe('style');
  });
  it('detects sld by xml root when extension is odd', () => {
    const buf = Buffer.from('<?xml version="1.0"?><StyledLayerDescriptor xmlns="http://www.opengis.net/sld" version="1.0.0"/>');
    expect(detectSource('/tmp/a.bin', buf)).toBe('sld');
  });
});
```

```ts
// tests/adapter-style-json.test.ts
import { describe, expect, it } from 'vitest';
import { parseStyleJson } from '../src/adapters/style-json.js';
import { loadFixtureText } from './helpers.js';

describe('parseStyleJson', () => {
  it('extracts literal paint tokens and element geometry', () => {
    const ir = parseStyleJson(loadFixtureText('style-min.json'), 'style-min.json');
    expect(ir.source.kind).toBe('style');
    expect(ir.colors.map((c) => c.value)).toContain('#3388ff');
    const line = ir.elements.find((e) => e.name === 'roads-primary');
    expect(line?.geometry).toBe('line');
    expect(line?.style.strokeColor).toBe('#3388ff');
    expect(line?.style.strokeWidth).toEqual({ value: 2, unit: 'px' });
    expect(line?.style.dash).toEqual([{ value: 4, unit: 'px' }, { value: 2, unit: 'px' }]);
  });

  it('routes filters and source-layer to bindings, never to elements', () => {
    const ir = parseStyleJson(loadFixtureText('style-boundary.json'), 'style-boundary.json');
    expect(ir.bindings.some((b) => b.kind === 'source-layer' && b.expression === 'transportation')).toBe(true);
    expect(ir.bindings.some((b) => b.kind === 'filter' && b.expression.includes('"class"'))).toBe(true);
    for (const e of ir.elements) {
      expect(JSON.stringify(e)).not.toContain('source-layer');
      expect(JSON.stringify(e)).not.toContain('highway');
    }
  });

  it('skips data-driven expressions and records scale hints from zoom stops', () => {
    const ir = parseStyleJson(loadFixtureText('style-boundary.json'), 'style-boundary.json');
    expect(ir.skipped.some((s) => s.reason.includes('数据驱动') || s.reason.includes('expression'))).toBe(true);
    expect(ir.scaleHints.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 写 fixtures**

```json
// fixtures/style-min.json
{
  "version": 8,
  "name": "Mini",
  "sources": { "basemap": { "type": "vector", "url": "https://tiles.example.com/tiles.json" } },
  "layers": [
    { "id": "background", "type": "background", "paint": { "background-color": "#f8f8f6" } },
    { "id": "roads-primary", "type": "line", "source": "basemap", "source-layer": "transportation",
      "paint": { "line-color": "#3388ff", "line-width": 2, "line-dasharray": [4, 2] } }
  ]
}
```

```json
// fixtures/style-boundary.json
{
  "version": 8,
  "name": "Boundary",
  "sources": { "basemap": { "type": "vector", "url": "https://tiles.example.com/tiles.json" } },
  "layers": [
    { "id": "roads", "type": "line", "source": "basemap", "source-layer": "transportation",
      "filter": ["==", ["get", "class"], "primary"],
      "minzoom": 5, "maxzoom": 15,
      "paint": {
        "line-color": "#3388ff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1, 15, 4],
        "line-opacity": ["get", "opacity"]
      } },
    { "id": "place-label", "type": "symbol", "source": "basemap", "source-layer": "place",
      "layout": { "text-font": ["Noto Sans Regular"], "text-size": 12 },
      "paint": { "text-color": "#333333", "text-halo-color": "#ffffff", "text-halo-width": 1 } }
  ]
}
```

- [ ] **Step 3: 运行测试确认失败**

Run: `pnpm --filter @cartographymd/init-skill test`
Expected: FAIL —— `detectSource`/`parseStyleJson` 不存在

- [ ] **Step 4: 实现 detect.ts 与 style-json.ts**

```ts
// src/detect.ts
import type { SourceKind } from './ir.js';

/** 扩展名优先,内容嗅探兜底;qgz/zip 由 Task 4 的 qgis 适配器内部再细分。 */
export function detectSource(absPath: string, head: Buffer): SourceKind {
  const lower = absPath.toLowerCase();
  if (lower.endsWith('.json') || lower.endsWith('.style.json')) {
    if (looksLikeStyleJson(head)) return 'style';
  }
  if (lower.endsWith('.qgs') || lower.endsWith('.qgz')) return 'qgis';
  if (lower.endsWith('.lyrx')) return 'lyrx';
  if (lower.endsWith('.stylx')) return 'stylx';
  if (lower.endsWith('.sld') || lower.endsWith('.xml')) {
    if (looksLikeSld(head)) return 'sld';
    if (looksLikeQgs(head)) return 'qgis';
  }
  // 纯内容兜底
  if (looksLikeStyleJson(head)) return 'style';
  if (looksLikeSld(head)) return 'sld';
  if (looksLikeQgs(head)) return 'qgis';
  if (head.length >= 4 && head.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    return 'qgis'; // zip:qgz 或 lyrx 均由此进入,由适配器按内部文件名区分
  }
  throw new Error(`无法识别的输入格式: ${absPath}`);
}

function looksLikeStyleJson(head: Buffer): boolean {
  const t = head.toString('utf8');
  return t.includes('"layers"') && t.includes('"version"');
}
function looksLikeSld(head: Buffer): boolean {
  return head.toString('utf8').includes('StyledLayerDescriptor');
}
function looksLikeQgs(head: Buffer): boolean {
  return head.toString('utf8').includes('<qgis');
}
```

`style-json.ts` 要点（实现时遵守）:
- `JSON.parse` 失败 → 抛错（由 cli 转退出码 2)
- 遍历 `layers[]`:paint/layout 仅取字面量；数组/对象值且不是合法 dasharray 数字数组 → `skipped`;`["get",...]`/`["interpolate",...]` → `skipped`(interpolate 的 stops 同时转 `scaleHints` 事实句：`"zoom 5 时 1px,zoom 15 时 4px"`)
- 元素名 = slug(layer.id)(slug 规则见 Task 7 `slugify`，本 Task 先用 `layer.id` 原样，consolidate 统一处理——**注意：测试中 fixture 的 id 本身已合法**)
- `type: 'symbol'` 且有 text-font → geometry `label`，生成 `rawTypography`
- 每个元素至少写一个样式属性；纯 layout 无可转样式 → `skipped`
- `filter`/`source-layer` → `bindings`(`expression` 用 `JSON.stringify(filter)`)

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm --filter @cartographymd/init-skill test`
Expected: PASS(3 个 adapter-style-json + 2 个 detect)

- [ ] **Step 6: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): style.json adapter and source detection"
```

---

### Task 3: SLD 适配器

**Files:**
- Create: `.agents/skills/cartography-init/src/adapters/sld.ts`
- Create: `.agents/skills/cartography-init/fixtures/sld-min.xml`
- Create: `.agents/skills/cartography-init/fixtures/sld-boundary.xml`
- Test: `.agents/skills/cartography-init/tests/adapter-sld.test.ts`

**Interfaces:**
- Produces: `parseSld(text: string, fileName?: string): ExtractedStyle`

**抽取规则：** SLD 1.0(`CssParameter name="stroke"`）与 1.1(`se:SvgParameter`）均支持；Rule 名 → 元素名；LineSymbolizer→line、PolygonSymbolizer→polygon、PointSymbolizer→point、TextSymbolizer→label;`ogc:Filter` → `bindings`；`MinScaleDenominator`/`MaxScaleDenominator` → `scaleHints`;uom 非像素（metre/foot）且无法无损换算 → `skipped`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/adapter-sld.test.ts
import { describe, expect, it } from 'vitest';
import { parseSld } from '../src/adapters/sld.js';
import { loadFixtureText } from './helpers.js';

describe('parseSld', () => {
  it('extracts line/polygon symbolizers from SLD 1.0', () => {
    const ir = parseSld(loadFixtureText('sld-min.xml'), 'sld-min.xml');
    expect(ir.source.kind).toBe('sld');
    const road = ir.elements.find((e) => e.name === 'PrimaryRoad');
    expect(road?.geometry).toBe('line');
    expect(road?.style.strokeColor).toBe('#FF6600');
    expect(road?.style.strokeWidth).toEqual({ value: 2, unit: 'px' });
  });

  it('routes ogc:Filter to bindings and scaleDenominator to scale hints', () => {
    const ir = parseSld(loadFixtureText('sld-boundary.xml'), 'sld-boundary.xml');
    expect(ir.bindings.some((b) => b.kind === 'filter' && b.expression.includes('highway'))).toBe(true);
    expect(ir.scaleHints.some((h) => h.fact.includes('50000'))).toBe(true);
    for (const e of ir.elements) expect(JSON.stringify(e)).not.toContain('highway');
  });
});
```

- [ ] **Step 2: 写 fixtures**

```xml
<!-- fixtures/sld-min.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer><Name>roads</Name><UserStyle><Name>roads</Name>
    <FeatureTypeStyle>
      <Rule><Name>PrimaryRoad</Name>
        <LineSymbolizer><Stroke>
          <CssParameter name="stroke">#FF6600</CssParameter>
          <CssParameter name="stroke-width">2</CssParameter>
          <CssParameter name="stroke-dasharray">4 2</CssParameter>
        </Stroke></LineSymbolizer>
      </Rule>
      <Rule><Name>WaterArea</Name>
        <PolygonSymbolizer><Fill><CssParameter name="fill">#d8ecff</CssParameter>
          <CssParameter name="fill-opacity">0.8</CssParameter></Fill></PolygonSymbolizer>
      </Rule>
    </FeatureTypeStyle>
  </UserStyle></NamedLayer>
</StyledLayerDescriptor>
```

```xml
<!-- fixtures/sld-boundary.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer><Name>roads</Name><UserStyle><Name>roads</Name>
    <FeatureTypeStyle>
      <Rule><Name>Primary</Name>
        <ogc:Filter><ogc:PropertyIsEqualTo>
          <ogc:PropertyName>highway</ogc:PropertyName><ogc:Literal>primary</ogc:Literal>
        </ogc:PropertyIsEqualTo></ogc:Filter>
        <MinScaleDenominator>5000</MinScaleDenominator>
        <MaxScaleDenominator>50000</MaxScaleDenominator>
        <LineSymbolizer><Stroke>
          <CssParameter name="stroke">#FF6600</CssParameter>
          <CssParameter name="stroke-width">2</CssParameter>
        </Stroke></LineSymbolizer>
      </Rule>
    </FeatureTypeStyle>
  </UserStyle></NamedLayer>
</StyledLayerDescriptor>
```

- [ ] **Step 3: 运行测试确认失败** — Expected: FAIL(`parseSld` 不存在）

- [ ] **Step 4: 实现 sld.ts**

要点：
- `fast-xml-parser` 的 `XMLParser`,`ignoreAttributes: false`、`removeNSPrefix: true`（同时吃掉 `se:`/`sld:` 前缀；`ogc:` 前缀单独剥离）、`isArray` 对 `Rule`/`LineSymbolizer`/`PolygonSymbolizer`/`PointSymbolizer`/`TextSymbolizer` 强制数组
- Filter 序列化：把 `ogc:Filter` 子树以稳定文本（属性+标签路径）写入 `bindings[].expression`；不试图还原 OGC 表达式语法，但 PropertyName/Literal 必须出现在文本里
- `stroke-dasharray "4 2"`（空格分隔）→ `dashes`
- `fill-opacity`/`stroke-opacity` 0..1 → `opacities`
- `TextSymbolizer` 的 `Font` CssParameter(font-family/font-size/font-weight)→ `rawTypography`

- [ ] **Step 5: 运行测试确认通过** — Expected: PASS(2)

- [ ] **Step 6: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): SLD adapter"
```

---

### Task 4: QGIS 适配器（.qgs / .qgz)

**Files:**
- Create: `.agents/skills/cartography-init/src/adapters/qgis.ts`
- Create: `.agents/skills/cartography-init/fixtures/qgis-min.qgs`
- Create: `.agents/skills/cartography-init/fixtures/qgis-rulebased.qgs`
- Test: `.agents/skills/cartography-init/tests/adapter-qgis.test.ts`

**Interfaces:**
- Produces: `parseQgis(buffer: Buffer, fileName: string): ExtractedStyle`（内部按 zip 魔数走 .qgz 解包，否则按 XML 文本）

**抽取规则：** 渲染器类型 `singleSymbol`/`categorizedSymbol`/`graduatedSymbol`/`RuleBased`；符号层仅 `SimpleLine`/`SimpleFill`/`SimpleMarker`(prop k/v);RuleBased 每条规则符号进 elements（同渲染器一个 family),`filter` 属性 → `bindings`;`data_defined_properties` → 属性取静态值进 IR，覆盖表达式 → `bindings`(kind: `field-override`)；标注 `text-style` → `rawTypography`；图层 `<datasource>` + `provider` → `datasources`;`MapUnits`/`Percentage` 单位 → `skipped`；单位换算表：`MM`→mm、`Points`→pt、`Pixels`→px、`Inches`→in；颜色 `"r,g,b,a"` 255 基 → `#rrggbb`(a<255 → `rgba()`)。

- [ ] **Step 1: 写失败测试**

```ts
// tests/adapter-qgis.test.ts
import { describe, expect, it } from 'vitest';
import { parseQgis } from '../src/adapters/qgis.js';
import { loadFixture, loadFixtureText } from './helpers.js';

describe('parseQgis', () => {
  it('extracts single symbols with unit and color conversion', () => {
    const ir = parseQgis(loadFixture('qgis-min.qgs'), 'qgis-min.qgs');
    expect(ir.source.kind).toBe('qgis');
    const road = ir.elements.find((e) => e.name === 'roads');
    expect(road?.geometry).toBe('line');
    expect(road?.style.strokeColor).toBe('#dd8844');
    expect(road?.style.strokeWidth).toEqual({ value: 0.26, unit: 'mm' });
    expect(ir.datasources.some((d) => d.identity.includes('ogr'))).toBe(true);
  });

  it('keeps rule symbols as one family and routes filter expressions to bindings', () => {
    const ir = parseQgis(loadFixture('qgis-rulebased.qgs'), 'qgis-rulebased.qgs');
    const fam = ir.elements.filter((e) => e.family === 'roads');
    expect(fam.length).toBe(2);
    expect(ir.bindings.some((b) => b.kind === 'filter' && b.expression.includes('highway'))).toBe(true);
    expect(ir.bindings.some((b) => b.kind === 'field-override')).toBe(true);
    for (const e of ir.elements) expect(JSON.stringify(e)).not.toContain('"highway"');
  });
});
```

- [ ] **Step 2: 写 fixtures（最小但结构真实的 .qgs)**

```xml
<!-- fixtures/qgis-min.qgs -->
<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis projectname="min" version="3.34.0">
  <projectlayers>
    <maplayer type="vector" id="l1">
      <layername>roads</layername>
      <provider>ogr</provider>
      <datasource>/data/roads.shp</datasource>
      <renderer-v2 type="singleSymbol">
        <symbols><symbol type="line" name="0">
          <layer class="SimpleLine"><prop k="line_color" v="221,136,68,255"/><prop k="line_width" v="0.26"/><prop k="line_width_unit" v="MM"/></layer>
        </symbol></symbols>
      </renderer-v2>
    </maplayer>
  </projectlayers>
</qgis>
```

```xml
<!-- fixtures/qgis-rulebased.qgs -->
<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis projectname="rb" version="3.34.0">
  <projectlayers>
    <maplayer type="vector" id="l1">
      <layername>roads</layername>
      <provider>ogr</provider>
      <datasource>/data/roads.shp</datasource>
      <renderer-v2 type="RuleBased">
        <rules>
          <rule filter="&quot;highway&quot; = 'primary'" symbol="0" label="主干道"/>
          <rule filter="&quot;highway&quot; = 'residential'" symbol="1" label="居住区道路"/>
        </rules>
        <symbols>
          <symbol type="line" name="0">
            <layer class="SimpleLine">
              <prop k="line_color" v="221,136,68,255"/><prop k="line_width" v="0.5"/><prop k="line_width_unit" v="MM"/>
              <data_defined_properties><Option type="Map">
                <Option name="width" type="Map"><Option name="active" value="1" type="bool"/><Option name="expression" value="&quot;lanes&quot; * 0.8" type="QString"/></Option>
              </Option></data_defined_properties>
            </layer>
          </symbol>
          <symbol type="line" name="1">
            <layer class="SimpleLine"><prop k="line_color" v="153,153,153,255"/><prop k="line_width" v="0.2"/><prop k="line_width_unit" v="MM"/></layer>
          </symbol>
        </symbols>
      </renderer-v2>
    </maplayer>
  </projectlayers>
</qgis>
```

- [ ] **Step 3: 运行测试确认失败** — Expected: FAIL(`parseQgis` 不存在）

- [ ] **Step 4: 实现 qgis.ts**

要点：
- zip 魔数检测（`PK\x03\x04`)→ `fflate.unzipSync`，取内部首个 `.qgs` 条目；找不到 → 抛错
- XML 解析同 SLD 配置；`&quot;` 实体由解析器还原
- `renderer-v2` 分支：`singleSymbol` 单元素；`categorizedSymbol`/`graduatedSymbol` 每 category/range 一个元素（同一 family,`roleHint` 按序 primary→secondary→context),category 的 `value` 属性 → `bindings`(kind: `field-ref`);`RuleBased` 同上且 `filter` → `bindings`(kind: `filter`)
- `data_defined_properties`：遍历 Option Map,`active=1` → `bindings`(kind: `field-override`,`expression` 取 `Option[name=expression]@value`)；静态 prop 值照常进 style
- `prop k="line_style" v="dash"` + `customdash` → `dashes`
- 标注：`<labeling>` 下 `text-style` 的 font family/size/unit/buffer → `rawTypography` + `haloColor`/`haloWidth`

- [ ] **Step 5: 运行测试确认通过** — Expected: PASS(2)

- [ ] **Step 6: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): QGIS .qgs/.qgz adapter"
```

---

### Task 5: CIM 解释器 + .lyrx 适配器

**Files:**
- Create: `.agents/skills/cartography-init/src/adapters/cim.ts`
- Create: `.agents/skills/cartography-init/src/adapters/arcgis.ts`
- Create: `.agents/skills/cartography-init/fixtures/arcgis-min.lyrx`
- Test: `.agents/skills/cartography-init/tests/adapter-arcgis.test.ts`

**Interfaces:**
- Produces: `parseLyrx(buffer: Buffer, fileName: string): ExtractedStyle`;`cimSymbolToStyle(sym: CimSymbol): { style: CoreStyleProps; geometry: Geometry } | null`(null → 调用方记 skipped)

**抽取规则：** CIMSymbolLayer 白名单：`CIMSolidStroke`→strokeColor/strokeWidth(pt!)、`CIMSolidFill`→fillColor、`CIMCharacterMarker`/`CIMVectorMarker`→symbol 语义名+size、`CIMHaloFill`→halo;`CIMGeometricEffectDashes`→dash;CIM 颜色对象（`CIMRGBColor` values [r,g,b] 0-255)→ hex;**CIM 尺寸单位是 pt**;CIM 字段映射（`attributeMapping`)/`where` 子句 → `bindings`；几何效果链其余（buffer/wave/offset 等）→ `skipped`。lyrx 本身即 zip 或 JSON 文本，两种都要吃（real-world lyrx 常为 JSON 文本）。

- [ ] **Step 1: 写失败测试 + fixture**

```json
// fixtures/arcgis-min.lyrx(JSON 文本形态)
{
  "type": "CIMLayerDocument",
  "layerDefinitions": [
    {
      "type": "CIMFeatureLayer",
      "name": "roads",
      "renderer": {
        "type": "CIMSimpleRenderer",
        "symbol": {
          "type": "CIMSymbolReference",
          "symbol": {
            "type": "CIMLineSymbol",
            "symbolLayers": [
              { "type": "CIMSolidStroke", "color": { "type": "CIMRGBColor", "values": [51, 136, 255] }, "width": 1.5, "capStyle": "Round" }
            ]
          }
        }
      }
    },
    {
      "type": "CIMFeatureLayer",
      "name": "water",
      "renderer": {
        "type": "CIMSimpleRenderer",
        "symbol": {
          "type": "CIMSymbolReference",
          "symbol": {
            "type": "CIMPolygonSymbol",
            "symbolLayers": [
              { "type": "CIMSolidFill", "color": { "type": "CIMRGBColor", "values": [216, 236, 255] } }
            ]
          }
        }
      }
    }
  ]
}
```

```ts
// tests/adapter-arcgis.test.ts
import { describe, expect, it } from 'vitest';
import { parseLyrx } from '../src/adapters/arcgis.js';
import { loadFixture } from './helpers.js';

describe('parseLyrx', () => {
  it('extracts CIM solid stroke/fill with pt units and hex colors', () => {
    const ir = parseLyrx(loadFixture('arcgis-min.lyrx'), 'arcgis-min.lyrx');
    expect(ir.source.kind).toBe('lyrx');
    const roads = ir.elements.find((e) => e.name === 'roads');
    expect(roads?.geometry).toBe('line');
    expect(roads?.style.strokeColor).toBe('#3388ff');
    expect(roads?.style.strokeWidth).toEqual({ value: 1.5, unit: 'pt' });
    const water = ir.elements.find((e) => e.name === 'water');
    expect(water?.geometry).toBe('polygon');
    expect(water?.style.fillColor).toBe('#d8ecff');
  });

  it('skips unsupported CIM effects with reasons', () => {
    const ir = parseLyrx(loadFixture('arcgis-min.lyrx'), 'arcgis-min.lyrx');
    // fixture 中无 effect 时跳过本断言;有 CIMGeometricEffectBuffer 时必须进 skipped
    for (const s of ir.skipped) expect(s.reason.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`parseLyrx` 不存在）

- [ ] **Step 3: 实现 cim.ts + arcgis.ts**

`cim.ts` 要点：
- `cimColorToCss(c)`:`CIMRGBColor` → `#rrggbb`（四舍五入截断到整数）;`CIMHSVColor`/`CIMGrayColor` → 转 RGB 后 hex;未知类型 → null
- `cimSymbolToStyle`：按 `sym.type` 分派 `CIMLineSymbol`/`CIMPolygonSymbol`/`CIMPointSymbol`/`CIMTextSymbol`；遍历 `symbolLayers`，白名单外的 layer type 收集为 skipped 原因列表（返回值附带 `skippedReasons: string[]`)
- 尺寸字段（`width`/`size`/`xoffset`…）一律 `{ value, unit: 'pt' }`

`arcgis.ts` 要点：
- zip 检测同 qgis;JSON 文本直接 `JSON.parse`
- `layerDefinitions[]`:`CIMSimpleRenderer` 单元素；`CIMUniqueValueRenderer` 每组一元素（同一 family，组 value → `bindings` kind `field-ref`);`CIMClassBreaksRenderer` 同
- 图层 `featureTable.dataConnection`（工作空间路径/连接串）→ `datasources`

- [ ] **Step 4: 运行测试确认通过** — Expected: PASS(2)

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): CIM interpreter and .lyrx adapter"
```

---

### Task 6: .stylx 适配器

**Files:**
- Create: `.agents/skills/cartography-init/src/adapters/arcgis.ts`（扩展：导出 `parseStylx`)
- Modify: `.agents/skills/cartography-init/tests/adapter-arcgis.test.ts`（追加 stylx 用例）

**Interfaces:**
- Produces: `parseStylx(buffer: Buffer, fileName: string): ExtractedStyle`

**要点：** stylx 是 SQLite。表 `ITEMS`(`NAME`, `CATEGORY`, `CONTENT` BLOB=JSON)。用 better-sqlite3 只读打开；取 CATEGORY 为 Symbols/Colors 的行；`CONTENT` 走 `cimSymbolToStyle`（复用 Task 5)；无图层上下文 → 元素名取符号 NAME slug,family 由 CATEGORY 推；不存在的表/坏库 → 抛错（cli 转退出码 2)。fixture 由测试钩子现场生成，不提交二进制。

- [ ] **Step 1: 写失败测试（含 fixture 生成钩子）**

```ts
// 追加到 tests/adapter-arcgis.test.ts
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseStylx } from '../src/adapters/arcgis.js';

function makeStylx(): Buffer {
  const dir = mkdtempSync(path.join(tmpdir(), 'stylx-'));
  const file = path.join(dir, 'test.stylx');
  const db = new Database(file);
  db.exec('CREATE TABLE ITEMS (ID INTEGER PRIMARY KEY, CLASS INTEGER, CATEGORY TEXT, NAME TEXT, TAGS TEXT, CONTENT BLOB, KEY TEXT)');
  const content = JSON.stringify({
    type: 'CIMLineSymbol',
    symbolLayers: [{ type: 'CIMSolidStroke', color: { type: 'CIMRGBColor', values: [51, 136, 255] }, width: 1.5 }],
  });
  db.prepare('INSERT INTO ITEMS (CLASS, CATEGORY, NAME, CONTENT) VALUES (?, ?, ?, ?)')
    .run(3, 'Symbols', 'major-road', Buffer.from(content, 'utf8'));
  db.close();
  return readFileSync(file);
}

describe('parseStylx', () => {
  it('extracts named symbols from a stylx sqlite file', () => {
    const ir = parseStylx(makeStylx(), 'test.stylx');
    expect(ir.source.kind).toBe('stylx');
    const el = ir.elements.find((e) => e.name === 'major-road');
    expect(el?.style.strokeColor).toBe('#3388ff');
    expect(el?.style.strokeWidth).toEqual({ value: 1.5, unit: 'pt' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`parseStylx` 不存在）

- [ ] **Step 3: 实现 parseStylx**

- `new Database(path, { readonly: true, fileMustExist: true })`；输入是 Buffer → 先落临时文件再打开（better-sqlite3 不支持内存挂载）
- 表存在性检查：`SELECT name FROM sqlite_master WHERE type='table' AND name='ITEMS'`；缺失 → 抛错
- 遍历行，`CONTENT` JSON.parse 失败 → 该行进 `skipped`;CATEGORY 不在 Symbols/Colors/Labels → 进 `skipped`

- [ ] **Step 4: 运行测试确认通过** — Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): .stylx adapter via better-sqlite3"
```

---

### Task 7: consolidate（去重、命名、归并）

**Files:**
- Create: `.agents/skills/cartography-init/src/consolidate.ts`
- Test: `.agents/skills/cartography-init/tests/consolidate.test.ts`

**Interfaces:**
- Consumes: `ExtractedStyle`
- Produces:
  ```ts
  /** consolidate 后元素样式:原字面量值替换为 Token 名(string);dash 字面量残留为 string[]("4px" 形态) */
  export type ConsolidatedStyle = Partial<Record<keyof CoreStyleProps, string | string[]>>;

  /** consolidate 阶段尚未定义 emit 所需完整 typography 形态时,与 ir.ts 的 ExtractedType 同形 */
  export type TypographyToken = Omit<ExtractedType, 'nameHint' | 'usedBy'>;

  export interface ConsolidatedElement {
    name: string;               // 最终 TokenIdentifier(冲突已消解)
    geometry: Geometry;
    family?: string;
    role: 'primary' | 'secondary' | 'context';
    state: string;              // 默认 'default'
    layerRole?: LayerRole;
    style: ConsolidatedStyle;   // typography 值为 typography Token 名
    scaleHints: ScaleHint[];
  }

  export interface Consolidated {
    tokens: {
      colors: Record<string, string>;
      widths: Record<string, Dimension>;
      dashes: Record<string, Dimension[]>;
      opacities: Record<string, number>;
      typography: Record<string, TypographyToken>;
    };
    elements: ConsolidatedElement[]; // style 值已替换为 Token 名引用
    nameMap: Map<string, string>;    // 元素原 name → 最终 name(供 report 回填 symbolRef)
    notes: string[];                 // 归并说明(进报告)
  }
  export function consolidate(ir: ExtractedStyle): Consolidated;
  export function slugify(raw: string): string; // → TokenIdentifier;空 → ''
  ```

**规则：**
- `slugify`：保留 `[A-Za-z0-9_-]`，其余字符 → `-`，折叠重复 `-`，去首尾 `-`;空结果 → 调用方用中性名
- 颜色/宽度/虚线/透明度按值去重；命名优先 `nameHint` slug，冲突追加 `-2`/`-3`，无 hint → `color-1` 等
- typography 去重键：`fontFamily.join('|')+fontSize+fontWeight`
- 元素名冲突同规则；family 相同的元素按 roleHint 赋 `role`(primary/secondary/context)，无 hint 且 family 内唯一 → role `primary`；同 family 多元素共享 `state: default`
- `rawTypography` → typography Token，元素 `typography` 属性记 Token 名

- [ ] **Step 1: 写失败测试**

```ts
// tests/consolidate.test.ts
import { describe, expect, it } from 'vitest';
import { consolidate, slugify } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

describe('slugify', () => {
  it('keeps TokenIdentifier charset and transliterates nothing', () => {
    expect(slugify('Roads (primary)')).toBe('roads-primary');
    expect(slugify('主干道')).toBe('');
    expect(slugify('a  b__c')).toBe('a-b__c');
  });
});

describe('consolidate', () => {
  it('dedups colors by value and prefers semantic name hints', () => {
    const ir = emptyExtracted({ kind: 'style' });
    ir.colors.push(
      { value: '#3388ff', nameHint: 'Roads Primary', usedBy: ['l1'] },
      { value: '#3388ff', nameHint: 'roads-primary', usedBy: ['l2'] },
      { value: '#ffffff', usedBy: ['l3'] },
    );
    const c = consolidate(ir);
    expect(Object.values(c.tokens.colors)).toEqual(['#3388ff', '#ffffff']);
    expect(c.tokens.colors['roads-primary']).toBe('#3388ff');
    expect(c.tokens.colors['color-1']).toBe('#ffffff');
  });

  it('assigns roles within a family and replaces element values with token names', () => {
    const ir = emptyExtracted({ kind: 'style' });
    ir.colors.push({ value: '#3388ff', nameHint: 'accent', usedBy: ['a', 'b'] });
    ir.elements.push(
      { name: 'road-a', geometry: 'line', family: 'road', roleHint: 'primary', style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } }, scaleHints: [] },
      { name: 'road-b', geometry: 'line', family: 'road', roleHint: 'secondary', style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } }, scaleHints: [] },
    );
    ir.widths.push({ value: { value: 2, unit: 'px' }, nameHint: 'line', usedBy: ['a', 'b'] });
    const c = consolidate(ir);
    expect(c.elements[0].role).toBe('primary');
    expect(c.elements[0].style.strokeColor).toBe('accent');
    expect(c.elements[0].style.strokeWidth).toBe('line');
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`consolidate` 不存在）

- [ ] **Step 3: 实现 consolidate.ts**（纯函数；不做 IO)

- [ ] **Step 4: 运行测试确认通过** — Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): consolidate dedup, naming, family grouping"
```

---

### Task 8: emit（生成 CARTOGRAPHY.md 草稿）

**Files:**
- Create: `.agents/skills/cartography-init/src/emit.ts`
- Test: `.agents/skills/cartography-init/tests/emit.test.ts`

**Interfaces:**
- Consumes: `Consolidated` + `ExtractedStyle`（取 name、scaleHints、skipped 计数）
- Produces: `emitDocument(c: Consolidated, ir: ExtractedStyle, opts: { name: string }): string`

**规则：**
- front matter:`version: "0.3.0"`、`name`、去重后非空的 Token 组、`elements`（引用写作 `"{colors.x}"`)
- YAML 输出：手写发射器（只产 string/number/array/嵌套 map 的保守子集；字符串含 `: #{}\"'` 或匹配 TokenReference 形态时用双引号）——不引入 yaml 依赖
- 正文九章（Overview / Color / Typography & Labels / Composition & Density / Layering & Depth / Geometry & Symbols / Scale & Generalization / Map Elements / Data & Legend）全量非空：
  - 可推断事实 → 事实句（"主要线要素使用 `{colors.accent}` 与 `{widths.line}`")
  - 不可推断 → `> TODO(agent): 说明……`(Overview 的来源行写 `来源:<fileName>`)
  - Scale & Generalization：有 scaleHints 写事实列表；没有 → TODO
- elements 中值是 Token 名 → `"{colors.accent}"` 引用语法；Dimension → `"2px"`（数字+单位字符串，规范 §7.2 的 AbsoluteDimension 表示）;dash → `["4px", "2px"]` YAML 数组

- [ ] **Step 1: 写失败测试**

```ts
// tests/emit.test.ts
import { describe, expect, it } from 'vitest';
import { emitDocument } from '../src/emit.js';
import { consolidate } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

function sample() {
  const ir = emptyExtracted({ kind: 'style', name: 'Demo' });
  ir.colors.push({ value: '#3388ff', nameHint: 'accent', usedBy: ['road-a'] });
  ir.widths.push({ value: { value: 2, unit: 'px' }, nameHint: 'line', usedBy: ['road-a'] });
  ir.elements.push({
    name: 'road-a', geometry: 'line', family: 'road', roleHint: 'primary',
    style: { strokeColor: '#3388ff', strokeWidth: { value: 2, unit: 'px' } },
    scaleHints: [{ fact: 'zoom 5–15 可见' }],
  });
  ir.scaleHints.push({ fact: 'zoom 5–15 可见' });
  return { ir, c: consolidate(ir) };
}

describe('emitDocument', () => {
  it('emits version 0.3.0 front matter with token references', () => {
    const { ir, c } = sample();
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    expect(doc).toContain('version: "0.3.0"');
    expect(doc).toContain('name: Demo Atlas');
    expect(doc).toContain('accent: "#3388ff"');
    expect(doc).toContain('strokeColor: "{colors.accent}"');
    expect(doc).toContain('strokeWidth: "{widths.line}"');
  });

  it('keeps all nine sections non-empty and marks unknowns as TODO(agent)', () => {
    const { ir, c } = sample();
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    for (const h of ['## Overview', '## Color', '## Typography & Labels', '## Composition & Density',
      '## Layering & Depth', '## Geometry & Symbols', '## Scale & Generalization',
      '## Map Elements', '## Data & Legend']) {
      expect(doc).toContain(h);
    }
    expect(doc).toContain('TODO(agent)');
    expect(doc).toContain('zoom 5–15 可见');
  });

  it('never leaks bindings into the document', () => {
    const { ir, c } = sample();
    ir.bindings.push({ source: 'style', layer: 'roads', kind: 'filter', expression: '"highway" = \'primary\'' });
    const doc = emitDocument(c, ir, { name: 'Demo Atlas' });
    expect(doc).not.toContain('highway');
    expect(doc).not.toContain('dataProfile');
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`emitDocument` 不存在）

- [ ] **Step 3: 实现 emit.ts**

- [ ] **Step 4: 运行测试确认通过** — Expected: PASS(3)

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): emit CARTOGRAPHY.md draft with nine sections"
```

---

### Task 9: report(md + JSON + 分诊核验）

**Files:**
- Create: `.agents/skills/cartography-init/src/report.ts`
- Test: `.agents/skills/cartography-init/tests/report.test.ts`

**Interfaces:**
- Consumes: `ExtractedStyle`、`Consolidated`
- Produces:
  ```ts
  export function renderReportMarkdown(ir: ExtractedStyle, c: Consolidated): string;
  export function renderReportJson(ir: ExtractedStyle, c: Consolidated): string; // pretty JSON
  export function checkReportTriage(jsonPath: string): { ok: boolean; pending: string[] };
  ```

**JSON 结构（报告 schema，写进文档注释与测试）:**

```json
{
  "source": { "kind": "style", "name": "…", "file": "…" },
  "skipped": [{ "source": "…", "layer": "…", "reason": "…" }],
  "datasources": [{ "source": "…", "layer": "…", "identity": "ogr:/data/roads.shp", "providerType": "ogr" }],
  "bindings": [{ "source": "…", "layer": "…", "family": "…", "kind": "filter", "expression": "…", "symbolRef": "roads-primary" }],
  "unresolved": [{ "topic": "target tile source url/type", "detail": "…" }],
  "notes": ["归并说明……"]
}
```

- `symbolRef` 由 `nameMap` 回填（元素原 name → 最终名）
- `unresolved` 由适配器/主流程按来源常识填充（style.json 有 sources → glyphs/sprites/layer order 未决；qgis → 目标瓦片源未决……)
- md 报告：人读版，含 skipped/bindings/datasources/unresolved 四节 + "下一步：Agent 补写清单"
- `checkReportTriage`：读取 JSON，凡 `bindings[]` 缺 `triage.decision` → 收集 `layer+expression` 进 `pending`;`ok = pending.length === 0`

- [ ] **Step 1: 写失败测试**

```ts
// tests/report.test.ts
import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkReportTriage, renderReportJson, renderReportMarkdown } from '../src/report.js';
import { consolidate } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

function sampleIr() {
  const ir = emptyExtracted({ kind: 'qgis', name: 'Demo' });
  ir.elements.push({ name: 'roads', geometry: 'line', family: 'roads', roleHint: 'primary', style: { strokeColor: '#dd8844' }, scaleHints: [] });
  ir.colors.push({ value: '#dd8844', nameHint: 'roads', usedBy: ['roads'] });
  ir.bindings.push({ source: 'qgis', layer: 'roads', family: 'roads', kind: 'filter', expression: '"highway" = \'primary\'' });
  ir.datasources.push({ source: 'qgis', layer: 'roads', identity: 'ogr:/data/roads.shp', providerType: 'ogr' });
  ir.unresolved.push({ topic: 'target tile source url/type', detail: 'QGIS 工程不含瓦片源定义' });
  ir.skipped.push({ source: 'qgis', layer: 'roads', reason: '嵌套符号层特效' });
  return ir;
}

describe('report', () => {
  it('json backfills symbolRef from the name map', () => {
    const ir = sampleIr();
    const json = JSON.parse(renderReportJson(ir, consolidate(ir)));
    expect(json.bindings[0].symbolRef).toBe('roads');
    expect(json.datasources[0].identity).toContain('ogr:');
    expect(json.unresolved).toHaveLength(1);
  });

  it('markdown lists skipped and a next-steps checklist', () => {
    const md = renderReportMarkdown(sampleIr(), consolidate(sampleIr()));
    expect(md).toContain('嵌套符号层特效');
    expect(md).toContain('bindings');
    expect(md).toContain('补写');
  });

  it('checkReportTriage fails on untriaged bindings and passes after triage', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'report-'));
    const file = path.join(dir, 'INIT_REPORT.json');
    const ir = sampleIr();
    writeFileSync(file, renderReportJson(ir, consolidate(ir)));
    expect(checkReportTriage(file).ok).toBe(false);

    const triaged = JSON.parse(renderReportJson(ir, consolidate(ir)));
    triaged.bindings[0].triage = { decision: 'prose', note: '主干道强调色' };
    writeFileSync(file, JSON.stringify(triaged, null, 2));
    const res = checkReportTriage(file);
    expect(res.ok).toBe(true);
    expect(res.pending).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`report.ts` 不存在）

- [ ] **Step 3: 实现 report.ts**

- [ ] **Step 4: 运行测试确认通过** — Expected: PASS(3)

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): markdown and JSON generation report with triage check"
```

---

### Task 10: verify + CLI + 端到端

**Files:**
- Create: `.agents/skills/cartography-init/src/verify.ts`
- Create: `.agents/skills/cartography-init/src/cli.ts`
- Create: `.agents/skills/cartography-init/src/init.ts`
- Create: `.agents/skills/cartography-init/scripts/init.ts`
- Test: `.agents/skills/cartography-init/tests/cli.test.ts`
- Test: `.agents/skills/cartography-init/tests/verify.test.ts`(钉住 lint 真实返回形状 LintReport)

**Interfaces:**
- Consumes：全部前序模块
- Produces:
  ```ts
  export function verifyDocument(docText: string): { ok: boolean; errors: string[] }; // lint 0 错误
  export function runCli(argv: string[]): Promise<number>; // 退出码:0 成功;1 lint 未过/分诊未完成;2 用法/解析错误
  ```

**CLI 契约：**
```
init --input <path> --output <CARTOGRAPHY.md> [--name <name>] [--report <md>] [--report-json <json>]
init --check-report <INIT_REPORT.json>
```
- `--check-report`:triage 未完成 → stdout 列 pending，退出码 1；完成 → 退出码 0
- 解析失败/无法识别 → 退出码 2;lint 未过 → **不写任何文件**，退出码 1
- 成功路径：写 output(+ 可选 report)，摘要打印到 stdout

- [ ] **Step 1: 写失败测试（端到端）**

```ts
// tests/cli.test.ts
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { fixturesDir } from './helpers.js';

describe('runCli end-to-end', () => {
  it('generates a lint-clean document from style-min.json', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const out = path.join(dir, 'CARTOGRAPHY.md');
    const code = await runCli([
      '--input', path.join(fixturesDir, 'style-min.json'),
      '--output', out,
      '--report-json', path.join(dir, 'INIT_REPORT.json'),
    ]);
    expect(code).toBe(0);
    const doc = readFileSync(out, 'utf8');
    expect(doc).toContain('version: "0.3.0"');
    expect(doc).not.toContain('source-layer');
  });

  it('refuses to write on unrecognised input', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const out = path.join(dir, 'CARTOGRAPHY.md');
    const bad = path.join(dir, 'mystery.bin');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(bad, Buffer.from([0, 1, 2, 3]));
    const code = await runCli(['--input', bad, '--output', out]);
    expect(code).toBe(2);
    expect(existsSync(out)).toBe(false);
  });

  it('--check-report exits 1 until every binding is triaged', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'init-e2e-'));
    const reportJson = path.join(dir, 'INIT_REPORT.json');
    const code1 = await runCli([
      '--input', path.join(fixturesDir, 'style-boundary.json'),
      '--output', path.join(dir, 'CARTOGRAPHY.md'),
      '--report-json', reportJson,
    ]);
    expect(code1).toBe(0);
    expect(await runCli(['--check-report', reportJson])).toBe(1); // style-boundary 有 bindings
  });
});
```

- [ ] **Step 2: 运行测试确认失败** — Expected: FAIL(`runCli` 不存在）
另写 `tests/verify.test.ts`,直接钉住 `lint()` 的真实返回形状(`LintReport.valid` + `findings[]`,finding 字段为 `ruleId`/`severity`/`message`):

```ts
// tests/verify.test.ts
import { describe, expect, it } from 'vitest';
import { verifyDocument } from '../src/verify.js';
import { emitDocument } from '../src/emit.js';
import { consolidate } from '../src/consolidate.js';
import { emptyExtracted } from '../src/ir.js';

function validDoc(): string {
  const ir = emptyExtracted({ kind: 'style', name: 'Demo' });
  ir.colors.push({ value: '#3388ff', nameHint: 'accent', usedBy: ['road'] });
  ir.elements.push({
    name: 'road', geometry: 'line', family: 'road', roleHint: 'primary',
    style: { strokeColor: '#3388ff' }, scaleHints: [],
  });
  return emitDocument(consolidate(ir), ir, { name: 'Demo', sourceFile: 'style-min.json' });
}

describe('verifyDocument', () => {
  it('returns ok with empty errors for a lint-clean document', () => {
    const res = verifyDocument(validDoc());
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('maps error findings to "ruleId: message" strings when invalid', () => {
    const res = verifyDocument('---\nname: Missing Version\n---\n\n## Overview\nx\n');
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    for (const e of res.errors) expect(e).toContain(':');
  });
});
```

- [ ] **Step 3: 实现 verify.ts / init.ts / cli.ts / scripts/init.ts**

`verify.ts`:
```ts
import { lint } from '@mapseekai/cartography.md';

export function verifyDocument(docText: string, sourcePath = 'CARTOGRAPHY.md') {
  const report = lint(docText, { sourcePath });
  const errors = report.findings
    .filter((f) => f.severity === 'error')
    .map((f) => `${f.ruleId}: ${f.message}`);
  return { ok: report.valid && errors.length === 0, errors };
}
```

`scripts/init.ts`:
```ts
#!/usr/bin/env node
import { runCli } from '../src/cli.js';

const code = await runCli(process.argv.slice(2));
process.exit(code);
```

注意：verify 依赖 `@mapseekai/cartography.md` 的 dist 已构建；root `check` 顺序保证（见 Task 11)。

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm build && pnpm --filter @cartographymd/init-skill test`
Expected: PASS(3)

- [ ] **Step 5: 提交**

```bash
git add .agents/skills/cartography-init
git commit -m "feat(init-skill): CLI, verification gate, end-to-end flow"
```

---

### Task 11: SKILL.md + boundary 测试 + 根脚本/CI 接入

**Files:**
- Create: `.agents/skills/cartography-init/SKILL.md`
- Create: `.agents/skills/cartography-init/tests/boundary.test.ts`
- Modify: `package.json`（根；加 `test:init` / `typecheck:init`,`check` 在 build 之后追加 init 验证）
- Modify: `.github/workflows/ci.yml`（跟随 data-profile 先例，build 之后加 init 的 typecheck/test 步）

**Interfaces:**
- Produces: `pnpm test:init`、`pnpm typecheck:init`（根脚本）;SKILL.md(Agent 消费）

- [ ] **Step 1: 写 boundary 测试**

```ts
// tests/boundary.test.ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { emitDocument } from '../src/emit.js';
import { consolidate } from '../src/consolidate.js';
import { parseStyleJson } from '../src/adapters/style-json.js';
import { fixturesDir } from './helpers.js';

describe('boundary', () => {
  it('generated document contains no data bindings', () => {
    const ir = parseStyleJson(readFileSync(path.join(fixturesDir, 'style-boundary.json'), 'utf8'));
    const doc = emitDocument(consolidate(ir), ir, { name: 'Boundary' });
    for (const forbidden of ['source-layer', 'highway', 'filter', 'dataProfile']) {
      expect(doc).not.toContain(forbidden);
    }
  });

  it('package does not depend on renderer libraries', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const forbidden of ['maplibre-gl', 'mapbox-gl', 'leaflet', 'openlayers', 'arcgis-rest-js']) {
      expect(deps).not.toContain(forbidden);
    }
  });
});
```

- [ ] **Step 2: 写 SKILL.md**

结构（各节完整成文，语言中文，含触发时机/命令/流程/分诊表/限制）:
- frontmatter:`name: cartography-init`,`description: Use when the user wants to convert an existing map style (style.json, .qgs/.qgz, .lyrx/.stylx, .sld) into a CARTOGRAPHY.md draft…`
- 触发与不触发（从零创作 → cartography-md 技能）
- 命令:`pnpm --filter @cartographymd/init-skill init -- --input … --output … --report … --report-json …`
- 工作流：生成 → 读报告 → 补写（语义命名、设计意图、TODO(agent) 段落）→ **bindings 分诊**（三选一，编辑 `INIT_REPORT.json` 写入 `triage`)→ `init -- --check-report INIT_REPORT.json` → `cartographymd lint CARTOGRAPHY.md`
- 分诊决策表：设计意图 prose / 运行时保留 / 显式丢弃（各配一条标准与例子）
- 限制：数据绑定绝不进文档；不支持的 CIM/符号层进 skipped；草稿不是成品，补写完成前不得宣称迁移完成

- [ ] **Step 3: 接入根脚本与 CI**

根 `package.json` scripts 追加：
```json
"test:init": "pnpm --filter @cartographymd/init-skill test",
"typecheck:init": "pnpm --filter @cartographymd/init-skill typecheck"
```
`check` 改为：
```json
"check": "pnpm run schema:check && pnpm run typecheck && pnpm run typecheck:init && pnpm run test && pnpm run build && pnpm run test:init && pnpm --filter @mapseekai/cartography.md run check-package"
```
（`test:init` 必须位于 `build` 之后：verify 依赖 cli dist。)

`ci.yml` 在 "Run data-profile skill tests" 步后追加：
```yaml
      - name: Typecheck cartography-init skill
        run: pnpm --filter @cartographymd/init-skill typecheck

      - name: Run cartography-init skill tests
        run: pnpm --filter @cartographymd/init-skill test
```

- [ ] **Step 4: 全量验证**

Run: `pnpm check`
Expected: 全绿（含新增 init 步骤；data-profile 134/134 与 CLI 115/115 不回归）

- [ ] **Step 5: 提交**

```bash
git add package.json .github/workflows/ci.yml .agents/skills/cartography-init
git commit -m "feat(init-skill): SKILL.md, boundary tests, root script and CI wiring"
```

---

## Self-Review 记录

- **Spec coverage**:§3 架构五段 → Task 2-10;§4 IR → Task 1;§5 五源边界 → Task 2-6;§6 consolidate → Task 7;§7 emit → Task 8;§8 CLI/SKILL/分诊/资料链 → Task 9-11;§9 测试 → 各 Task 测试 + Task 11 boundary;§10 依赖边界 → Task 1/11;§11 验收 1-6 → Task 11 Step 4 全量 + Task 9 分诊核验 + Task 10 退出码。
- **Placeholder scan**：无 TBD/TODO 步骤；fixture 与测试代码全量给出；适配器实现节以映射表 + 要点约束行为（解析代码在任务内迭代，属实现细节而非规格缺口）。
- **Type consistency**:`ExtractedStyle` 字段名贯穿 Task 2-10;`slugify`/`consolidate` 签名在 Task 7 定义、Task 8/9/10 消费一致；`runCli` 退出码语义在 Task 10 定义、Task 11 SKILL.md 引用一致。
- **已知风险**:better-sqlite3 在 CI ubuntu 有预编译二进制；verify 依赖构建顺序已在根脚本编排；QGIS/SLD XML 实体与命名空间差异由 fast-xml-parser 配置兜底，超出部分进 skipped。
