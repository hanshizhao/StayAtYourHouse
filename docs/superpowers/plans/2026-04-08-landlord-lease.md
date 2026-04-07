# 房东租约管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为每个房间新增房东租约对象，记录从上游房东租入的合同信息（房东联系方式、月租金、付款方式、水电费单价及其他费用），在房间列表页通过抽屉展示和编辑。

**Architecture:** 新增独立实体 `LandlordLease`，与 `Room` 一对一关联。后端遵循 Furion 框架规范（IDynamicApiController、Entity 继承、ITransient 服务注册），前端遵循 Vue 3 + TDesign + TypeScript 模式。Room 上原有的 `CostPrice`/`WaterPrice`/`ElectricPrice` 标记废弃，利润计算改为从 `LandlordLease.MonthlyRent` 读取。

**Tech Stack:** .NET 10 / Furion / EF Core (MySQL) | Vue 3 / TDesign Vue Next / TypeScript

**设计文档:** `docs/superpowers/specs/2026-04-08-landlord-lease-design.md`

---

## 文件结构

### 后端新增文件

| 文件 | 职责 |
|------|------|
| `Gentle/Gentle.Core/Enums/PaymentMethod.cs` | 付款方式枚举 |
| `Gentle/Gentle.Core/Entities/LandlordLease.cs` | 房东租约实体 |
| `Gentle/Gentle.Application/Dtos/LandlordLease/LandlordLeaseDto.cs` | 输出 DTO |
| `Gentle/Gentle.Application/Dtos/LandlordLease/CreateLandlordLeaseInput.cs` | 创建输入 DTO |
| `Gentle/Gentle.Application/Dtos/LandlordLease/UpdateLandlordLeaseInput.cs` | 更新输入 DTO |
| `Gentle/Gentle.Application/Services/ILandlordLeaseService.cs` | 服务接口 |
| `Gentle/Gentle.Application/Services/LandlordLeaseService.cs` | 服务实现 |
| `Gentle/Gentle.Application/Apps/LandlordLeaseAppService.cs` | API 控制器 |

### 后端修改文件

| 文件 | 改动 |
|------|------|
| `Gentle/Gentle.Core/Entities/Room.cs` | 新增 `LandlordLease` 导航属性 |
| `Gentle/Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs` | 配置一对一关系 |
| `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` | 新增 `LandlordLease` 属性 |
| `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs` | `CostPrice` 去掉 `[Required]` |
| `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs` | `CostPrice` 去掉 `[Required]` |
| `Gentle/Gentle.Application/Mapper.cs` | 更新 Profit 计算 + 新增 LandlordLease 映射 |
| `Gentle/Gentle.Application/Services/RoomService.cs` | GetList/GetById 新增 Include LandlordLease |
| `Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs` | `CostPrice` 改为 `LandlordLeaseMonthlyRent`，`MonthlyProfit` 改为普通属性 |
| `Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs` | `VacantRoomDto.CostPrice` 改为 `LandlordLeaseMonthlyRent` |
| `Gentle/Gentle.Application/Services/ReportService.cs` | 成本改为从 LandlordLease 读取 + 相关 Include |

### 前端新增文件

| 文件 | 职责 |
|------|------|
| `Hans/src/api/model/landlordLeaseModel.ts` | TS 类型定义 |
| `Hans/src/api/landlordLease.ts` | API 调用函数 |

### 前端修改文件

| 文件 | 改动 |
|------|------|
| `Hans/src/api/model/roomModel.ts` | `RoomItem` 新增 `landlordLease` 字段 |
| `Hans/src/pages/housing/room/index.vue` | 新增"房东租约"按钮 + Drawer |
| `Hans/src/pages/housing/room/detail.vue` | 重构价格卡片 + 新增房东租约卡片 |

---

### Task 1: 后端枚举和实体

**Files:**
- Create: `Gentle/Gentle.Core/Enums/PaymentMethod.cs`
- Create: `Gentle/Gentle.Core/Entities/LandlordLease.cs`
- Modify: `Gentle/Gentle.Core/Entities/Room.cs`

- [ ] **Step 1: 创建 PaymentMethod 枚举**

```csharp
// Gentle/Gentle.Core/Enums/PaymentMethod.cs
namespace Gentle.Core.Enums;

/// <summary>
/// 付款方式枚举
/// </summary>
public enum PaymentMethod
{
    /// <summary>月付</summary>
    Monthly = 0,

    /// <summary>季付（押一付三）</summary>
    Quarterly = 1,

    /// <summary>半年付</summary>
    SemiAnnual = 2,

    /// <summary>年付</summary>
    Annual = 3,

    /// <summary>自定义</summary>
    Custom = 4,
}
```

- [ ] **Step 2: 创建 LandlordLease 实体**

```csharp
// Gentle/Gentle.Core/Entities/LandlordLease.cs
using Gentle.Core.Enums;

namespace Gentle.Core.Entities;

/// <summary>
/// 房东租约实体
/// </summary>
public class LandlordLease : Entity<int>
{
    /// <summary>关联房间 ID</summary>
    public int RoomId { get; set; }

    /// <summary>导航属性：关联房间</summary>
    public Room Room { get; set; } = null!;

    /// <summary>房东姓名</summary>
    public string LandlordName { get; set; } = string.Empty;

    /// <summary>联系电话</summary>
    [RegularExpression(@"^1\d{10}$", ErrorMessage = "手机号格式不正确")]
    public string? LandlordPhone { get; set; }

    /// <summary>起租日期</summary>
    public DateTime StartDate { get; set; }

    /// <summary>到期日期（留空表示无固定期限）</summary>
    public DateTime? EndDate { get; set; }

    /// <summary>月租金（元）</summary>
    public decimal MonthlyRent { get; set; }

    /// <summary>付款方式</summary>
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>押金月数</summary>
    public int? DepositMonths { get; set; }

    /// <summary>水费单价（元/吨）</summary>
    public decimal? WaterPrice { get; set; }

    /// <summary>电费单价（元/度）</summary>
    public decimal? ElectricPrice { get; set; }

    /// <summary>电梯费（元/月）</summary>
    public decimal? ElevatorFee { get; set; }

    /// <summary>物业费（元/月）</summary>
    public decimal? PropertyFee { get; set; }

    /// <summary>网络费（元/月）</summary>
    public decimal? InternetFee { get; set; }

    /// <summary>其他费用描述</summary>
    public string? OtherFees { get; set; }

    /// <summary>备注</summary>
    public string? Remark { get; set; }
}
```

