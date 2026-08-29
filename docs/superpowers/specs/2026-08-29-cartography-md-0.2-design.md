# cartography.md 0.2 通用规范重构设计

> 状态：已确认设计
> 日期：2026-08-29
> 目标版本：0.2.0
> 范围：格式规范、schema、核心 CLI/API、文档、示例及 Agent Skills

## 1. 背景

当前 `CARTOGRAPHY.md` 同时承担制图设计系统、数据契约、任务配置和 MapLibre 样式治理职责。它能够严格检查数据与样式的一致性，但也因此与单个数据集、单次任务和单个渲染器绑定，无法作为长期稳定、跨项目迁移的制图设计参考。

0.2.0 将采用 Google [`DESIGN.md`](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) 的基本格式哲学：一个自包含的 Markdown 文件由机器可读 token 和人类可读设计理由组成；prose 表达设计本身，token 提供准确上下文，而不是充当渲染指令。cartography.md 保留地图领域真正通用的制图内容，但不复刻 UI 组件模型。

本次变更发生在项目尚未发布的开发阶段，因此直接进行破坏性升级，不提供旧 schema 兼容层或迁移说明。

## 2. 核心原则

`CARTOGRAPHY.md` 是唯一标准化、可迁移、可由核心工具验证的工件。

它只描述长期稳定的制图设计系统：视觉身份、设计 token、视觉层级、色彩、字体与标注、线面符号语言、比例尺变化、构图、状态、无障碍和评审原则。

它不描述：

- 用户本次任务；
- 实际数据字段、数据源或数据图层；
- `DATA_PROFILE.json` 的路径或格式；
- MapLibre、QGIS 或其他渲染器；
- style、layer、expression、source-layer 等目标格式概念；
- 输出文件、运行时方案或适配器；
- 设计来源或溯源字段。

数据画像和用户任务属于 Skill 的运行时上下文。MapLibre 只能出现在独立 `data-profile` Skill 及其脚本和 fixture 中，不能出现在通用规范、schema、核心包、核心 API、核心规则或通用示例中。

## 3. 目标与非目标

### 3.1 目标

- 让一份 `CARTOGRAPHY.md` 能跨数据集、专题、任务和渲染器复用。
- 保留现有格式、parser、token 引用、章节、finding、diff 和 CLI 的可用基础。
- 让不同 `CARTOGRAPHY.md` 仍能形成鲜明、可辨识的视觉家族。
- 让 prose 成为专业判断的主要载体，结构化 token 提供精确值。
- 将核心验证严格限制在单个 `CARTOGRAPHY.md` 的内部有效性。
- 通过唯一 schema 来源消除 Zod 与 JSON Schema 漂移。
- 将通用 Skill 与可包含 MapLibre 的数据画像 Skill 分离。

### 3.2 非目标

- 验证数据事实、数据画像或目标样式。
- 定义 `DATA_PROFILE.json` 的公共 schema 或版本协议。
- 定义 renderer adapter、中间样式方案或跨渲染器转换接口。
- 自动判断地图视觉质量或任务适配度。
- 为旧 0.1 文档提供兼容解析或迁移工具。
- 在核心包中保留 MapLibre 能力或依赖。

## 4. 系统边界

核心数据流只有一个输入工件：

```text
CARTOGRAPHY.md
      ↓
parse / lint / diff / spec / rules
```

Skill 工作流位于核心之外：

```text
稳定且唯一可迁移
CARTOGRAPHY.md
       ↓
通用 cartography-md Skill
       ↑
用户任务 + 可选 DATA_PROFILE.json
                 ↑
          data-profile Skill
       （这里可以使用 MapLibre）
```

核心工具不读取 Skill 运行时输入，也不根据这些输入改变 `CARTOGRAPHY.md` 的有效性。

## 5. 文档模型

### 5.1 文件结构

继续复用现有的双层结构：

1. 文件顶部必需的最小 YAML front matter；
2. 使用规范化 `##` 标题组织的 Markdown prose。

保留必需 front matter 是对现有实现的有意复用，使 parser、格式版本识别、schema 和 diff 无需改成无元数据模式。prose-first 表示 prose 承载设计判断，不表示文件可以缺少身份和版本。

YAML 中的精确 token 值是规范值；prose 解释其用途、边界、取舍和例外。发生可确定的值冲突时，token 值优先，同时工具可以报告矛盾。工具不得假装能够理解或验证所有自然语言判断。

### 5.2 根结构

0.2.0 根字段如下：

```yaml
version: <"0.2.0">
name: <string>
description: <string?>
locale: <string?>
tokens: <TokenSet?>
accessibility: <Accessibility?>
omitted: <OmittedSection[]?>
extensions: <object?>
```

