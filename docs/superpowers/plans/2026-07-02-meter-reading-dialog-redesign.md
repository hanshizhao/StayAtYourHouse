# 抄表录入弹窗 UI 重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将水电抄录页"抄表录入"弹窗从 600px 纯纵向堆叠（4 条分割线、约 13 行）重构为 820px 水/电双列对照表（约 9-11 行），压缩到一屏内可见。

**Architecture:** 单文件 UI 重构。模板从"多个 t-row/t-col + t-divider 区块"改为"顶部并排行 + 原生 `<table>` 对照表 + 底部并排费用区 + 备注"。所有表单逻辑（formRules / calculatedUsage / calculatedFees / handleRoomChange / handleSubmit）保持不变，仅模板与样式调整。新增 max-height 滚动兜底。

**Tech Stack:** Vue 3 + TDesign Vue Next（tdesign-vue-next ^1.13.2）+ TypeScript + scoped less。

## Global Constraints

- 仅改动 `Hans/src/pages/utility/meter/index.vue` 一个文件，不涉及后端 / API / Model / 测试文件
- 保留所有现有 `data-testid`：`meter-form-dialog` / `room-select` / `meter-date-input` / `water-reading-input` / `electric-reading-input` / `remark-input`
- 保留文本"房间/水表/电表/读数"等关键字（E2E 测试 feat-023 用 `includes()` 断言这些词，且依赖 `.t-dialog` 类）
- 表单逻辑零改动：`formRules`、`calculatedUsage`、`calculatedFees`、`hasFixedFees`、`handleRoomChange`、`handleSubmit`、`handleRecord`、`handleDialogClose` 原样保留
- 用量超阈值红字警告（>50 吨 / >200 度）保留
- 弹窗宽度 600px → 820px；新增 `max-height: 85vh` + 内容区滚动
- 删除全部 4 条 `<t-divider>` 分割标题
- 备注 textarea autosize `{minRows:2, maxRows:4}` → `{minRows:1, maxRows:3}`
- 桌面端（≥1280px），不做手机端适配

## File Structure

| 文件 | 责任 | 本次操作 |
|------|------|----------|
| `Hans/src/pages/utility/meter/index.vue` | 抄表录入页面（表格 + 录入弹窗 + 删除弹窗） | 修改：弹窗模板（93-243 行）+ 弹窗样式（621-689 行） |

变更范围严格限定在该文件的"抄表录入对话框"区块和其 scoped less。页面其它部分（顶部操作栏、数据表格、删除确认对话框、所有 `<script setup>`）不动。

---

## Task 1: 弹窗容器宽度与滚动兜底

**Files:**
- Modify: `Hans/src/pages/utility/meter/index.vue:93-101`（`<t-dialog>` 开始标签）
- Modify: `Hans/src/pages/utility/meter/index.vue:621-689`（scoped less，新增弹窗 body 样式）

**Interfaces:**
- Consumes: 无（本任务为容器层改造）
- Produces: 一个带有 `dialogClass="meter-reading-dialog"` 的 `t-dialog`，宽度 820px，body 可滚动；后续任务在此容器内填充表格内容

- [ ] **Step 1: 修改 t-dialog 开始标签**

把 `<t-dialog>` 的 `width="600px"` 改为 `width="820px"`，并新增 `dialog-class="meter-reading-dialog"`（TDesign Vue Next 通过 `dialogClass` prop 透传 class 到 dialog 根节点）。

将 `Hans/src/pages/utility/meter/index.vue:93-101`：
```html
    <t-dialog
      v-model:visible="dialogVisible"
      header="抄表录入"
      width="600px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="meter-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
```
改为：
```html
    <t-dialog
      v-model:visible="dialogVisible"
      header="抄表录入"
      width="820px"
      dialog-class="meter-reading-dialog"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="meter-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
```

- [ ] **Step 2: 新增弹窗 body 滚动样式**

在 scoped less 的 `.meter-management { ... }` 块内（当前结束于 689 行 `}` 前）追加针对该弹窗 body 的滚动约束。使用 `:deep()` 穿透到 TDesign 内部 `.t-dialog__body`，并用 `.meter-reading-dialog` 限定作用域，避免影响其它弹窗。

在 `Hans/src/pages/utility/meter/index.vue` 的 `.meter-management { ... }` 块内（紧接 `.total-fee-large { ... }` 之后、`}` 闭合括号之前）插入：
```less
  /* 抄表录入弹窗：内容区滚动兜底，header/footer 始终可见 */
  :deep(.meter-reading-dialog .t-dialog__body) {
    max-height: calc(85vh - 140px);
    overflow-y: auto;
  }
```

