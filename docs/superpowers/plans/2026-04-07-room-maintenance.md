# 房间维修管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为房间添加完整的维修信息管理功能，包括报修、维修管理页面和 Dashboard 待办集成。

**Architecture:** 扩展现有待办聚合模式，新增 `MaintenanceRecord` 实体作为第三种待办数据源。后端遵循 Furion 框架规范（IDynamicApiController、Entity 继承、ITransient 服务注册），前端遵循 Vue 3 + TDesign + TypeScript 模式。

**Tech Stack:** .NET 10 / Furion / EF Core (MySQL) | Vue 3 / TDesign Vue Next / TypeScript / Pinia / Vue Router

**设计文档:** `docs/superpowers/specs/2026-04-07-room-maintenance-design.md`

---

## 文件结构

### 后端新增文件

| 文件 | 职责 |
|------|------|
| `Gentle/Gentle.Core/Enums/MaintenancePriority.cs` | 维修优先级枚举 |
| `Gentle/Gentle.Core/Enums/MaintenanceStatus.cs` | 维修状态枚举 |
| `Gentle/Gentle.Core/Entities/MaintenanceRecord.cs` | 维修记录实体 |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceAddInput.cs` | 新增输入 DTO |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceUpdateInput.cs` | 更新输入 DTO |
| ~~`Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceListFilter.cs`~~ | ~~列表筛选 DTO（不创建，使用独立参数）~~ |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceDetailDto.cs` | 详情输出 DTO |
| `Gentle/Gentle.Application/Dtos/Maintenance/CompleteMaintenanceInput.cs` | 完成维修输入 DTO |
| `Gentle/Gentle.Application/Services/IMaintenanceService.cs` | 服务接口 |
| `Gentle/Gentle.Application/Services/MaintenanceService.cs` | 服务实现 |
| `Gentle/Gentle.Application/Apps/MaintenanceAppService.cs` | API 控制器 |

### 后端修改文件

| 文件 | 改动 |
|------|------|
| `Gentle/Gentle.Core/Enums/TodoType.cs` | 新增 `Maintenance = 2` |
| `Gentle/Gentle.Core/Entities/Room.cs` | 新增 `MaintenanceRecords` 导航属性 |
| `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs` | 新增维修字段，修复 `CreatedTime` |
| `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs` | 新增 `MaintenanceCount` |
| `Gentle/Gentle.Application/Services/TodoService.cs` | 新增维修数据源 + 类型验证扩展 |
| `Gentle/Gentle.Application/Apps/TodoAppService.cs` | 类型验证扩展 |
| `Gentle/Gentle.Application/Mapper.cs` | 新增 MaintenanceRecord 映射 |

### 前端新增文件

| 文件 | 职责 |
|------|------|
| `Hans/src/api/maintenance.ts` | 维修 API 服务 |
| `Hans/src/api/model/maintenanceModel.ts` | 维修类型定义 |
| `Hans/src/pages/maintenance/list.vue` | 维修记录列表页 |
| `Hans/src/pages/maintenance/add.vue` | 新增/编辑报修页 |
| `Hans/src/router/modules/maintenance.ts` | 维修路由模块 |
| `Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue` | Dashboard 维修详情对话框 |

### 前端修改文件

| 文件 | 改动 |
|------|------|
| `Hans/src/api/model/todoModel.ts` | TodoType 新增 Maintenance=2 |
| `Hans/src/api/todo.ts` | `todoTypeToString` 扩展 |
| `Hans/src/pages/dashboard/base/components/TodoPanel.vue` | 集成维修待办 |
| `Hans/src/pages/housing/room/index.vue` | 行内新增"维修"按钮 |

---

### Task 1: 后端枚举和实体

**Files:**
- Create: `Gentle/Gentle.Core/Enums/MaintenancePriority.cs`
- Create: `Gentle/Gentle.Core/Enums/MaintenanceStatus.cs`
- Create: `Gentle/Gentle.Core/Entities/MaintenanceRecord.cs`
- Modify: `Gentle/Gentle.Core/Enums/TodoType.cs`
- Modify: `Gentle/Gentle.Core/Entities/Room.cs`

- [ ] **Step 1: 创建 MaintenancePriority 枚举**

```csharp
// Gentle/Gentle.Core/Enums/MaintenancePriority.cs
namespace Gentle.Core.Enums;

public enum MaintenancePriority
{
    Urgent = 0,   // 紧急
    Normal = 1,   // 一般
    Low = 2       // 低
}
```

- [ ] **Step 2: 创建 MaintenanceStatus 枚举**

```csharp
// Gentle/Gentle.Core/Enums/MaintenanceStatus.cs
namespace Gentle.Core.Enums;