- [ ] **Step 3: 修改 Room 实体，添加导航属性**

在 `Gentle/Gentle.Core/Entities/Room.cs` 中，在 `MaintenanceRecords` 导航属性之后新增：

```csharp
    /// <summary>房东租约（一对一）</summary>
    public LandlordLease? LandlordLease { get; set; }
```

- [ ] **Step 4: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Core/Enums/PaymentMethod.cs Gentle/Gentle.Core/Entities/LandlordLease.cs Gentle/Gentle.Core/Entities/Room.cs
git commit -m "feat: 新增 LandlordLease 实体和 PaymentMethod 枚举"
```

---

### Task 2: 后端 DTO 和 Mapster 映射

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/LandlordLease/LandlordLeaseDto.cs`
- Create: `Gentle/Gentle.Application/Dtos/LandlordLease/CreateLandlordLeaseInput.cs`
- Create: `Gentle/Gentle.Application/Dtos/LandlordLease/UpdateLandlordLeaseInput.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs`
- Modify: `Gentle/Gentle.Application/Mapper.cs`

- [ ] **Step 1: 创建 LandlordLeaseDto**

```csharp
// Gentle/Gentle.Application/Dtos/LandlordLease/LandlordLeaseDto.cs
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.LandlordLease;

/// <summary>
/// 房东租约输出 DTO
/// </summary>
public class LandlordLeaseDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string LandlordName { get; set; } = string.Empty;
    [RegularExpression(@"^1\d{10}$", ErrorMessage = "手机号格式不正确")]
    public string? LandlordPhone { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public int? DepositMonths { get; set; }
    public decimal? WaterPrice { get; set; }
    public decimal? ElectricPrice { get; set; }
    public decimal? ElevatorFee { get; set; }
    public decimal? PropertyFee { get; set; }
    public decimal? InternetFee { get; set; }
    public string? OtherFees { get; set; }
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }

    /// <summary>房间信息（格式：小区名 X栋 XXX号）</summary>
    public string RoomInfo { get; set; } = string.Empty;
}
```

- [ ] **Step 2: 创建 CreateLandlordLeaseInput**

```csharp
// Gentle/Gentle.Application/Dtos/LandlordLease/CreateLandlordLeaseInput.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.LandlordLease;

/// <summary>
/// 创建房东租约输入
/// </summary>
public class CreateLandlordLeaseInput
{
    [Required(ErrorMessage = "房间ID不能为空")]
    public int RoomId { get; set; }

    [Required(ErrorMessage = "房东姓名不能为空")]
    [MaxLength(50, ErrorMessage = "房东姓名最长50个字符")]
    public string LandlordName { get; set; } = string.Empty;

    [RegularExpression(@"^1\d{10}$", ErrorMessage = "手机号格式不正确")]
    public string? LandlordPhone { get; set; }

    [Required(ErrorMessage = "起租日期不能为空")]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required(ErrorMessage = "月租金不能为空")]
    [Range(0.01, 999999, ErrorMessage = "月租金范围为0.01-999999")]
    public decimal MonthlyRent { get; set; }

    [Required(ErrorMessage = "付款方式不能为空")]
    public PaymentMethod PaymentMethod { get; set; }

    [Range(0, 36, ErrorMessage = "押金月数范围为0-36")]
    public int? DepositMonths { get; set; }

    [Range(0.01, 999, ErrorMessage = "水费单价范围为0.01-999")]
    public decimal? WaterPrice { get; set; }

    [Range(0.01, 999, ErrorMessage = "电费单价范围为0.01-999")]
    public decimal? ElectricPrice { get; set; }

    [Range(0, 99999, ErrorMessage = "电梯费范围为0-99999")]
    public decimal? ElevatorFee { get; set; }

    [Range(0, 99999, ErrorMessage = "物业费范围为0-99999")]
    public decimal? PropertyFee { get; set; }

    [Range(0, 99999, ErrorMessage = "网络费范围为0-99999")]
    public decimal? InternetFee { get; set; }

    public string? OtherFees { get; set; }

    public string? Remark { get; set; }
}
```

- [ ] **Step 3: 创建 UpdateLandlordLeaseInput**

```csharp
// Gentle/Gentle.Application/Dtos/LandlordLease/UpdateLandlordLeaseInput.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.LandlordLease;

/// <summary>
/// 更新房东租约输入
/// </summary>
public class UpdateLandlordLeaseInput
{
    [Required(ErrorMessage = "ID不能为空")]
    public int Id { get; set; }

    [Required(ErrorMessage = "房东姓名不能为空")]
    [MaxLength(50, ErrorMessage = "房东姓名最长50个字符")]
    public string LandlordName { get; set; } = string.Empty;

    [RegularExpression(@"^1\d{10}$", ErrorMessage = "手机号格式不正确")]
    public string? LandlordPhone { get; set; }

    [Required(ErrorMessage = "起租日期不能为空")]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required(ErrorMessage = "月租金不能为空")]
    [Range(0.01, 999999, ErrorMessage = "月租金范围为0.01-999999")]
    public decimal MonthlyRent { get; set; }

    [Required(ErrorMessage = "付款方式不能为空")]
    public PaymentMethod PaymentMethod { get; set; }

    [Range(0, 36, ErrorMessage = "押金月数范围为0-36")]
    public int? DepositMonths { get; set; }

    [Range(0.01, 999, ErrorMessage = "水费单价范围为0.01-999")]
    public decimal? WaterPrice { get; set; }

    [Range(0.01, 999, ErrorMessage = "电费单价范围为0.01-999")]
    public decimal? ElectricPrice { get; set; }

    [Range(0, 99999, ErrorMessage = "电梯费范围为0-99999")]
    public decimal? ElevatorFee { get; set; }

    [Range(0, 99999, ErrorMessage = "物业费范围为0-99999")]
    public decimal? PropertyFee { get; set; }

    [Range(0, 99999, ErrorMessage = "网络费范围为0-99999")]
    public decimal? InternetFee { get; set; }

    public string? OtherFees { get; set; }

    public string? Remark { get; set; }
}
```

