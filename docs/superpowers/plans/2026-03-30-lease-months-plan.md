# 租期月数输入 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将租期类型从固定枚举（月租/半年租/年租）改为灵活的月数输入（1~36个月）

**Architecture:** 删除 `LeaseType` 枚举，后端实体/DTO 全部改用 `int LeaseMonths`，前端改用数字输入框。数据库迁移将旧枚举值转为对应月数。

**Tech Stack:** .NET 10 + EF Core (Furion), Vue 3 + TDesign, Playwright E2E

**using 判断标准：** 修改每个文件时，搜索文件中是否还有 `RentalStatus`、`DepositStatus`、`RoomStatus`、`RentalReminderStatus` 等同命名空间枚举的引用。如果有则保留 `using Gentle.Core.Enums;`，否则移除。

**XML 文档文件：** `Gentle.Core.xml` 和 `Gentle.Application.xml` 为编译时自动生成，重新编译后自动更新，无需手动修改。

**续租对话框合同到期日：** 保留手动日期选择器，`leaseMonths` 仅作为信息存储。续租时用户可灵活选择到期日，不受月数限制。

**关于 TDD：** 本次为纯重构（功能不变，接口签名改变），先改实现代码后更新测试是可接受的模式。

---

### Task 1: 删除枚举 + 更新实体

**Files:**
- Delete: `Gentle/Gentle.Core/Enums/LeaseType.cs`
- Modify: `Gentle/Gentle.Core/Entities/RentalRecord.cs`

- [ ] **Step 1: 删除 LeaseType.cs**

删除整个文件 `Gentle/Gentle.Core/Enums/LeaseType.cs`。

- [ ] **Step 2: 更新 RentalRecord 实体**

将 `RentalRecord.cs` 中：

```csharp
using Gentle.Core.Enums;

// ...

/// <summary>
/// 租期类型
/// </summary>
public LeaseType LeaseType { get; set; } = LeaseType.Monthly;
```

替换为：

```csharp
/// <summary>
/// 租期月数
/// </summary>
[Range(1, 36, ErrorMessage = "租期月数必须在1-36之间")]
public int LeaseMonths { get; set; } = 1;
```

移除 `using Gentle.Core.Enums;`（如果该 using 只用于 LeaseType）。检查文件中是否还有其他引用该命名空间的地方（如 `RentalStatus`、`DepositStatus`），如果有则保留。

- [ ] **Step 3: 验证编译**

Run: `cd Gentle && dotnet build Gentle.Core/Gentle.Core`
Expected: 编译失败，因为其他项目仍引用 `LeaseType`（预期，后续任务修复）

- [ ] **Step 4: Commit**

```bash
git rm Gentle/Gentle.Core/Enums/LeaseType.cs
git add Gentle/Gentle.Core/Entities/RentalRecord.cs
git commit -m "refactor: 删除 LeaseType 枚举，实体改用 LeaseMonths int 字段"
```

---

### Task 2: 更新后端 DTO

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/CheckInInput.cs`
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Rental/RenewRentalInput.cs`

- [ ] **Step 1: 更新 CheckInInput.cs**

将：

```csharp
using Gentle.Core.Enums;

// ...

/// <summary>
/// 租期类型
/// </summary>
public LeaseType LeaseType { get; set; } = LeaseType.Monthly;
```

替换为：

```csharp
/// <summary>
/// 租期月数
/// </summary>
[Range(1, 36, ErrorMessage = "租期月数必须在1-36之间")]
public int LeaseMonths { get; set; } = 1;
```

移除 `using Gentle.Core.Enums;`（该文件无其他枚举引用）。

- [ ] **Step 2: 更新 RentalRecordDto.cs**

将：

```csharp
using Gentle.Core.Enums;

// ...

/// <summary>
/// 租期类型
/// </summary>
public LeaseType LeaseType { get; set; }

/// <summary>
/// 租期类型文本
/// </summary>
public string LeaseTypeText => LeaseType switch
{
    LeaseType.Monthly => "月租",
    LeaseType.HalfYear => "半年租",
    LeaseType.Yearly => "年租",
    _ => "未知"
};
```

替换为：

```csharp
/// <summary>
/// 租期月数
/// </summary>
public int LeaseMonths { get; set; }

/// <summary>
/// 租期月数文本
/// </summary>
public string LeaseMonthsText => $"{LeaseMonths}个月";
```