public enum MaintenanceStatus
{
    Pending = 0,     // 待处理
    InProgress = 1,  // 进行中
    Completed = 2    // 已完成
}
```

- [ ] **Step 3: 修改 TodoType 枚举，新增 Maintenance**

在 `Gentle/Gentle.Core/Enums/TodoType.cs` 中追加 `Maintenance = 2`：

```csharp
namespace Gentle.Core.Enums;

public enum TodoType
{
    Utility = 0,      // 水电费待办
    Rental = 1,       // 催收房租待办
    Maintenance = 2   // 维修待办
}
```

- [ ] **Step 4: 创建 MaintenanceRecord 实体**

```csharp
// Gentle/Gentle.Core/Entities/MaintenanceRecord.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

[Table("maintenance_record")]
[Index(nameof(RoomId))]
public class MaintenanceRecord : Entity<int>
{
    [Required] public int RoomId { get; set; }
    public Room Room { get; set; } = null!;

    [Required, MaxLength(500)] public string Description { get; set; } = string.Empty;
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Normal;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;

    [Required, Column(TypeName = "date")] public DateTime ReportDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    [Range(0, double.MaxValue), Column(TypeName = "decimal(10,2)")] public decimal? Cost { get; set; }
    [MaxLength(50)] public string? RepairPerson { get; set; }
    [MaxLength(20)] public string? RepairPhone { get; set; }
    public string? Images { get; set; }
    [MaxLength(500)] public string? Remark { get; set; }
}
```

注意：不需要 `IEntitySeedData`，无种子数据。

- [ ] **Step 5: 修改 Room 实体，新增导航属性**

在 `Gentle/Gentle.Core/Entities/Room.cs` 的 `UtilityBills` 属性后追加：

```csharp
public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
```

同时确保文件顶部有 `using Gentle.Core.Enums;`（如果尚未存在）。

- [ ] **Step 6: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功，无错误

- [ ] **Step 7: 提交**

```bash
git add Gentle/Gentle.Core/Enums/MaintenancePriority.cs Gentle/Gentle.Core/Enums/MaintenanceStatus.cs Gentle/Gentle.Core/Entities/MaintenanceRecord.cs Gentle/Gentle.Core/Enums/TodoType.cs Gentle/Gentle.Core/Entities/Room.cs
git commit -m "feat: 新增维修记录实体和枚举"
```

---

### Task 2: 后端 DTO

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceAddInput.cs`
- Create: `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceUpdateInput.cs`
- ~~Create: `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceListFilter.cs`~~ （不创建，AppService 使用独立参数）
- Create: `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceDetailDto.cs`
- Create: `Gentle/Gentle.Application/Dtos/Maintenance/CompleteMaintenanceInput.cs`

- [ ] **Step 1: 创建 MaintenanceAddInput**

```csharp
// Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceAddInput.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Maintenance;

public class MaintenanceAddInput
{
    [Required] public int RoomId { get; set; }
    [Required, MaxLength(500)] public string Description { get; set; } = string.Empty;
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Normal;
    [Required] public DateTime ReportDate { get; set; }
    [Range(0, double.MaxValue)] public decimal? Cost { get; set; }
    [MaxLength(50)] public string? RepairPerson { get; set; }
    [MaxLength(20)] public string? RepairPhone { get; set; }
    public string? Images { get; set; }
    [MaxLength(500)] public string? Remark { get; set; }
}
```

- [ ] **Step 2: 创建 MaintenanceUpdateInput**

```csharp
// Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceUpdateInput.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Maintenance;

public class MaintenanceUpdateInput
{
    [Required] public int Id { get; set; }
    [Required, MaxLength(500)] public string Description { get; set; } = string.Empty;
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Normal;
    [Required] public DateTime ReportDate { get; set; }
    [Range(0, double.MaxValue)] public decimal? Cost { get; set; }
    [MaxLength(50)] public string? RepairPerson { get; set; }
    [MaxLength(20)] public string? RepairPhone { get; set; }
    public string? Images { get; set; }
    [MaxLength(500)] public string? Remark { get; set; }
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;
}
```

- [ ] **Step 3: 创建 MaintenanceDetailDto**

```csharp
// Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceDetailDto.cs
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Maintenance;

public class MaintenanceDetailDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomInfo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MaintenancePriority Priority { get; set; }
    public string PriorityText { get; set; } = string.Empty;
    public MaintenanceStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public DateTime ReportDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal? Cost { get; set; }
    public string? RepairPerson { get; set; }
    public string? RepairPhone { get; set; }
    public string? Images { get; set; }
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
}
```

- [ ] **Step 4: 创建 CompleteMaintenanceInput**

```csharp
// Gentle/Gentle.Application/Dtos/Maintenance/CompleteMaintenanceInput.cs
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Maintenance;

public class CompleteMaintenanceInput
{
    [Range(0, double.MaxValue)] public decimal? ActualCost { get; set; }
    [MaxLength(500)] public string? Remark { get; set; }
}
```

- [ ] **Step 6: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功

