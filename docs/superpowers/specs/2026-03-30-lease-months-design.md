# 租期类型改为月数输入 — 设计文档

日期：2026-03-30

## 背景

当前入住页面的租期类型是固定三选一的枚举（月租/半年租/年租），不够灵活。改为让用户直接输入月数，覆盖 1~36 个月的任意租期。

## 方案

彻底替换：废弃 `LeaseType` 枚举，用 `LeaseMonths`（int）字段替代。数据库迁移时将旧枚举值转换为对应月数。

## 变更详情

### 1. 数据库

迁移步骤（三步操作）：

1. 新增 `lease_months` 列（int, not null, default 1）
2. SQL 更新数据：`lease_type = 0→1`, `1→6`, `2→12`；NULL 或超出范围的值设为 1
3. 删除 `lease_type` 列

删除枚举文件 `Gentle.Core/Enums/LeaseType.cs`。

### 2. 实体

`RentalRecord.cs`：

```csharp
// 删除
public LeaseType LeaseType { get; set; } = LeaseType.Monthly;

// 替换为
public int LeaseMonths { get; set; } = 1;
```

### 3. 后端 API

**DTO：**

- `CheckInInput.cs`：`LeaseType LeaseType` → `int LeaseMonths`，加 `[Range(1, 36)]` 验证
- `RentalRecordDto.cs`：`LeaseType LeaseType` → `int LeaseMonths`；`LeaseTypeText` 计算属性改为 `LeaseMonthsText`，实现为 `$"{LeaseMonths}个月"`
- `RenewRentalInput.cs`：`LeaseType LeaseType` → `int LeaseMonths`，加 `[Range(1, 36)]` 验证

**服务层：**

- `RentalRecordService.cs`：`CalculateContractEndDate` 改为接收 `int leaseMonths`，直接 `checkInDate.AddMonths(leaseMonths).AddDays(-1)`
- `RentalReminderService.cs`：`RenewAsync` 方法中 `LeaseType` 赋值改为 `LeaseMonths`
- `Mapper.cs`：Mapster 按约定自动映射 `LeaseMonths → LeaseMonths`，无需手动调整；`LeaseMonthsText` 为 DTO 计算属性，不参与映射

### 4. 前端

**类型定义：**

- `rentalModel.ts`：删除 `LeaseType` 枚举和 `LeaseTypeText` 映射；`CheckInFormData` 接口中 `leaseType` → `leaseMonths: number`
- `todoModel.ts`：删除 `LeaseType`/`LeaseTypeText` 的导入和重导出；`RenewRentalInput` 接口中 `leaseType` → `leaseMonths: number`

**入住页面（check-in.vue）：**

- 单选按钮组 → `t-input-number` 数字输入框（min=1, max=36, step=1）
- 输入框后缀显示"个月"
- 合同结束日期直接用月数计算
- 默认值 `leaseMonths: 1`

**续租对话框（RenewRentalDialog.vue）：**

- 租期类型选择器改为月数数字输入框（与入住页面一致）
- 续租提交参数 `leaseType` → `leaseMonths`
- 后端根据原合同结束日期 + `LeaseMonths` 计算新到期日

**工具函数（date.ts）：**

- `calculateContractEndDate` 改为接收 `leaseMonths: number`
- 内部简化为 `checkIn.add(leaseMonths, 'month').subtract(1, 'day')`
- 删除 `LeaseType` 的导入和重导出语句

**租赁列表页（rental/index.vue）：**

- 表格列 `colKey: 'leaseTypeText'` → `colKey: 'leaseMonthsText'`
- 列标题"租期类型" → "租期"
- 模板 slot 同步更新

### 5. 测试文件

**后端单元测试：**

- `RentalReminderServiceTests.cs`：所有 `LeaseType` 枚举引用替换为对应月数值
- `TodoServiceTests.cs`：断言中 `LeaseType` 属性改为 `LeaseMonths`

**E2E 测试：**

- `feat-009-rental-record-entity.spec.ts`：删除 `LeaseType.cs` 文件存在性断言，改为验证 `LeaseMonths` 属性存在
- `feat-011-checkin-checkout-api.spec.ts`：`leaseType: 0/1/99` → `leaseMonths: 1/6/0`（0 为无效值测试）
- `feat-068-renew-rental-input.spec.ts`：`leaseType` 断言 → `leaseMonths`
- `feat-083-renew-rental-dialog.spec.ts`：租期类型选择器验证改为月数输入验证
- `feat-086-integration-test.spec.ts`：`leaseType: 0/1` → `leaseMonths: 1/6`
- `feat-087-todo-panel-enhancement.spec.ts`：租期类型相关断言更新

## 影响范围

| 文件 | 变更类型 |
|------|----------|
| `Gentle.Core/Enums/LeaseType.cs` | 删除 |
| `Gentle.Core/Entities/RentalRecord.cs` | 字段替换 |
| `Gentle.Application/Dtos/RentalRecord/CheckInInput.cs` | 字段替换 + 验证 |
| `Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | 字段替换 + 计算属性更新 |
| `Gentle.Application/Dtos/Rental/RenewRentalInput.cs` | 字段替换 + 验证 |
| `Gentle.Application/Services/RentalRecordService.cs` | 方法签名更新 |
| `Gentle.Application/Services/RentalReminderService.cs` | 续租方法更新 |
| `Gentle.Application/Apps/RentalAppService.cs` | 透传更新 |
| `Gentle.Database.Migrations/` | 新增迁移 |
| `Hans/src/api/model/rentalModel.ts` | 删除枚举，字段替换 |
| `Hans/src/api/model/todoModel.ts` | 删除枚举引用，更新接口 |
| `Hans/src/pages/tenant/check-in.vue` | 单选→数字输入 |
| `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue` | 租期选择→月数输入 |
| `Hans/src/pages/housing/rental/index.vue` | 列 colKey 和标题更新 |
| `Hans/src/utils/date.ts` | 函数签名简化 + 清理导入 |
| `Gentle.Tests/Services/RentalReminderServiceTests.cs` | 枚举引用替换 |
| `Gentle.Tests/Services/TodoServiceTests.cs` | 属性断言更新 |
| `tests/e2e/feat-009-*.spec.ts` | 枚举断言→月数断言 |
| `tests/e2e/feat-011-*.spec.ts` | API 参数更新 |
| `tests/e2e/feat-068-*.spec.ts` | 断言更新 |
| `tests/e2e/feat-083-*.spec.ts` | 选择器验证更新 |
| `tests/e2e/feat-086-*.spec.ts` | API 参数更新 |
| `tests/e2e/feat-087-*.spec.ts` | 断言更新 |
