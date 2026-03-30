# 租期类型改为月数输入

## 背景

当前办理入住页面使用三选一的租期类型枚举（月租/半年租/年租），不够灵活。用户可能需要 3 个月、9 个月等非标准租期。

## 目标

将租期类型（LeaseType 枚举）改为用户直接输入月数（LeaseMonths 整数），范围 1-12 个月。

## 变更范围

### 数据库迁移

**表：** `rental_record`

采用分步迁移策略，降低不可逆风险：

**第一步迁移 — 新增列并填充数据：**
1. 新增 `LeaseMonths` 列（int, NOT NULL, 默认 1）
2. 数据迁移 SQL：
   ```sql
   UPDATE rental_record SET LeaseMonths = CASE LeaseType
     WHEN 0 THEN 1   -- Monthly
     WHEN 1 THEN 6   -- HalfYear
     WHEN 2 THEN 12  -- Yearly
     ELSE 1
   END;
   ```

**第二步迁移 — 删除旧列：**
3. 确认数据正确后，删除 `LeaseType` 列

**EF Core 迁移文件：** `Gentle/Gentle.Database.Migrations/Migrations/`
**EF Core 迁移快照：** `Gentle/Gentle.Database.Migrations/Migrations/DefaultDbContextModelSnapshot.cs`（自动更新）

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

#### 5. 后端单元测试修改

`Gentle/Gentle.Tests/Services/RentalReminderServiceTests.cs`
- 删除 `LeaseType_EnumValues_AreCorrect` 测试方法（整个方法删除）
- 所有 `LeaseType = LeaseType.Monthly` → `LeaseMonths = 1`
- `Assert.Equal(default, input.LeaseType)` → `Assert.Equal(1, input.LeaseMonths)`

`Gentle/Gentle.Tests/Services/TodoServiceTests.cs`
- `Assert.Equal(default, input.LeaseType)` → `Assert.Equal(1, input.LeaseMonths)`

### 前端改动

#### 1. 类型定义

`Hans/src/api/model/rentalModel.ts`
- 删除 `LeaseType` 枚举
- 删除 `LeaseTypeText` 常量
- `CheckInInput` 接口：`leaseType` → `leaseMonths: number`
- `RentalRecord` 接口：`leaseType` → `leaseMonths: number`，`leaseTypeText` → `leaseMonthsText: string`

`Hans/src/api/model/todoModel.ts`
- 删除 `LeaseType, LeaseTypeText` 的 re-export
- `RenewRentalInput` 接口：`leaseType` → `leaseMonths: number`

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
- **交互说明：** `contractEndDate` 仍由用户手动选择（后端 `ContractEndDate` 是必填字段），`leaseMonths` 仅用于前端预览参考和续租记录存储

#### 5. 租赁记录列表

`Hans/src/pages/housing/rental/index.vue`
- 列定义：`leaseTypeText` → `leaseMonthsText`
- Tag 显示：从枚举文本改为 `${months}个月`

### E2E 测试改动

以下 6 个测试文件需要同步修改：

| 文件 | 改动内容 |
|------|----------|
| `tests/e2e/feat-009-rental-record-entity.spec.ts` | 删除验证 `LeaseType` 枚举文件的测试，改为验证 `LeaseMonths` 属性 |
| `tests/e2e/feat-011-checkin-checkout-api.spec.ts` | API 请求参数 `leaseType: 0` → `leaseMonths: 1` |
| `tests/e2e/feat-068-renew-rental-input.spec.ts` | 请求参数 `leaseType` → `leaseMonths` |
| `tests/e2e/feat-083-renew-rental-dialog.spec.ts` | 删除验证枚举文件内容的断言，改为验证月数输入 |
| `tests/e2e/feat-086-integration-test.spec.ts` | 续租对话框的 `t-select` 验证改为 `t-input-number` 验证 |
| `tests/e2e/feat-087-todo-panel-enhancement.spec.ts` | API 参数 `leaseType: 0/1` → `leaseMonths: 1/6` |

### 自动更新（无需手动修改）

| 文件 | 说明 |
|------|------|
| `Gentle/Gentle.Application/Gentle.Application.xml` | 构建时自动生成，含 LeaseType 注释 |
| `Gentle/Gentle.Core/Gentle.Core.xml` | 构建时自动生成，含 LeaseType 注释 |
| `Gentle/Gentle.Database.Migrations/Migrations/DefaultDbContextModelSnapshot.cs` | EF Core 迁移时自动更新 |

## 不做的事

- 不修改已有的合同结束日期计算逻辑（仍然 checkInDate + months - 1 day）
- 不修改到期提醒、催收等其他业务逻辑（它们依赖 ContractEndDate，不依赖 LeaseType）
- 不增加租期输入的"常用快捷"按钮（如 3/6/12 月），保持简单
- 不修改 `ReportService` 中手动计算 `leaseMonths` 的逻辑（它是局部变量，从 ContractEndDate 推算，与 LeaseType 无关）

## 可选优化（不在本次范围内）

- `Gentle/Gentle.Application/Services/ReportService.cs` 第 78 行手动从 `ContractEndDate` 计算 `leaseMonths`，改为 `LeaseMonths` 后可直接使用实体属性，省去重复计算

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 数据库迁移不可逆 | 分两步执行：先加列填数据确认，再删旧列；执行前备份数据库 |
| 已有数据的枚举值转换错误 | 迁移后验证：`SELECT LeaseType, LeaseMonths FROM rental_record` 确认映射正确 |
| 单元测试 / E2E 测试编译失败 | 逐文件修改所有 LeaseType 引用，确保测试通过 |