- [ ] **Step 7: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Maintenance/
git commit -m "feat: 新增维修管理 DTO"
```

---

### Task 3: 后端服务层

**Files:**
- Create: `Gentle/Gentle.Application/Services/IMaintenanceService.cs`
- Create: `Gentle/Gentle.Application/Services/MaintenanceService.cs`
- Modify: `Gentle/Gentle.Application/Mapper.cs`

- [ ] **Step 1: 创建 IMaintenanceService 接口**

```csharp
// Gentle/Gentle.Application/Services/IMaintenanceService.cs
using Gentle.Application.Dtos.Maintenance;

namespace Gentle.Application.Services;

public interface IMaintenanceService : ITransient
{
    Task<(List<MaintenanceDetailDto> Items, int Total)> GetListAsync(MaintenanceStatus? status, int? roomId, MaintenancePriority? priority, int page, int pageSize);
    Task<MaintenanceDetailDto> GetByIdAsync(int id);
    Task<MaintenanceDetailDto> AddAsync(MaintenanceAddInput input);
    Task<MaintenanceDetailDto> UpdateAsync(MaintenanceUpdateInput input);
    Task<MaintenanceDetailDto> CompleteAsync(int id, CompleteMaintenanceInput input);
    Task DeleteAsync(int id);
}
```

- [ ] **Step 2: 创建 MaintenanceService 实现**

```csharp
// Gentle/Gentle.Application/Services/MaintenanceService.cs
using Furion.DatabaseAccessor;
using Furion.DependencyInjection;
using Furion.FriendlyException;
using Gentle.Application.Dtos.Maintenance;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly IRepository<MaintenanceRecord> _repository;
    private readonly IRepository<Room> _roomRepository;

    public MaintenanceService(
        IRepository<MaintenanceRecord> repository,
        IRepository<Room> roomRepository)
    {
        _repository = repository;
        _roomRepository = roomRepository;
    }

    public async Task<(List<MaintenanceDetailDto> Items, int Total)> GetListAsync(
        MaintenanceStatus? status, int? roomId, MaintenancePriority? priority, int page, int pageSize)
    {
        var query = _repository.AsQueryable(false)
            .Include(m => m.Room).ThenInclude(r => r!.Community)
            .AsSingleQuery();

        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);
        if (roomId.HasValue)
            query = query.Where(m => m.RoomId == roomId.Value);
        if (priority.HasValue)
            query = query.Where(m => m.Priority == priority.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.ReportDate)
            .ThenByDescending(m => m.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items.Select(MapToDto).ToList(), total);
    }

    public async Task<MaintenanceDetailDto> GetByIdAsync(int id)
    {
        var record = await _repository.AsQueryable(false)
            .Include(m => m.Room).ThenInclude(r => r!.Community)
            .AsSingleQuery()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
            throw Oops.Oh("维修记录不存在");

        return MapToDto(record);
    }

    [UnitOfWork]
    public async Task<MaintenanceDetailDto> AddAsync(MaintenanceAddInput input)
    {
        var room = await _roomRepository.AsQueryable(false)
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RoomId);

        if (room == null)
            throw Oops.Oh("房间不存在");

        var record = input.Adapt<MaintenanceRecord>();
        var inserted = await _repository.InsertNowAsync(record);
        return MapToDto(inserted.Entity);
    }

    [UnitOfWork]
    public async Task<MaintenanceDetailDto> UpdateAsync(MaintenanceUpdateInput input)
    {
        var record = await _repository.FindAsync(input.Id);
        if (record == null)
            throw Oops.Oh("维修记录不存在");

        if (record.Status == MaintenanceStatus.Completed)
            throw Oops.Oh("已完成的维修记录不可编辑");

        record.Description = input.Description;
        record.Priority = input.Priority;
        record.ReportDate = input.ReportDate;
        record.Cost = input.Cost;
        record.RepairPerson = input.RepairPerson;
        record.RepairPhone = input.RepairPhone;
        record.Images = input.Images;
        record.Remark = input.Remark;
        record.Status = input.Status;

        await _repository.UpdateNowAsync(record);
        return await GetByIdAsync(record.Id);
    }

    [UnitOfWork]
    public async Task<MaintenanceDetailDto> CompleteAsync(int id, CompleteMaintenanceInput input)
    {
        var record = await _repository.FindAsync(id);
        if (record == null)
            throw Oops.Oh("维修记录不存在");

        if (record.Status == MaintenanceStatus.Completed)
            throw Oops.Oh("该维修记录已完成");

        record.Status = MaintenanceStatus.Completed;
        record.CompletedDate = DateTime.Now;
        if (input.ActualCost.HasValue)
            record.Cost = input.ActualCost;
        if (!string.IsNullOrEmpty(input.Remark))
            record.Remark = input.Remark;

        await _repository.UpdateNowAsync(record);
        return await GetByIdAsync(record.Id);
    }

    [UnitOfWork]
    public async Task DeleteAsync(int id)
    {
        var record = await _repository.FindAsync(id);
        if (record == null)
            throw Oops.Oh("维修记录不存在");

        await _repository.DeleteNowAsync(record);
    }

    private static MaintenanceDetailDto MapToDto(MaintenanceRecord record)
    {
        return new MaintenanceDetailDto
        {
            Id = record.Id,
            RoomId = record.RoomId,
            RoomInfo = record.Room != null
                ? $"{record.Room.Community?.Name ?? ""} {record.Room.Building}栋 {record.Room.RoomNumber}号"
                : "",
            Description = record.Description,
            Priority = record.Priority,
            PriorityText = record.Priority switch
            {
                MaintenancePriority.Urgent => "紧急",
                MaintenancePriority.Normal => "一般",
                MaintenancePriority.Low => "低",
                _ => ""
            },
            Status = record.Status,
            StatusText = record.Status switch
            {
                MaintenanceStatus.Pending => "待处理",
                MaintenanceStatus.InProgress => "进行中",
                MaintenanceStatus.Completed => "已完成",
                _ => ""
            },
            ReportDate = record.ReportDate,
            CompletedDate = record.CompletedDate,
            Cost = record.Cost,
            RepairPerson = record.RepairPerson,
            RepairPhone = record.RepairPhone,
            Images = record.Images,
            Remark = record.Remark,
            CreatedTime = record.CreatedTime,
        };
    }
}
```

- [ ] **Step 3: 修改 Mapper.cs，新增 MaintenanceRecord 映射**

在 `Gentle/Gentle.Application/Mapper.cs` 的 `Register` 方法末尾追加：

```csharp
// 仅注册 AddInput 映射（UpdateAsync 使用手动赋值以精确控制可更新字段）
config.NewConfig<MaintenanceAddInput, MaintenanceRecord>();
```

确保文件顶部有 `using Gentle.Core.Entities;` 和 `using Gentle.Application.Dtos.Maintenance;`。

注意：不注册 `MaintenanceUpdateInput -> MaintenanceRecord` 映射，因为 `UpdateAsync` 中使用手动赋值来精确控制哪些字段可更新，避免 Mapster 意外覆盖 `Id`、`RoomId` 等不可变字段。

- [ ] **Step 4: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Services/IMaintenanceService.cs Gentle/Gentle.Application/Services/MaintenanceService.cs Gentle/Gentle.Application/Mapper.cs
git commit -m "feat: 新增维修管理服务层"
```

