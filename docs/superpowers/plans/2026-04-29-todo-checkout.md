# 待办面板催收房租增加退租操作 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Dashboard 待办面板的催收房租弹窗中增加「退租」操作，复用现有 CheckOutDialog 组件。

**Architecture:** 扩展 `CheckOutDialog` 使其支持通过 `rentalRecordId` 直接打开（不需要 `TenantItem`），在 `RentalReminderDialog` 中增加退租按钮并引用 `CheckOutDialog`。后端无需改动。

**Tech Stack:** Vue 3 + TypeScript + TDesign Vue Next

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `Hans/src/pages/tenant/components/CheckOutDialog.vue` | Modify | 扩展 props 支持 `rentalRecordId` 入口 |
| `Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue` | Modify | 增加退租按钮和 CheckOutDialog 引用 |

---

### Task 1: 扩展 CheckOutDialog 支持 rentalRecordId 入口

**Files:**
- Modify: `Hans/src/pages/tenant/components/CheckOutDialog.vue`

- [ ] **Step 1: 添加 `getTenantById` 导入**

在 `CheckOutDialog.vue` 第 133 行（`import { checkOut, getRentalById } from '@/api/rental';`）后添加：

```typescript
import { getTenantById } from '@/api/tenant';
```

- [ ] **Step 2: 扩展 Props 接口**

将第 155-160 行的 `Props` 接口：

```typescript
interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 租客信息 */
  tenant: TenantItem | null;
}
```

改为：

```typescript
interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 租客信息（从租客列表进入时使用） */
  tenant: TenantItem | null;
  /** 租住记录ID（从待办面板进入时使用，tenant 为 null 时生效） */
  rentalRecordId?: number;
}
```

- [ ] **Step 3: 添加 `resolvedTenant` ref 和 `effectiveTenant` computed**

在第 180 行（`const deposit = ref(0);`）后添加：

```typescript
const resolvedTenant = ref<TenantItem | null>(null);

const effectiveTenant = computed(() => props.tenant ?? resolvedTenant.value);
```

- [ ] **Step 4: 修改 watch 数据加载逻辑**

将第 225-249 行的 watch：

```typescript
watch(
  () => props.visible,
  async (newVisible) => {
    if (newVisible && props.tenant?.rentalRecordId) {
      // 重置表单
      formData.value = {
        checkOutDate: getLocalDateString(),
        depositStatus: DepositStatus.Refunded,
        depositDeduction: undefined,
        checkOutRemark: '',
      };

      // 获取租住记录详情以获取押金金额
      try {
        const record = await getRentalById(props.tenant.rentalRecordId);
        rentalRecord.value = record;
        deposit.value = record.deposit;
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '获取租住记录失败';
        MessagePlugin.error(errorMessage);
        emit('update:visible', false);
      }
    }
  },
);
```

替换为：

```typescript
watch(
  () => props.visible,
  async (newVisible) => {
    if (!newVisible) return;

    const rentalId = props.tenant?.rentalRecordId ?? props.rentalRecordId;
    if (!rentalId) return;

    resolvedTenant.value = null;
    formData.value = {
      checkOutDate: getLocalDateString(),
      depositStatus: DepositStatus.Refunded,
      depositDeduction: undefined,
      checkOutRemark: '',
    };

    try {
      const record = await getRentalById(rentalId);
      rentalRecord.value = record;
      deposit.value = record.deposit;

      if (!props.tenant && record.tenantId) {
        resolvedTenant.value = await getTenantById(record.tenantId);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '获取租住记录失败';
      MessagePlugin.error(errorMessage);
      emit('update:visible', false);
    }
  },
);
```

- [ ] **Step 5: 更新模板中的 `tenant` 引用为 `effectiveTenant`**

在 `<template>` 中，将所有 `tenant` 引用替换为 `effectiveTenant`（共 5 处）：

| 行号 | 原代码 | 新代码 |
|------|--------|--------|
| 11 | `v-if="tenant"` | `v-if="effectiveTenant"` |
| 19 | `{{ tenant.name }}` | `{{ effectiveTenant!.name }}` |
| 22 | `{{ tenant.phone }}` | `{{ effectiveTenant!.phone }}` |
| 26 | `v-if="tenant.currentRoom"` | `v-if="effectiveTenant!.currentRoom"` |
| 30 | `{{ tenant.currentRoom.fullInfo }}` | `{{ effectiveTenant!.currentRoom!.fullInfo }}` |

注：`v-if="effectiveTenant"` 已保证值非 null，模板中用 `!` 告诉 TS 编译器。

- [ ] **Step 6: 更新 submit 中的 rentalRecordId 获取方式**

将第 278 行：

```typescript
const rentalRecordId = props.tenant?.rentalRecordId;
```

替换为：

```typescript
const rentalRecordId = effectiveTenant.value?.rentalRecordId ?? props.rentalRecordId;
```