- [ ] **Step 3: 启动前端验证弹窗可打开**

Run: `cd Hans && npm run dev`（后台运行）
在浏览器打开水电抄录页，点击"抄表录入"按钮，确认：
- 弹窗宽度变宽（820px）
- 弹窗标题、内容、确定/取消按钮仍可见
- 暂时内容还是旧的（下一个 Task 才重构）

Expected: 弹窗正常打开，无控制台报错。

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/utility/meter/index.vue
git commit -m "refactor(meter): 弹窗宽度拓至 820px 并加内容区滚动兜底"
```

---

## Task 2: 顶部房间+日期并排，删除前两条分割线

**Files:**
- Modify: `Hans/src/pages/utility/meter/index.vue:102-133`（顶部 form 开始 → 上次读数区块结束）

**Interfaces:**
- Consumes: `formData.roomId`、`formData.meterDate`、`formRules`、`roomOptions`、`handleRoomChange`、`lastReadings`（均不变）
- Produces: 顶部为单行并排的房间+日期；上次读数改为对照表第一行（本任务只做"并排+删分割线"，对照表主体在 Task 3 落地）

- [ ] **Step 1: 房间与日期并排为一行**

把"选择房间"和"抄表日期"两个独立 `t-form-item` 包进一个 `t-row`（两个 `t-col :span="12"`）。将 `Hans/src/pages/utility/meter/index.vue:103-120`：
```html
        <t-form-item label="选择房间" name="roomId">
          <t-select
            v-model="formData.roomId"
            :options="roomOptions"
            placeholder="请选择房间"
            filterable
            data-testid="room-select"
            @change="handleRoomChange"
          />
        </t-form-item>
        <t-form-item label="抄表日期" name="meterDate">
          <t-date-picker
            v-model="formData.meterDate"
            :clearable="false"
            data-testid="meter-date-input"
            style="width: 100%"
          />
        </t-form-item>
```
改为：
```html
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="选择房间" name="roomId">
              <t-select
                v-model="formData.roomId"
                :options="roomOptions"
                placeholder="请选择房间"
                filterable
                data-testid="room-select"
                @change="handleRoomChange"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="抄表日期" name="meterDate">
              <t-date-picker
                v-model="formData.meterDate"
                :clearable="false"
                data-testid="meter-date-input"
                style="width: 100%"
              />
            </t-form-item>
          </t-col>
        </t-row>
```

- [ ] **Step 2: 删除"上次读数"分割线及区块，暂留为表格占位**

删除 `Hans/src/pages/utility/meter/index.vue:121-133`（`<t-divider>上次读数</t-divider>` 及其下的整个 `t-row` 区块）。本任务先删除，Task 3 用对照表替换。即把：
```html
        <t-divider>上次读数</t-divider>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水表读数">
              <span class="prev-reading">{{ lastReadings.waterReading.toFixed(2) }}</span>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电表读数">
              <span class="prev-reading">{{ lastReadings.electricReading.toFixed(2) }}</span>
            </t-form-item>
          </t-col>
        </t-row>
```
整段删除（替换为空）。

- [ ] **Step 3: 浏览器验证**

刷新水电抄录页，打开弹窗，确认：
- 房间、日期在同一行并排
- 旧的上次读数区块消失
- 表单无报错，控制台无错误

Expected: 顶部并排正常，下面跟着"本次读数"分割线（下一 Task 处理）。

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/utility/meter/index.vue
git commit -m "refactor(meter): 房间与日期并排，删除上次读数分割线区块"
```

---

## Task 3: 主体改造为水/电双列对照表

**Files:**
- Modify: `Hans/src/pages/utility/meter/index.vue`（原 134-203 行：本次读数分割线 → 用量计算三区块；全部替换为对照表）

**Interfaces:**
- Consumes: `formData.waterReading`、`formData.electricReading`、`lastReadings`、`calculatedUsage`、`selectedRoom`、`calculatedFees`、`formatMoney`、`calculateUsage`（均不变）
- Produces: 一个 `<table class="meter-table">`，含表头（💧水 / ⚡电）和 5 行（上次/本次/用量/单价/小计）；本次读数行内嵌 `t-input-number`，`name` 校验挂在对应 `t-form-item` 上

