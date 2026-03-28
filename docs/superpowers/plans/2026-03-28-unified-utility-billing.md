# 统一水电费账单实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除不符合实际业务的月租账单（Bill）体系，将水电费账单（UtilityBill）改造为系统唯一账单，并关联到租住记录。

**Architecture:** 删除 Bill/CollectionRecord 实体及其全部服务层和前端页面；修改 UtilityBill 增加 RentalRecordId 外键直接关联租住记录；移除 Merged 状态；更新 RentalRecord 导航属性从 Bills 改为 UtilityBills；前端租赁记录展开行展示水电费账单。

**Tech Stack:** .NET 10 (Furion)、Vue 3 + TypeScript + TDesign、Playwright E2E

**Spec:** `docs/superpowers/specs/2026-03-28-unified-utility-billing-design.md`

---

### Task 1: 删除后端 Bill/CollectionRecord 实体和枚举文件

**Files:**
- Delete: `Gentle/Gentle.Core/Entities/Bill.cs`
- Delete: `Gentle.Core/Entities/CollectionRecord.cs`
- Delete: `Gentle.Core/Enums/BillStatus.cs`
- Delete: `Gentle.Core/Enums/CollectResult.cs`

- [ ] **Step 1: 删除 4 个文件**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
rm Gentle/Gentle.Core/Entities/Bill.cs
rm Gentle/Gentle.Core/Entities/CollectionRecord.cs
rm Gentle/Gentle.Core/Enums/BillStatus.cs
rm Gentle/Gentle.Core/Enums/CollectResult.cs
```

> 此时编译会失败（其他文件仍引用这些类型），这是预期的，在 Task 2 中修复。

- [ ] **Step 2: 提交（暂不编译验证，与 Task 2 合并后验证）**

---

### Task 2: 删除后端 Bill 服务层和 DTO

**Files:**
- Delete: `Gentle/Gentle.Application/Apps/BillAppService.cs`
- Delete: `Gentle/Gentle.Application/Services/IBillService.cs`
- Delete: `Gentle/Gentle.Application/Services/BillService.cs`
- Delete: `Gentle/Gentle.Application/Dtos/Bill/` (整个目录)
- Delete: `Gentle/Gentle.Application/Dtos/Report/CollectionReportDto.cs`

- [ ] **Step 1: 删除文件**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
rm Gentle/Gentle.Application/Apps/BillAppService.cs
rm Gentle/Gentle.Application/Services/IBillService.cs
rm Gentle/Gentle.Application/Services/BillService.cs
rm -rf Gentle/Gentle.Application/Dtos/Bill/
rm Gentle/Gentle.Application/Dtos/Report/CollectionReportDto.cs
```

> 此时编译仍会失败，在 Task 3 中修复所有引用。

---

### Task 3: 清理后端共享文件中的 Bill 引用

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/RentalRecord.cs:2,138`
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs:1,126`
- Modify: `Gentle/Gentle.Application/Mapper.cs:1,49,55-59`

- [ ] **Step 1: 修改 RentalRecord.cs — 删除 Bills 导航属性**

在第 2 行删除 `using System.Collections.Generic;`（如仍被 List 初始化使用则保留）。

将第 135-138 行：
```csharp
    /// <summary>
    /// 账单集合
    /// </summary>
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
```
整段删除。

- [ ] **Step 2: 修改 RentalRecordDto.cs — 删除 Bills 属性**

将第 1 行 `using Gentle.Application.Dtos.Bill;` 删除。

将第 123-126 行：
```csharp
    /// <summary>
    /// 关联账单列表
    /// </summary>
    public List<BillDto>? Bills { get; set; }
```
整段删除。

- [ ] **Step 3: 修改 Mapper.cs — 删除 Bill 相关映射**

将第 1 行 `using Gentle.Application.Dtos.Bill;` 删除。

将第 49 行 `.Map(dest => dest.Bills, src => src.Bills);` 删除。