---

### Task 4: 后端 API 控制器

**Files:**
- Create: `Gentle/Gentle.Application/Apps/MaintenanceAppService.cs`

- [ ] **Step 1: 创建 MaintenanceAppService**

```csharp
// Gentle/Gentle.Application/Apps/MaintenanceAppService.cs
using Gentle.Application.Dtos.Maintenance;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

[ApiDescriptionSettings("Maintenance", Name = "MaintenanceApp", Order = 50)]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceAppService : IDynamicApiController
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceAppService(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [HttpGet("list")]
    public async Task<object> GetList(
        MaintenanceStatus? status, int? roomId, MaintenancePriority? priority,
        int page = 1, int pageSize = 20)
    {
        var (items, total) = await _maintenanceService.GetListAsync(status, roomId, priority, page, pageSize);
        return new { items, total };
    }

    [HttpGet("{id}")]
    public async Task<MaintenanceDetailDto> GetById(int id)
    {
        return await _maintenanceService.GetByIdAsync(id);
    }

    [HttpPost("add")]
    public async Task<MaintenanceDetailDto> Add(MaintenanceAddInput input)
    {
        return await _maintenanceService.AddAsync(input);
    }

    [HttpPut("edit")]
    public async Task<MaintenanceDetailDto> Edit(MaintenanceUpdateInput input)
    {
        return await _maintenanceService.UpdateAsync(input);
    }

    [HttpPost("{id}/complete")]
    public async Task<MaintenanceDetailDto> Complete(int id, CompleteMaintenanceInput input)
    {
        return await _maintenanceService.CompleteAsync(id, input);
    }

    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _maintenanceService.DeleteAsync(id);
    }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Apps/MaintenanceAppService.cs
git commit -m "feat: 新增维修管理 API 控制器"
```

---