- [ ] **Step 1: 用对照表替换"本次读数 + 用量计算"全部旧区块**

把 `Hans/src/pages/utility/meter/index.vue` 中从 `<t-divider>本次读数</t-divider>`（原 134 行）到"水费/电费"`t-row` 结束（原 203 行）的整段：
```html
        <t-divider>本次读数</t-divider>
        <t-row :gutter="24">
          ...（本次读数 水/电 输入）...
        </t-row>
        <t-divider>用量计算</t-divider>
        <t-row :gutter="24">
          ...（用水量/用电量）...
        </t-row>
        <t-row :gutter="24">
          ...（水费单价/电费单价）...
        </t-row>
        <t-row :gutter="24">
          ...（水费/电费）...
        </t-row>
```
完整替换为下面的对照表（含表头 + 上次/本次/用量/单价/小计 共 5 行数据行）：
```html
        <table class="meter-table">
          <thead>
            <tr>
              <th class="col-label"></th>
              <th class="col-meter">💧 水</th>
              <th class="col-meter">⚡ 电</th>
            </tr>
          </thead>
          <tbody>
            <!-- 上次读数（只读灰字） -->
            <tr>
              <td class="row-label">上次读数</td>
              <td><span class="prev-reading">{{ lastReadings.waterReading.toFixed(2) }}</span></td>
              <td><span class="prev-reading">{{ lastReadings.electricReading.toFixed(2) }}</span></td>
            </tr>
            <!-- 本次读数（输入，校验挂在此行） -->
            <tr>
              <td class="row-label">本次读数</td>
              <td>
                <t-form-item name="waterReading" class="cell-form-item">
                  <t-input-number
                    v-model="formData.waterReading"
                    placeholder="请输入水表读数"
                    :min="0"
                    :decimal-places="2"
                    data-testid="water-reading-input"
                    style="width: 100%"
                    @change="calculateUsage"
                  />
                </t-form-item>
              </td>
              <td>
                <t-form-item name="electricReading" class="cell-form-item">
                  <t-input-number
                    v-model="formData.electricReading"
                    placeholder="请输入电表读数"
                    :min="0"
                    :decimal-places="2"
                    data-testid="electric-reading-input"
                    style="width: 100%"
                    @change="calculateUsage"
                  />
                </t-form-item>
              </td>
            </tr>
            <!-- 用量（超阈值红字警告） -->
            <tr>
              <td class="row-label">用量</td>
              <td>
                <span :class="{ 'usage-warning': calculatedUsage.water > 50 }">
                  {{ calculatedUsage.water.toFixed(2) }} 吨
                </span>
              </td>
              <td>
                <span :class="{ 'usage-warning': calculatedUsage.electric > 200 }">
                  {{ calculatedUsage.electric.toFixed(2) }} 度
                </span>
              </td>
            </tr>
            <!-- 单价（取自房间配置，未设置显示"未设置"） -->
            <tr>
              <td class="row-label">单价</td>
              <td>
                <span>{{ selectedRoom?.waterPrice ? `¥${selectedRoom.waterPrice.toFixed(2)}/吨` : '未设置' }}</span>
              </td>
              <td>
                <span>{{ selectedRoom?.electricPrice ? `¥${selectedRoom.electricPrice.toFixed(2)}/度` : '未设置' }}</span>
              </td>
            </tr>
            <!-- 小计（水费/电费） -->
            <tr>
              <td class="row-label">小计</td>
              <td><span class="fee-text">¥{{ formatMoney(calculatedFees.water) }}</span></td>
              <td><span class="fee-text">¥{{ formatMoney(calculatedFees.electric) }}</span></td>
            </tr>
          </tbody>
        </table>
```

注意：`t-form-item` 用 `name="waterReading"` / `name="electricReading"` 绑定 `formRules` 校验；这些 form-item 现在嵌在 `<td>` 内，class `cell-form-item` 用于在 Step 2 去掉它们的默认 label 占位与外边距。

- [ ] **Step 2: 新增对照表样式**