保留 `using Gentle.Core.Enums;`（该文件还用到 `DepositStatus`、`RentalStatus`）。

- [ ] **Step 3: 更新 RenewRentalInput.cs**

将：

```csharp
using Gentle.Core.Enums;

// ...

/// <summary>
/// 租期类型
/// </summary>
/// <remarks>
/// 必填，月租/半年租/年租。
/// </remarks>
[Required(ErrorMessage = "租期类型不能为空")]
public LeaseType LeaseType { get; set; }
```

替换为：

```csharp
/// <summary>
/// 租期月数
/// </summary>
/// <remarks>
/// 必填，1-36个月。
/// </remarks>
[Range(1, 36, ErrorMessage = "租期月数必须在1-36之间")]
public int LeaseMonths { get; set; } = 1;
```

移除 `using Gentle.Core.Enums;`（该文件无其他枚举引用）。

- [ ] **Step 4: 验证编译**

Run: `cd Gentle && dotnet build Gentle.Application/Gentle.Application`
Expected: 编译失败（服务层仍引用 LeaseType，预期）

- [ ] **Step 5: Commit**

```bash
git add Gentle/Gentle.Application/Dtos/
git commit -m "refactor: DTO 中 LeaseType 改为 LeaseMonths int 字段"
```

---

### Task 3: 更新后端服务层

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs`
- Modify: `Gentle/Gentle.Application/Services/RentalReminderService.cs`

- [ ] **Step 1: 更新 RentalRecordService.cs**

1. 移除 `using Gentle.Core.Enums;`（检查是否还有其他枚举引用，如 `RentalStatus`、`DepositStatus`、`RoomStatus` — 这些在 `Gentle.Core.Enums` 命名空间中，如有则保留）

2. 将入住方法中的枚举赋值改为月数：

```csharp
// 原: var contractEndDate = CalculateContractEndDate(input.CheckInDate, input.LeaseType);
var contractEndDate = CalculateContractEndDate(input.CheckInDate, input.LeaseMonths);

// 原: LeaseType = input.LeaseType,
LeaseMonths = input.LeaseMonths,
```

3. 将 `CalculateContractEndDate` 方法简化：

```csharp
// 原: private static DateTime CalculateContractEndDate(DateTime checkInDate, LeaseType leaseType)
//     带 switch 表达式
// 改为:
private static DateTime CalculateContractEndDate(DateTime checkInDate, int leaseMonths)
{
    return checkInDate.AddMonths(leaseMonths).AddDays(-1);
}
```

- [ ] **Step 2: 更新 RentalReminderService.cs**

1. 移除 `using Gentle.Core.Enums;`（检查是否还有其他枚举引用，如 `RentalReminderStatus`、`RentalStatus` — 如有则保留）

2. 将续租方法中的枚举赋值改为月数：

```csharp
// 原: LeaseType = input.LeaseType,
LeaseMonths = input.LeaseMonths,
```

- [ ] **Step 3: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功（后端全部更新完毕）

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Application/Services/
git commit -m "refactor: 服务层 LeaseType 改为 LeaseMonths"
```

---

### Task 4: 生成数据库迁移

**Files:**
- Create: `Gentle/Gentle.Database.Migrations/Migrations/<timestamp>_LeaseTypeToLeaseMonths.cs`

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add LeaseTypeToLeaseMonths --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 迁移文件成功生成

- [ ] **Step 2: 检查并修改生成的迁移**

打开生成的迁移文件和 `DefaultDbContextModelSnapshot.cs`（EF Core 会自动更新 snapshot）。确认迁移文件包含：
- `AddColumn("lease_months")` 操作
- 数据迁移 SQL（`UPDATE rental_record SET lease_months = CASE lease_type WHEN 0 THEN 1 WHEN 1 THEN 6 WHEN 2 THEN 12 ELSE 1 END`）
- `DropColumn("lease_type")` 操作

EF Core 通常不会自动生成数据迁移 SQL，需要手动在 `Up` 方法中添加：

```csharp
migrationBuilder.AddColumn<int>("lease_months", "rental_record", nullable: false, defaultValue: 1);

migrationBuilder.Sql(
    "UPDATE rental_record SET lease_months = CASE lease_type WHEN 0 THEN 1 WHEN 1 THEN 6 WHEN 2 THEN 12 ELSE 1 END");

migrationBuilder.DropColumn("lease_type", "rental_record");
```