字段要求：

- `version` 和 `name` 必填；
- 其余字段可选；
- 不得新增 `source`、`target`、`data`、`intent.primaryTask` 或任何渲染器字段；
- 未知根键应被保留；疑似规范键拼写错误时给出 warning；
- 自定义扩展应放在 `extensions` 中或使用命名空间键。

### 5.3 Token 模型

继续保留现有 `tokens` 容器和 `{path.to.token}` 引用语法。`tokens` 是开放集合，不要求每份设计系统拥有相同的 token 组。

规范内置并可确定校验的推荐组包括：

- `colors`：通用 CSS color；
- `typography`：字体族、字号、字重、行高、字距等稳定排版值；
- `widths`：线宽或描边宽度；
- `sizes`：符号和其他尺寸；
- `opacities`：0–1 范围的透明度。

其他 token 组可以通过开放结构保存。已知组进行类型校验，未知组保留，不被解释为渲染属性。

YAML 标量中的 token 引用必须占据完整字符串；Markdown prose 可以在句子中内嵌引用。两种引用都必须解析到同一 front matter 内的值；断链和循环是错误。

### 5.4 Accessibility

复用现有显式对比关系：

```yaml
accessibility:
  contrastPairs:
    - id: label-on-canvas
      foreground: "{tokens.colors.ink}"
      background: "{tokens.colors.canvas}"
      minimum: 4.5
      kind: text
```

该结构只检查文件内部声明的颜色关系，不代表实际渲染、混合、影像背景或所有视口已经通过无障碍评审。

### 5.5 YAML 确定性约束

复用现有安全、确定性的 YAML 子集：

- 禁止重复键；
- 禁止 anchor、alias 和 merge key；
- 禁止自定义 tag 和可执行值；
- 禁止 tab 缩进；
- 长篇理由必须放在 Markdown，不放入 YAML block scalar；
- 日期、前导零和其他歧义标量应显式加引号。

## 6. Markdown 章节

规范章节按以下顺序出现：

1. `Overview`
2. `Intent & Audience`
3. `Visual Hierarchy`
4. `Color`
5. `Typography & Labels`
6. `Geometry & Symbols`
7. `Scale & Generalization`
8. `Layering & Composition`
9. `Interaction States`
10. `Accessibility`
11. `Review Principles`
12. `Do's and Don'ts`

各章节职责如下：

- `Overview`：提供具体、可唤起完整视觉世界的设计参照，避免只写“现代、清晰、专业”等泛化形容词。
- `Intent & Audience`：描述设计系统长期服务的场景和人群，不记录本次用户任务。
- `Visual Hierarchy`：描述背景、上下文、主体、焦点和关键状态之间的稳定显著性关系。
- `Color`：解释 palette、语义角色、强调稀缺性、明度和饱和度取舍。
- `Typography & Labels`：描述字体性格、标注层级、halo、密度、冲突和可读性原则。
- `Geometry & Symbols`：描述点、线、面、纹理、图案和符号的家族语言，不绑定具体数据几何。
- `Scale & Generalization`：以渲染器无关的比例尺阶段描述渐进表达和制图综合，不保存 zoom 数值。
- `Layering & Composition`：描述层叠、留白、密度和构图，不保存实际 layer ID 或顺序值。
- `Interaction States`：描述 hover、selection、alert、invalid 等状态之间的视觉关系，并要求保留底层业务语义。
- `Accessibility`：描述颜色冗余、对比度、色觉、小屏标注和关键状态原则。
- `Review Principles`：描述长期适用的设计评审维度，不声明外部 fixture 或验证输入。
- `Do's and Don'ts`：用强约束的正反例保护设计家族特征。

章节可以通过 `omitted` 有理由地省略。条目可以是规范章节名，也可以是包含 `section` 和可选 `reason` 的对象。未知章节应保留；重复规范章节是错误；已出现的规范章节应按规定顺序排列。现有中英文规范章节别名机制继续保留，并与新的章节集合一起更新。

专业模式不进入根 schema。设计系统确有长期、可复用的专业约束时，应把它写成相关规范章节下的 prose 子章节；单次任务模式仍只存在于 Skill 的运行时上下文。

## 7. 现有模型的复用与处置

### 7.1 原样复用

- YAML front matter + Markdown body；
- `version`、`name`、`description`、`locale`；
- `tokens` 容器；
- `{path.to.token}` 引用；
- `accessibility.contrastPairs`；
- `omitted` 和 `extensions`；
- 确定性 YAML 限制；
- parser、section extractor、finding、strict mode 和退出码；
- `parse`、`lint`、`diff`、`spec`、`rules` 命令。

