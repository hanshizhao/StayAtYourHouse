# 待办事项卡片增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展落地页待办事项卡片，支持收水电费和催收房租两种待办类型，提供筛选、宽限、续租等功能。

**Architecture:** 后端新增 RentalReminder 和 RentalDeferral 实体，通过 TodoService 聚合水电费和催收房租待办；前端改造 TodoPanel 组件支持类型筛选，新增催收房租相关弹窗组件。

**Tech Stack:** .NET 10 (Furion), Vue 3, TDesign, Entity Framework Core

---

## 前置准备

- [ ] **Task 0: 创建功能分支**
  - 从 main 分支创建 `feat/todo-panel-enhancement` 分支
  - `git checkout -b feat/todo-panel-enhancement`

- [ ] **Task 0.1: 确认现有枚举和扩展方法**
  - 确认 `Gentle.Core/Enums/LeaseType.cs` 存在
  - 确认 `Gentle.Core/Enums/RentalStatus.cs` 存在且包含 `Terminated` 值
  - 确认 `Gentle.Core/Enums/UtilityBillStatus.cs` 存在
  - 确认 `Gentle.Core/Enums/RoomStatusExtensions.cs` 存在（提供 `RoomStatus.ToText()`）
  - **需要创建以下扩展方法文件：**
    - `Gentle.Core/Enums/LeaseTypeExtensions.cs` - 提供 `LeaseType.ToText()`
    - `Gentle.Core/Enums/RentalStatusExtensions.cs` - 提供 `RentalStatus.ToText()`
    - `Gentle.Core/Enums/UtilityBillStatusExtensions.cs` - 提供 `UtilityBillStatus.ToText()`

---

## Phase 1: 后端数据模型

### Task 1: 创建 RentalReminderStatus 枚举

**文件:** `Gentle/Gentle.Core/Enums/RentalReminderStatus.cs`

```csharp
namespace Gentle.Core.Enums;

/// <summary>
/// 催收提醒状态
/// </summary>
public enum RentalReminderStatus
{
    /// <summary>
    /// 待处理
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 已宽限
    /// </summary>
    Deferred = 1,

    /// <summary>
    /// 已完成（续租）
    /// </summary>
    Completed = 2
}
```

**验证:** 编译通过

---

### Task 2: 创建 RentalReminder 实体

**文件:** `Gentle/Gentle.Core/Entities/RentalReminder.cs`

```csharp
using Gentle.Core.Enums;
using Gentle.EntityFramework.Core;

namespace Gentle.Core.Entities;

/// <summary>
/// 催收提醒
/// </summary>
public class RentalReminder : Entity<int>
{
    /// <summary>
    /// 关联的租赁记录ID
    /// </summary>
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 提醒日期
    /// </summary>
    public DateTime ReminderDate { get; set; }

    /// <summary>
    /// 状态
    /// </summary>
    public RentalReminderStatus Status { get; set; } = RentalReminderStatus.Pending;

    /// <summary>
    /// 导航属性：关联的租赁记录
    /// </summary>
    public RentalRecord RentalRecord { get; set; } = null!;

    /// <summary>
    /// 导航属性：宽限记录集合
    /// </summary>
    public ICollection<RentalDeferral> Deferrals { get; set; } = new List<RentalDeferral>();
}
```

**验证:** 编译通过

---

### Task 3: 创建 RentalDeferral 实体

**文件:** `Gentle/Gentle.Core/Entities/RentalDeferral.cs`

```csharp
using Gentle.EntityFramework.Core;

namespace Gentle.Core.Entities;

/// <summary>
/// 宽限记录
/// </summary>
public class RentalDeferral : Entity<int>
{
    /// <summary>
    /// 关联的催收提醒ID
    /// </summary>
    public int RentalReminderId { get; set; }

    /// <summary>
    /// 原计划提醒日期
    /// </summary>
    public DateTime OriginalReminderDate { get; set; }

    /// <summary>
    /// 宽限到的日期
    /// </summary>
    public DateTime DeferredToDate { get; set; }

    /// <summary>
    /// 宽限原因/备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 导航属性：关联的催收提醒
    /// </summary>
    public RentalReminder RentalReminder { get; set; } = null!;
}
```

**验证:** 编译通过

---

### Task 4: 创建数据库迁移

**命令:**
```bash
cd Gentle
dotnet ef migrations add AddRentalReminderAndDeferral --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```

**验证:** 迁移文件生成成功，检查 Up 方法包含 RentalReminder 和 RentalDeferral 表创建

---

### Task 5: 执行数据库迁移

**命令:**
```bash
cd Gentle
dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```

**验证:** 数据库表创建成功

**提交:** `git add -A && git commit -m "feat: 添加 RentalReminder 和 RentalDeferral 实体"`

---

## Phase 2: 后端 DTO

### Task 6: 创建待办类型枚举

**文件:** `Gentle/Gentle.Application/Dtos/Todo/TodoType.cs`

```csharp
namespace Gentle.Application.Dtos.Todo;

/// <summary>
/// 待办类型
/// </summary>
public enum TodoType
{
    /// <summary>
    /// 水电费
    /// </summary>
    Utility = 0,

    /// <summary>
    /// 催收房租
    /// </summary>
    Rental = 1
}
```