### Task 5: 待办系统集成

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs`
- Modify: `Gentle/Gentle.Application/Services/TodoService.cs`
- Modify: `Gentle/Gentle.Application/Apps/TodoAppService.cs`

- [ ] **Step 1: 修改 TodoItemDto**

在 `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs` 中：

1. 新增维修专用字段（在催收房租字段之后）：

```csharp
// 维修专用
public string? Description { get; set; }
public MaintenancePriority? Priority { get; set; }
public string? PriorityText { get; set; }
public decimal? MaintenanceCost { get; set; }
public MaintenanceStatus? MaintenanceStatus { get; set; }
public string? MaintenanceStatusText { get; set; }
```

2. 修改 `CreatedTime` 计算属性，从三元表达式改为 switch：

```csharp
public DateTimeOffset CreatedTime => Type switch
{
    TodoType.Utility => UtilityBill?.CreatedTime ?? DateTimeOffset.MinValue,
    TodoType.Rental => RentalReminder?.CreatedTime ?? DateTimeOffset.MinValue,
    TodoType.Maintenance => MaintenanceCreatedTime ?? DateTimeOffset.MinValue,
    _ => DateTimeOffset.MinValue
};
```

3. 新增辅助字段：

```csharp
public DateTimeOffset? MaintenanceCreatedTime { get; set; }
```

确保文件顶部有 `using Gentle.Core.Enums;`。

- [ ] **Step 2: 修改 TodoListResult**

在 `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs` 中新增：

```csharp
public int MaintenanceCount { get; set; }
```

- [ ] **Step 3: 修改 TodoService**

在 `Gentle/Gentle.Application/Services/TodoService.cs` 中：

1. 构造函数新增注入 `IRepository<MaintenanceRecord>`：

```csharp
private readonly IRepository<MaintenanceRecord> _maintenanceRepository;

public TodoService(
    IRepository<UtilityBill> utilityBillRepository,
    IRepository<RentalReminder> rentalReminderRepository,
    IRepository<RentalRecord> rentalRecordRepository,
    IRepository<MaintenanceRecord> maintenanceRepository)
{
    _utilityBillRepository = utilityBillRepository;
    _rentalReminderRepository = rentalReminderRepository;
    _rentalRecordRepository = rentalRecordRepository;
    _maintenanceRepository = maintenanceRepository;
}
```

2. 修改 `GetTodoListAsync` 方法中的 type 参数验证，扩展为接受 `"maintenance"`：

```csharp
if (!string.IsNullOrEmpty(type) &&
    !type.Equals("utility", StringComparison.OrdinalIgnoreCase) &&
    !type.Equals("rental", StringComparison.OrdinalIgnoreCase) &&
    !type.Equals("maintenance", StringComparison.OrdinalIgnoreCase))
{
    throw Oops.Oh("待办类型参数无效，仅支持 utility、rental 或 maintenance");
}
```

3. 在获取水电费和催收房租数据之后，新增维修数据获取逻辑：

```csharp
// 获取维修待办
var shouldFetchMaintenance = string.IsNullOrEmpty(type) ||
    type.Equals("maintenance", StringComparison.OrdinalIgnoreCase);

var maintenanceItems = new List<TodoItemDto>();
var maintenanceCount = 0;
if (shouldFetchMaintenance)
{
    var maintenanceQuery = _maintenanceRepository.AsQueryable(false)
        .Include(m => m.Room).ThenInclude(r => r!.Community)
        .Where(m => m.Status != MaintenanceStatus.Completed);

    maintenanceCount = await maintenanceQuery.CountAsync();
    maintenanceItems = await maintenanceQuery
        .OrderByDescending(m => m.ReportDate)
        .ToListAsync();

    maintenanceItems = maintenanceItems.Select(MapFromMaintenanceRecord).ToList();
}
```

4. 合并所有待办项时加入维修项：

```csharp
allItems.AddRange(maintenanceItems);
```

5. 返回结果中新增 MaintenanceCount：

```csharp
return new TodoListResult
{
    Items = pagedItems,
    Total = allItems.Count,
    UtilityCount = utilityCount,
    RentalCount = rentalCount,
    MaintenanceCount = maintenanceCount
};
```

6. 新增 `MapFromMaintenanceRecord` 私有方法：

```csharp
private static TodoItemDto MapFromMaintenanceRecord(MaintenanceRecord record)
{
    return new TodoItemDto
    {
        Type = TodoType.Maintenance,
        Id = record.Id,
        RoomInfo = record.Room != null
            ? $"{record.Room.Community?.Name ?? ""} {record.Room.Building}栋 {record.Room.RoomNumber}号"
            : "",
        Description = record.Description,
        Priority = record.Priority,
        PriorityText = record.Priority switch
        {
            MaintenancePriority.Urgent => "紧急",
            MaintenancePriority.Normal => "一般",
            MaintenancePriority.Low => "低",
            _ => ""
        },
        MaintenanceCost = record.Cost,
        MaintenanceStatus = record.Status,
        MaintenanceStatusText = record.Status switch
        {
            MaintenanceStatus.Pending => "待处理",
            MaintenanceStatus.InProgress => "进行中",
            _ => ""
        },
        MaintenanceCreatedTime = record.CreatedTime,
    };
}
```

- [ ] **Step 4: 修改 TodoAppService**

在 `Gentle/Gentle.Application/Apps/TodoAppService.cs` 的 `GetList` 方法中，修改 type 参数验证：

```csharp
if (type is not null and not ("utility" or "rental" or "maintenance"))
    throw Oops.Oh("待办类型参数无效，仅支持 utility、rental 或 maintenance");  // 注意：同步更新错误消息
