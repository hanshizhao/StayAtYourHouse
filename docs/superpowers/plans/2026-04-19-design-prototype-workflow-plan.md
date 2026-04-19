# 设计图分层消费方案 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改进 workflow-init 和 workflow-next 对 .pen 设计稿的读取策略，通过设计索引中间文件实现分层消费。

**Architecture:** workflow-init 浅读 .pen 生成 markdown 索引文件，workflow-next 根据索引定向深读相关组件节点。不修改 writing-plans 技能。

**Tech Stack:** Claude Code 命令文件 (.md), Pencil MCP 工具, Node.js (现有 workflow-init-project.js 脚本)

---

### Task 1: workflow-init 增加设计索引生成步骤

**Files:**
- Modify: `~/.claude/commands/workflow-init.md` (步骤 6 之后，第 253-287 行的 design_file 解析章节)

- [ ] **Step 1: 在执行步骤列表中增加"生成设计索引"子步骤**

在 workflow-init.md 第 10 行的执行步骤列表中，在步骤 6 和步骤 7 之间插入新步骤，原步骤 7-10 顺延为 8-11：

```markdown
7. **如果用户提供了 .pen 原型文件路径** → 生成设计索引文件（见下方"设计索引生成"章节）
```

- [ ] **Step 2: 替换现有的 design_file 解析章节**

将 workflow-init.md 第 253-287 行（`### design_file 解析（Pencil 设计稿桥接）`）完整替换为新的设计索引生成章节：

```markdown
### 设计索引生成（Pencil 设计稿桥接）

**当用户在调用 workflow-init 时提供了 .pen 原型文件路径，自动生成设计索引文件。**

**触发条件**：用户在调用时提到了 .pen 文件路径（如："原型文件是 docs/prototypes/xxx.pen"）

**生成流程**：

```
1. 浅读 .pen 文件（readDepth=2-3），获取画板和组件层级
   mcp__pencil__batch_get({ filePath: "<.pen路径>", readDepth: 2 })

2. 遍历顶层节点，提取每个画板的：
   - 画板名称和 nodeId
   - 子组件名称和 nodeId（到第 2-3 层）

3. 生成索引文件（markdown 格式），写入 .pen 同目录
   - 文件名：<.pen文件名去掉.pen>-index.md
   - 示例：docs/prototypes/xxx.pen → docs/prototypes/xxx-index.md

4. 索引文件格式：
   # Design Index: <功能名>

   Source: <.pen 相对路径>

   ## <画板名称> (<nodeId>)
   - <组件名> (<nodeId>): <子组件名> (<nodeId>), ...

5. 为涉及 UI 的 FEAT 添加 design_file 字段，指向索引文件路径
```

**索引文件示例**：

```markdown
# Design Index: debt-management

Source: docs/prototypes/2026-04-18-debt-management-design.pen

## 主列表页 (Rc7RP)
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

**FEAT design_file 字段**：

所有涉及 UI 的 FEAT 添加 `design_file` 字段，指向索引文件（不是 .pen 文件）：

```json
{
  "id": "FEAT-175",
  "design_file": "docs/prototypes/2026-04-18-debt-management-design-index.md"
}
```

- 索引文件是整个设计共享的，多个 FEAT 指向同一个索引文件
- 不涉及 UI 的 FEAT（后端枚举、数据库迁移等）不添加此字段
- workflow-next 根据自身 FEAT 描述自行判断读取索引中的哪些节点

**向后兼容**：没有 `design_file` 的 FEAT 条目跳过设计稿桥接，按现有流程正常执行。如果 `design_file` 直接指向 `.pen` 文件（旧格式），workflow-next 按旧流程执行。

**边界情况**：
- 未提供 .pen 路径 → 跳过索引生成，无任何影响
- .pen 文件读取失败 → 跳过索引生成，输出警告，继续正常流程
- 索引文件已存在 → 总是覆盖，不做增量更新

**索引文件与版本控制**：索引文件应提交到 git，作为工作流状态的一部分。它与 feature_list.json 和 progress.md 类似，是工作流的中间状态。当 .pen 文件更新时，重新运行 workflow-init 即可更新索引。
```

- [ ] **Step 3: 更新提交信息模板**

在 workflow-init.md 的提交信息模板（约第 715 行）中增加设计索引相关说明：

```markdown
- 生成设计索引（如果提供了 .pen 原型文件）
```

- [ ] **Step 4: 替换含设计稿的 FEAT 示例（第 521-551 行）**

将第 521-551 行的"含设计稿的 FEAT 示例（前端任务）"替换为新格式示例，关键变化：
- `design_file` 指向 `-index.md` 文件而非 `.pen` 文件
- **删除 `design_nodes` 字段**（节点匹配由 workflow-next 通过索引文件自动完成）
- `code_hint` 中更新为引用索引文件

```json
{
  "id": "FEAT-031",
  "category": "前端",
  "priority": "high",
  "test_type": "e2e",
  "design_file": "docs/prototypes/product-profile-form-index.md",
  "description": "前端：属性面板组件",
  "acceptance_criteria": [
    "属性面板渲染与设计稿一致",
    "支持动态字段渲染"
  ],
  "implementation_steps": [
    {
      "step": 1,
      "action": "创建属性面板组件",
      "file": "client/.../AttributePanel.vue",
      "code_hint": "按设计索引中 attribute-panel 节点布局实现，workflow-next 会自动深读相关节点"
    }
  ],
  "test_file": "tests/e2e/feat-031-attribute-panel.spec.ts",
  "status": "pending",
  "verification": {
    "e2e_tests_created": false,
    "e2e_tests_passed": false
  }
}
```

---

### Task 2: workflow-next 更新 Pencil 按图施工流程

**Files:**
- Modify: `~/.claude/commands/workflow-next.md` (第 223-287 行的 "Pencil 按图施工流程" 章节)

- [ ] **Step 1: 更新执行步骤中的触发条件（第 53 行）**

将 workflow-next.md 第 53 行改为：

```markdown
   - **如果前端任务且有设计稿**（`design_file` 字段存在）→ **必须**执行 Pencil 按图施工流程（见下方"按图施工"章节，自动识别索引格式或 .pen 格式）