- [ ] **Step 4: 修改 RoomDto，新增 LandlordLease 属性**

在 `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` 中添加 using 和属性：

```csharp
// 文件顶部新增 using
using Gentle.Application.Dtos.LandlordLease;

// 在 RoomDto 类中，Profit 属性之后新增
    /// <summary>房东租约</summary>
    public LandlordLeaseDto? LandlordLease { get; set; }
```

- [ ] **Step 5: 修改 CreateRoomInput，CostPrice 去掉 Required**

在 `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs` 中：
- 将 `CostPrice` 的 `[Required]` 去掉
- 添加默认值：`public decimal CostPrice { get; set; } = 0;`

- [ ] **Step 6: 修改 UpdateRoomInput，CostPrice 去掉 Required**

在 `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs` 中同样处理 `CostPrice`。

- [ ] **Step 7: 更新 Mapper.cs**

在 `Gentle/Gentle.Application/Mapper.cs` 中：

1. 修改 Room -> RoomDto 映射的 Profit 计算：
```csharp
// 将现有的
.Map(dest => dest.Profit, src => src.RentPrice - src.CostPrice)
// 改为
.Map(dest => dest.Profit, src => src.RentPrice - (src.LandlordLease != null ? src.LandlordLease.MonthlyRent : 0))
```

2. 在文件末尾新增 LandlordLease 映射：
```csharp
// LandlordLease mappings
config.NewConfig<LandlordLease, LandlordLeaseDto>()
    .Map(dest => dest.RoomInfo, src => src.Room != null && src.Room.Community != null
        ? $"{src.Room.Community.Name} {src.Room.Building}栋 {src.Room.RoomNumber}号"
        : string.Empty);

config.NewConfig<CreateLandlordLeaseInput, LandlordLease>();
config.NewConfig<UpdateLandlordLeaseInput, LandlordLease>();
```

注意：需要在文件顶部添加 `using Gentle.Core.Entities;` 和 `using Gentle.Application.Dtos.LandlordLease;`（如果尚未存在）。

- [ ] **Step 8: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 9: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/LandlordLease/ Gentle/Gentle.Application/Dtos/Room/ Gentle/Gentle.Application/Mapper.cs
git commit -m "feat: 新增 LandlordLease DTO 和 Mapster 映射配置"
```

---

### Task 3: 后端服务层和 API

**Files:**
- Create: `Gentle/Gentle.Application/Services/ILandlordLeaseService.cs`
- Create: `Gentle/Gentle.Application/Services/LandlordLeaseService.cs`
- Create: `Gentle/Gentle.Application/Apps/LandlordLeaseAppService.cs`

- [ ] **Step 1: 创建 ILandlordLeaseService 接口**

```csharp
// Gentle/Gentle.Application/Services/ILandlordLeaseService.cs
using Gentle.Application.Dtos.LandlordLease;

namespace Gentle.Application.Services;

/// <summary>
/// 房东租约服务接口
/// </summary>
public interface ILandlordLeaseService : ITransient
{
    Task<LandlordLeaseDto?> GetByRoomIdAsync(int roomId);
    Task<LandlordLeaseDto> AddAsync(CreateLandlordLeaseInput input);
    Task<LandlordLeaseDto> EditAsync(UpdateLandlordLeaseInput input);
    Task RemoveAsync(int id);
}
```

- [ ] **Step 2: 创建 LandlordLeaseService 实现**

```csharp
// Gentle/Gentle.Application/Services/LandlordLeaseService.cs
using Gentle.Application.Dtos.LandlordLease;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 房东租约服务实现
/// </summary>
public class LandlordLeaseService : ILandlordLeaseService
{
    private readonly IRepository<LandlordLease> _leaseRepository;
    private readonly IRepository<Room> _roomRepository;

    public LandlordLeaseService(
        IRepository<LandlordLease> leaseRepository,
        IRepository<Room> roomRepository)
    {
        _leaseRepository = leaseRepository;
        _roomRepository = roomRepository;
    }

    public async Task<LandlordLeaseDto?> GetByRoomIdAsync(int roomId)
    {
        var lease = await _leaseRepository.AsQueryable()
            .Include(l => l.Room)
                .ThenInclude(r => r!.Community)
            .FirstOrDefaultAsync(l => l.RoomId == roomId);

        return lease?.Adapt<LandlordLeaseDto>();
    }

    public async Task<LandlordLeaseDto> AddAsync(CreateLandlordLeaseInput input)
    {
        // 校验房间存在
        var room = await _roomRepository.FindAsync(input.RoomId);
        if (room == null)
        {
            throw Oops.Oh("房间不存在");
        }

        // 校验一对一约束
        var exists = await _leaseRepository.AsQueryable()
            .AnyAsync(l => l.RoomId == input.RoomId);
        if (exists)
        {
            throw Oops.Oh("该房间已存在房东租约");
        }

        // 校验 EndDate >= StartDate
        if (input.EndDate.HasValue && input.EndDate.Value < input.StartDate)
        {
            throw Oops.Oh("到期日期不能早于起租日期");
        }

        var lease = input.Adapt<LandlordLease>();
        lease.CreatedTime = DateTimeOffset.Now;

        var added = await _leaseRepository.InsertNowAsync(lease);

        // 重新查询以包含导航属性
        var result = await _leaseRepository.AsQueryable()
            .Include(l => l.Room)
                .ThenInclude(r => r!.Community)
            .FirstOrDefaultAsync(l => l.Id == added.Entity.Id);

        return result!.Adapt<LandlordLeaseDto>();
    }