- [ ] **Step 3: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Database.Migrations/
git commit -m "feat: 生成 LeaseTypeToLeaseMonths 数据库迁移"
```

---

### Task 5: 更新后端单元测试

**Files:**
- Modify: `Gentle/Gentle.Tests/Services/RentalReminderServiceTests.cs`
- Modify: `Gentle/Gentle.Tests/Services/TodoServiceTests.cs`

- [ ] **Step 1: 更新 RentalReminderServiceTests.cs**

1. 删除 `LeaseType_EnumValues_AreCorrect` 测试方法（整个方法，因为枚举已删除）

2. 更新 `RenewRentalInput_DefaultValues_AreCorrect` 测试：

```csharp
// 原: Assert.Equal(default, input.LeaseType);
Assert.Equal(1, input.LeaseMonths);
```

3. 更新 `RenewAsync_ContractEndDateEqualsOriginal_ThrowsException` 测试：

```csharp
// 原: LeaseType = LeaseType.Monthly,
LeaseMonths = 1,
```

4. 更新 `RenewAsync_ContractEndDateEarlierThanOriginal_ThrowsException` 测试：

```csharp
// 原: LeaseType = LeaseType.Monthly,
LeaseMonths = 1,
```

5. 更新 `CreateValidRenewInput` 辅助方法：

```csharp
// 原: LeaseType = LeaseType.Monthly,
LeaseMonths = 1,
```

6. 移除 `using Gentle.Core.Enums;`（如果仅用于 LeaseType）

- [ ] **Step 2: 更新 TodoServiceTests.cs**

1. 更新 `RenewRentalInput_DefaultValues_AreCorrect` 测试：

```csharp
// 原: Assert.Equal(default, input.LeaseType);
Assert.Equal(1, input.LeaseMonths);
```

2. 移除 `using Gentle.Core.Enums;`（如果仅用于 LeaseType）

- [ ] **Step 3: 运行测试**

Run: `cd Gentle && dotnet test Gentle.Tests/`
Expected: 所有测试通过

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Tests/
git commit -m "test: 更新后端单元测试，LeaseType 改为 LeaseMonths"
```

---

### Task 6: 更新前端类型定义

**Files:**
- Modify: `Hans/src/api/model/rentalModel.ts`
- Modify: `Hans/src/api/model/todoModel.ts`
- Modify: `Hans/src/utils/date.ts`

- [ ] **Step 1: 更新 rentalModel.ts**

1. 删除 `LeaseType` 枚举定义（第 6-13 行）和 `LeaseTypeText` 映射（第 18-22 行）

2. 更新 `CheckInInput` 接口：

```typescript
// 原: leaseType: LeaseType;
leaseMonths: number;
```

3. 更新 `RentalRecordDto` 接口：

```typescript
// 原: leaseType: LeaseType;
//     leaseTypeText: string;
leaseMonths: number;
leaseMonthsText: string;
```

- [ ] **Step 2: 更新 todoModel.ts**

1. 删除导入和重导出：

```typescript
// 删除: import type { LeaseType } from './rentalModel';
// 删除: export { LeaseType, LeaseTypeText } from './rentalModel';
```

2. 更新 `RenewRentalInput` 接口：

```typescript
// 原: leaseType: LeaseType;
leaseMonths: number;
```

- [ ] **Step 3: 更新 date.ts**

1. 删除重导出和局部导入：

```typescript
// 删除第5行: export { LeaseType } from '@/api/model/rentalModel';
// 删除第42行: import { LeaseType } from '@/api/model/rentalModel';
```

2. 简化 `calculateContractEndDate` 函数：

```typescript
export function calculateContractEndDate(
  checkInDate: string | null | undefined,
  leaseMonths: number | null | undefined,
): string | null {
  if (!checkInDate || !leaseMonths) {
    return null;
  }

  const checkIn = dayjs(checkInDate);

  if (!checkIn.isValid()) {
    return null;
  }

  return checkIn.add(leaseMonths, 'month').subtract(1, 'day').format('YYYY-MM-DD');
}
```

- [ ] **Step 4: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 编译失败（check-in.vue 等文件仍引用已删除的 LeaseType，预期）

- [ ] **Step 5: Commit**