**验证:** 编译通过

---

### Task 7: 创建 TodoItemDto

**文件:** `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs`

```csharp
using Gentle.Application.Dtos.Meter;

namespace Gentle.Application.Dtos.Todo;

/// <summary>
/// 待办事项 DTO（用于统一返回水电费和催收房租）
/// </summary>
public class TodoItemDto
{
    /// <summary>
    /// 待办类型
    /// </summary>
    public TodoType Type { get; set; }

    /// <summary>
    /// 关联ID（水电费账单ID 或 催收提醒ID）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 房间信息
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    // === 水电费专用字段 ===

    /// <summary>
    /// 账单金额（水电费）
    /// </summary>
    public decimal? Amount { get; set; }

    /// <summary>
    /// 账单周期（水电费）
    /// </summary>
    public string? Period { get; set; }

    // === 催收房租专用字段 ===

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string? TenantName { get; set; }

    /// <summary>
    /// 租客电话（脱敏）
    /// </summary>
    public string? TenantPhone { get; set; }

    /// <summary>
    /// 月租金
    /// </summary>
    public decimal? MonthlyRent { get; set; }

    /// <summary>
    /// 合同到期日
    /// </summary>
    public DateTime? ContractEndDate { get; set; }

    /// <summary>
    /// 入住日期
    /// </summary>
    public DateTime? CheckInDate { get; set; }

    /// <summary>
    /// 租期类型
    /// </summary>
    public int? LeaseType { get; set; }

    /// <summary>
    /// 租期类型文本
    /// </summary>
    public string? LeaseTypeText { get; set; }

    /// <summary>
    /// 宽限次数
    /// </summary>
    public int DeferralCount { get; set; }

    /// <summary>
    /// 最近宽限日期
    /// </summary>
    public DateTime? LastDeferredDate { get; set; }

    // === 原始数据（用于弹窗展示） ===

    /// <summary>
    /// 水电费账单详情（仅水电费类型）
    /// </summary>
    public UtilityBillDto? UtilityBill { get; set; }

    /// <summary>
    /// 催收提醒详情（仅催收房租类型）
    /// </summary>
    public RentalReminderDto? RentalReminder { get; set; }
}
```

**验证:** 编译通过

---

### Task 8: 创建 TodoListResult

**文件:** `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs`

```csharp
namespace Gentle.Application.Dtos.Todo;

/// <summary>
/// 待办列表结果
/// </summary>
public class TodoListResult
{
    /// <summary>
    /// 待办列表
    /// </summary>
    public List<TodoItemDto> Items { get; set; } = new();

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 水电费待办数量
    /// </summary>
    public int UtilityCount { get; set; }

    /// <summary>
    /// 催收房租待办数量
    /// </summary>
    public int RentalCount { get; set; }
}
```

**验证:** 编译通过

---

### Task 9: 创建 RentalReminderDto

**文件:** `Gentle/Gentle.Application/Dtos/Rental/RentalReminderDto.cs`

```csharp
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 催收提醒 DTO
/// </summary>
public class RentalReminderDto
{
    public int Id { get; set; }
    public int RentalRecordId { get; set; }
    public string RoomInfo { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string? TenantPhone { get; set; }
    public int TenantId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime ContractEndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal Deposit { get; set; }
    public LeaseType LeaseType { get; set; }
    public string LeaseTypeText { get; set; } = string.Empty;
    public int DeferralCount { get; set; }
    public DateTime? LastDeferredDate { get; set; }
}
```

**验证:** 编译通过

---

### Task 10: 创建 DeferReminderInput

**文件:** `Gentle/Gentle.Application/Dtos/Rental/DeferReminderInput.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 宽限提醒输入
/// </summary>
public class DeferReminderInput
{
    /// <summary>
    /// 宽限到的日期
    /// </summary>
    [Required(ErrorMessage = "宽限日期不能为空")]
    public DateTime DeferredToDate { get; set; }

    /// <summary>
    /// 宽限原因/备注
    /// </summary>
    public string? Remark { get; set; }
}
```

**验证:** 编译通过

---

### Task 11: 创建 RenewRentalInput

**文件:** `Gentle/Gentle.Application/Dtos/Rental/RenewRentalInput.cs`

```csharp
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 续租输入
/// </summary>
public class RenewRentalInput
{
    /// <summary>
    /// 新租期类型
    /// </summary>
    [Required(ErrorMessage = "租期类型不能为空")]
    public LeaseType LeaseType { get; set; }

    /// <summary>
    /// 新月租金
    /// </summary>
    [Required(ErrorMessage = "月租金不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "月租金必须大于0")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 新合同到期日
    /// </summary>
    [Required(ErrorMessage = "合同到期日不能为空")]
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 合同图片
    /// </summary>
    public string? ContractImage { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}
```

**验证:** 编译通过

---

### Task 12: 创建 DeferralRecordDto

**文件:** `Gentle/Gentle.Application/Dtos/Rental/DeferralRecordDto.cs`