    public async Task<LandlordLeaseDto> EditAsync(UpdateLandlordLeaseInput input)
    {
        var lease = await _leaseRepository.FindAsync(input.Id);
        if (lease == null)
        {
            throw Oops.Oh("房东租约不存在");
        }

        // 校验 EndDate >= StartDate
        if (input.EndDate.HasValue && input.EndDate.Value < input.StartDate)
        {
            throw Oops.Oh("到期日期不能早于起租日期");
        }

        // 逐字段更新（不可变模式）
        lease.LandlordName = input.LandlordName;
        lease.LandlordPhone = input.LandlordPhone;
        lease.StartDate = input.StartDate;
        lease.EndDate = input.EndDate;
        lease.MonthlyRent = input.MonthlyRent;
        lease.PaymentMethod = input.PaymentMethod;
        lease.DepositMonths = input.DepositMonths;
        lease.WaterPrice = input.WaterPrice;
        lease.ElectricPrice = input.ElectricPrice;
        lease.ElevatorFee = input.ElevatorFee;
        lease.PropertyFee = input.PropertyFee;
        lease.InternetFee = input.InternetFee;
        lease.OtherFees = input.OtherFees;
        lease.Remark = input.Remark;
        lease.UpdatedTime = DateTimeOffset.Now;

        await _leaseRepository.UpdateNowAsync(lease);

        // 重新查询以包含导航属性
        var result = await _leaseRepository.AsQueryable()
            .Include(l => l.Room)
                .ThenInclude(r => r!.Community)
            .FirstOrDefaultAsync(l => l.Id == input.Id);

        return result!.Adapt<LandlordLeaseDto>();
    }

    public async Task RemoveAsync(int id)
    {
        var lease = await _leaseRepository.FindAsync(id);
        if (lease == null)
        {
            throw Oops.Oh("房东租约不存在");
        }

        await _leaseRepository.DeleteNowAsync(lease);
    }
}
```

- [ ] **Step 3: 创建 LandlordLeaseAppService**

```csharp
// Gentle/Gentle.Application/Apps/LandlordLeaseAppService.cs
using Gentle.Application.Dtos.LandlordLease;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 房东租约管理 API
/// </summary>
[ApiDescriptionSettings("Housing", Name = "LandlordLease", Order = 3)]
[Route("api/landlord-lease")]
[Authorize]
public class LandlordLeaseAppService : IDynamicApiController
{
    private readonly ILandlordLeaseService _leaseService;

    public LandlordLeaseAppService(ILandlordLeaseService leaseService)
    {
        _leaseService = leaseService;
    }

    /// <summary>
    /// 根据房间ID获取房东租约
    /// </summary>
    [HttpGet("room/{roomId}")]
    public async Task<LandlordLeaseDto?> GetByRoomId(int roomId)
    {
        return await _leaseService.GetByRoomIdAsync(roomId);
    }

    /// <summary>
    /// 新增房东租约
    /// </summary>
    [HttpPost("add")]
    public async Task<LandlordLeaseDto> Add([FromBody] CreateLandlordLeaseInput input)
    {
        return await _leaseService.AddAsync(input);
    }

    /// <summary>
    /// 更新房东租约
    /// </summary>
    [HttpPut("edit")]
    public async Task<LandlordLeaseDto> Edit([FromBody] UpdateLandlordLeaseInput input)
    {
        return await _leaseService.EditAsync(input);
    }

    /// <summary>
    /// 删除房东租约
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _leaseService.RemoveAsync(id);
    }
}
```

- [ ] **Step 4: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Services/ILandlordLeaseService.cs Gentle/Gentle.Application/Services/LandlordLeaseService.cs Gentle/Gentle.Application/Apps/LandlordLeaseAppService.cs
git commit -m "feat: 新增 LandlordLease 服务层和 API 控制器"
```

---

### Task 4: 后端 RoomService 和 DbContext 变更

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs`
- Modify: `Gentle/Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs`

- [ ] **Step 1: 修改 DefaultDbContext，配置一对一关系**

在 `Gentle/Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs` 中，新增 `OnModelCreating` 方法（当前不存在该方法）：

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Room 与 LandlordLease 一对一关系
// Room 与 LandlordLease 一对一关系
modelBuilder.Entity<Room>()
    .HasOne(r => r.LandlordLease)
    .WithOne(l => l.Room)
    .HasForeignKey<LandlordLease>(l => l.RoomId)
    .OnDelete(DeleteBehavior.Cascade);
}
```

注意：需要在文件顶部添加 `using Gentle.Core.Entities;`（如果尚未存在）。

- [ ] **Step 2: 修改 RoomService，Include LandlordLease**

在 `Gentle/Gentle.Application/Services/RoomService.cs` 中：

1. **GetListAsync**：在 `.Include(r => r.Community)` 后新增 `.Include(r => r.LandlordLease)`
2. **GetByIdAsync**：在 `.Include(r => r.Community)` 后新增 `.Include(r => r.LandlordLease)`

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs Gentle/Gentle.Application/Services/RoomService.cs
git commit -m "feat: 配置 Room-LandlordLease 一对一关系，更新 RoomService Include"
```

---

### Task 5: 后端报表模块更新

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs`
- Modify: `Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs`
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs`

- [ ] **Step 1: 修改 RoomProfitRankingDto**

在 `Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs` 中：

1. 将 `CostPrice` 属性改为 `LandlordLeaseMonthlyRent`：
```csharp
    /// <summary>房东月租金（成本）</summary>
    public decimal? LandlordLeaseMonthlyRent { get; set; }
```

2. 将 `MonthlyProfit` 从计算属性改为普通属性：
```csharp
    /// <summary>月利润</summary>
    public decimal MonthlyProfit { get; set; }
```

3. 更新依赖 `MonthlyProfit` 的计算属性（`ProfitRate` 和 `IsLoss`）保持不变（它们依赖 `MonthlyProfit` 属性，无论其来源）。

- [ ] **Step 2: 修改 HousingOverviewDto 中的 VacantRoomDto**

在 `Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs` 的 `VacantRoomDto` 类中：

将 `CostPrice` 属性改为：
```csharp
    /// <summary>房东月租金（成本）</summary>
    public decimal? LandlordLeaseMonthlyRent { get; set; }