```bash
git add Hans/src/api/model/rentalModel.ts Hans/src/api/model/todoModel.ts Hans/src/utils/date.ts
git commit -m "refactor: 前端类型定义 LeaseType 改为 LeaseMonths"
```

---

### Task 7: 更新入住页面

**Files:**
- Modify: `Hans/src/pages/tenant/check-in.vue`

- [ ] **Step 1: 更新模板**

将租期类型单选按钮（约第 136-141 行）：

```vue
<t-form-item label="租期类型" name="leaseType">
  <t-radio-group v-model="formData.leaseType" data-testid="lease-type">
    <t-radio v-for="(text, value) in LeaseTypeText" :key="value" :value="Number(value)">
      {{ text }}
    </t-radio>
  </t-radio-group>
</t-form-item>
```

替换为：

```vue
<t-form-item label="租期（月）" name="leaseMonths">
  <t-input-number
    v-model="formData.leaseMonths"
    :min="1"
    :max="36"
    :step="1"
    theme="normal"
    suffix="个月"
    data-testid="lease-months"
  />
</t-form-item>
```

- [ ] **Step 2: 更新 script 导入**

1. 移除导入：

```typescript
// 删除: import { LeaseTypeText } from '@/api/model/rentalModel';
```

2. 更新 date 导入（移除 LeaseType）：

```typescript
// 原: import { calculateContractEndDate, formatDate, getLocalDateString, LeaseType } from '@/utils/date';
import { calculateContractEndDate, formatDate, getLocalDateString } from '@/utils/date';
```

- [ ] **Step 3: 更新接口和默认值**

1. 表单接口定义（约第 300 行）：

```typescript
// 原: leaseType: LeaseType;
leaseMonths: number;
```

2. 初始值（约第 331 行）：

```typescript
// 原: leaseType: LeaseType.Monthly,
leaseMonths: 1,
```

3. 合同结束日期计算（约第 367 行）：

```typescript
// 原: const endDate = calculateContractEndDate(formData.value.checkInDate, formData.value.leaseType);
const endDate = calculateContractEndDate(formData.value.checkInDate, formData.value.leaseMonths);
```

4. 提交参数（约第 494 行）：

```typescript
// 原: leaseType: formData.value.leaseType,
leaseMonths: formData.value.leaseMonths,
```

- [ ] **Step 4: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 该文件不再有类型错误

- [ ] **Step 5: Commit**

```bash
git add Hans/src/pages/tenant/check-in.vue
git commit -m "feat: 入住页面租期类型改为月数数字输入"
```

---

### Task 8: 更新续租对话框

**Files:**
- Modify: `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`

**注意：** 续租对话框保留"合同到期日"手动日期选择器（`t-date-picker`）。`leaseMonths` 作为信息存储字段，用户可自由选择到期日，不受月数约束。

- [ ] **Step 1: 更新模板**

将租期类型选择器（约第 36 行）：

```vue
<t-select v-model="formData.leaseType" :options="leaseTypeOptions" placeholder="请选择租期类型" />
```

替换为：

```vue
<t-input-number
  v-model="formData.leaseMonths"
  :min="1"
  :max="36"
  :step="1"
  theme="normal"
  suffix="个月"
  placeholder="请输入租期月数"
/>
```

- [ ] **Step 2: 更新 script**

1. 移除导入：

```typescript
// 删除: import { LeaseType } from '@/api/model/todoModel';
```

2. 更新 formData 初始值（约第 124 行）：

```typescript
// 原: leaseType: LeaseType.Monthly,
leaseMonths: 1,
```

3. 更新验证规则（约第 132 行）：

```typescript
// 原: leaseType: [{ required: true, message: '请选择租期类型' }],
leaseMonths: [{ required: true, message: '请输入租期月数' }],
```

4. 删除 `leaseTypeOptions` computed（约第 151-155 行）：

```typescript
// 删除整个 computed:
// const leaseTypeOptions = computed(() => [
//   { label: '月租', value: LeaseType.Monthly },
//   { label: '半年租', value: LeaseType.HalfYear },
//   { label: '年租', value: LeaseType.Yearly },
// ]);
```

5. 更新弹窗打开时的重置（约第 177 行）：

```typescript
// 原: leaseType: LeaseType.Monthly,
leaseMonths: 1,
```

6. 更新提交参数中的字段名：

```typescript
// 原: leaseType: ...,
leaseMonths: ...,
```