```csharp
namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 宽限记录 DTO
/// </summary>
public class DeferralRecordDto
{
    public int Id { get; set; }
    public DateTime OriginalReminderDate { get; set; }
    public DateTime DeferredToDate { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedTime { get; set; }
}

/// <summary>
/// 宽限记录列表结果
/// </summary>
public class DeferralListResult
{
    public List<DeferralRecordDto> Items { get; set; } = new();
    public int Total { get; set; }
}
```

**验证:** 编译通过

---

## Phase 3: 后端服务

### Task 13: 创建 ITodoService 接口

**文件:** `Gentle/Gentle.Application/Services/ITodoService.cs`

```csharp
using Gentle.Application.Dtos.Todo;

namespace Gentle.Application.Services;

/// <summary>
/// 待办服务接口
/// </summary>
public interface ITodoService
{
    /// <summary>
    /// 获取待办列表
    /// </summary>
    Task<TodoListResult> GetTodoListAsync(string? type, int page, int pageSize);
}
```

**验证:** 编译通过

---

### Task 14: 创建 TodoService 实现

**文件:** `Gentle/Gentle.Application/Services/TodoService.cs`

```csharp
using Gentle.Application.Dtos.Meter;
using Gentle.Application.Dtos.Rental;
using Gentle.Application.Dtos.Todo;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 待办服务实现
/// </summary>
public class TodoService : ITodoService, ITransient
{
    private readonly IRepository<UtilityBill> _billRepository;
    private readonly IRepository<RentalReminder> _reminderRepository;
    private readonly IRepository<RentalRecord> _rentalRepository;

    public TodoService(
        IRepository<UtilityBill> billRepository,
        IRepository<RentalReminder> reminderRepository,
        IRepository<RentalRecord> rentalRepository)
    {
        _billRepository = billRepository;
        _reminderRepository = reminderRepository;
        _rentalRepository = rentalRepository;
    }

    public async Task<TodoListResult> GetTodoListAsync(string? type, int page, int pageSize)
    {
        var items = new List<TodoItemDto>();
        var utilityCount = 0;
        var rentalCount = 0;

        // 获取水电费待办
        if (type is null or "utility")
        {
            var bills = await _billRepository
                .AsQueryable(false)
                .Include(b => b.Room)
                .ThenInclude(r => r!.Community)
                .Where(b => b.Status == UtilityBillStatus.Pending)
                .OrderBy(b => b.CreatedTime)
                .Take(pageSize)
                .ToListAsync();

            utilityCount = await _billRepository
                .AsQueryable(false)
                .CountAsync(b => b.Status == UtilityBillStatus.Pending);

            foreach (var bill in bills)
            {
                items.Add(new TodoItemDto
                {
                    Type = TodoType.Utility,
                    Id = bill.Id,
                    RoomInfo = $"{bill.Room?.Community?.Name} {bill.Room?.Building}-{bill.Room?.RoomNumber}",
                    Amount = bill.TotalAmount,
                    Period = $"{bill.PeriodStart:yyyy-MM-dd} ~ {bill.PeriodEnd:yyyy-MM-dd}",
                    UtilityBill = MapToUtilityBillDto(bill)
                });
            }
        }

        // 获取催收房租待办
        if (type is null or "rental")
        {
            var reminders = await _reminderRepository
                .AsQueryable(false)
                .Include(r => r.RentalRecord)
                .ThenInclude(rr => rr!.Renter)
                .Include(r => r.RentalRecord)
                .ThenInclude(rr => rr!.Room)
                .ThenInclude(room => room!.Community)
                .Include(r => r.Deferrals)
                .Where(r => r.Status == RentalReminderStatus.Pending && r.ReminderDate <= DateTime.Today)
                .OrderBy(r => r.ReminderDate)
                .Take(pageSize)
                .ToListAsync();

            rentalCount = await _reminderRepository
                .AsQueryable(false)
                .CountAsync(r => r.Status == RentalReminderStatus.Pending && r.ReminderDate <= DateTime.Today);

            foreach (var reminder in reminders)
            {
                var rental = reminder.RentalRecord;
                var deferrals = reminder.Deferrals.OrderByDescending(d => d.CreatedTime).ToList();

                items.Add(new TodoItemDto
                {
                    Type = TodoType.Rental,
                    Id = reminder.Id,
                    RoomInfo = $"{rental?.Room?.Community?.Name} {rental?.Room?.Building}-{rental?.Room?.RoomNumber}",
                    TenantName = rental?.Renter?.Name ?? "",
                    TenantPhone = MaskPhone(rental?.Renter?.Phone),
                    MonthlyRent = rental?.MonthlyRent ?? 0,
                    ContractEndDate = rental?.ContractEndDate,
                    CheckInDate = rental?.CheckInDate,
                    LeaseType = (int?)rental?.LeaseType,
                    LeaseTypeText = rental?.LeaseType.ToText() ?? "",
                    DeferralCount = deferrals.Count,
                    LastDeferredDate = deferrals.FirstOrDefault()?.DeferredToDate,
                    RentalReminder = MapToRentalReminderDto(reminder, rental, deferrals)
                });
            }
        }

        // 按类型分组排序：水电费在前，催收房租在后
        items = items.OrderBy(i => i.Type).ThenBy(i => i.Id).ToList();

        return new TodoListResult
        {
            Items = items,
            Total = utilityCount + rentalCount,
            UtilityCount = utilityCount,
            RentalCount = rentalCount
        };
    }

    private UtilityBillDto MapToUtilityBillDto(UtilityBill bill)
    {
        // 复用现有映射逻辑
        return new UtilityBillDto
        {
            Id = bill.Id,
            RoomId = bill.RoomId,
            RoomInfo = $"{bill.Room?.Community?.Name} {bill.Room?.Building}-{bill.Room?.RoomNumber}",
            PeriodStart = bill.PeriodStart.ToString("yyyy-MM-dd"),
            PeriodEnd = bill.PeriodEnd.ToString("yyyy-MM-dd"),
            WaterUsage = bill.WaterUsage,
            ElectricUsage = bill.ElectricUsage,
            WaterFee = bill.WaterFee,
            ElectricFee = bill.ElectricFee,
            TotalAmount = bill.TotalAmount,
            Status = bill.Status,
            StatusText = bill.Status.ToText()
        };
    }

    private RentalReminderDto MapToRentalReminderDto(
        RentalReminder reminder,
        RentalRecord? rental,
        List<RentalDeferral> deferrals)
    {
        return new RentalReminderDto
        {
            Id = reminder.Id,
            RentalRecordId = reminder.RentalRecordId,
            RoomInfo = $"{rental?.Room?.Community?.Name} {rental?.Room?.Building}-{rental?.Room?.RoomNumber}",
            RoomId = rental?.RoomId ?? 0,
            TenantName = rental?.Renter?.Name ?? "",
            TenantPhone = MaskPhone(rental?.Renter?.Phone),
            TenantId = rental?.TenantId ?? 0,
            CheckInDate = rental?.CheckInDate ?? DateTime.MinValue,
            ContractEndDate = rental?.ContractEndDate ?? DateTime.MinValue,
            MonthlyRent = rental?.MonthlyRent ?? 0,
            Deposit = rental?.Deposit ?? 0,
            LeaseType = rental?.LeaseType ?? LeaseType.Monthly,
            LeaseTypeText = rental?.LeaseType.ToText() ?? "",
            DeferralCount = deferrals.Count,
            LastDeferredDate = deferrals.FirstOrDefault()?.DeferredToDate
        };
    }

    private static string? MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length < 7)
            return phone;

        return phone[..3] + "****" + phone[^4..];
    }
}
```