### 7.2 迁移为 prose

- `intent.aesthetic` 和长期 audience → `Overview` / `Intent & Audience`；
- `hierarchy` → `Visual Hierarchy`；
- `labels` → `Typography & Labels`；
- `states` → `Interaction States`；
- zoom 与 generalization 原则 → `Scale & Generalization`；
- layer-order 原则 → `Layering & Composition`；
- scales 与 encodings 中可复用的视觉通道原则 → 对应 prose；
- validation 中通用的设计评审原则 → `Review Principles`。

### 7.3 从核心删除

- `target`；
- `data`；
- 具体 `scales`；
- 数据绑定的 `encodings`；
- 实际 `layerOrder`；
- `maplibre`；
- `outputs`；
- 运行时 `security` 和 `performance` 配置；
- `DATA_PROFILE.json` schema 和 API；
- style/profile 跨文件验证；
- renderer adapter 与运行时方案模型。

## 8. 核心校验模型

核心 linter 只接受一个 `CARTOGRAPHY.md` 字符串或文件。

### 8.1 保留的规则

- front matter fence 和 YAML 语法；
- YAML 确定性与安全限制；
- 0.2.0 Zod schema；
- 文档大小；
- 重复、缺失、空白和乱序章节；
- `omitted` 合法性；
- 未知根键和疑似拼写错误；
- YAML/Markdown token 引用断链和循环；
- 已知 token 类型；
- 通用 CSS color；
- 显式 contrast pair；
- token 和章节摘要。

### 8.2 删除的规则

- zoom band 数值与重叠；
- layer order 与 encoding 关联；
- scale、field、source、source-layer 和 geometry；
- profile schema、字段覆盖和稳定 ID；
- MapLibre style specification；
- style metadata、token drift、feature-state、filter 和 portability；
- render fixture 声明。

### 8.3 不做出的保证

lint 通过只表示 `CARTOGRAPHY.md` 的结构和可确定内部关系有效。它不表示：

- 数据正确或完整；
- 任何目标样式有效；
- 地图已经正确渲染；
- 地图符合某次用户任务；
- 地图在审美、无障碍或专业制图上已经完成人工评审。

## 9. CLI 与公共 API

保留命令：

```text
cartographymd parse CARTOGRAPHY.md
cartographymd lint CARTOGRAPHY.md
cartographymd diff before.md after.md
cartographymd spec
cartographymd rules
```

删除 `lint --profile` 和 `lint --style` 以及所有对应文件读取逻辑。

保留现有结构化 finding、severity、strict mode 和退出码：

- `0`：校验通过；
- `1`：存在阻断 finding；
- `2`：参数、文件读取或内部执行失败。

`LintOptions` 只保留 `sourcePath`、`strict`、自定义 document rules 和文档大小限制等单文件选项。`LintReport` 删除 profile/style artifact 状态。公共 API 不再导出 `DataProfile`、`validateMapLibreStyle` 或其他 renderer-specific 类型和函数。

无效文档应返回结构化 findings，而不是因普通格式错误直接崩溃。

## 10. Schema 单一来源

现有 Zod schema 继续作为运行时规范来源。`schema/cartography.schema.json` 从同一来源生成，并通过边界 fixture 做等价性测试。JSON Schema 不再手工维护独立必填集。

`schema/data-profile.schema.json` 从核心规范和发布包删除。`DATA_PROFILE.json` 若由 Skill 生成，其结构属于 Skill 的非规范性实现细节，不参与 cartography.md 版本协商。

中英文 spec 应保持相同章节和字段含义。规范性 schema 表格应从同一结构来源生成或通过测试核对，避免文档再次与运行时实现漂移。

## 11. Skills

### 11.1 通用 `cartography-md` Skill

该 Skill 保持 renderer-neutral：

1. 查找并完整读取 `CARTOGRAPHY.md`；
2. 运行核心 linter；
3. 理解 token、prose 和 Do's/Don'ts；
4. 结合当前任务和可用运行时上下文做制图判断；
5. 不把任务、数据字段或渲染器信息写回规范；
6. 不把单文件 lint 通过描述为数据或样式验证通过；
7. 将目标产物生成交给当前环境中的工具或目标 Skill。

### 11.2 可选 `data-profile` Skill

该 Skill 根据用户实际数据生成运行时 `DATA_PROFILE.json`：