```

- [ ] **Step 3: 修改 ReportService**

在 `Gentle/Gentle.Application/Services/ReportService.cs` 中：

1. **GetIncomeReportAsync**：
   - 查询中新增 `.Include(r => r.Room.LandlordLease)`（在已有的 `.Include(r => r.Room)` 之后）
   - 第 65 行附近 `rental.Room.CostPrice` 改为 `(rental.Room.LandlordLease?.MonthlyRent ?? 0)`

2. **GetHousingOverviewAsync**：
   - 查询中新增 `.Include(r => r.LandlordLease)`（在已有的 Room 查询上）
   - `VacantRoomDto` 构造中 `CostPrice = r.CostPrice` 改为 `LandlordLeaseMonthlyRent = r.LandlordLease != null ? r.LandlordLease.MonthlyRent : null`

3. **GetRoomProfitRankingAsync**：
   - 查询中新增 `.Include(r => r.LandlordLease)`
   - `RoomProfitRankingDto` 构造中：
     - `CostPrice = room.CostPrice` 改为 `LandlordLeaseMonthlyRent = room.LandlordLease != null ? room.LandlordLease.MonthlyRent : null`
     - `MonthlyProfit` 改为显式赋值：`MonthlyProfit = room.RentPrice - (room.LandlordLease != null ? room.LandlordLease.MonthlyRent : 0)`

- [ ] **Step 4: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Report/ Gentle/Gentle.Application/Services/ReportService.cs
git commit -m "feat: 报表模块利润计算改从 LandlordLease 读取"
```

---

### Task 6: 数据库迁移

**Files:**
- Auto-generated by EF Core

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add AddLandlordLease --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: Migration created successfully

- [ ] **Step 2: 检查生成的迁移文件**

确认迁移包含：
- 创建 `LandlordLease` 表
- `RoomId` 列有唯一索引
- `RoomId` 外键指向 `Room` 表，级联删除
- `Room` 表无结构变更（导航属性不需要列变更）

- [ ] **Step 3: 应用迁移（可选，需数据库连接）**

Run: `cd Gentle && dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Database.Migrations/
git commit -m "feat: 新增 AddLandlordLease 数据库迁移"
```

---

### Task 7: 前端类型定义和 API

**Files:**
- Create: `Hans/src/api/model/landlordLeaseModel.ts`
- Create: `Hans/src/api/landlordLease.ts`
- Modify: `Hans/src/api/model/roomModel.ts`

- [ ] **Step 1: 创建 landlordLeaseModel.ts**

```typescript
// Hans/src/api/model/landlordLeaseModel.ts

/** 付款方式枚举 */
export enum PaymentMethod {
  Monthly = 0,
  Quarterly = 1,
  SemiAnnual = 2,
  Annual = 3,
  Custom = 4,
}

/** 付款方式中文映射 */
export const PaymentMethodText: Record<PaymentMethod, string> = {
  [PaymentMethod.Monthly]: '月付',
  [PaymentMethod.Quarterly]: '季付（押一付三）',
  [PaymentMethod.SemiAnnual]: '半年付',
  [PaymentMethod.Annual]: '年付',
  [PaymentMethod.Custom]: '自定义',
}

/** 房东租约详情 */
export interface LandlordLeaseDetail {
  id: number
  roomId: number
  landlordName: string
  landlordPhone?: string
  startDate: string
  endDate?: string
  monthlyRent: number
  paymentMethod: PaymentMethod
  depositMonths?: number
  waterPrice?: number
  electricPrice?: number
  elevatorFee?: number
  propertyFee?: number
  internetFee?: number
  otherFees?: string
  remark?: string
  createdTime: string
  roomInfo: string
}

/** 创建房东租约参数 */
export interface CreateLandlordLeaseParams {
  roomId: number
  landlordName: string
  landlordPhone?: string
  startDate: string
  endDate?: string
  monthlyRent: number
  paymentMethod: PaymentMethod
  depositMonths?: number
  waterPrice?: number
  electricPrice?: number
  elevatorFee?: number
  propertyFee?: number
  internetFee?: number
  otherFees?: string
  remark?: string
}

/** 更新房东租约参数 */
export interface UpdateLandlordLeaseParams {
  id: number
  landlordName: string
  landlordPhone?: string
  startDate: string
  endDate?: string
  monthlyRent: number
  paymentMethod: PaymentMethod
  depositMonths?: number
  waterPrice?: number
  electricPrice?: number
  elevatorFee?: number
  propertyFee?: number
  internetFee?: number
  otherFees?: string
  remark?: string
}
```

- [ ] **Step 2: 创建 landlordLease.ts API**

```typescript
// Hans/src/api/landlordLease.ts
import type {
  CreateLandlordLeaseParams,
  LandlordLeaseDetail,
  UpdateLandlordLeaseParams,
} from '@/api/model/landlordLeaseModel'
import request from '@/utils/request'

const Api = {
  GetByRoomId: '/landlord-lease/room',
  Add: '/landlord-lease/add',
  Edit: '/landlord-lease/edit',
  Remove: '/landlord-lease/remove',
}

/** 根据房间ID获取房东租约 */
export function getLandlordLeaseByRoomId(roomId: number) {
  return request.get<LandlordLeaseDetail>({ url: `${Api.GetByRoomId}/${roomId}` })
}

/** 新增房东租约 */
export function addLandlordLease(data: CreateLandlordLeaseParams) {
  return request.post<LandlordLeaseDetail>({ url: Api.Add, data })
}

/** 更新房东租约 */
export function updateLandlordLease(data: UpdateLandlordLeaseParams) {
  return request.put<LandlordLeaseDetail>({ url: Api.Edit, data })
}

/** 删除房东租约 */
export function removeLandlordLease(id: number) {
  return request.delete({ url: `${Api.Remove}/${id}` })
}
```

- [ ] **Step 3: 修改 roomModel.ts，RoomItem 新增字段**

在 `Hans/src/api/model/roomModel.ts` 中：

1. 文件顶部新增 import：
```typescript
import type { LandlordLeaseDetail } from '@/api/model/landlordLeaseModel'
```

2. 在 `RoomItem` 接口中，`createdTime` 之前新增：
```typescript
  /** 房东租约 */
  landlordLease?: LandlordLeaseDetail
```

- [ ] **Step 4: 构建验证**

Run: `cd Hans && npm run build:type`
Expected: No type errors

- [ ] **Step 5: 提交**