**验证:** 编译通过

---

### Task 15: 创建 IRentalReminderService 接口

**文件:** `Gentle/Gentle.Application/Services/IRentalReminderService.cs`

```csharp
using Gentle.Application.Dtos.Rental;

namespace Gentle.Application.Services;

/// <summary>
/// 催收提醒服务接口
/// </summary>
public interface IRentalReminderService
{
    /// <summary>
    /// 宽限处理
    /// </summary>
    Task DeferAsync(int reminderId, DeferReminderInput input);

    /// <summary>
    /// 续租处理
    /// </summary>
    Task<int> RenewAsync(int reminderId, RenewRentalInput input);

    /// <summary>
    /// 获取宽限记录列表
    /// </summary>
    Task<DeferralListResult> GetDeferralsAsync(int reminderId);
}
```

**验证:** 编译通过

---

### Task 16: 创建 RentalReminderService 实现

**文件:** `Gentle/Gentle.Application/Services/RentalReminderService.cs`

```csharp
using Gentle.Application.Dtos.Rental;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Gentle.EntityFramework.Core;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 催收提醒服务实现
/// </summary>
public class RentalReminderService : IRentalReminderService, ITransient
{
    private readonly IRepository<RentalReminder> _reminderRepository;
    private readonly IRepository<RentalDeferral> _deferralRepository;
    private readonly IRepository<RentalRecord> _rentalRepository;

    public RentalReminderService(
        IRepository<RentalReminder> reminderRepository,
        IRepository<RentalDeferral> deferralRepository,
        IRepository<RentalRecord> rentalRepository)
    {
        _reminderRepository = reminderRepository;
        _deferralRepository = deferralRepository;
        _rentalRepository = rentalRepository;
    }

    public async Task DeferAsync(int reminderId, DeferReminderInput input)
    {
        var reminder = await _reminderRepository
            .AsQueryable()
            .Include(r => r.RentalRecord)
            .FirstOrDefaultAsync(r => r.Id == reminderId);

        if (reminder == null)
            throw Oops.Oh("催收提醒不存在");

        if (input.DeferredToDate <= DateTime.Today)
            throw Oops.Oh("宽限日期必须大于今天");

        // 宽限天数上限验证（30天）
        var maxDeferDate = reminder.ReminderDate.AddDays(30);
        if (input.DeferredToDate > maxDeferDate)
            throw Oops.Oh("宽限天数不能超过30天");

        // 创建宽限记录
        var deferral = new RentalDeferral
        {
            RentalReminderId = reminderId,
            OriginalReminderDate = reminder.ReminderDate,
            DeferredToDate = input.DeferredToDate,
            Remark = input.Remark
        };
        await _deferralRepository.InsertAsync(deferral);

        // 更新原提醒状态
        reminder.Status = RentalReminderStatus.Deferred;
        await _reminderRepository.UpdateAsync(reminder);

        // 创建新的提醒
        var newReminder = new RentalReminder
        {
            RentalRecordId = reminder.RentalRecordId,
            ReminderDate = input.DeferredToDate,
            Status = RentalReminderStatus.Pending
        };
        await _reminderRepository.InsertAsync(newReminder);
    }

    public async Task<int> RenewAsync(int reminderId, RenewRentalInput input)
    {
        var reminder = await _reminderRepository
            .AsQueryable()
            .Include(r => r.RentalRecord)
            .FirstOrDefaultAsync(r => r.Id == reminderId);

        if (reminder == null)
            throw Oops.Oh("催收提醒不存在");

        var originalRental = reminder.RentalRecord;
        if (originalRental == null)
            throw Oops.Oh("关联的租赁记录不存在");

        // 验证合同到期日
        if (input.ContractEndDate <= originalRental.ContractEndDate)
            throw Oops.Oh("新合同到期日必须晚于原合同到期日");

        if (input.ContractEndDate <= DateTime.Today)
            throw Oops.Oh("新合同到期日必须大于今天");

        // 计算新入住日期（原合同结束日期）
        var newCheckInDate = originalRental.ContractEndDate;

        // 创建新租赁记录
        var newRental = new RentalRecord
        {
            TenantId = originalRental.TenantId,
            RoomId = originalRental.RoomId,
            CheckInDate = newCheckInDate,
            LeaseType = input.LeaseType,
            MonthlyRent = input.MonthlyRent,
            ContractEndDate = input.ContractEndDate,
            Deposit = originalRental.Deposit, // 押金继承
            DepositStatus = DepositStatus.Received, // 押金状态为已收
            Remark = input.Remark,
            ContractImage = input.ContractImage,
            Status = RentalStatus.Active
        };
        await _rentalRepository.InsertAsync(newRental);

        // 更新原租赁记录状态
        originalRental.Status = RentalStatus.Terminated;
        originalRental.CheckOutDate = newCheckInDate;
        await _rentalRepository.UpdateAsync(originalRental);

        // 更新提醒状态
        reminder.Status = RentalReminderStatus.Completed;
        await _reminderRepository.UpdateAsync(reminder);

        return newRental.Id;
    }

    public async Task<DeferralListResult> GetDeferralsAsync(int reminderId)
    {
        var deferrals = await _deferralRepository
            .AsQueryable(false)
            .Where(d => d.RentalReminderId == reminderId)
            .OrderByDescending(d => d.CreatedTime)
            .ToListAsync();

        return new DeferralListResult
        {
            Items = deferrals.Select(d => new DeferralRecordDto
            {
                Id = d.Id,
                OriginalReminderDate = d.OriginalReminderDate,
                DeferredToDate = d.DeferredToDate,
                Remark = d.Remark,
                CreatedTime = d.CreatedTime
            }).ToList(),
            Total = deferrals.Count
        };
    }
}
```