将第 55-59 行：
```csharp
        // Bill -> BillDto 映射配置
        config.NewConfig<Bill, BillDto>();

        // CollectionRecord -> CollectionRecordDto 映射配置
        config.NewConfig<CollectionRecord, CollectionRecordDto>();
```
整段删除。

- [ ] **Step 4: 验证编译**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: 编译仍有错误（ReportService、RentalRecordService 仍引用 Bill），在 Task 4-5 中修复。

---

### Task 4: 清理 ReportService 中的 Bill 引用

**Files:**
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs:13,19-20,26,43-47,86-88,106,242-335`
- Modify: `Gentle/Gentle.Application/Services/IReportService.cs:37`
- Modify: `Gentle/Gentle.Application/Apps/ReportAppService.cs:53-64`

- [ ] **Step 1: 修改 ReportService.cs**

删除构造函数中 `IRepository<Bill>` 相关代码：
- 第 13 行：删除 `private readonly IRepository<Bill> _billRepository;`
- 构造函数参数中删除 `IRepository<Bill> billRepository,`
- 构造函数体中删除 `_billRepository = billRepository;`

修改 `GetIncomeReportAsync` 方法（第 34-111 行）：
- 删除第 43-47 行（查询 paidBills）
- 将第 86-88 行的 `rentIncome` 计算改为从 RentalRecord 计算：

```csharp
            // 租金收入从租住记录的入住日期所在月份计算
            var rentIncome = activeRentals
                .Where(r => r.CheckInDate >= monthStart && r.CheckInDate <= monthEnd)
                .Sum(r => r.MonthlyRent);
```

- 将第 106 行的 `TotalRentIncome` 改为：

```csharp
            TotalRentIncome = activeRentals
                .Where(r => r.CheckInDate >= yearStart && r.CheckInDate <= yearEnd)
                .Sum(r => r.MonthlyRent),
```

删除整个 `GetCollectionReportAsync` 方法（第 242-335 行）。

- [ ] **Step 2: 修改 IReportService.cs**

删除第 31-37 行的 `GetCollectionReportAsync` 接口声明。

- [ ] **Step 3: 修改 ReportAppService.cs**

删除第 53-64 行的 `GetCollectionReport` 方法。

- [ ] **Step 4: 验证编译**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: 编译仍有错误（RentalRecordService 仍引用 .Include(r => r.Bills)），在 Task 5 中修复。

---

### Task 5: 清理 RentalRecordService 中的 Bill 引用

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs:75,101`

- [ ] **Step 1: 修改 GetByIdAsync**

将第 75 行：
```csharp
            .Include(r => r.Bills)
```
删除。

- [ ] **Step 2: 修改 GetPagedListAsync**

将第 101 行：
```csharp
            .Include(r => r.Bills)
```
删除。

- [ ] **Step 3: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交 Task 1-5 的所有改动**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add -A Gentle/
git commit -m "refactor: 删除 Bill/CollectionRecord 月租账单体系"
```

---

### Task 6: 修改 UtilityBillStatus 枚举（移除 Merged）

**Files:**
- Modify: `Gentle/Gentle.Core/Enums/UtilityBillStatus.cs`

- [ ] **Step 1: 移除 Merged 枚举值**

将文件内容改为：
```csharp
namespace Gentle.Core.Enums;

/// <summary>
/// 水电账单状态
/// </summary>
public enum UtilityBillStatus
{
    /// <summary>
    /// 待收取
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 已收取
    /// </summary>
    Paid = 1
}
```

- [ ] **Step 2: 验证编译**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: 编译失败（MeterService 和 UtilityBillDto 中引用 Merged），在 Task 7 中修复。

---

### Task 7: 清理 MeterService 和 UtilityBillDto 中的 Merged 引用

**Files:**
- Modify: `Gentle/Gentle.Application/Services/MeterService.cs:277-280,357-360`
- Modify: `Gentle/Gentle.Application/Dtos/Meter/UtilityBillDto.cs:92`

- [ ] **Step 1: 修改 MeterService.cs PayAsync 方法**

删除第 277-280 行：
```csharp
        if (bill.Status == UtilityBillStatus.Merged)
        {
            throw Oops.Oh("该账单已合并到房租账单，无法单独收款");
        }
