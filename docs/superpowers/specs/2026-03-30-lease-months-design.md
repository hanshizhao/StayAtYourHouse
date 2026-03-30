# 租期类型改为月数输入

## 背景

当前办理入住页面使用三选一的租期类型枚举（月租/半年租/年租），不够灵活。用户可能需要 3 个月、9 个月等非标准租期。

## 目标

将租期类型（LeaseType 枚举）改为用户直接输入月数（LeaseMonths 整数），范围 1-12 个月。

## 变更范围

### 数据库迁移

**表：** `rental_record`

1. 新增 `LeaseMonths` 列（int, NOT NULL, 默认 1）
2. 数据迁移：根据旧 `LeaseType` 值填充 `LeaseMonths`
   - Monthly (0) → 1
   - HalfYear (1) → 6
   - Yearly (2) → 12
3. 删除 `LeaseType` 列

**EF Core 迁移文件：** `Gentle/Gentle.Database.Migrations/Migrations/`

### 后端改动

#### 1. 删除枚举（删除文件）

`Gentle/Gentle.Core/Enums/LeaseType.cs` — 整个文件删除

#### 2. 实体修改

`Gentle/Gentle.Core/Entities/RentalRecord.cs`
- 删除 `public LeaseType LeaseType { get; set; } = LeaseType.Monthly;`
- 新增 `public int LeaseMonths { get; set; } = 1;`

#### 3. DTO 修改

`Gentle/Gentle.Application/Dtos/RentalRecord/CheckInInput.cs`
- 删除 `LeaseType` 属性
- 新增 `[Range(1, 12)] public int LeaseMonths { get; set; } = 1;`

`Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`
- 删除 `LeaseType` 属性和 `LeaseTypeText` 计算属性
- 新增 `public int LeaseMonths { get; set; }`
- 新增 `public string LeaseMonthsText => $"{LeaseMonths}个月";`

`Gentle/Gentle.Application/Dtos/Rental/RenewRentalInput.cs`
- 删除 `LeaseType` 属性
- 新增 `[Range(1, 12)] public int LeaseMonths { get; set; } = 1;`

#### 4. 服务层修改

`Gentle/Gentle.Application/Services/RentalRecordService.cs`
- `CheckInAsync`：`input.LeaseType` → `input.LeaseMonths`，传给 `CalculateContractEndDate`
- `CalculateContractEndDate`：参数从 `LeaseType` 改为 `int months`，逻辑简化为 `checkInDate.AddMonths(months).AddDays(-1)`
- 删除所有 `LeaseType` 枚举引用

`Gentle/Gentle.Application/Services/RentalReminderService.cs`
- `RenewAsync`：`LeaseType = input.LeaseType` → `LeaseMonths = input.LeaseMonths`

### 前端改动

#### 1. 类型定义

`Hans/src/api/model/rentalModel.ts`
- 删除 `LeaseType` 枚举
- 删除 `LeaseTypeText` 常量
- `CheckInInput` 接口：`leaseType` → `leaseMonths: number`
- `RentalRecord` 接口：`leaseType` → `leaseMonths: number`，`leaseTypeText` → `leaseMonthsText: string`

`Hans/src/api/model/todoModel.ts`
- 删除 `LeaseType, LeaseTypeText` 的 re-export

#### 2. 工具函数

`Hans/src/utils/date.ts`
- 删除 `LeaseType` 的 re-export
- `calculateContractEndDate(checkInDate, leaseType)` → `calculateContractEndDate(checkInDate, months: number)`
- 逻辑简化：直接 `dayjs(checkInDate).add(months, 'month').subtract(1, 'day')`

#### 3. 办理入住页面

`Hans/src/pages/tenant/check-in.vue`
- 表单字段：`leaseType` → `leaseMonths`（默认 1）
- Radio 组替换为 `t-input-number`（min=1, max=12）
- 合同结束日期计算更新

#### 4. 续租对话框

`Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`
- Select 下拉替换为 `t-input-number`（min=1, max=12）
- 表单字段名更新

#### 5. 租赁记录列表

`Hans/src/pages/housing/rental/index.vue`
- 列定义：`leaseTypeText` → `leaseMonthsText`
- Tag 显示：从枚举文本改为 `${months}个月`

## 不做的事

- 不修改已有的合同结束日期计算逻辑（仍然 checkInDate + months - 1 day）
- 不修改到期提醒、催收等其他业务逻辑（它们依赖 ContractEndDate，不依赖 LeaseType）
- 不增加租期输入的"常用快捷"按钮（如 3/6/12 月），保持简单

## 风险

- 数据库迁移需要在生产环境执行前备份
- 已有租赁记录的迁移是不可逆的（LeaseType 列会被删除）