**验证:** 编译通过

**提交:** `git add -A && git commit -m "feat: 添加待办服务和催收提醒服务"`

---

## Phase 4: 后端 API

### Task 17: 创建 TodoAppService

**文件:** `Gentle/Gentle.Application/Apps/TodoAppService.cs`

```csharp
using Gentle.Application.Dtos.Rental;
using Gentle.Application.Dtos.Todo;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 待办事项应用服务
/// </summary>
[ApiDescriptionSettings("Todo", Name = "TodoApp", Order = 50)]
[Route("api/todo")]
[Authorize]
public class TodoAppService : IDynamicApiController
{
    private readonly ITodoService _todoService;
    private readonly IRentalReminderService _rentalReminderService;
    private readonly IMeterService _meterService;

    public TodoAppService(
        ITodoService todoService,
        IRentalReminderService rentalReminderService,
        IMeterService meterService)
    {
        _todoService = todoService;
        _rentalReminderService = rentalReminderService;
        _meterService = meterService;
    }

    /// <summary>
    /// 获取待办列表
    /// </summary>
    [HttpGet("list")]
    public async Task<TodoListResult> GetList(string? type = null, int page = 1, int pageSize = 10)
    {
        return await _todoService.GetTodoListAsync(type, page, pageSize);
    }

    /// <summary>
    /// 宽限处理
    /// </summary>
    [HttpPost("rental-reminder/{id}/defer")]
    public async Task Defer(int id, [FromBody] DeferReminderInput input)
    {
        await _rentalReminderService.DeferAsync(id, input);
    }

    /// <summary>
    /// 续租处理
    /// </summary>
    [HttpPost("rental-reminder/{id}/renew")]
    public async Task<RenewResult> Renew(int id, [FromBody] RenewRentalInput input)
    {
        var newRentalId = await _rentalReminderService.RenewAsync(id, input);
        return new RenewResult { NewRentalRecordId = newRentalId };
    }

    /// <summary>
    /// 获取宽限记录列表
    /// </summary>
    [HttpGet("rental-reminder/{id}/deferrals")]
    public async Task<DeferralListResult> GetDeferrals(int id)
    {
        return await _rentalReminderService.GetDeferralsAsync(id);
    }
}

/// <summary>
/// 续租结果
/// </summary>
public class RenewResult
{
    /// <summary>
    /// 新租赁记录ID
    /// </summary>
    public int NewRentalRecordId { get; set; }
}
```