```

- [ ] **Step 2: 修改 MeterService.cs DeleteBillAsync 方法**

删除第 357-360 行：
```csharp
        if (bill.Status == UtilityBillStatus.Merged)
        {
            throw Oops.Oh("已合并的账单不能删除");
        }
```

- [ ] **Step 3: 修改 UtilityBillDto.cs StatusText**

将第 88-94 行改为：
```csharp
    public string StatusText => Status switch
    {
        UtilityBillStatus.Pending => "待收取",
        UtilityBillStatus.Paid => "已收取",
        _ => "未知"
    };
```

- [ ] **Step 4: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Gentle/Gentle.Core/Enums/UtilityBillStatus.cs Gentle/Gentle.Application/Services/MeterService.cs Gentle/Gentle.Application/Dtos/Meter/UtilityBillDto.cs
git commit -m "refactor: 移除 UtilityBillStatus.Merged 枚举及引用"
```

---

### Task 8: UtilityBill 增加 RentalRecordId 字段

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/UtilityBill.cs:56-57,79-80`
- Modify: `Gentle/Gentle.Application/Services/MeterService.cs` (CreateUtilityBillAsync 方法)

- [ ] **Step 1: 在 UtilityBill 实体中新增字段**

在 `MeterRecord` 导航属性之后（约第 89 行后）插入：

```csharp
    /// <summary>
    /// 租住记录ID（可选，无活跃租约时为空）
    /// </summary>
    public int? RentalRecordId { get; set; }

    /// <summary>
    /// 租住记录导航属性
    /// </summary>
    public RentalRecord? RentalRecord { get; set; }
```

同时在 `[Index(nameof(MeterRecordId))]` 之后添加索引：
```csharp
[Index(nameof(RentalRecordId))]
```

- [ ] **Step 2: 修改 MeterService.CreateUtilityBillAsync**

将方法体（第 381-417 行）改为：

```csharp
    private async Task CreateUtilityBillAsync(MeterRecord meterRecord, Room room, DateTime? prevMeterDate)
    {
        // 获取当前租约
        var activeRental = await _rentalRecordRepository
            .AsQueryable(false)
            .Where(r => r.RoomId == meterRecord.RoomId && r.Status == RentalStatus.Active)
            .FirstOrDefaultAsync();

        // 无活跃租约时不创建账单（仅保存抄表记录）
        if (activeRental == null)
        {
            return;
        }

        // 计算账单周期
        DateTime periodStart;
        if (prevMeterDate.HasValue)
        {
            periodStart = prevMeterDate.Value;
        }
        else
        {
            periodStart = meterRecord.MeterDate.AddMonths(-1);
        }

        var utilityBill = new UtilityBill
        {
            RoomId = meterRecord.RoomId,
            RentalRecordId = activeRental.Id,
            MeterRecordId = meterRecord.Id,
            PeriodStart = periodStart,
            PeriodEnd = meterRecord.MeterDate,
            WaterUsage = meterRecord.WaterUsage,
            ElectricUsage = meterRecord.ElectricUsage,
            WaterFee = meterRecord.WaterFee,
            ElectricFee = meterRecord.ElectricFee,
            TotalAmount = meterRecord.WaterFee + meterRecord.ElectricFee,
            Status = UtilityBillStatus.Pending
        };

        await _utilityBillRepository.InsertAsync(utilityBill);
    }