```

- [ ] **Step 5: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: 编译成功

- [ ] **Step 6: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs Gentle/Gentle.Application/Services/TodoService.cs Gentle/Gentle.Application/Apps/TodoAppService.cs
git commit -m "feat: 集成维修待办到待办系统"
```

---

### Task 6: 数据库迁移

**Files:**
- Auto-generated: `Gentle/Gentle.Database.Migrations/Migrations/*.cs`

- [ ] **Step 1: 创建迁移**

Run: `cd Gentle && dotnet ef migrations add AddMaintenanceRecord --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 迁移文件成功创建

- [ ] **Step 2: 检查生成的迁移文件**

确认迁移文件包含：
- 创建 `maintenance_record` 表，含所有字段
- 为 `RoomId` 创建索引
- 外键关联 `rooms` 表

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Database.Migrations/Migrations/
git commit -m "feat: 新增 MaintenanceRecord 数据库迁移"
```

注意：不在此处执行 `database update`，实际部署时执行。

---

### Task 7: 前端 API 层和路由

**Files:**
- Create: `Hans/src/api/model/maintenanceModel.ts`
- Create: `Hans/src/api/maintenance.ts`
- Create: `Hans/src/router/modules/maintenance.ts`

- [ ] **Step 1: 创建 maintenanceModel.ts**

```ts
// Hans/src/api/model/maintenanceModel.ts
export enum MaintenancePriority {
  Urgent = 0,
  Normal = 1,
  Low = 2,
}

export const MaintenancePriorityText: Record<MaintenancePriority, string> = {
  [MaintenancePriority.Urgent]: '紧急',
  [MaintenancePriority.Normal]: '一般',
  [MaintenancePriority.Low]: '低',
};

export enum MaintenanceStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
}

export const MaintenanceStatusText: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.Pending]: '待处理',
  [MaintenanceStatus.InProgress]: '进行中',
  [MaintenanceStatus.Completed]: '已完成',
};

export interface MaintenanceDetail {
  id: number;
  roomId: number;
  roomInfo: string;
  description: string;
  priority: MaintenancePriority;
  priorityText: string;
  status: MaintenanceStatus;
  statusText: string;
  reportDate: string;
  completedDate?: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
  createdTime: string;
}

export interface MaintenanceListResult {
  items: MaintenanceDetail[];
  total: number;
}

export interface MaintenanceAddInput {
  roomId: number;
  description: string;
  priority: MaintenancePriority;
  reportDate: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
}

export interface MaintenanceUpdateInput {
  id: number;
  description: string;
  priority: MaintenancePriority;
  reportDate: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
  status: MaintenanceStatus;
}

export interface CompleteMaintenanceInput {
  actualCost?: number;
  remark?: string;
}

export interface MaintenanceListParams {
  status?: MaintenanceStatus;
  roomId?: number;
  priority?: MaintenancePriority;
  page?: number;
  pageSize?: number;
}
```

- [ ] **Step 2: 创建 maintenance.ts**

```ts
// Hans/src/api/maintenance.ts
import type {
  CompleteMaintenanceInput,
  MaintenanceAddInput,
  MaintenanceDetail,
  MaintenanceListParams,
  MaintenanceListResult,
  MaintenanceUpdateInput,
} from '@/api/model/maintenanceModel';
import { request } from '@/utils/request';

const Api = {
  List: '/maintenance/list',
  GetById: '/maintenance',
  Add: '/maintenance/add',
  Edit: '/maintenance/edit',
  Complete: '/maintenance',
  Delete: '/maintenance/remove',
};

export function getMaintenanceList(params?: MaintenanceListParams) {
  return request.get<MaintenanceListResult>({ url: Api.List, params });
}

export function getMaintenanceById(id: number) {
  return request.get<MaintenanceDetail>({ url: `${Api.GetById}/${id}` });
}

export function addMaintenance(data: MaintenanceAddInput) {
  return request.post<MaintenanceDetail>({ url: Api.Add, data });
}

export function updateMaintenance(data: MaintenanceUpdateInput) {
  return request.put<MaintenanceDetail>({ url: Api.Edit, data });
}

export function completeMaintenance(id: number, data: CompleteMaintenanceInput) {
  return request.post<MaintenanceDetail>({ url: `${Api.Complete}/${id}/complete`, data });
}

export function deleteMaintenance(id: number) {
  return request.delete<void>({ url: `${Api.Delete}/${id}` });
}
```

- [ ] **Step 3: 创建 maintenance 路由模块**

