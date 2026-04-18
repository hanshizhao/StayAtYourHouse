# 老赖管理功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现欠款管理模块，支持多笔欠款录入、分次还款追踪、还款历史查看。

**Architecture:** 后端采用 Furion 框架标准分层（Entity → Service → AppService），新增 `Debt` 和 `DebtRepayment` 两张表，通过聚合计算已还金额。前端使用卡片布局展示欠款列表，弹窗处理还款和详情。

**Tech Stack:** .NET 10 + Furion + EF Core + MySQL | Vue 3 + TypeScript + TDesign

**Design Spec:** `docs/superpowers/specs/2026-04-18-debt-management-design.md`

---

## File Map

### Backend — 新建

| 文件 | 职责 |
|------|------|
| `Gentle.Core/Enums/DebtStatus.cs` | 欠款状态枚举 |
| `Gentle.Core/Enums/PaymentChannel.cs` | 还款渠道枚举 |
| `Gentle.Core/Entities/Debt.cs` | 欠款实体 |
| `Gentle.Core/Entities/DebtRepayment.cs` | 还款记录实体 |
| `Gentle.Application/Dtos/Debt/DebtDetailDto.cs` | 欠款详情输出（含计算字段） |
| `Gentle.Application/Dtos/Debt/DebtListResult.cs` | 分页列表结果 |
| `Gentle.Application/Dtos/Debt/CreateDebtInput.cs` | 新增欠款输入 |
| `Gentle.Application/Dtos/Debt/UpdateDebtInput.cs` | 修改欠款输入 |
| `Gentle.Application/Dtos/Debt/AddRepaymentInput.cs` | 新增还款输入 |
| `Gentle.Application/Dtos/Debt/DebtRepaymentDto.cs` | 还款记录输出 |
| `Gentle.Application/Services/IDebtService.cs` | 服务接口 |
| `Gentle.Application/Services/DebtService.cs` | 服务实现 |
| `Gentle.Application/Apps/DebtAppService.cs` | API 控制器 |

### Frontend — 新建

| 文件 | 职责 |
|------|------|
| `Hans/src/api/model/debtModel.ts` | TypeScript 类型定义 |
| `Hans/src/api/debt.ts` | API 调用函数 |
| `Hans/src/router/modules/debt.ts` | 路由配置 |
| `Hans/src/pages/debt/index.vue` | 主列表页（含卡片和弹窗） |

### Database — 迁移

| 文件 | 职责 |
|------|------|
| EF Core Migration | 创建 `debt` 和 `debt_repayment` 表 |

---

## Task 1: 后端枚举

**Files:**
- Create: `Gentle.Core/Enums/DebtStatus.cs`
- Create: `Gentle.Core/Enums/PaymentChannel.cs`

- [ ] **Step 1: 创建 DebtStatus 枚举**

```csharp
// Gentle.Core/Enums/DebtStatus.cs
namespace Gentle.Core.Enums;

/// <summary>
/// 欠款状态
/// </summary>
public enum DebtStatus
{
    /// <summary>
    /// 进行中
    /// </summary>
    Ongoing = 0,

    /// <summary>
    /// 已还清
    /// </summary>
    Settled = 1
}
```

- [ ] **Step 2: 创建 PaymentChannel 枚举**

```csharp
// Gentle.Core/Enums/PaymentChannel.cs
namespace Gentle.Core.Enums;

/// <summary>
/// 还款渠道
/// </summary>
public enum PaymentChannel
{
    /// <summary>
    /// 现金
    /// </summary>
    Cash = 0,

    /// <summary>
    /// 微信
    /// </summary>
    WeChat = 1,

    /// <summary>
    /// 支付宝
    /// </summary>
    Alipay = 2,

    /// <summary>
    /// 银行转账
    /// </summary>
    BankTransfer = 3
}
```