**验证:** 编译通过，启动项目后访问 Swagger 确认 API 可用

**提交:** `git add -A && git commit -m "feat: 添加待办事项 API 控制器"`

---

## Phase 5: 定时任务（可选）

> **注意:** 定时任务作为可选功能，初期可通过 API 手动触发或在应用启动时执行一次扫描。

### Task 18: 创建催收提醒后台服务

**文件:** `Gentle/Gentle.Application/BackgroundServices/RentalReminderBackgroundService.cs`

使用 ASP.NET Core BackgroundService 实现定时扫描：

```csharp
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Gentle.EntityFramework.Core;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.BackgroundServices;

/// <summary>
/// 催收提醒后台服务
/// 每日凌晨执行，扫描即将到期的租赁记录并创建提醒
/// </summary>
public class RentalReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RentalReminderBackgroundService> _logger;

    /// <summary>
    /// 提前提醒天数
    /// </summary>
    private const int ReminderDaysBefore = 3;

    /// <summary>
    /// 执行间隔（24小时）
    /// </summary>
    private static readonly TimeSpan ExecutionInterval = TimeSpan.FromHours(24);

    public RentalReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<RentalReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("催收提醒后台服务已启动");

        // 首次启动时延迟到次日凌晨执行
        var now = DateTime.Now;
        var nextRun = now.Date.AddDays(1).AddHours(1); // 次日凌晨1点
        var initialDelay = nextRun - now;

        await Task.Delay(initialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ScanAndCreateRemindersAsync();
                _logger.LogInformation("催收提醒扫描完成，下次执行时间: {NextRun}",
                    DateTime.Now.Add(ExecutionInterval));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "催收提醒扫描失败");
            }

            await Task.Delay(ExecutionInterval, stoppingToken);
        }
    }

    private async Task ScanAndCreateRemindersAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var rentalRepository = scope.ServiceProvider.GetRequiredService<IRepository<RentalRecord>>();
        var reminderRepository = scope.ServiceProvider.GetRequiredService<IRepository<RentalReminder>>();

        var today = DateTime.Today;
        var reminderDate = today.AddDays(ReminderDaysBefore);

        // 查找即将到期的活跃租赁记录
        var expiringRentals = await rentalRepository
            .AsQueryable()
            .Where(r => r.Status == RentalStatus.Active
                     && r.ContractEndDate == reminderDate)
            .ToListAsync();

        foreach (var rental in expiringRentals)
        {
            // 检查是否已存在待处理的提醒
            var existingReminder = await reminderRepository
                .AsQueryable()
                .AnyAsync(r => r.RentalRecordId == rental.Id
                            && r.Status == RentalReminderStatus.Pending);

            if (!existingReminder)
            {
                var reminder = new RentalReminder
                {
                    RentalRecordId = rental.Id,
                    ReminderDate = today,
                    Status = RentalReminderStatus.Pending
                };
                await reminderRepository.InsertAsync(reminder);
                _logger.LogInformation("已创建催收提醒: 租赁记录ID={RentalId}", rental.Id);
            }
        }
    }
}
```

**验证:** 编译通过

---

### Task 19: 注册后台服务

**文件:** `Gentle/Gentle.Web.Entry/Program.cs`

在服务注册部分添加：
```csharp
// 注册后台服务
builder.Services.AddHostedService<RentalReminderBackgroundService>();
```

**验证:** 启动项目确认无报错

**提交:** `git add -A && git commit -m "feat: 添加催收提醒后台服务"`

---

## Phase 6: 前端 API

### Task 20: 创建 todoModel.ts

**文件:** `Hans/src/api/model/todoModel.ts`

```typescript
import type { UtilityBillItem } from './meterModel';

/**
 * 待办类型
 */
export enum TodoType {
  Utility = 0,
  Rental = 1,
}

/**
 * 待办事项
 */
export interface TodoItem {
  type: TodoType;
  id: number;
  roomInfo: string;
  // 水电费字段
  amount?: number;
  period?: string;
  utilityBill?: UtilityBillItem;
  // 催收房租字段
  tenantName?: string;
  tenantPhone?: string;
  monthlyRent?: number;
  contractEndDate?: string;
  checkInDate?: string;
  leaseType?: number;
  leaseTypeText?: string;
  deferralCount: number;
  lastDeferredDate?: string;
  rentalReminder?: RentalReminderItem;
}

/**
 * 待办列表结果
 */
export interface TodoListResult {
  items: TodoItem[];
  total: number;
  utilityCount: number;
  rentalCount: number;
}

/**
 * 催收提醒详情
 */
export interface RentalReminderItem {
  id: number;
  rentalRecordId: number;
  roomInfo: string;
  roomId: number;
  tenantName: string;
  tenantPhone?: string;
  tenantId: number;
  checkInDate: string;
  contractEndDate: string;
  monthlyRent: number;
  deposit: number;
  leaseType: number;
  leaseTypeText: string;
  deferralCount: number;
  lastDeferredDate?: string;
}

/**
 * 宽限输入
 */
export interface DeferReminderInput {
  deferredToDate: string;
  remark?: string;
}

/**
 * 续租输入
 */
export interface RenewRentalInput {
  leaseType: number;
  monthlyRent: number;
  contractEndDate: string;
  contractImage?: string;
  remark?: string;
}

/**
 * 宽限记录
 */
export interface DeferralRecord {
  id: number;
  originalReminderDate: string;
  deferredToDate: string;
  remark?: string;
  createdTime: string;
}

/**
 * 宽限记录列表结果
 */
export interface DeferralListResult {
  items: DeferralRecord[];
  total: number;
}

/**
 * 续租结果
 */
export interface RenewResult {
  newRentalRecordId: number;
}
```