- 可以读取已有样式、metadata、TileJSON、MVT 或其他输入；
- 可以包含 MapLibre 专属发现逻辑；
- 可以记录 source、source-layer、字段、几何、值域、采样和未解决项；
- 不得编造未观察或未声明的事实；
- 部分成功时保留已观察事实并明确未解决项；
- 不修改 `CARTOGRAPHY.md`；
- 不向核心 CLI 注册 profile 校验；
- 其脚本、依赖和 fixture 与核心 npm 包隔离。

## 12. 文档与示例

需要同步更新：

- `docs/spec.md` 和 `docs/spec.zh-CN.md`；
- `README.md` 和 `README.zh-CN.md`；
- `docs/api.md` 和 `docs/api.zh-CN.md`；
- `packages/cli/README.md`；
- `schema/cartography.schema.json`；
- 通用示例和 Skill 文档。

现有 OpenFreeMap Bright 资产不直接丢弃：

- 颜色、字体、层级和制图原则提炼为 renderer-neutral 的通用 `CARTOGRAPHY.md`；
- 字段、source、source-layer、zoom、layer ID 和 MapLibre 章节从通用示例删除；
- 现有 `style.json`、`DATA_PROFILE.json` 和相关事实移入 `data-profile` Skill fixture；
- 核心示例目录只展示一个可独立 lint 的 `CARTOGRAPHY.md`。

现有 L0–L3 conformance-level 提案不再适用并从当前文档集删除。0.2.0 不使用成熟度等级，也不以外部证据是否存在改变 `CARTOGRAPHY.md` 的有效性。

## 13. 错误处理

- 文件无法读取、CLI 参数无效或内部执行失败时返回结构化错误和退出码 2；
- YAML 语法、schema、引用或章节错误返回 findings 和退出码 1；
- 未知扩展保留，不静默删除；
- 无法理解 prose 不得产生虚假的确定性 finding；
- Skill 缺少数据事实时报告未知或请求信息，不修改固定规范来填补空缺；
- `data-profile` Skill 遇到部分数据失败时区分部分成功和完全失败；
- 核心工具绝不因为没有 profile、style 或 renderer 而报错。

## 14. 测试策略

### 14.1 核心单元测试

- front matter 与安全 YAML；
- 0.2.0 schema 边界；
- token 类型；
- YAML 和 Markdown 引用；
- section、alias、order 和 `omitted`；
- 通用 CSS color；
- contrast pair；
- finding、strict mode 和退出码；
- diff 和 report。

### 14.2 一致性测试

- Zod 与生成 JSON Schema 对边界 fixture 结果一致；
- 英文和中文 spec 结构一致；
- `rules` 输出与实际启用规则一致；
- `spec` 输出与发布规范一致；
- 通用示例仅凭自身通过 lint。

### 14.3 边界测试

- 核心包不依赖 renderer-specific 包；
- 核心 API 不导出 profile/style/renderer 能力；
- 核心 CLI 拒绝已删除的 `--profile` 和 `--style` 参数；
- 核心规范、schema、核心包和通用示例中不存在 MapLibre 绑定；
- MapLibre 仅允许出现在 `data-profile` Skill 及其 fixture 中。

### 14.4 Skill 测试

- 通用 Skill 能读取并遵循 renderer-neutral 示例；
- 通用 Skill 不修改固定规范以适配单次任务；
- `data-profile` Skill 可以使用现有 MapLibre fixture 生成用户画像；
- 画像生成失败不会影响核心 `CARTOGRAPHY.md` 的 lint 结果。

## 15. 验收标准

0.2.0 完成时必须满足：

1. `CARTOGRAPHY.md` 是唯一标准化和核心验证工件。
2. 根 schema 只包含稳定设计系统字段。
3. prose 能形成具体、可辨识的地图视觉家族，而不是通用形容词集合。
4. 核心规范和核心包没有 MapLibre 或其他 renderer 绑定。
5. 核心 npm 包不依赖 MapLibre。
6. CLI/API 仅解析、校验和比较 `CARTOGRAPHY.md`。
7. 数据画像、样式和用户任务不会影响 lint 有效性。
8. Zod 和 JSON Schema 不再漂移。
9. 原有 parser、token、section、finding、diff 和 CLI 基础得到复用。
10. 中英文文档、API 文档和通用示例与 0.2.0 一致。
11. 通用 `cartography-md` Skill 保持 renderer-neutral。
12. 独立 `data-profile` Skill 可以包含 MapLibre，但不进入核心规范或校验器。

## 16. 最终原则

> `CARTOGRAPHY.md` 保存可迁移的制图视觉身份和长期设计判断；核心工具只验证该文件自身。用户任务、数据画像和目标渲染器属于 Skill 的运行时工作，不得反向污染通用规范。