```

关键变更：
- 添加 `if (activeRental == null) return;` — 无租客时不创建账单
- `BillTenantId` 不再设置（已废弃）
- 新增 `RentalRecordId = activeRental.Id`

- [ ] **Step 3: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Gentle/Gentle.Core/Entities/UtilityBill.cs Gentle/Gentle.Application/Services/MeterService.cs
git commit -m "feat: UtilityBill 增加 RentalRecordId，无租客时不创建账单"
```

---

### Task 9: RentalRecord 新增 UtilityBills 导航属性并更新查询

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/RentalRecord.cs`
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs:68-76,96-102`
- Modify: `Gentle/Gentle.Application/Mapper.cs`

- [ ] **Step 1: 在 RentalRecord 实体中新增 UtilityBills 导航属性**

在之前删除 `Bills` 的位置插入：

```csharp
    /// <summary>
    /// 水电费账单集合
    /// </summary>
    public ICollection<UtilityBill> UtilityBills { get; set; } = new List<UtilityBill>();
```

- [ ] **Step 2: 在 RentalRecordDto 中新增 UtilityBills 属性**

添加 `using Gentle.Application.Dtos.Meter;`

在之前删除 `Bills` 的位置插入：

```csharp
    /// <summary>
    /// 关联水电费账单列表
    /// </summary>
    public List<UtilityBillDto>? UtilityBills { get; set; }
```

- [ ] **Step 3: 修改 RentalRecordService 查询**

在 GetByIdAsync（第 68-76 行）中，在 `.Include(r => r.Room)` 之后添加：
```csharp
            .Include(r => r.UtilityBills)
```

在 GetPagedListAsync（第 96-102 行）中，在 `.Include(r => r.Room)` 之后添加：
```csharp
            .Include(r => r.UtilityBills)
```

- [ ] **Step 4: 修改 Mapper.cs — 添加 UtilityBills 映射**

在 RentalRecord -> RentalRecordDto 映射中添加 `.Map(dest => dest.UtilityBills, src => src.UtilityBills);`：

```csharp
        config.NewConfig<RentalRecord, RentalRecordDto>()
            .Map(dest => dest.TenantId, src => src.RenterId)
            .Map(dest => dest.TenantName, src => src.Renter != null ? src.Renter.Name : string.Empty)
            .Map(dest => dest.RoomInfo, src => src.Room != null && src.Room.Community != null
                ? $"{src.Room.Community.Name} {src.Room.Building}栋 {src.Room.RoomNumber}号"
                : string.Empty)
            .Map(dest => dest.UtilityBills, src => src.UtilityBills);
```

- [ ] **Step 5: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 6: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Gentle/Gentle.Core/Entities/RentalRecord.cs Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs Gentle/Gentle.Application/Services/RentalRecordService.cs Gentle/Gentle.Application/Mapper.cs
git commit -m "feat: RentalRecord 关联 UtilityBills，替代原 Bills 导航"
```

---

### Task 10: 数据库迁移

**Files:**
- Generate: `Gentle/Gentle.Database.Migrations/Migrations/` (新迁移文件)

- [ ] **Step 1: 生成迁移**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle
dotnet ef migrations add RemoveBillAndAddUtilityBillRentalLink \
  --project Gentle.Database.Migrations \
  --startup-project Gentle.Web.Entry
```

- [ ] **Step 2: 检查迁移文件内容**

打开生成的迁移文件，确认包含：
1. 删除 `collection_record` 表
2. 删除 `bill` 表
3. `utility_bill` 表新增 `rental_record_id` 列（可空 int，外键）
4. 将 `utility_bill` 中 `status = 2` 的记录改为 `status = 1`（Merged → Paid）

如果迁移文件中缺少第 4 项，手动在 `Up` 方法中添加：

```csharp
migrationBuilder.Sql("UPDATE utility_bill SET status = 1 WHERE status = 2");
```

- [ ] **Step 3: 应用迁移**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle
dotnet ef database update \
  --project Gentle.Database.Migrations \
  --startup-project Gentle.Web.Entry