- [ ] **Step 3: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle.Core/Enums/DebtStatus.cs Gentle.Core/Enums/PaymentChannel.cs
git commit -m "feat: 新增 DebtStatus 和 PaymentChannel 枚举"
```

---

## Task 2: 后端实体

**Files:**
- Create: `Gentle.Core/Entities/Debt.cs`
- Create: `Gentle.Core/Entities/DebtRepayment.cs`

- [ ] **Step 1: 创建 Debt 实体**

参考 `MaintenanceRecord.cs` 的模式：继承 `Entity<int>`，`[Table]`、`[Index]`、DataAnnotations。

```csharp
// Gentle.Core/Entities/Debt.cs
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 欠款记录实体
/// </summary>
[Table("debt")]
[Index(nameof(TenantId))]
public class Debt : Entity<int>
{
    /// <summary>
    /// 租客ID
    /// </summary>
    [Required(ErrorMessage = "租客ID不能为空")]
    public int TenantId { get; set; }

    /// <summary>
    /// 租客导航属性
    /// </summary>
    public Tenant Tenant { get; set; } = null!;

    /// <summary>
    /// 总欠款金额
    /// </summary>
    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 欠款状态
    /// </summary>
    public DebtStatus Status { get; set; } = DebtStatus.Ongoing;

    /// <summary>
    /// 欠款说明
    /// </summary>
    [MaxLength(500, ErrorMessage = "欠款说明长度不能超过500个字符")]
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 还款记录导航属性
    /// </summary>
    public ICollection<DebtRepayment> Repayments { get; set; } = [];
}
```

- [ ] **Step 2: 创建 DebtRepayment 实体**

```csharp
// Gentle.Core/Entities/DebtRepayment.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 还款记录实体
/// </summary>
[Table("debt_repayment")]
[Index(nameof(DebtId))]
public class DebtRepayment : Entity<int>
{
    /// <summary>
    /// 欠款ID
    /// </summary>
    [Required(ErrorMessage = "欠款ID不能为空")]
    public int DebtId { get; set; }

    /// <summary>
    /// 欠款导航属性
    /// </summary>
    public Debt Debt { get; set; } = null!;