**验证:** 无 TypeScript 错误

---

### Task 21: 创建 todo.ts API

**文件:** `Hans/src/api/todo.ts`

```typescript
import type {
  DeferReminderInput,
  DeferralListResult,
  RenewRentalInput,
  RenewResult,
  TodoListResult,
} from '@/api/model/todoModel';
import { request } from '@/utils/request';

/**
 * 获取待办列表
 */
export function getTodoList(type?: string, pageSize = 10) {
  return request.get<TodoListResult>('/api/todo/list', {
    params: { type, page: 1, pageSize },
  });
}

/**
 * 宽限处理
 */
export function deferReminder(reminderId: number, input: DeferReminderInput) {
  return request.post(`/api/todo/rental-reminder/${reminderId}/defer`, input);
}

/**
 * 续租处理
 */
export function renewRental(reminderId: number, input: RenewRentalInput) {
  return request.post<RenewResult>(`/api/todo/rental-reminder/${reminderId}/renew`, input);
}

/**
 * 获取宽限记录列表
 */
export function getDeferrals(reminderId: number) {
  return request.get<DeferralListResult>(`/api/todo/rental-reminder/${reminderId}/deferrals`);
}
```

**验证:** 无 TypeScript 错误

**提交:** `git add -A && git commit -m "feat: 添加待办事项前端 API"`

---

## Phase 7: 前端组件

### Task 22: 改造 TodoPanel 组件

**文件:** `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

主要改动：
1. 添加类型筛选下拉框
2. 支持两种待办类型渲染
3. 点击待办触发对应弹窗

**关键代码结构:**
```vue
<template>
  <div class="todo-panel">
    <div class="todo-header">
      <div class="todo-date">...</div>
      <div class="todo-filter">
        <t-select v-model="filterType" :options="typeOptions" @change="fetchTodos" />
        <t-tag>待办 {{ totalCount }} 项</t-tag>
      </div>
    </div>

    <!-- 待办列表 -->
    <div v-for="item in todoItems" :key="`${item.type}-${item.id}`" class="todo-item" @click="handleClick(item)">
      <!-- 水电费待办 -->
      <template v-if="item.type === TodoType.Utility">
        <t-icon name="logo-water" />
        <div>{{ item.roomInfo }}</div>
        <div>水电费待收款 ¥{{ item.amount }}</div>
      </template>
      <!-- 催收房租待办 -->
      <template v-else>
        <t-icon name="home" />
        <div>{{ item.roomInfo }}</div>
        <div>催收房租 ¥{{ item.monthlyRent }}</div>
      </template>
    </div>
  </div>

  <!-- 弹窗组件 -->
  <PayUtilityDialog v-model:visible="payDialogVisible" :bill="payingBill" @success="handlePaySuccess" />
  <RentalReminderDialog v-model:visible="rentalDialogVisible" :reminder="currentReminder" @success="handleRentalSuccess" />
