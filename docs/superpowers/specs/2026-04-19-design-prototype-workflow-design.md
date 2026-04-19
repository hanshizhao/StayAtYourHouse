# 设计图分层消费方案

## 问题

writing-plans 阶段同时输入设计文档 + .pen 原型数据时，.pen 节点数据量过大导致实施计划编写卡住。

## 现状流程

```
设计文档 + .pen → writing-plans(卡住) → workflow-init → workflow-next
```

## 改进后流程

```
设计文档 → writing-plans → workflow-init(导入 + 生成索引) → workflow-next(按索引定向读取)
   ↑ 不带 .pen                    ↑ 浅读 .pen              ↑ 按索引深读
```

核心思路：不丢数据，不压缩数据，在正确的阶段读取正确的深度。

- writing-plans：只读设计文档，不读 .pen 文件
- workflow-init：浅读 .pen（readDepth=2-3），生成设计索引文件
- workflow-next：根据索引定向深读当前 FEAT 相关组件

## 设计索引文件

### 格式

```markdown
# Design Index: <feature-name>

Source: <relative-path-to-.pen-file>

## <画板名称> (<nodeId>)
- <组件名称> (<nodeId>): <子组件名称> (<nodeId>), ...
```

### 存放位置和命名

- 与 .pen 文件同目录
- 命名：原型文件名去掉 `.pen` 后缀，加 `-index.md`
- 示例：`docs/prototypes/2026-04-18-debt-management-design.pen` → `docs/prototypes/2026-04-18-debt-management-design-index.md`

### 示例

```markdown
# Design Index: debt-management

Source: docs/prototypes/2026-04-18-debt-management-design.pen

## 主列表页 (Rc7RP)
- Sidebar (TTLKC): logo (hXoql), navSection (Ny1rP)
- MainContent (CPdrn):
  - pageHeader (Mxas7): title (O5Z6D), addBtn (RfKtQ)
  - filterBar (s3GFN): searchBox (TylPL), tabAll (2jnOq), tabOngoing (o0LhQ), tabSettled (DHDOC)
  - CardGrid (iJ2LM): DebtCard1 (607qa), DebtCard2 (Sjyy9), DebtCard3 (XaxGX)

## 还款弹窗 (CpgMh)
- RepayModal (dqRpf)

## 详情弹窗 (usCCc)
- DetailModal (j04gZ)

## 新增欠款弹窗 (ksmzJ)
- DebtFormModal (VNHQ6)
```

## workflow-init 变化

在导入实施计划之后增加子步骤：

1. 检测实施计划中是否引用了 `.pen` 设计文件
2. 如果有，浅读 `.pen`（readDepth=2-3），提取组件层级
3. 生成设计索引文件到 `.pen` 同目录
4. 在 `feature_list.json` 的每个 FEAT 中添加 `design_file` 字段，指向索引文件路径

feature_list.json 示例：

```json
{
  "feat_id": "FEAT-175",
  "description": "前端主列表页与组件：卡片布局+弹窗",
  "design_file": "docs/prototypes/2026-04-18-debt-management-design-index.md"
}
```

索引文件是整个设计共享的，不是每个 FEAT 一个。多个 FEAT 指向同一个索引文件，workflow-next 根据自身任务描述自行判断读取哪些节点。

## workflow-next 变化

实现一个 FEAT 时的流程：

1. 读取 FEAT 描述，检查是否有 `design_file` 字段
2. 如果有，读取设计索引文件（几十行，消耗极低）
3. 根据 FEAT 描述匹配索引中的相关组件，确定需要深读的 node ID
4. 用 `batch_get` 定向深读这些 node ID（readDepth=4-5，获取完整样式和文字）
5. 基于完整数据实现代码

对于不涉及 UI 的 FEAT（如后端枚举、数据库迁移），workflow-next 判断无需 UI 数据则跳过。

### 示例：FEAT-175 前端主列表页

```
workflow-next 读取索引 → 发现"主列表页"匹配 → 提取 node ID：
  - Rc7RP (整个页面)
  - CPdrn (MainContent)
  - s3GFN (filterBar)
  - iJ2LM (CardGrid)
→ batch_get(nodeIds: ["s3GFN", "iJ2LM"], readDepth: 5)
→ 获取卡片和筛选栏的完整样式、文字、间距
→ 不读取弹窗数据（不属于这个 FEAT）
```

## 数据保真

- 浅读 .pen 只用于提取结构和 node ID，不丢弃任何样式数据
- 完整样式数据保留在 .pen 文件中，workflow-next 按需深读
- 不存在数据损失，只改变了数据消费的时机