- [ ] **Step 7: 在 handleClose 中清理 resolvedTenant**

将第 318-321 行：

```typescript
function handleClose() {
  formRef.value?.reset();
  emit('update:visible', false);
}
```

替换为：

```typescript
function handleClose() {
  formRef.value?.reset();
  resolvedTenant.value = null;
  emit('update:visible', false);
}
```

- [ ] **Step 8: 运行类型检查确认编译通过**

Run: `cd Hans && npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 9: Commit**

```bash
git add Hans/src/pages/tenant/components/CheckOutDialog.vue
git commit -m "feat: 扩展 CheckOutDialog 支持 rentalRecordId 入口"
```

---

### Task 2: 在 RentalReminderDialog 中增加退租按钮

**Files:**
- Modify: `Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue`

- [ ] **Step 1: 导入 CheckOutDialog**

将第 91-93 行的导入：

```typescript
import DeferDialog from './DeferDialog.vue';
import DeferralRecordsDialog from './DeferralRecordsDialog.vue';
import RenewRentalDialog from './RenewRentalDialog.vue';
```

替换为：

```typescript
import CheckOutDialog from '@/pages/tenant/components/CheckOutDialog.vue';
import DeferDialog from './DeferDialog.vue';
import DeferralRecordsDialog from './DeferralRecordsDialog.vue';
import RenewRentalDialog from './RenewRentalDialog.vue';
```

- [ ] **Step 2: 添加退租弹窗状态和处理函数**

在第 116 行（`const deferralRecordsDialogVisible = ref(false);`）后添加：

```typescript
const checkOutDialogVisible = ref(false);
```

在第 146 行（`handleRenewSuccess` 函数后）添加：

```typescript
function handleCheckOut() {
  checkOutDialogVisible.value = true;
}

function handleCheckOutSuccess() {
  checkOutDialogVisible.value = false;
  emit('success');
}
```

- [ ] **Step 3: 在操作按钮区域添加退租按钮**

将第 49-59 行的操作按钮区域：

```html
      <div class="action-buttons">
        <t-button variant="outline" @click="handleDefer">
          <template #icon><t-icon name="time" /></template>
          宽限处理
        </t-button>
        <t-button theme="primary" @click="handleRenew">
          <template #icon><t-icon name="refresh" /></template>
          续租
        </t-button>
        <t-button variant="outline" theme="default" @click="handleClose"> 取消 </t-button>
      </div>
```

替换为：

```html
      <div class="action-buttons">
        <t-button variant="outline" @click="handleDefer">
          <template #icon><t-icon name="time" /></template>
          宽限处理
        </t-button>
        <t-button theme="primary" @click="handleRenew">
          <template #icon><t-icon name="refresh" /></template>
          续租
        </t-button>
        <t-button theme="danger" variant="outline" @click="handleCheckOut">
          <template #icon><t-icon name="close-circle" /></template>
          退租
        </t-button>
        <t-button variant="outline" theme="default" @click="handleClose"> 取消 </t-button>
      </div>
```

- [ ] **Step 4: 在模板中添加 CheckOutDialog 组件**

在第 81 行（`</t-dialog>` 之前，`deferral-records-dialog` 之后）添加：

```html
    <!-- 退租弹窗 -->
    <check-out-dialog
      v-model:visible="checkOutDialogVisible"
      :tenant="null"
      :rental-record-id="reminder?.rentalReminder?.rentalRecordId"
      @success="handleCheckOutSuccess"
    />
```

- [ ] **Step 5: 运行类型检查确认编译通过**

Run: `cd Hans && npx vue-tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue
git commit -m "feat: 催收房租待办增加退租操作入口"
```

---

### Task 3: 端到端验证

- [ ] **Step 1: 启动开发服务器**

Run: `cd Hans && npm run dev`

在浏览器中打开 Dashboard 页面。

- [ ] **Step 2: 验证现有退租流程不受影响**

1. 进入租客列表，选择一个有活跃租约的租客
2. 点击「退租」，确认 CheckOutDialog 正常加载并显示租客信息、退租表单
3. 关闭弹窗，不提交（避免影响测试数据）

- [ ] **Step 3: 验证待办面板退租新流程**

1. 在 Dashboard 待办面板中，找到一条催收房租待办
2. 点击卡片打开 RentalReminderDialog
3. 确认显示「宽限处理」「续租」「退租」「取消」四个按钮
4. 点击「退租」按钮，确认 CheckOutDialog 弹出
5. 确认弹窗中显示加载状态后正确加载租客信息（姓名、电话、房间、租金、押金）
6. 填写退租表单并提交（使用测试数据）
7. 确认退租成功后，催收待办从列表中消失

- [ ] **Step 4: 运行构建确认无编译错误**

Run: `cd Hans && npm run build`
Expected: 构建成功

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: 修复待办退租流程验证中发现的问题"
```