</template>
```

**验证:** 页面正常渲染，筛选功能正常

---

### Task 23: 创建 PayUtilityDialog 组件

**文件:** `Hans/src/pages/dashboard/base/components/PayUtilityDialog.vue`

从 `utility/bill/index.vue` 抽取收款弹窗逻辑为独立组件。

**Props:**
- `visible: boolean`
- `bill: UtilityBillItem | null`

**Events:**
- `update:visible`
- `success` - 收款成功后触发

**验证:** 弹窗正常显示，收款功能正常

---

### Task 24: 创建 RentalReminderDialog 组件

**文件:** `Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue`

**功能:**
- 显示租客、房间、入住信息
- 显示宽限次数（可点击查看记录）
- 宽限/续租/取消按钮

**验证:** 弹窗正常显示，信息正确

---

### Task 25: 创建 DeferDialog 组件

**文件:** `Hans/src/pages/dashboard/base/components/DeferDialog.vue`

**功能:**
- 日期选择器（最小明天，默认+3天）
- 备注输入
- 确认/取消按钮

**验证:** 宽限功能正常，数据正确提交

---

### Task 26: 创建 RenewRentalDialog 组件

**文件:** `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`

**功能:**
- 显示租客、房间（只读）
- 显示上个租期
- 新租期类型选择
- 新月租金输入（默认=上月租金）
- 新合同到期日（自动计算+手动修改）
- 合同图片上传（可选）
- 备注输入
- 押金继承提示

**验证:** 续租功能正常，新租赁记录创建成功

---

### Task 27: 创建 DeferralRecordsDialog 组件

**文件:** `Hans/src/pages/dashboard/base/components/DeferralRecordsDialog.vue`

**功能:**
- 表格显示宽限记录
- 按时间倒序排列
- 空状态提示

**验证:** 宽限记录正常显示

**提交:** `git add -A && git commit -m "feat: 完成待办事项卡片前端组件"`

---

## Phase 8: 测试与验证

### Task 28: 后端单元测试

**文件:** `Gentle/Gentle.Tests/Services/TodoServiceTests.cs`

测试用例：
- [ ] GetTodoListAsync 返回水电费待办
- [ ] GetTodoListAsync 返回催收房租待办
- [ ] GetTodoListAsync 筛选类型正确
- [ ] DeferAsync 验证宽限日期
- [ ] RenewAsync 创建新租赁记录
- [ ] RenewAsync 更新原记录状态

**验证:** `dotnet test` 通过

---

### Task 29: 集成测试

**测试场景:**
1. 创建即将到期的租赁记录
2. 运行定时任务
3. 验证待办列表显示催收房租
4. 测试宽限流程
5. 测试续租流程
6. 验证原租赁记录状态变更

**验证:** 所有流程正常

---

### Task 30: E2E 测试

**文件:** `tests/e2e/feat-058-todo-panel-enhancement.spec.ts`

> **命名规范:** 遵循项目 `feat-XXX` 命名规范，编号从 `docs/superpowers/progress.md` 获取

测试用例：
- [ ] 待办列表显示两种类型
- [ ] 筛选功能正常
- [ ] 水电费收款弹窗正常
- [ ] 催收房租弹窗正常
- [ ] 宽限功能正常
- [ ] 续租功能正常
- [ ] 宽限记录弹窗正常

**验证:** `cd tests && npx playwright test e2e/feat-058-todo-panel-enhancement.spec.ts` 通过

**提交:** `git add -A && git commit -m "test: 添加待办事项卡片 E2E 测试"`

---

## Phase 9: 收尾

### Task 31: 代码审查

- [ ] 检查代码风格一致性
- [ ] 检查 TypeScript 类型完整性
- [ ] 检查错误处理
- [ ] 检查控制台无报错

---

### Task 32: 合并到主分支

```bash
git checkout main
git merge feat/todo-panel-enhancement
git push origin main
```

**验证:** 生产环境功能正常

---

## 文件清单

### 后端新增文件
- `Gentle/Gentle.Core/Enums/RentalReminderStatus.cs`
- `Gentle/Gentle.Core/Entities/RentalReminder.cs`
- `Gentle/Gentle.Core/Entities/RentalDeferral.cs`
- `Gentle/Gentle.Application/Dtos/Todo/TodoType.cs`
- `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs`
- `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs`
- `Gentle/Gentle.Application/Dtos/Rental/RentalReminderDto.cs`
- `Gentle/Gentle.Application/Dtos/Rental/DeferReminderInput.cs`
- `Gentle/Gentle.Application/Dtos/Rental/RenewRentalInput.cs`
- `Gentle/Gentle.Application/Dtos/Rental/DeferralRecordDto.cs`
- `Gentle/Gentle.Application/Services/ITodoService.cs`
- `Gentle/Gentle.Application/Services/TodoService.cs`
- `Gentle/Gentle.Application/Services/IRentalReminderService.cs`
- `Gentle/Gentle.Application/Services/RentalReminderService.cs`
- `Gentle/Gentle.Application/Apps/TodoAppService.cs`
- `Gentle/Gentle.Application/Jobs/RentalReminderJob.cs`
- `Gentle/Gentle.Tests/Services/TodoServiceTests.cs`

### 后端修改文件
- 数据库迁移文件

### 前端新增文件
- `Hans/src/api/model/todoModel.ts`
- `Hans/src/api/todo.ts`
- `Hans/src/pages/dashboard/base/components/PayUtilityDialog.vue`
- `Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue`
- `Hans/src/pages/dashboard/base/components/DeferDialog.vue`
- `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`
- `Hans/src/pages/dashboard/base/components/DeferralRecordsDialog.vue`
- `tests/e2e/feat-058-todo-panel-enhancement.spec.ts`

### 前端修改文件
- `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

---

## 依赖关系

```
Task 1-5 (数据模型) ─┐
                     ├──► Task 6-12 (DTO)
Task 4-5 (迁移) ─────┘        │
                              ├──► Task 13-16 (服务) ──► Task 17 (API)
Task 1-3 (实体) ──────────────┘        │
                                       ├──► Task 18-19 (定时任务)
Task 6-12 (DTO) ───────────────────────┘
                                       │
Task 17 (API) ─────────────────────────┼──► Task 20-21 (前端 API)
                                       │
                                       └──► Task 22-27 (前端组件) ──► Task 28-30 (测试)
```