```

Expected: Done.

- [ ] **Step 4: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Gentle/Gentle.Database.Migrations/
git commit -m "feat: 数据库迁移 - 删除 bill/collection_record 表，utility_bill 增加 rental_record_id"
```

---

### Task 11: 删除前端 Bill 相关文件

**Files:**
- Delete: `Hans/src/pages/bill/` (整个目录)
- Delete: `Hans/src/api/bill.ts`
- Delete: `Hans/src/api/model/billModel.ts`
- Delete: `Hans/src/router/modules/bill.ts`

- [ ] **Step 1: 删除文件**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
rm -rf Hans/src/pages/bill/
rm Hans/src/api/bill.ts
rm Hans/src/api/model/billModel.ts
rm Hans/src/router/modules/bill.ts
```

- [ ] **Step 2: 清理 rentalModel.ts**

修改 `Hans/src/api/model/rentalModel.ts`：
- 删除第 1 行 `import type { BillItem } from '@/api/model/billModel';`
- 删除 `bills?: BillItem[]` 属性

在对应位置新增：
```typescript
import type { UtilityBillItem } from '@/api/model/meterModel';

// ... 在 RentalRecordItem 接口中
  /** 关联水电费账单 */
  utilityBills?: UtilityBillItem[];
```

- [ ] **Step 3: 清理 reportModel.ts**

修改 `Hans/src/api/model/reportModel.ts`：
- 删除 `CollectionReport`、`OverdueBillInfo`、`GraceBillInfo` 类型定义

- [ ] **Step 4: 清理 report.ts**

修改 `Hans/src/api/report.ts`：
- 删除 `getCollectionReport` 函数

- [ ] **Step 5: 删除催收统计报表前端页面**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
rm Hans/src/pages/report/collection/index.vue
```

- [ ] **Step 6: 清理报表路由**

修改 `Hans/src/router/modules/report.ts`：
- 删除催收统计报表路由条目

- [ ] **Step 7: 验证前端构建**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run build:type`
Expected: 可能有类型错误（其他文件仍引用 BillItem 等），在 Task 12 中修复。

- [ ] **Step 8: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add -A Hans/
git commit -m "refactor: 删除前端 Bill 月租账单相关页面和 API"
```

---

### Task 12: 前端租赁记录页展示 UtilityBills

**Files:**
- Modify: `Hans/src/pages/housing/rental/index.vue`

- [ ] **Step 1: 修改展开行数据源和列定义**

在展开行模板 `#expandedRow` 中：
- 将 `rentalRow.bills` 改为 `rentalRow.utilityBills`
- 将 `暂无关联账单` 改为 `暂无水电费账单`
- 将 `关联账单` 改为 `水电费账单`

列定义改为水电费账单列：
```typescript
const utilityBillColumns = [
  { colKey: 'periodText', title: '周期', width: 200 },
  { colKey: 'waterFee', title: '水费（元）', width: 100 },
  { colKey: 'electricFee', title: '电费（元）', width: 100 },
  { colKey: 'totalAmount', title: '总金额（元）', width: 120 },
  { colKey: 'statusText', title: '状态', width: 100 },
  { colKey: 'paidDate', title: '收款日期', width: 120 },
];
```

同时删除原来的 `billColumns` 定义。

- [ ] **Step 2: 验证前端构建通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run build:type`
Expected: 通过或有剩余错误（继续修复）。

- [ ] **Step 3: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Hans/src/pages/housing/rental/index.vue
git commit -m "feat: 租赁记录展开行展示水电费账单"
```

---

### Task 13: 前端水电费类型清理和页面适配