```ts
// Hans/src/router/modules/maintenance.ts
import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/maintenance',
    name: 'maintenance',
    component: Layout,
    redirect: '/maintenance/list',
    meta: { title: { zh_CN: '维修管理', en_US: 'Maintenance' }, icon: 'tools', orderNo: 5 },
    children: [
      {
        path: 'list',
        name: 'MaintenanceList',
        component: () => import('@/pages/maintenance/list.vue'),
        meta: { title: { zh_CN: '维修记录', en_US: 'Maintenance Records' } },
      },
      {
        path: 'add',
        name: 'MaintenanceAdd',
        component: () => import('@/pages/maintenance/add.vue'),
        meta: { title: { zh_CN: '新增报修', en_US: 'Add Maintenance' }, hidden: true },
      },
      {
        path: 'edit/:id',
        name: 'MaintenanceEdit',
        component: () => import('@/pages/maintenance/add.vue'),
        meta: { title: { zh_CN: '编辑报修', en_US: 'Edit Maintenance' }, hidden: true },
      },
    ],
  },
];
```

- [ ] **Step 4: 验证前端编译**

Run: `cd Hans && npm run build:type`
Expected: 类型检查通过（如果维护页面文件还未创建可能会有路由导入错误，这是正常的，在 Task 8 后会解决）

- [ ] **Step 5: 提交**

```bash
git add Hans/src/api/model/maintenanceModel.ts Hans/src/api/maintenance.ts Hans/src/router/modules/maintenance.ts
git commit -m "feat: 新增维修管理前端 API 层和路由"
```

---

### Task 8: 前端维修列表页

**Files:**
- Create: `Hans/src/pages/maintenance/list.vue`

- [ ] **Step 1: 创建维修列表页**

创建 `Hans/src/pages/maintenance/list.vue`，包含：
- 顶部筛选栏：状态下拉、优先级下拉、日期选择器
- `t-table` 表格：房间号、小区、维修描述、优先级（t-tag 颜色标签）、状态（t-tag 颜色标签）、费用、报修日期、操作
- 操作列：查看详情、编辑（未完成时）、标记完成（未完成时）、删除
- 新增报修按钮 → 跳转 `/maintenance/add`
- 标记完成弹出 `t-dialog` 确认框，可填实际费用和备注
- 删除弹出 `t-dialog` 确认框

参考现有 `housing/room/index.vue` 的页面结构和 `utility/bill/index.vue` 的列表模式。

使用 TDesign 组件：
- `t-card` 容器
- `t-select` 筛选
- `t-table` 数据表格
- `t-tag` 状态/优先级标签
- `t-dialog` 完成确认/删除确认
- `t-button` 操作按钮
- `t-input-number` 费用输入
- `t-textarea` 备注输入

关键逻辑：
- `getMaintenanceList` API 调用，传入筛选参数
- 前端分页（与现有房间管理页一致）
- `router.push` 跳转到新增/编辑页
- `completeMaintenance` API 调用完成操作
- `deleteMaintenance` API 调用删除操作

优先级标签颜色：紧急=red、一般=orange、低=grey
状态标签颜色：待处理=blue、进行中=orange、已完成=green

- [ ] **Step 2: 验证页面可访问**

Run: `cd Hans && npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add Hans/src/pages/maintenance/list.vue
git commit -m "feat: 新增维修记录列表页"
```

---

### Task 9: 前端报修表单页（新增/编辑复用）

**Files:**
- Create: `Hans/src/pages/maintenance/add.vue`

- [ ] **Step 1: 创建报修表单页**

创建 `Hans/src/pages/maintenance/add.vue`，复用于新增和编辑：

关键逻辑：
- 通过 `useRoute()` 检测是否有 `id` 参数（编辑模式）或 `roomId` 查询参数（从房间管理页跳转）
- 编辑模式：调用 `getMaintenanceById` 加载已有数据填充表单
- 房间预选模式：`roomId` 查询参数存在时，房间选择器自动选中且禁用
- 表单字段：房间选择（t-select）、维修描述（t-textarea）、优先级（t-select）、报修日期（t-date-picker）、维修费用（t-input-number）、维修人员（t-input）、联系电话（t-input）、图片路径（t-input，一期简化）、备注（t-textarea）
- 房间选择器数据来源：调用 `getRoomList` API 获取房间列表
- 提交：新增调用 `addMaintenance`，编辑调用 `updateMaintenance`
- 成功后 `router.push('/maintenance/list')`

参考现有表单模式（如房间管理的创建/编辑对话框中的表单布局），使用 `t-form` + `t-form-item`。

- [ ] **Step 2: 验证编译**

Run: `cd Hans && npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add Hans/src/pages/maintenance/add.vue
git commit -m "feat: 新增报修表单页（新增/编辑复用）"
```

---

### Task 10: 前端房间管理页集成

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

- [ ] **Step 1: 在房间管理表格操作列新增"维修"按钮**

在 `Hans/src/pages/housing/room/index.vue` 的表格操作列中，现有按钮（编辑、删除）旁边新增一个"维修"按钮：

模板中操作列添加：
```html
<t-button theme="warning" variant="text" size="small" @click="handleMaintenance(row)">
  维修
</t-button>
```