在 scoped less 的 `.meter-management { ... }` 块内（Task 1 插入的滚动样式之后）追加对照表样式：
```less
  /* 水/电双列对照表 */
  .meter-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--td-comp-margin-s);

    th,
    td {
      padding: var(--td-comp-margin-xs) var(--td-comp-margin-s);
      vertical-align: middle;
    }

    thead th {
      text-align: left;
      font-weight: 500;
      color: var(--td-text-color-secondary);
      border-bottom: 1px solid var(--td-component-stroke);
    }

    tbody tr + tr td {
      border-top: 1px solid var(--td-component-stroke);
    }

    .col-label {
      width: 80px;
    }

    .col-meter {
      width: calc((100% - 80px) / 2);
    }

    .row-label {
      color: var(--td-text-color-secondary);
      text-align: right;
      white-space: nowrap;
    }

    /* 单元格内的 form-item 去掉 label 与默认外边距，贴合表格行高 */
    .cell-form-item {
      margin-bottom: 0;

      :deep(.t-form__label) {
        display: none;
      }
    }
  }
```

- [ ] **Step 3: 浏览器验证对照表与实时计算**

刷新并打开弹窗，选择房间，输入本次读数，确认：
- 对照表正确显示 5 行（上次/本次/用量/单价/小计）+ 表头
- 输入本次读数后"用量""小计"实时更新
- 读数 >50 吨 / >200 度时"用量"红字
- 未设置单价的房间显示"未设置"
- 校验生效：清空读数后点确定，提示"请输入水表读数/电表读数"
- `water-reading-input` / `electric-reading-input` 的 data-testid 仍在

Expected: 对照表渲染正常，计算与校验逻辑与改前一致，控制台无错误。

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/utility/meter/index.vue
git commit -m "refactor(meter): 主体改为水/电双列对照表（上次/本次/用量/单价/小计）"
```

---

## Task 4: 固定费用横排标签 + 合计费用并排

**Files:**
- Modify: `Hans/src/pages/utility/meter/index.vue`（原 204-232 行：固定费用区块 + 合计费用 form-item；替换为并排区）

**Interfaces:**
- Consumes: `hasFixedFees`、`selectedRoom`（elevatorFee/propertyFee/internetFee/otherFees）、`calculatedFees.total`、`formatMoney`（均不变）
- Produces: 一个 `t-row`，左 `t-col` 放固定费用横排标签（仅 hasFixedFees 时渲染），右 `t-col` 放合计费用强调块

- [ ] **Step 1: 用并排区替换固定费用四宫格 + 合计 form-item**

把原"固定费用 template + 合计费用 form-item"区块（原 204-232 行）：
```html
        <template v-if="hasFixedFees">
          <t-divider>固定费用（取自房间配置）</t-divider>
          <t-row :gutter="24">
            ...（电梯/物业/网络/其他 四宫格）...
          </t-row>
        </template>
        <t-form-item label="合计费用">
          <span class="total-fee-large">¥{{ formatMoney(calculatedFees.total) }}</span>
        </t-form-item>
```
完整替换为下面的并排区（固定费用横排 + 合计强调块，用单个 `t-row` 两列）：
```html
        <t-row :gutter="24" class="fee-summary-row">
          <t-col :span="12">
            <div v-if="hasFixedFees" class="fixed-fees-block">
              <div class="block-title">固定费用</div>
              <div class="fixed-fees-tags">
                <span v-if="selectedRoom?.elevatorFee">电梯 ¥{{ formatMoney(selectedRoom.elevatorFee) }}</span>
                <span v-if="selectedRoom?.propertyFee">物业 ¥{{ formatMoney(selectedRoom.propertyFee) }}</span>
                <span v-if="selectedRoom?.internetFee">网络 ¥{{ formatMoney(selectedRoom.internetFee) }}</span>
                <span v-if="selectedRoom?.otherFees">其他 ¥{{ formatMoney(selectedRoom.otherFees) }}</span>
              </div>
            </div>
          </t-col>
          <t-col :span="12">
            <div class="total-fee-block">
              <span class="block-title">合计费用</span>
              <span class="total-fee-large">¥{{ formatMoney(calculatedFees.total) }}</span>
            </div>
          </t-col>
        </t-row>
```

- [ ] **Step 2: 新增底部并排区样式**

在 scoped less `.meter-management { ... }` 块内（对照表样式之后）追加：
```less
  /* 底部：固定费用 + 合计 并排区 */
  .fee-summary-row {
    margin-top: var(--td-comp-margin-s);
  }

  .block-title {
    color: var(--td-text-color-secondary);
    font-size: 13px;
    margin-bottom: 4px;
  }

  .fixed-fees-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;

    span {
      color: var(--td-text-color-primary);
      font-weight: 500;
    }
  }

  .total-fee-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }
```

`.total-fee-large` 样式（18px / 600 / brand-color）已存在（684-688 行），保持不动。

- [ ] **Step 3: 浏览器验证并排区**

刷新打开弹窗，选房间，确认：
- 选有固定费用的房间：左侧出现"固定费用 + 横排标签（电梯 ¥xx · 物业 ¥xx ...）"，右侧出现"合计费用 ¥xxx"
- 选无固定费用的房间：左侧空白，右侧合计仍显示
- 合计 = 水小计 + 电小计 + 固定费用之和（与改前数值一致）
- 控制台无错误

Expected: 固定费用与合计并排，数值正确。

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/utility/meter/index.vue
git commit -m "refactor(meter): 固定费用横排标签 + 合计费用并排强调块"
```

---

## Task 5: 备注行数收紧 + 全局回归验证

**Files:**
- Modify: `Hans/src/pages/utility/meter/index.vue:233-241`（备注 textarea autosize）

**Interfaces:**
- Consumes: `formData.remark`（不变）
- Produces: 备注 textarea autosize 收紧为 `{minRows:1, maxRows:3}`

- [ ] **Step 1: 收紧备注 textarea 行数**

将 `Hans/src/pages/utility/meter/index.vue` 备注的 autosize：
```html
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            data-testid="remark-input"
          />
        </t-form-item>
```
改为：
```html
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 1, maxRows: 3 }"
            data-testid="remark-input"
          />
        </t-form-item>
```

- [ ] **Step 2: 全局回归验证清单**

逐项核对（浏览器打开水电抄录页 → 抄表录入弹窗）：
- [ ] 弹窗宽 820px，顶部房间+日期并排
- [ ] 对比表 5 行 + 表头正常，无残留 `t-divider` 分割线
- [ ] 输入读数后用量/小计实时更新；超阈值红字
- [ ] 单价"未设置"房间显示"未设置"
- [ ] 有/无固定费用两种房间，底部并排区正确
- [ ] 合计数值 = 水+电+固定费用
- [ ] 备注默认 1 行，输入多行最高 3 行
- [ ] 校验：清空必填项点确定有错误提示
- [ ] 读数小于上次读数有 warning 提示
- [ ] 提交成功后弹窗关闭、列表刷新
- [ ] 整体高度在 1366×768 视口内不超出（缩窗到触发滚动时，header/footer 仍可见）

Expected: 全部通过，与改前功能一致，UI 更紧凑。

- [ ] **Step 3: 跑现有 E2E 测试确认未破坏**

Run: `cd tests && npx playwright test feat-023-meter-page.spec.ts --reporter=line`
Expected: 所有用例 PASS（测试依赖 `.t-dialog` 类与文本断言"房间/水表/电表/读数"，均保留）。

如有失败，优先检查是否误删了 `data-testid` 或文本关键字，而非改测试。

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/utility/meter/index.vue
git commit -m "refactor(meter): 备注行数收紧 1-3 行，完成弹窗 UI 重设计"
```

---

## 自查（Self-Review）

**1. Spec 覆盖**：
- 宽度 820px → Task 1 ✓
- max-height 85vh + 滚动 → Task 1 ✓
- 删 4 条 t-divider → Task 2(上次读数) / Task 3(本次读数+用量计算) / Task 4(固定费用) 全覆盖 ✓
- 房间+日期并排 → Task 2 ✓
- 水/电对照表 5 行（上次/本次/用量/单价/小计）→ Task 3 ✓
- 表头 💧水/⚡电 → Task 3 ✓
- 固定费用横排标签 → Task 4 ✓
- 合计费用并排强调块 → Task 4 ✓
- 备注 autosize 1-3 行 → Task 5 ✓
- 用量超阈值红字 → Task 3 ✓
- 单价"未设置" → Task 3 ✓
- 逻辑零改动（formRules/calculatedUsage/calculatedFees/handleRoomChange/handleSubmit）→ 各 Task 均仅动模板与样式 ✓

**2. 占位符扫描**：无 TBD/TODO，每步均含完整代码与命令。✓

**3. 类型/标识一致**：`calculatedFees.water/electric/total`、`calculatedUsage.water/electric`、`lastReadings.waterReading/electricReading`、`selectedRoom.waterPrice/electricPrice/elevatorFee/propertyFee/internetFee/otherFees`、`formData.*`、`hasFixedFees` 在各 Task 中引用名称与 `<script setup>` 现状一致。✓

**4. 边界**：data-testid 全部保留；E2E 依赖的 `.t-dialog` 类与文本关键字（房间/水表/电表/读数）均保留。
