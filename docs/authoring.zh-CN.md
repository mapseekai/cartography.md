# 编写 0.4.0 设计系统

写出不了解原数据集的作者也能执行的决定。YAML 保存精确 Token，正文解释用途、边界和关系。提取旧样式时，没有证据的设计理由保留具体 TODO，不要编造。

| 章节 | 必须回答的问题 |
|---|---|
| Overview | 视觉身份是什么？阅读目标和优先级是什么？ |
| Colors | 各颜色的语义与禁用组合是什么？ |
| Typography & Labels | 拥挤时先去掉什么标注，必须保留什么？ |
| Composition & Density | 主体、上下文、留白如何平衡？ |
| Layering & Depth | 谁突出、谁退后、谁不能被遮挡？ |
| Geometry & Symbols | 点线面如何保持家族相似性？尺寸和间距采用什么约定？ |
| Scale & Generalization | 基础表达在哪一阶段？什么改变，什么不变？ |
| Map Elements | 哪些组件代表本设计，何时使用或避免？ |
| Do's and Don'ts | 哪些常见错误会破坏视觉身份或语义？ |

重要组件可采用以下说明模板：Purpose（用途）、Visual Character（视觉特征与理由）、Use When（适用）、Avoid When（不适用）、Scale Behavior（尺度）、State Behavior（状态）、Invariants（不变量）、Do Not（禁忌）。模板不属于格式强制结构。解释每个视觉通道的用途。“先移除上下文标注，再减少导航地名”比“标注要清晰”更可执行。

保持精确值稳定。为 overview/regional/local/detail 写明实际 Token 引用、显隐、可变化属性和不变量，不写 renderer zoom 表达式。平滑过渡用正文说明；目标只能分阶段切换时报告差异。

显式定义 critical 与 critical-selected，保持风险色和虚线，用轮廓或套线增加选中反馈。不得拆分状态名或推断继承。明确语义状态、操作反馈、装饰的优先级；不维护交互时直接说明。

专题设计应说明无序类别、强度单调序列以及仅适用于有意义中点的发散色彩。区分 missing、unknown、zero、not applicable，用图例解释并补充形状、图案或文字。压低背景和上下文。字段、分类算法和断点仍属于运行时。

分别报告：格式校验（Schema、类型、引用、章节、确定性边界）；设计评审（具体身份、层级、组件边界、尺度依据、状态冲突、缺失与零、冗余通道）；目标验证（语法、资源、能力警告、替代与损失）；视觉评审（实际可读性、密度、状态与无障碍）。未执行的检查须明确标记。

另见[迁移说明](migrations/0.3-to-0.4.zh-CN.md)与[适配契约](adapter-contracts.md)。
