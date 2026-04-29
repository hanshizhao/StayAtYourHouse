# 待办面板催收房租增加退租操作

## 背景

Dashboard 待办面板的催收房租提醒（`RentalReminderDialog`）目前只提供「宽限处理」和「续租」两个操作。当租客要求退租时，用户必须离开待办面板、前往租客列表才能办理退租，且退租后催收待办未自动消失的问题需要先观察。

## 方案

在 `RentalReminderDialog` 中增加「退租」按钮，复用现有 `CheckOutDialog` 组件。后端无需改动（`CheckOutAsync` 已自动将 `Pending` 提醒标记为 `Completed`）。

## 前端改动

### 1. 扩展 CheckOutDialog Props

**文件**：`Hans/src/pages/tenant/components/CheckOutDialog.vue`

新增可选 prop `rentalRecordId`，作为 `tenant` 为 null 时的替代入口：

```typescript
interface Props {
  visible: boolean;
  tenant: TenantItem | null;
  rentalRecordId?: number; // 新增：从待办面板进入时使用
}
```

**数据加载逻辑**：

当 `tenant` 为 null 且 `rentalRecordId` 有值时：
1. 调用 `getRentalById(rentalRecordId)` 获取租约记录（含 `tenantId`）
2. 调用 `getTenantById(tenantId)` 获取完整租客信息（含 `phone`）
3. 将两者拼装为等效的内部状态，复用现有模板和提交逻辑

现有从租客列表进入的流程不受影响。

### 2. RentalReminderDialog 增加退租按钮

**文件**：`Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue`

**按钮布局**（在操作按钮区域，续租按钮之后）：

```
[宽限处理] [续租] [退租]                    [取消]
```

- 退租按钮使用 `theme="danger"` 红色警示样式
- 点击后打开 `CheckOutDialog`，传入 `rentalRecordId`
- 退租成功后 `emit('success')`，父组件 `TodoPanel` 刷新待办列表

**新增状态**：

```typescript
const checkOutDialogVisible = ref(false);
```

**新增模板**：

```vue
<check-out-dialog
  v-model:visible="checkOutDialogVisible"
  :tenant="null"
  :rental-record-id="reminder?.rentalReminder?.rentalRecordId"
  @success="handleCheckOutSuccess"
/>
```

### 3. 后端

无需改动。`RentalRecordService.CheckOutAsync` 已在退租时将对应 `RentalReminder`（`Status == Pending`）标记为 `Completed`。

## 改动范围汇总

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `Hans/.../CheckOutDialog.vue` | 扩展 | 新增 `rentalRecordId` prop，增加从 rentalRecordId 加载租客数据的逻辑 |
| `Hans/.../RentalReminderDialog.vue` | 扩展 | 增加退租按钮和 CheckOutDialog 引用 |

## 不在范围内

- 退租后待办不消失的数据同步问题（持续观察中）
- 水电费/维修待办的退租联动处理