```bash
git add Hans/src/api/model/landlordLeaseModel.ts Hans/src/api/landlordLease.ts Hans/src/api/model/roomModel.ts
git commit -m "feat: 前端 LandlordLease 类型定义和 API 层"
```

---

### Task 8: 前端房间列表页 - 房东租约抽屉

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

这是最大的前端改动。在房间列表页的操作列新增"房东租约"按钮，点击后打开右侧抽屉。

- [ ] **Step 1: 新增 import**

在 `<script setup>` 的 import 区域新增：

```typescript
import {
  getLandlordLeaseByRoomId,
  addLandlordLease,
  updateLandlordLease,
  removeLandlordLease,
} from '@/api/landlordLease'
import type {
  LandlordLeaseDetail,
  CreateLandlordLeaseParams,
  PaymentMethod,
} from '@/api/model/landlordLeaseModel'
import { PaymentMethodText } from '@/api/model/landlordLeaseModel'
```

- [ ] **Step 2: 新增响应式状态**

```typescript
// ==================== 房东租约抽屉 ====================
const leaseDrawerVisible = ref(false)
const leaseLoading = ref(false)
const leaseData = ref<LandlordLeaseDetail | null>(null)
const leaseEditMode = ref(false) // true=表单模式, false=展示模式
const leaseSaving = ref(false)
const leaseRoomInfo = ref('') // 当前操作的房间信息

// 表单数据
const leaseForm = ref<CreateLandlordLeaseParams>({
  roomId: 0,
  landlordName: '',
  startDate: '',
  monthlyRent: 0,
  paymentMethod: 0,
})

const deleteLeaseConfirmVisible = ref(false)
```

- [ ] **Step 3: 新增方法**

```typescript
// ==================== 房东租约方法 ====================

/** 打开房东租约抽屉 */
async function handleOpenLease(row: RoomItem) {
  leaseRoomInfo.value = `${row.communityName} ${row.building}栋${row.roomNumber}`
  leaseDrawerVisible.value = true
  leaseEditMode.value = false
  leaseLoading.value = true
  leaseData.value = null

  try {
    const res = await getLandlordLeaseByRoomId(row.id)
    leaseData.value = res
  }
  catch {
    leaseData.value = null
  }
  finally {
    leaseLoading.value = false
  }
}

/** 进入添加模式 */
function handleAddLease() {
  leaseEditMode.value = true
  // 从当前行获取 roomId（leaseData 为 null 时也要能添加）
  leaseForm.value = {
    roomId: leaseData.value?.roomId ?? 0,
    landlordName: '',
    startDate: '',
    monthlyRent: 0,
    paymentMethod: 0,
  }
}

/** 进入编辑模式 */
function handleEditLease() {
  if (!leaseData.value)
    return
  leaseEditMode.value = true
  leaseForm.value = {
    roomId: leaseData.value.roomId,
    landlordName: leaseData.value.landlordName,
    landlordPhone: leaseData.value.landlordPhone ?? undefined,
    startDate: leaseData.value.startDate,
    endDate: leaseData.value.endDate ?? undefined,
    monthlyRent: leaseData.value.monthlyRent,
    paymentMethod: leaseData.value.paymentMethod,
    depositMonths: leaseData.value.depositMonths ?? undefined,
    waterPrice: leaseData.value.waterPrice ?? undefined,
    electricPrice: leaseData.value.electricPrice ?? undefined,
    elevatorFee: leaseData.value.elevatorFee ?? undefined,
    propertyFee: leaseData.value.propertyFee ?? undefined,
    internetFee: leaseData.value.internetFee ?? undefined,
    otherFees: leaseData.value.otherFees ?? undefined,
    remark: leaseData.value.remark ?? undefined,
  }
}

/** 保存房东租约 */
async function handleSaveLease() {
  leaseSaving.value = true
  try {
    if (leaseData.value) {
      // 更新
      await updateLandlordLease({
        id: leaseData.value.id,
        ...leaseForm.value,
      })
      MessagePlugin.success('房东租约更新成功')
    }
    else {
      // 新增
      await addLandlordLease(leaseForm.value)
      MessagePlugin.success('房东租约添加成功')
    }
    // 刷新数据
    const res = await getLandlordLeaseByRoomId(leaseForm.value.roomId)
    leaseData.value = res
    leaseEditMode.value = false
    // 刷新列表以更新利润
    await fetchData()
  }
  catch (e: any) {
    MessagePlugin.error(e.message || '操作失败')
  }
  finally {
    leaseSaving.value = false
  }
}

/** 删除房东租约确认 */
function handleDeleteLeaseConfirm() {
  deleteLeaseConfirmVisible.value = true
}

/** 删除房东租约 */
async function handleDeleteLease() {
  if (!leaseData.value)
    return
  try {
    await removeLandlordLease(leaseData.value.id)
    MessagePlugin.success('房东租约已删除')
    leaseData.value = null
    leaseEditMode.value = false
    deleteLeaseConfirmVisible.value = false
    // 刷新列表
    await fetchData()
  }
  catch (e: any) {
    MessagePlugin.error(e.message || '删除失败')
  }
}
```

- [ ] **Step 4: 操作列新增"房东租约"按钮**

在表格模板的操作列中，在"编辑"按钮之前（或之后）新增按钮。需要确保 `handleOpenLease` 方法中能获取到当前行的 `id`。

注意：当前 `index.vue` 的操作列使用的是 slot，需要在按钮区域新增一个按钮。在现有的编辑按钮附近添加：

```html
<t-button variant="text" size="small" @click="handleOpenLease(row)">
  房东租约
</t-button>
```

同时需要在 `handleOpenLease` 中记录当前行的 roomId。修改 `handleOpenLease` 方法开头：

```typescript
leaseForm.value.roomId = row.id
```

- [ ] **Step 5: 新增抽屉模板**

在 `</template>` 之前添加抽屉组件：