脚本中添加跳转方法：
```ts
import { useRouter } from 'vue-router';
const router = useRouter();

function handleMaintenance(row: RoomRecord) {
  router.push(`/maintenance/add?roomId=${row.id}`);
}
```

- [ ] **Step 2: 验证编译**

Run: `cd Hans && npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间管理页新增维修入口按钮"
```

---

### Task 11: 前端待办模型和 API 修改

**Files:**
- Modify: `Hans/src/api/model/todoModel.ts`
- Modify: `Hans/src/api/todo.ts`

- [ ] **Step 1: 修改 todoModel.ts**

在 `Hans/src/api/model/todoModel.ts` 中：

1. `TodoType` 枚举新增 `Maintenance = 2`
2. `TodoTypeEnum` 对象（如果存在）对应更新
3. `TodoItem` 接口新增维修相关字段：

```ts
// 维修相关
description?: string;
priority?: number;
priorityText?: string;
maintenanceCost?: number;
maintenanceStatus?: number;
maintenanceStatusText?: string;
```

4. `TodoListResult` 接口新增 `maintenanceCount` 字段：

```ts
maintenanceCount?: number;
```

- [ ] **Step 2: 修改 todo.ts**

在 `Hans/src/api/todo.ts` 中，找到 `todoTypeToString` 函数，修改为支持三种类型：

```ts
function todoTypeToString(type?: TodoType): string | undefined {
  if (type === undefined) return undefined;
  if (type === TodoType.Utility) return 'utility';
  if (type === TodoType.Rental) return 'rental';
  if (type === TodoType.Maintenance) return 'maintenance';
  return undefined;
}
```

- [ ] **Step 3: 提交**

```bash
git add Hans/src/api/model/todoModel.ts Hans/src/api/todo.ts
git commit -m "feat: 前端待办模型新增维修类型支持"
```

---

### Task 12: 前端 Dashboard 待办面板集成

**Files:**
- Create: `Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue`
- Modify: `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

- [ ] **Step 1: 创建 MaintenanceDetailDialog.vue**

创建 `Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue`，参考 `PayUtilityDialog.vue` 的模式：

- Props: `visible` (boolean), `record` (MaintenanceDetail | null)
- Emits: `update:visible`, `success`
- 展示字段：房间信息、维修描述、优先级标签、状态、报修日期、费用、维修人员、联系电话
- 底部按钮：
  - "标记完成"（仅未完成时显示）→ 弹出二次确认（可填实际费用和备注）→ 调用 `completeMaintenance` API
  - "前往维修管理" → `router.push('/maintenance/list')`

- [ ] **Step 2: 修改 TodoPanel.vue**

在 `Hans/src/pages/dashboard/base/components/TodoPanel.vue` 中：

1. 导入 `MaintenanceDetailDialog` 组件和相关类型/API
2. 新增 `MaintenanceDetailDialog` 模板引用
3. 筛选选项 `typeOptions` 新增维修选项：`{ label: '维修', value: TodoType.Maintenance }`
4. `getTodoTypeClass` 新增维修返回 `'maintenance'`
5. `getTodoIcon` 新增维修返回 `'tools'`
6. `todo-desc` 模板新增维修类型的展示分支：

```html
<template v-else-if="item.type === TodoType.Maintenance">
  <span class="todo-type-tag todo-type-tag--maintenance">维修</span>
  {{ item.description }}
  <t-tag v-if="item.priorityText" size="small" :theme="getPriorityTheme(item.priority)" variant="light">
    {{ item.priorityText }}
  </t-tag>
</template>
```

7. `handleTodoClick` 新增维修类型处理：

```ts
if (item.type === TodoType.Maintenance) {
  // 将 TodoItem 转为 MaintenanceDetail 格式
  selectedMaintenance.value = convertToMaintenanceDetail(item);
  maintenanceDialogVisible.value = true;
}
```

8. 新增样式：`.todo-item--maintenance`、`.todo-icon--maintenance`、`.todo-type-tag--maintenance`

9. 统计信息中考虑维修数量（如果统计展示区域有分别计数）

- [ ] **Step 3: 验证编译**

Run: `cd Hans && npm run build`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue Hans/src/pages/dashboard/base/components/TodoPanel.vue
git commit -m "feat: Dashboard 待办面板集成维修待办"
```

---

### Task 13: 端到端验证

**Files:** 无新增/修改

- [ ] **Step 1: 后端完整编译验证**

Run: `cd Gentle && dotnet build`
Expected: 编译成功，无警告

- [ ] **Step 2: 前端完整构建验证**

Run: `cd Hans && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 3: 前端 lint 检查**

Run: `cd Hans && npm run lint`
Expected: 无 lint 错误

- [ ] **Step 4: 最终提交（如有 lint 自动修复的变更）**

```bash
git add -A
git commit -m "chore: lint 修复"
```