**Files:**
- Modify: `Hans/src/api/model/meterModel.ts`
- Modify: `Hans/src/pages/utility/bill/index.vue`
- Modify: `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

- [ ] **Step 1: 清理 meterModel.ts**

删除 `UtilityBillStatus.Merged = 2` 枚举值和对应的文本映射。

- [ ] **Step 2: 修改水电账单页面**

修改 `Hans/src/pages/utility/bill/index.vue`：
- 移除所有 Merged 状态的筛选选项、状态展示和处理逻辑

- [ ] **Step 3: 修改 Dashboard 待办面板**

修改 `Hans/src/pages/dashboard/base/components/TodoPanel.vue`：
- 删除 `getTodayTodos` 调用和 Bill 相关导入
- 改为查询 Pending 状态的 UtilityBill 列表（使用 meter API 中的获取水电账单列表接口）
- 显示格式：房间号 + 水电费金额 + 待收取状态

- [ ] **Step 4: 验证前端构建通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run build:type`
Expected: BUILD SUCCEEDED（无类型错误）

- [ ] **Step 5: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add Hans/src/api/model/meterModel.ts Hans/src/pages/utility/bill/index.vue Hans/src/pages/dashboard/base/components/TodoPanel.vue
git commit -m "refactor: 前端清理 Merged 状态，Dashboard 改为展示水电费待办"
```

---

### Task 14: 清理 E2E 测试文件

**Files:**
- Delete: `tests/e2e/feat-015-bill-entity.spec.ts`
- Delete: `tests/e2e/feat-016-collection-record-entity.spec.ts`
- Delete: `tests/e2e/feat-017-bill-api.spec.ts`
- Delete: `tests/e2e/feat-018-bill-page.spec.ts`
- Delete: `tests/e2e/feat-019-collect-dialog.spec.ts`
- Delete: `tests/e2e/feat-029-collection-report-page.spec.ts`
- Modify: `tests/e2e/feat-020-dashboard-todo.spec.ts`
- Modify: `tests/e2e/feat-024-utility-bill-page.spec.ts`
- Modify: `tests/e2e/feat-030-full-flow.spec.ts`
- Modify: `tests/e2e/feat-031-rental-dto-mapper.spec.ts`

- [ ] **Step 1: 删除 Bill 相关 E2E 测试文件**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse/tests
rm e2e/feat-015-bill-entity.spec.ts
rm e2e/feat-016-collection-record-entity.spec.ts
rm e2e/feat-017-bill-api.spec.ts
rm e2e/feat-018-bill-page.spec.ts
rm e2e/feat-019-collect-dialog.spec.ts
rm e2e/feat-029-collection-report-page.spec.ts
```

- [ ] **Step 2: 更新 feat-020-dashboard-todo.spec.ts**

- 删除所有 Bill 待办相关的断言
- 改为断言 Pending 状态的 UtilityBill 出现在待办列表中

- [ ] **Step 3: 更新 feat-024-utility-bill-page.spec.ts**

- 删除所有 Merged 状态相关的测试用例

- [ ] **Step 4: 更新 feat-030-full-flow.spec.ts**

- 删除 Bill 催收流程相关的步骤

- [ ] **Step 5: 更新 feat-031-rental-dto-mapper.spec.ts**

- 将 Bill 映射断言改为 UtilityBill 映射断言
- 验证 UtilityBills 集合正确映射

- [ ] **Step 6: 提交**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add -A tests/
git commit -m "refactor: 清理 Bill 相关 E2E 测试，更新水电费测试"
```

---

### Task 15: 最终验证

- [ ] **Step 1: 后端编译**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 2: 前端类型检查**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run build:type`
Expected: 无错误

- [ ] **Step 3: 前端完整构建**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 启动后端 API**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet run --project Gentle.Web.Entry`
Expected: 服务器正常启动，Swagger 页面可访问

- [ ] **Step 5: 启动前端开发服务器**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run dev`
Expected: 开发服务器在 3002 端口启动

- [ ] **Step 6: 运行 E2E 测试**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/tests && npm run test`
Expected: 所有剩余测试通过

- [ ] **Step 7: 最终提交（如有遗漏修复）**

```bash
cd C:/Users/hansh/Desktop/StayAtYourHouse
git add -A
git commit -m "fix: 统一水电费账单最终修复"
```