    /// <summary>
    /// 还款金额
    /// </summary>
    [Required(ErrorMessage = "还款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// 还款日期
    /// </summary>
    [Required(ErrorMessage = "还款日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// 还款渠道
    /// </summary>
    public PaymentChannel PaymentChannel { get; set; } = PaymentChannel.Cash;

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
```

- [ ] **Step 3: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle.Core/Entities/Debt.cs Gentle.Core/Entities/DebtRepayment.cs
git commit -m "feat: 新增 Debt 和 DebtRepayment 实体"
```

---

## Task 3: 后端 DTO

**Files:**
- Create: `Gentle.Application/Dtos/Debt/DebtRepaymentDto.cs`
- Create: `Gentle.Application/Dtos/Debt/DebtDetailDto.cs`
- Create: `Gentle.Application/Dtos/Debt/DebtListResult.cs`
- Create: `Gentle.Application/Dtos/Debt/CreateDebtInput.cs`
- Create: `Gentle.Application/Dtos/Debt/UpdateDebtInput.cs`
- Create: `Gentle.Application/Dtos/Debt/AddRepaymentInput.cs`

- [ ] **Step 1: 创建 DebtRepaymentDto**

```csharp
// Gentle.Application/Dtos/Debt/DebtRepaymentDto.cs
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 还款记录 DTO
/// </summary>
public class DebtRepaymentDto
{
    public int Id { get; set; }
    public int DebtId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentChannel PaymentChannel { get; set; }

    public string PaymentChannelText => PaymentChannel switch
    {
        PaymentChannel.Cash => "现金",
        PaymentChannel.WeChat => "微信",
        PaymentChannel.Alipay => "支付宝",
        PaymentChannel.BankTransfer => "银行转账",
        _ => "未知"
    };

    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
}
```

- [ ] **Step 2: 创建 DebtDetailDto**

```csharp
// Gentle.Application/Dtos/Debt/DebtDetailDto.cs
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 欠款详情 DTO
/// </summary>
public class DebtDetailDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string? TenantPhone { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DebtStatus Status { get; set; }

    public string StatusText => Status switch
    {
        DebtStatus.Ongoing => "进行中",
        DebtStatus.Settled => "已还清",
        _ => "未知"
    };

    public string? Description { get; set; }
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
    public List<DebtRepaymentDto> Repayments { get; set; } = [];
}
```

- [ ] **Step 3: 创建 DebtListResult**

```csharp
// Gentle.Application/Dtos/Debt/DebtListResult.cs
namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 欠款列表结果
/// </summary>
public class DebtListResult
{
    public List<DebtDetailDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
```

- [ ] **Step 4: 创建 CreateDebtInput**

```csharp
// Gentle.Application/Dtos/Debt/CreateDebtInput.cs
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 新增欠款输入
/// </summary>
public class CreateDebtInput
{
    [Required(ErrorMessage = "租客ID不能为空")]
    public int TenantId { get; set; }

    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500, ErrorMessage = "欠款说明长度不能超过500个字符")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
```

- [ ] **Step 5: 创建 UpdateDebtInput**

```csharp
// Gentle.Application/Dtos/Debt/UpdateDebtInput.cs
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 修改欠款输入
/// </summary>
public class UpdateDebtInput
{
    [Required(ErrorMessage = "欠款ID不能为空")]
    public int Id { get; set; }

    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500, ErrorMessage = "欠款说明长度不能超过500个字符")]
    public string? Description { get; set; }

    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
```

- [ ] **Step 6: 创建 AddRepaymentInput**

```csharp
// Gentle.Application/Dtos/Debt/AddRepaymentInput.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 新增还款输入
/// </summary>
public class AddRepaymentInput
{
    [Required(ErrorMessage = "还款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "还款日期不能为空")]
    public DateTime PaymentDate { get; set; }

    public PaymentChannel PaymentChannel { get; set; } = PaymentChannel.Cash;

    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
```

- [ ] **Step 7: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 8: Commit**

```bash
git add Gentle.Application/Dtos/Debt/
git commit -m "feat: 新增欠款管理 DTO"
```

---

## Task 4: 后端服务层

**Files:**
- Create: `Gentle.Application/Services/IDebtService.cs`
- Create: `Gentle.Application/Services/DebtService.cs`

- [ ] **Step 1: 创建 IDebtService 接口**

```csharp
// Gentle.Application/Services/IDebtService.cs
using Gentle.Application.Dtos.Debt;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款管理服务接口
/// </summary>
public interface IDebtService : ITransient
{
    Task<(List<DebtDetailDto> Items, int Total)> GetListAsync(
        DebtStatus? status = null,
        string? tenantName = null,
        int page = 1,
        int pageSize = 20);

    Task<DebtDetailDto> GetByIdAsync(int id);

    Task<DebtDetailDto> CreateAsync(CreateDebtInput input);

    Task<DebtDetailDto> UpdateAsync(UpdateDebtInput input);

    Task DeleteAsync(int id);

    Task<DebtDetailDto> AddRepaymentAsync(int debtId, AddRepaymentInput input);

    Task DeleteRepaymentAsync(int repaymentId);
}
```

- [ ] **Step 2: 创建 DebtService 实现**

```csharp
// Gentle.Application/Services/DebtService.cs
using Gentle.Application.Dtos.Debt;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款管理服务实现
/// </summary>
public class DebtService : IDebtService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly IRepository<Debt> _debtRepository;
    private readonly IRepository<DebtRepayment> _repaymentRepository;
    private readonly IRepository<Tenant> _tenantRepository;

    public DebtService(
        IRepository<Debt> debtRepository,
        IRepository<DebtRepayment> repaymentRepository,
        IRepository<Tenant> tenantRepository)
    {
        _debtRepository = debtRepository;
        _repaymentRepository = repaymentRepository;
        _tenantRepository = tenantRepository;
    }

    public async Task<(List<DebtDetailDto> Items, int Total)> GetListAsync(
        DebtStatus? status = null,
        string? tenantName = null,
        int page = 1,
        int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > MaxPageSize) pageSize = DefaultPageSize;

        var query = _debtRepository
            .AsQueryable(false)
            .Include(d => d.Tenant)
            .Include(d => d.Repayments)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(tenantName))
            query = query.Where(d => d.Tenant.Name.Contains(tenantName));

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(d => d.CreatedTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToDto).ToList();
        return (dtos, total);
    }

    public async Task<DebtDetailDto> GetByIdAsync(int id)
    {
        var debt = await _debtRepository
            .AsQueryable(false)
            .Include(d => d.Tenant)
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (debt == null)
            throw Oops.Oh($"欠款记录 {id} 不存在");

        return MapToDto(debt);
    }

    public async Task<DebtDetailDto> CreateAsync(CreateDebtInput input)
    {
        var tenant = await _tenantRepository
            .AsQueryable(false)
            .FirstOrDefaultAsync(t => t.Id == input.TenantId);

        if (tenant == null)
            throw Oops.Oh($"租客 {input.TenantId} 不存在");

        var entity = input.Adapt<Debt>();
        entity.CreatedTime = DateTimeOffset.Now;

        await _debtRepository.InsertAsync(entity);
        await _debtRepository.SaveNowAsync();

        return await GetByIdAsync(entity.Id);
    }

    public async Task<DebtDetailDto> UpdateAsync(UpdateDebtInput input)
    {
        var debt = await _debtRepository
            .AsQueryable()
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == input.Id);

        if (debt == null)
            throw Oops.Oh($"欠款记录 {input.Id} 不存在");

        if (debt.Status == DebtStatus.Settled)
        {
            var paidAmount = debt.Repayments.Sum(r => r.Amount);
            if (input.TotalAmount < paidAmount)
                throw Oops.Oh($"已还清的欠款，修改后金额不能小于已还金额 ¥{paidAmount:F2}");
        }

        debt.TotalAmount = input.TotalAmount;
        debt.Description = input.Description;
        debt.Remark = input.Remark;

        await _debtRepository.UpdateAsync(debt);
        await _debtRepository.SaveNowAsync();

        return await GetByIdAsync(debt.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var debt = await _debtRepository
            .AsQueryable()
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (debt == null)
            throw Oops.Oh($"欠款记录 {id} 不存在");

        if (debt.Repayments.Count > 0)
            throw Oops.Oh("该欠款已有还款记录，无法删除");

        await _debtRepository.DeleteAsync(debt);
        await _debtRepository.SaveNowAsync();
    }

    public async Task<DebtDetailDto> AddRepaymentAsync(int debtId, AddRepaymentInput input)
    {
        var debt = await _debtRepository
            .AsQueryable()
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == debtId);

        if (debt == null)
            throw Oops.Oh($"欠款记录 {debtId} 不存在");

        var paidAmount = debt.Repayments.Sum(r => r.Amount);
        var remaining = debt.TotalAmount - paidAmount;

        if (input.Amount > remaining)
            throw Oops.Oh($"还款金额不能超过剩余欠款 ¥{remaining:F2}");

        var repayment = input.Adapt<DebtRepayment>();
        repayment.DebtId = debtId;
        repayment.CreatedTime = DateTimeOffset.Now;

        await _repaymentRepository.InsertAsync(repayment);
        await _repaymentRepository.SaveNowAsync();

        // 重新计算是否还清
        var newPaidAmount = paidAmount + input.Amount;
        if (newPaidAmount >= debt.TotalAmount)
        {
            debt.Status = DebtStatus.Settled;
            await _debtRepository.UpdateAsync(debt);
            await _debtRepository.SaveNowAsync();
        }

        return await GetByIdAsync(debtId);
    }

    public async Task DeleteRepaymentAsync(int repaymentId)
    {
        var repayment = await _repaymentRepository
            .AsQueryable()
            .FirstOrDefaultAsync(r => r.Id == repaymentId);

        if (repayment == null)
            throw Oops.Oh($"还款记录 {repaymentId} 不存在");

        var debt = await _debtRepository
            .AsQueryable()
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == repayment.DebtId);

        if (debt != null && debt.Status == DebtStatus.Settled)
        {
            debt.Status = DebtStatus.Ongoing;
            await _debtRepository.UpdateAsync(debt);
        }

        await _repaymentRepository.DeleteAsync(repayment);
        await _repaymentRepository.SaveNowAsync();
    }

    private static DebtDetailDto MapToDto(Debt debt)
    {
        var dto = debt.Adapt<DebtDetailDto>();
        dto.TenantName = debt.Tenant?.Name ?? "未知";
        dto.TenantPhone = debt.Tenant?.Phone;
        dto.PaidAmount = debt.Repayments?.Sum(r => r.Amount) ?? 0;
        dto.RemainingAmount = dto.TotalAmount - dto.PaidAmount;
        dto.Repayments = debt.Repayments?
            .OrderByDescending(r => r.PaymentDate)
            .Select(r => r.Adapt<DebtRepaymentDto>())
            .ToList() ?? [];
        return dto;
    }
}
```

- [ ] **Step 3: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle.Application/Services/IDebtService.cs Gentle.Application/Services/DebtService.cs
git commit -m "feat: 新增欠款管理服务层"
```

---

## Task 5: 后端 AppService

**Files:**
- Create: `Gentle.Application/Apps/DebtAppService.cs`

- [ ] **Step 1: 创建 DebtAppService**

```csharp
// Gentle.Application/Apps/DebtAppService.cs
using System.ComponentModel.DataAnnotations;
using Gentle.Application.Dtos.Debt;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 欠款管理应用服务
/// </summary>
[ApiDescriptionSettings("Debt", Name = "DebtApp", Order = 45)]
[Route("api/debt")]
[Authorize]
public class DebtAppService : IDynamicApiController
{
    private readonly IDebtService _debtService;

    public DebtAppService(IDebtService debtService)
    {
        _debtService = debtService;
    }

    /// <summary>
    /// 获取欠款列表
    /// </summary>
    [HttpGet("list")]
    public async Task<DebtListResult> GetList(
        DebtStatus? status = null,
        string? tenantName = null,
        int page = 1,
        int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var (items, total) = await _debtService.GetListAsync(status, tenantName, page, pageSize);
        return new DebtListResult { Items = items, Total = total, Page = page, PageSize = pageSize };
    }

    /// <summary>
    /// 获取欠款详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<DebtDetailDto> GetById([Range(1, int.MaxValue)] int id)
    {
        return await _debtService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增欠款
    /// </summary>
    [HttpPost("add")]
    public async Task<DebtDetailDto> Add(CreateDebtInput input)
    {
        return await _debtService.CreateAsync(input);
    }

    /// <summary>
    /// 修改欠款
    /// </summary>
    [HttpPut("edit")]
    public async Task<DebtDetailDto> Edit(UpdateDebtInput input)
    {
        return await _debtService.UpdateAsync(input);
    }

    /// <summary>
    /// 删除欠款
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove([Range(1, int.MaxValue)] int id)
    {
        await _debtService.DeleteAsync(id);
    }

    /// <summary>
    /// 新增还款记录
    /// </summary>
    [HttpPost("{id}/repay")]
    public async Task<DebtDetailDto> Repay([Range(1, int.MaxValue)] int id, AddRepaymentInput input)
    {
        return await _debtService.AddRepaymentAsync(id, input);
    }

    /// <summary>
    /// 删除还款记录
    /// </summary>
    [HttpDelete("repay/remove/{id}")]
    public async Task RemoveRepayment([Range(1, int.MaxValue)] int id)
    {
        await _debtService.DeleteRepaymentAsync(id);
    }
}
```

- [ ] **Step 2: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: Commit**

```bash
git add Gentle.Application/Apps/DebtAppService.cs
git commit -m "feat: 新增欠款管理 API 控制器"
```

---

## Task 6: 数据库迁移

**Files:**
- Generated: EF Core migration files

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add AddDebtTables --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: Build succeeded, migration created

- [ ] **Step 2: 检查生成的迁移文件**

确认包含 `CreateTable("debt", ...)` 和 `CreateTable("debt_repayment", ...)`。

- [ ] **Step 3: 应用迁移**

Run: `cd Gentle && dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: Done.

- [ ] **Step 4: Commit**

```bash
git add Gentle.Database.Migrations/
git commit -m "feat: 新增 debt 和 debt_repayment 表迁移"
```

---

## Task 7: 前端 API Model 和 Service

**Files:**
- Create: `Hans/src/api/model/debtModel.ts`
- Create: `Hans/src/api/debt.ts`

- [ ] **Step 1: 创建 debtModel.ts**

```ts
// Hans/src/api/model/debtModel.ts

/**
 * 欠款状态枚举（与后端 Gentle.Core.Enums.DebtStatus 保持一致）
 */
export enum DebtStatus {
  Ongoing = 0,
  Settled = 1,
}

export const DebtStatusText: Record<DebtStatus, string> = {
  [DebtStatus.Ongoing]: '进行中',
  [DebtStatus.Settled]: '已还清',
};

/**
 * 还款渠道枚举（与后端 Gentle.Core.Enums.PaymentChannel 保持一致）
 */
export enum PaymentChannel {
  Cash = 0,
  WeChat = 1,
  Alipay = 2,
  BankTransfer = 3,
}

export const PaymentChannelText: Record<PaymentChannel, string> = {
  [PaymentChannel.Cash]: '现金',
  [PaymentChannel.WeChat]: '微信',
  [PaymentChannel.Alipay]: '支付宝',
  [PaymentChannel.BankTransfer]: '银行转账',
};

/**
 * 还款记录 DTO
 */
export interface DebtRepaymentDto {
  id: number;
  debtId: number;
  amount: number;
  paymentDate: string;
  paymentChannel: PaymentChannel;
  paymentChannelText: string;
  remark?: string;
  createdTime: string;
}

/**
 * 欠款详情 DTO
 */
export interface DebtDetail {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  statusText: string;
  description?: string;
  remark?: string;
  createdTime: string;
  repayments: DebtRepaymentDto[];
}

/**
 * 欠款列表结果
 */
export interface DebtListResult {
  items: DebtDetail[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 新增欠款输入
 */
export interface CreateDebtInput {
  tenantId: number;
  totalAmount: number;
  description?: string;
  remark?: string;
}

/**
 * 修改欠款输入
 */
export interface UpdateDebtInput {
  id: number;
  totalAmount: number;
  description?: string;
  remark?: string;
}

/**
 * 新增还款输入
 */
export interface AddRepaymentInput {
  amount: number;
  paymentDate: string;
  paymentChannel: PaymentChannel;
  remark?: string;
}

/**
 * 欠款列表查询参数
 */
export interface DebtListParams {
  status?: DebtStatus;
  tenantName?: string;
  page?: number;
  pageSize?: number;
}
```

- [ ] **Step 2: 创建 debt.ts**

```ts
// Hans/src/api/debt.ts
import type {
  AddRepaymentInput,
  CreateDebtInput,
  DebtDetail,
  DebtListParams,
  DebtListResult,
  UpdateDebtInput,
} from '@/api/model/debtModel';
import { request } from '@/utils/request';

const Api = {
  List: '/debt/list',
  Detail: '/debt',
  Add: '/debt/add',
  Edit: '/debt/edit',
  Delete: '/debt/remove',
  Repay: '/debt',
  DeleteRepayment: '/debt/repay/remove',
};

export function getDebtList(params?: DebtListParams) {
  return request.get<DebtListResult>({ url: Api.List, params });
}

export function getDebtById(id: number) {
  return request.get<DebtDetail>({ url: `${Api.Detail}/${id}` });
}

export function createDebt(data: CreateDebtInput) {
  return request.post<DebtDetail>({ url: Api.Add, data });
}

export function updateDebt(data: UpdateDebtInput) {
  return request.put<DebtDetail>({ url: Api.Edit, data });
}

export function deleteDebt(id: number) {
  return request.delete<void>({ url: `${Api.Delete}/${id}` });
}

export function addRepayment(id: number, data: AddRepaymentInput) {
  return request.post<DebtDetail>({ url: `${Api.Repay}/${id}/repay`, data });
}

export function deleteRepayment(id: number) {
  return request.delete<void>({ url: `${Api.DeleteRepayment}/${id}` });
}
```

- [ ] **Step 3: 验证构建**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/api/model/debtModel.ts Hans/src/api/debt.ts
git commit -m "feat: 新增欠款管理前端 API 层"
```

---

## Task 8: 前端路由

**Files:**
- Create: `Hans/src/router/modules/debt.ts`

- [ ] **Step 1: 创建路由配置**

路由自动被 `router/index.ts` 的 `import.meta.glob` 发现，无需手动注册。orderNo 设为 3（租客管理=2 之后、水电管理=4 之前）。

```ts
// Hans/src/router/modules/debt.ts
import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/debt',
    name: 'debt',
    component: Layout,
    redirect: '/debt/list',
    meta: { title: { zh_CN: '老赖管理', en_US: 'Debt Management' }, icon: 'wallet', orderNo: 3 },
    children: [
      {
        path: 'list',
        name: 'DebtList',
        component: () => import('@/pages/debt/index.vue'),
        meta: { title: { zh_CN: '欠款列表', en_US: 'Debt List' } },
      },
    ],
  },
];
```

- [ ] **Step 2: 验证开发服务器加载路由**

Run: `cd Hans && npm run dev`
Expected: 左侧菜单出现「老赖管理」，点击进入空白页面不报错

- [ ] **Step 3: Commit**

```bash
git add Hans/src/router/modules/debt.ts
git commit -m "feat: 新增老赖管理路由配置"
```

---

## Task 9: 前端主列表页

**Files:**
- Create: `Hans/src/pages/debt/index.vue`

这是最核心的前端任务，包含卡片列表、筛选栏、以及 3 个弹窗（新增/编辑、还款、详情）。

- [ ] **Step 1: 创建主页面骨架**

创建 `Hans/src/pages/debt/index.vue`，包含完整的 `<template>`、`<script setup lang="ts">`、`<style lang="less" scoped>`。

页面结构：
1. 顶部操作栏：标题「老赖管理」+ 新增欠款按钮
2. 筛选栏：租客姓名搜索输入框 + 状态筛选下拉（全部/进行中/已还清）
3. 卡片网格：每张卡片显示租客姓名、电话、欠款说明、金额进度（已还/总额 + 进度条）、状态标签、操作按钮（还款/详情/编辑/删除）
4. 分页控件

弹窗：
- `DebtFormDialog`：新增/编辑欠款（选择租客、金额、说明、备注）
- `RepayDialog`：还款（金额、日期、还款方式、备注）
- `DebtDetailDialog`：详情（基本信息 + 金额汇总 + 还款记录表格）

关键实现要点：
- 使用 TDesign 的 `t-card`、`t-input`、`t-select`、`t-button`、`t-dialog`、`t-form`、`t-tag`、`t-table`、`t-pagination` 组件
- 卡片布局使用 CSS Grid（`.debt-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }`）
- 进度条使用 `t-progress` 组件
- 金额格式化：`¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` 
- 租客下拉使用 `getTenantList` API 获取选项
- 弹窗内表单使用 `t-form` 的 `:rules` 验证
- `onMounted` + `onActivated` 都调用 `fetchData()`
- 按钮使用 `data-testid` 属性便于 E2E 测试

- [ ] **Step 2: 验证开发服务器渲染**

Run: `cd Hans && npm run dev`
Expected: 页面正常渲染，卡片布局正确，弹窗交互正常

- [ ] **Step 3: 验证构建**

Run: `cd Hans && npm run build`
Expected: BUILD SUCCESS，无类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/debt/
git commit -m "feat: 实现老赖管理前端页面（卡片列表+弹窗）"
```

---

## Task 10: 端到端验证

**Files:**
- Test: `tests/e2e/` (新建测试文件)

- [ ] **Step 1: 启动后端**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`
Expected: 服务器启动成功，Swagger 可访问

- [ ] **Step 2: 启动前端**

Run: `cd Hans && npm run dev`
Expected: 开发服务器运行在 3002 端口

- [ ] **Step 3: 手动验证核心流程**

1. 登录系统
2. 左侧菜单点击「老赖管理」
3. 点击「新增欠款」→ 选择租客 → 输入金额 ¥20,000 → 输入说明 → 提交
4. 卡片列表出现新记录，状态为「进行中」
5. 点击「还款」→ 输入 ¥3,000 → 选择微信 → 提交
6. 点击「详情」→ 确认还款记录已记录，已还金额更新
7. 继续还款直到还清 → 状态变为「已还清」
8. 点击「编辑」→ 修改说明 → 保存
9. 点击「删除」→ 确认无还款记录的欠款可删除

- [ ] **Step 4: Commit (如有修复)**

```bash
git add -A
git commit -m "fix: 端到端验证修复"
```
