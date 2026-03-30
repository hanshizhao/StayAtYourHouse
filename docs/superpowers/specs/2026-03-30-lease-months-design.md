# 租期类型改为月数输入 — 设计文档

日期：2026-03-30

## 背景

当前入住页面的租期类型是固定三选一的枚举（月租/半年租/年租），不够灵活。改为让用户直接输入月数，覆盖 1~36 个月的任意租期。

## 方案

彻底替换：废弃 `LeaseType` 枚举，用 `LeaseMonths`（int）字段替代。数据库迁移时将旧枚举值转换为对应月数。

## 变更详情

### 1. 数据库

- 新增 `lease_months` 列（int, not null, default 1）
- 迁移 SQL 将旧值转换：`lease_type = 0→1`, `1→6`, `2→12`
- 删除 `lease_type` 列
- 删除枚举文件 `Gentle.Core/Enums/LeaseType.cs`

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
- `RentalRecordDto.cs`：`LeaseType LeaseType` → `int LeaseMonths`，增加 `LeaseMonthsText` 输出（如 "3个月"）

**服务层：**

- `RentalRecordService.cs`：`CalculateContractEndDate` 改为接收 `int leaseMonths`，直接 `checkInDate.AddMonths(leaseMonths).AddDays(-1)`
- 续租等引用 `LeaseType` 的方法同步更新

### 4. 前端

**类型定义（rentalModel.ts）：**

- 删除 `LeaseType` 枚举和 `LeaseTypeText` 映射
- `CheckInFormData` 接口中 `leaseType` → `leaseMonths: number`

**入住页面（check-in.vue）：**

- 单选按钮组 → `t-input-number` 数字输入框（min=1, max=36, step=1）
- 输入框后缀显示"个月"
- 合同结束日期直接用月数计算
- 默认值 `leaseMonths: 1`

**工具函数（date.ts）：**

- `calculateContractEndDate` 改为接收 `leaseMonths: number`
- 内部简化为 `checkIn.add(leaseMonths, 'month').subtract(1, 'day')`

**其他引用点：**

- 租赁列表页、续租对话框等显示租期的地方，从"月租/半年租/年租"改为"X个月"

## 影响范围

| 文件 | 变更类型 |
|------|----------|
| `Gentle.Core/Enums/LeaseType.cs` | 删除 |
| `Gentle.Core/Entities/RentalRecord.cs` | 字段替换 |
| `Gentle.Application/Dtos/RentalRecord/CheckInInput.cs` | 字段替换 + 验证 |
| `Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | 字段替换 + 新增文本 |
| `Gentle.Application/Services/RentalRecordService.cs` | 方法签名更新 |
| `Gentle.Application/Apps/RentalAppService.cs` | 透传更新 |
| `Gentle.Database.Migrations/` | 新增迁移 |
| `Hans/src/api/model/rentalModel.ts` | 删除枚举，字段替换 |
| `Hans/src/pages/tenant/check-in.vue` | 单选→数字输入 |
| `Hans/src/utils/date.ts` | 函数签名简化 |
| 租赁列表页、续租对话框等 | 显示文本更新 |