```html
<!-- 房东租约抽屉 -->
<t-drawer
  v-model:visible="leaseDrawerVisible"
  :header="`房东租约 - ${leaseRoomInfo}`"
  size="500px"
  :destroy-on-close="true"
>
  <t-loading v-if="leaseLoading" />

  <template v-else-if="leaseEditMode">
    <!-- 表单模式 -->
    <t-form :data="leaseForm" label-align="top" :disabled="leaseSaving">
      <t-form-item label="房东姓名" name="landlordName">
        <t-input v-model="leaseForm.landlordName" placeholder="请输入房东姓名" />
      </t-form-item>

      <t-form-item label="联系电话" name="landlordPhone">
        <t-input v-model="leaseForm.landlordPhone" placeholder="请输入联系电话" />
      </t-form-item>

      <t-form-item label="起租日期" name="startDate">
        <t-date-picker v-model="leaseForm.startDate" clearable style="width: 100%" />
      </t-form-item>

      <t-form-item label="到期日期" name="endDate">
        <t-date-picker v-model="leaseForm.endDate" clearable placeholder="留空表示无固定期限" style="width: 100%" />
      </t-form-item>

      <t-form-item label="月租金（元）" name="monthlyRent">
        <t-input-number v-model="leaseForm.monthlyRent" :min="0.01" :max="999999" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="付款方式" name="paymentMethod">
        <t-select v-model="leaseForm.paymentMethod">
          <t-option v-for="(label, value) in PaymentMethodText" :key="value" :value="Number(value)" :label="label" />
        </t-select>
      </t-form-item>

      <t-form-item label="押金月数" name="depositMonths">
        <t-input-number v-model="leaseForm.depositMonths" :min="0" :max="36" style="width: 100%" />
      </t-form-item>

      <t-divider>费用信息</t-divider>

      <t-form-item label="水费单价（元/吨）" name="waterPrice">
        <t-input-number v-model="leaseForm.waterPrice" :min="0.01" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="电费单价（元/度）" name="electricPrice">
        <t-input-number v-model="leaseForm.electricPrice" :min="0.01" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="电梯费（元/月）" name="elevatorFee">
        <t-input-number v-model="leaseForm.elevatorFee" :min="0" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="物业费（元/月）" name="propertyFee">
        <t-input-number v-model="leaseForm.propertyFee" :min="0" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="网络费（元/月）" name="internetFee">
        <t-input-number v-model="leaseForm.internetFee" :min="0" :decimal-places="2" style="width: 100%" />
      </t-form-item>

      <t-form-item label="其他费用" name="otherFees">
        <t-textarea v-model="leaseForm.otherFees" placeholder="请描述其他费用" :maxlength="500" />
      </t-form-item>

      <t-form-item label="备注" name="remark">
        <t-textarea v-model="leaseForm.remark" placeholder="请输入备注" :maxlength="500" />
      </t-form-item>
    </t-form>

    <div class="lease-drawer-footer">
      <t-button theme="default" @click="leaseEditMode = false">取消</t-button>
      <t-button theme="primary" :loading="leaseSaving" @click="handleSaveLease">保存</t-button>
    </div>
  </template>

  <template v-else-if="leaseData">
    <!-- 展示模式 -->
    <div class="lease-detail">
      <div class="lease-detail-header">
        <h3>租约信息</h3>
        <div>
          <t-button variant="text" size="small" @click="handleEditLease">编辑</t-button>
          <t-button variant="text" size="small" theme="danger" @click="handleDeleteLeaseConfirm">删除</t-button>
        </div>
      </div>

      <t-descriptions :column="1" bordered>
        <t-descriptions-item label="房东姓名">{{ leaseData.landlordName }}</t-descriptions-item>
        <t-descriptions-item label="联系电话">{{ leaseData.landlordPhone || '-' }}</t-descriptions-item>
        <t-descriptions-item label="起租日期">{{ leaseData.startDate }}</t-descriptions-item>
        <t-descriptions-item label="到期日期">{{ leaseData.endDate || '无固定期限' }}</t-descriptions-item>
        <t-descriptions-item label="月租金">
          <span class="price">¥{{ leaseData.monthlyRent.toFixed(2) }}</span>
        </t-descriptions-item>
        <t-descriptions-item label="付款方式">{{ PaymentMethodText[leaseData.paymentMethod] }}</t-descriptions-item>
        <t-descriptions-item label="押金月数">{{ leaseData.depositMonths ? `${leaseData.depositMonths}个月` : '-' }}</t-descriptions-item>
      </t-descriptions>

      <h3 style="margin-top: 16px">费用信息</h3>
      <t-descriptions :column="1" bordered>
        <t-descriptions-item label="水费单价">{{ leaseData.waterPrice ? `¥${leaseData.waterPrice.toFixed(2)}/吨` : '-' }}</t-descriptions-item>
        <t-descriptions-item label="电费单价">{{ leaseData.electricPrice ? `¥${leaseData.electricPrice.toFixed(2)}/度` : '-' }}</t-descriptions-item>
        <t-descriptions-item label="电梯费">{{ leaseData.elevatorFee ? `¥${leaseData.elevatorFee.toFixed(2)}/月` : '-' }}</t-descriptions-item>
        <t-descriptions-item label="物业费">{{ leaseData.propertyFee ? `¥${leaseData.propertyFee.toFixed(2)}/月` : '-' }}</t-descriptions-item>
        <t-descriptions-item label="网络费">{{ leaseData.internetFee ? `¥${leaseData.internetFee.toFixed(2)}/月` : '-' }}</t-descriptions-item>
        <t-descriptions-item label="其他费用">{{ leaseData.otherFees || '-' }}</t-descriptions-item>
      </t-descriptions>

      <template v-if="leaseData.remark">
        <h3 style="margin-top: 16px">备注</h3>
        <p style="color: var(--td-text-color-secondary); line-height: 1.6; white-space: pre-wrap">{{ leaseData.remark }}</p>
      </template>
    </div>
  </template>

  <template v-else>
    <!-- 无租约 -->
    <t-empty description="暂无房东租约信息">
      <t-button theme="primary" @click="handleAddLease">添加房东租约</t-button>
    </t-empty>
  </template>
</t-drawer>

<!-- 删除确认对话框 -->
<t-dialog
  v-model:visible="deleteLeaseConfirmVisible"
  header="确认删除"
  body="确定要删除该房东租约吗？删除后利润将按成本为 0 计算。"
  :confirm-btn="{ theme: 'danger', content: '删除' }"
  @confirm="handleDeleteLease"
/>
```