- [ ] **Step 3: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 该文件不再有类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue
git commit -m "feat: 续租对话框租期类型改为月数输入"
```

---

### Task 9: 更新租赁列表页

**Files:**
- Modify: `Hans/src/pages/housing/rental/index.vue`

- [ ] **Step 1: 更新表格列定义**

将（约第 168 行）：

```typescript
{ colKey: 'leaseTypeText', title: '租期类型', width: 100 },
```

替换为：

```typescript
{ colKey: 'leaseMonthsText', title: '租期', width: 100 },
```

- [ ] **Step 2: 更新模板 slot**

将（约第 69-71 行）：

```vue
<template #leaseTypeText="{ row }">
  <t-tag variant="light">{{ row.leaseTypeText }}</t-tag>
</template>
```

替换为：

```vue
<template #leaseMonthsText="{ row }">
  <t-tag variant="light">{{ row.leaseMonthsText }}</t-tag>
</template>
```

- [ ] **Step 3: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 编译成功，无类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/housing/rental/index.vue
git commit -m "feat: 租赁列表页租期类型列改为月数显示"
```

---

### Task 10: 更新 E2E 测试

**Files:**
- Modify: `tests/e2e/feat-009-rental-record-entity.spec.ts`
- Modify: `tests/e2e/feat-011-checkin-checkout-api.spec.ts`
- Modify: `tests/e2e/feat-068-renew-rental-input.spec.ts`
- Modify: `tests/e2e/feat-083-renew-rental-dialog.spec.ts`
- Modify: `tests/e2e/feat-086-integration-test.spec.ts`
- Modify: `tests/e2e/feat-087-todo-panel-enhancement.spec.ts`

- [ ] **Step 1: 更新 feat-009-rental-record-entity.spec.ts**

1. 删除 `LeaseType.cs` 文件存在性断言
2. 删除 `LeaseType` 枚举值验证断言
3. 改为验证 `RentalRecord` 实体包含 `LeaseMonths` int 属性（如测试框架支持）

- [ ] **Step 2: 更新 feat-011-checkin-checkout-api.spec.ts**

所有 `leaseType: 0` → `leaseMonths: 1`，`leaseType: 1` → `leaseMonths: 6`，`leaseType: 99`（无效值测试）→ `leaseMonths: 0`（超出 Range 验证）。

- [ ] **Step 3: 更新 feat-068-renew-rental-input.spec.ts**

所有 `leaseType` 属性断言和引用改为 `leaseMonths`。

- [ ] **Step 4: 更新 feat-083-renew-rental-dialog.spec.ts**

租期类型选择器（`t-select`）相关测试改为月数输入（`t-input-number`）测试。

- [ ] **Step 5: 更新 feat-086-integration-test.spec.ts**

第 96 行 `leaseType: 0` → `leaseMonths: 1`，第 411 行 `leaseType: 1` → `leaseMonths: 6`。

- [ ] **Step 6: 更新 feat-087-todo-panel-enhancement.spec.ts**

将续租对话框中租期类型选择器验证：

```typescript
const leaseTypeSelect = renewDialog.locator('.t-select');
expect(await leaseTypeSelect.count()).toBeGreaterThan(0);
```

改为月数输入验证：

```typescript
const leaseMonthsInput = renewDialog.locator('.t-input-number');
expect(await leaseMonthsInput.count()).toBeGreaterThan(0);
```

- [ ] **Step 7: 运行全部测试**

Run: `cd tests && npm run test`
Expected: 所有测试通过

- [ ] **Step 8: Commit**

```bash
git add tests/e2e/
git commit -m "test: E2E 测试 LeaseType 改为 LeaseMonths"
```

---

### Task 11: 端到端验证

**Files:** 无新文件

- [ ] **Step 1: 后端完整构建**

Run: `cd Gentle && dotnet build`
Expected: 编译成功，无错误

- [ ] **Step 2: 前端完整构建**

Run: `cd Hans && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 3: 后端单元测试**

Run: `cd Gentle && dotnet test`
Expected: 所有测试通过

- [ ] **Step 4: 前端 lint 检查**

Run: `cd Hans && npm run lint`
Expected: 无 lint 错误

- [ ] **Step 5: E2E 验证测试**

Run: `cd tests && npx playwright test e2e/feat-011-checkin-checkout-api.spec.ts`
Expected: 测试通过，入住 API 正确接受 `leaseMonths` 参数