```

同时更新"触发条件"小节（第 225 行附近）为：

```markdown
**触发条件**：`category` 包含 "前端" 且 `design_file` 字段存在。

**格式识别**：
- `design_file` 以 `-index.md` 结尾 → **新格式**：先读索引，再定向深读
- `design_file` 以 `.pen` 结尾 → **旧格式**：直接读 .pen（向后兼容）
```

- [ ] **Step 2: 替换执行流程**

将 workflow-next.md 第 229-243 行的执行流程替换为：

```markdown
### 执行流程（新格式：设计索引）

```
1. 读取设计索引文件
   └─ 读取 design_file 指向的 markdown 索引文件（几十行，消耗极低）
   └─ 从索引中提取 .pen 文件路径（Source 行）

2. 匹配相关组件节点
   └─ 根据 FEAT 描述中的关键词（如"主列表页"、"还款弹窗"）
   └─ 在索引的画板名称和组件名称中查找匹配
   └─ 确定需要深读的 node ID 列表

3. 定向深读设计稿
   ├─ mcp__pencil__batch_get({ filePath: "<.pen路径>", nodeIds: ["匹配的nodeId1", "nodeId2"], readDepth: 4-5 })
   └─ mcp__pencil__get_variables({ filePath: "<.pen路径>" })

4. 展示设计稿截图
   ├─ mcp__pencil__get_screenshot({ filePath: "<.pen路径>", nodeId: "<画板nodeId>" })
   └─ 展示给用户确认"即将按此设计实现"

5. 按 implementation_steps 逐步实现
   ├─ 每步参照 Pencil 节点结构和主题变量
   ├─ 使用 TDesign 组件映射设计元素
   └─ 生成完整布局和样式代码（非骨架）

6. 实现完成后，继续正常流程（编写测试文件）
```

### 执行流程（旧格式：直接读 .pen，向后兼容）

```
1. 直接读取设计稿
   ├─ mcp__pencil__batch_get({ filePath: design_file, nodeIds: design_nodes, readDepth: 3 })
   └─ mcp__pencil__get_variables({ filePath: design_file })
   （与原流程相同，不做修改）
```
```

- [ ] **Step 3: 更新错误处理表**

将 workflow-next.md 第 282-287 行的错误处理表替换为：

```markdown
### 错误处理

| 故障场景 | 回退行为 |
|---------|---------|
| 索引文件不存在 | 跳过 Pencil 桥接，按标准 workflow-next 执行，输出警告 |
| 索引中引用的 .pen 文件不存在 | 跳过 Pencil 桥接，按标准 workflow-next 执行，输出警告 |
| batch_get 读取 node ID 返回空 | 提示用户重新运行 workflow-init 更新索引，跳过 Pencil 桥接 |
| 未匹配到相关组件 | 提示用户检查 FEAT 描述与设计索引的对应关系，按标准流程执行 |
| Pencil MCP 不可用 | 完全跳过，按标准 workflow-next 执行 |
```

- [ ] **Step 4: 更新输出格式（第 258-278 行）**

将输出格式中的设计稿相关部分替换为：

```markdown
📐 设计索引: docs/prototypes/xxx-index.md
   → 匹配画板: 主列表页 (Rc7RP), 组件: filterBar (s3GFN), CardGrid (iJ2LM)
   → 深读 .pen 文件获取完整样式数据
```

旧格式的输出保持不变：
```
📐 设计稿: pencil/product-profile-form.pen (节点: attribute-panel)
```

- [ ] **Step 5: 处理 `design_nodes` 残留引用**

在新格式流程中，**不再使用** `design_nodes` 字段。节点 ID 由索引文件提供。
在旧格式兼容流程中，`design_nodes` 从 FEAT JSON 字段读取，保持原逻辑不变。
确保新格式的错误处理表中不出现 `design_nodes`。

---

### Task 3: 端到端验证（手动测试）

**注意**：本任务为手动验证步骤，验证命令文件修改的正确性。索引文件由 workflow-init 运行时自动生成，不属于本次提交范围。

- [ ] **Step 1: 手动测试 workflow-init 的索引生成**

使用修改后的 workflow-init，调用时提供 .pen 文件路径：
- 期望：生成 `docs/prototypes/2026-04-18-debt-management-design-index.md`
- 期望：feature_list.json 中前端 FEAT 包含 `design_file` 字段指向索引文件
- 期望：后端 FEAT 不包含 `design_file` 字段

- [ ] **Step 2: 检查生成的索引文件内容**

验证索引文件：
- 包含所有 4 个画板（主列表页、还款弹窗、详情弹窗、新增欠款弹窗）
- 每个画板下的关键组件都有 node ID
- Source 行正确指向 .pen 文件

- [ ] **Step 3: 提交修改**

只提交命令文件的修改，索引文件由 workflow-init 运行时生成：

```bash
git add ~/.claude/commands/workflow-init.md ~/.claude/commands/workflow-next.md docs/superpowers/specs/2026-04-19-design-prototype-workflow-design.md docs/superpowers/plans/2026-04-19-design-prototype-workflow-plan.md
git commit -m "feat: workflow 设计图分层消费 - init 生成索引 + next 定向读取"
```