- [ ] **Step 6: 新增抽屉样式**

在 `<style>` 中新增：

```css
.lease-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--td-component-border);
  margin-top: 16px;
}

.lease-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: 500;
}
```

- [ ] **Step 7: 构建验证**

Run: `cd Hans && npm run build`
Expected: BUILD SUCCEEDED

- [ ] **Step 8: 提交**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间列表页新增房东租约抽屉（展示/编辑/删除）"
```

---

### Task 9: 前端房间详情页改造

**Files:**
- Modify: `Hans/src/pages/housing/room/detail.vue`

- [ ] **Step 1: 新增 import**

```typescript
import { PaymentMethodText } from '@/api/model/landlordLeaseModel'
```

- [ ] **Step 2: 重构价格信息卡片**

将现有的"价格信息"卡片改为只保留出租价和押金，移除成本价、水费、电费、利润：

```html
<!-- 价格信息卡片 -->
<t-card class="info-card" title="价格信息" :bordered="false">
  <t-descriptions :column="3" bordered>
    <t-descriptions-item label="出租价">
      <span class="price">¥{{ roomDetail.rentPrice?.toFixed(2) ?? '-' }}</span>
    </t-descriptions-item>
    <t-descriptions-item label="押金">
      {{ roomDetail.deposit ? `¥${roomDetail.deposit.toFixed(2)}` : '-' }}
    </t-descriptions-item>
  </t-descriptions>
</t-card>
```

- [ ] **Step 3: 新增房东租约卡片**

在备注卡片之后，当前租客卡片之前新增：

```html
<!-- 房东租约卡片 -->
<t-card class="info-card" title="房东租约" :bordered="false" data-testid="landlord-lease-card">
  <template v-if="roomDetail.landlordLease">
    <t-descriptions :column="3" bordered>
      <t-descriptions-item label="房东姓名">
        {{ roomDetail.landlordLease.landlordName }}
      </t-descriptions-item>
      <t-descriptions-item label="联系电话">
        {{ roomDetail.landlordLease.landlordPhone || '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="月租金">
        <span class="price">¥{{ roomDetail.landlordLease.monthlyRent.toFixed(2) }}</span>
      </t-descriptions-item>
      <t-descriptions-item label="起租日期">
        {{ roomDetail.landlordLease.startDate }}
      </t-descriptions-item>
      <t-descriptions-item label="到期日期">
        {{ roomDetail.landlordLease.endDate || '无固定期限' }}
      </t-descriptions-item>
      <t-descriptions-item label="付款方式">
        {{ PaymentMethodText[roomDetail.landlordLease.paymentMethod] }}
      </t-descriptions-item>
      <t-descriptions-item label="押金月数">
        {{ roomDetail.landlordLease.depositMonths ? `${roomDetail.landlordLease.depositMonths}个月` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="利润">
        <span class="price" :class="[(roomDetail.rentPrice - roomDetail.landlordLease.monthlyRent) >= 0 ? 'profit-positive' : 'profit-negative']">
          ¥{{ (roomDetail.rentPrice - roomDetail.landlordLease.monthlyRent).toFixed(2) }}
        </span>
      </t-descriptions-item>
    </t-descriptions>

    <t-descriptions :column="3" bordered style="margin-top: 8px">
      <t-descriptions-item label="水费单价">
        {{ roomDetail.landlordLease.waterPrice ? `¥${roomDetail.landlordLease.waterPrice.toFixed(2)}/吨` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="电费单价">
        {{ roomDetail.landlordLease.electricPrice ? `¥${roomDetail.landlordLease.electricPrice.toFixed(2)}/度` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="电梯费">
        {{ roomDetail.landlordLease.elevatorFee ? `¥${roomDetail.landlordLease.elevatorFee.toFixed(2)}/月` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="物业费">
        {{ roomDetail.landlordLease.propertyFee ? `¥${roomDetail.landlordLease.propertyFee.toFixed(2)}/月` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="网络费">
        {{ roomDetail.landlordLease.internetFee ? `¥${roomDetail.landlordLease.internetFee.toFixed(2)}/月` : '-' }}
      </t-descriptions-item>
      <t-descriptions-item label="其他费用">
        {{ roomDetail.landlordLease.otherFees || '-' }}
      </t-descriptions-item>
    </t-descriptions>

    <p v-if="roomDetail.landlordLease.remark" style="margin-top: 8px; color: var(--td-text-color-secondary); line-height: 1.6; white-space: pre-wrap">
      {{ roomDetail.landlordLease.remark }}
    </p>
  </template>
  <t-empty v-else description="暂无房东租约信息，请在房间列表页添加" />
</t-card>
```

- [ ] **Step 4: 构建验证**

Run: `cd Hans && npm run build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add Hans/src/pages/housing/room/detail.vue
git commit -m "feat: 房间详情页新增房东租约卡片，移除废弃字段"
```

---

### Task 10: 端到端验证

**Files:**
- Test: 手动验证

- [ ] **Step 1: 启动后端**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`
Expected: 服务启动在 localhost:5000

- [ ] **Step 2: 启动前端**

Run: `cd Hans && npm run dev`
Expected: 开发服务器启动在 localhost:3002

- [ ] **Step 3: 验证后端 API**

使用浏览器或 curl 测试：
1. `GET /api/landlord-lease/room/1` — 应返回 null 或租约数据
2. `POST /api/landlord-lease/add` — 创建一条租约
3. `PUT /api/landlord-lease/edit` — 更新租约
4. `DELETE /api/landlord-lease/remove/{id}` — 删除租约

- [ ] **Step 4: 验证前端交互**

1. 打开房间列表页
2. 点击某行的"房东租约"按钮，确认抽屉打开
3. 无租约时显示空状态，点击"添加房东租约"
4. 填写表单并保存，确认数据正确
5. 再次打开，确认展示模式显示完整信息
6. 点击编辑，修改并保存
7. 点击删除，确认删除成功

- [ ] **Step 5: 提交验证通过**

```bash
git commit --allow-empty -m "chore: 房东租约管理功能端到端验证通过"
```
