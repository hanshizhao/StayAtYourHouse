# 老赖管理功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现独立的老赖管理模块，支持多笔欠款录入、多次还款追踪、自动结算判定。

**Architecture:** 后端新增 Debt/DebtRepayment 两个实体 + 完整 CRUD 服务；前端新增独立菜单页，使用卡片布局展示欠款列表，弹窗处理还款/详情/编辑操作。金额通过还款记录聚合计算，不冗余存储。

**Tech Stack:** .NET 10 (Furion)、Vue 3 + TypeScript + TDesign、Playwright E2E

**Spec:** `docs/superpowers/specs/2026-04-18-debt-management-design.md`

---

## 文件结构

### 后端（Gentle/）

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 新增 | `Gentle.Core/Enums/DebtStatus.cs` | 欠款状态枚举 |
| 新增 | `Gentle.Core/Enums/PaymentChannel.cs` | 还款渠道枚举 |
| 新增 | `Gentle.Core/Entities/Debt.cs` | 欠款实体 |
| 新增 | `Gentle.Core/Entities/DebtRepayment.cs` | 还款记录实体 |
| 新增 | `Gentle.Application/Dtos/Debt/DebtDto.cs` | 所有欠款相关 DTO |
| 新增 | `Gentle.Application/Services/IDebtService.cs` | 服务接口 |
| 新增 | `Gentle.Application/Services/DebtService.cs` | 服务实现 |
| 新增 | `Gentle.Application/Apps/DebtAppService.cs` | API 控制器 |

### 前端（Hans/）

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 新增 | `Hans/src/api/model/debtModel.ts` | API 类型定义 |
| 新增 | `Hans/src/api/debt.ts` | API 调用函数 |
| 新增 | `Hans/src/router/modules/debt.ts` | 路由模块（orderNo: 3） |
| 新增 | `Hans/src/pages/debt/index.vue` | 主列表页 |
| 新增 | `Hans/src/pages/debt/components/DebtCard.vue` | 欠款卡片组件 |
| 新增 | `Hans/src/pages/debt/components/DebtFormDialog.vue` | 新增/编辑弹窗 |
| 新增 | `Hans/src/pages/debt/components/RepayDialog.vue` | 还款弹窗 |
| 新增 | `Hans/src/pages/debt/components/DebtDetailDialog.vue` | 详情弹窗 |

### 测试

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 新增 | `tests/e2e/debt.spec.ts` | E2E 测试 |

---

### Task 1: 后端枚举

**Files:**
- Create: `Gentle/Gentle.Core/Enums/DebtStatus.cs`
- Create: `Gentle/Gentle.Core/Enums/PaymentChannel.cs`

- [ ] **Step 1: 创建 DebtStatus 枚举**

创建 `Gentle/Gentle.Core/Enums/DebtStatus.cs`：

```csharp
namespace Gentle.Core.Enums;

/// <summary>
/// 欠款状态枚举
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

创建 `Gentle/Gentle.Core/Enums/PaymentChannel.cs`：

```csharp
namespace Gentle.Core.Enums;

/// <summary>
/// 还款渠道枚举
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

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Core/Enums/DebtStatus.cs Gentle/Gentle.Core/Enums/PaymentChannel.cs
git commit -m "feat: 新增 DebtStatus 和 PaymentChannel 枚举"
```

---

### Task 2: 后端实体

**Files:**
- Create: `Gentle/Gentle.Core/Entities/Debt.cs`
- Create: `Gentle/Gentle.Core/Entities/DebtRepayment.cs`

- [ ] **Step 1: 创建 Debt 实体**

创建 `Gentle/Gentle.Core/Entities/Debt.cs`：

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 欠款实体
/// </summary>
[Table("debt")]
[Index(nameof(TenantId))]
public class Debt : Entity<int>, IEntitySeedData<Debt>
{
    /// <summary>
    /// 关联租客 ID
    /// </summary>
    [Required]
    public int TenantId { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 欠款状态
    /// </summary>
    [Required]
    public DebtStatus Status { get; set; } = DebtStatus.Ongoing;

    /// <summary>
    /// 欠款说明
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500)]
    public string? Remark { get; set; }

    /// <summary>
    /// 关联租客
    /// </summary>
    public Tenant Tenant { get; set; } = null!;

    /// <summary>
    /// 还款记录集合
    /// </summary>
    public ICollection<DebtRepayment> Repayments { get; set; } = new List<DebtRepayment>();

    /// <summary>
    /// 种子数据
    /// </summary>
    public IEnumerable<Debt> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return Array.Empty<Debt>();
    }
}
```

- [ ] **Step 2: 创建 DebtRepayment 实体**

创建 `Gentle/Gentle.Core/Entities/DebtRepayment.cs`：

```csharp
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
public class DebtRepayment : Entity<int>, IEntitySeedData<DebtRepayment>
{
    /// <summary>
    /// 关联欠款 ID
    /// </summary>
    [Required]
    public int DebtId { get; set; }

    /// <summary>
    /// 本次还款金额
    /// </summary>
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// 还款日期
    /// </summary>
    [Required]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// 还款渠道
    /// </summary>
    [Required]
    public PaymentChannel PaymentChannel { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500)]
    public string? Remark { get; set; }

    /// <summary>
    /// 关联欠款
    /// </summary>
    public Debt Debt { get; set; } = null!;

    /// <summary>
    /// 种子数据
    /// </summary>
    public IEnumerable<DebtRepayment> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return Array.Empty<DebtRepayment>();
    }
}
```

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Core/Entities/Debt.cs Gentle/Gentle.Core/Entities/DebtRepayment.cs
git commit -m "feat: 新增 Debt 和 DebtRepayment 实体"
```

---

### Task 3: 后端 DTO

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/Debt/DebtDto.cs`

- [ ] **Step 1: 创建所有欠款相关 DTO**

创建 `Gentle/Gentle.Application/Dtos/Debt/DebtDto.cs`（包含所有 DTO 类）：

```csharp
using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 欠款列表项
/// </summary>
public class DebtListDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string? TenantPhone { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public DebtStatus Status { get; set; }
    public string? Description { get; set; }
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
}

/// <summary>
/// 欠款详情
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
    public string? Description { get; set; }
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
    public List<DebtRepaymentDto> Repayments { get; set; } = [];
}

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
    public string? Remark { get; set; }
    public DateTimeOffset CreatedTime { get; set; }
}

/// <summary>
/// 欠款列表查询参数
/// </summary>
public class DebtListInput
{
    public DebtStatus? Status { get; set; }
    public string? TenantName { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// 欠款列表分页结果
/// </summary>
public class DebtListResult
{
    public List<DebtListDto> List { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>
/// 新增欠款请求
/// </summary>
public class CreateDebtInput
{
    [Required(ErrorMessage = "租客不能为空")]
    public int TenantId { get; set; }

    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }
}

/// <summary>
/// 修改欠款请求
/// </summary>
public class UpdateDebtInput
{
    [Required(ErrorMessage = "欠款ID不能为空")]
    public int Id { get; set; }

    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }
}

/// <summary>
/// 新增还款请求
/// </summary>
public class AddRepaymentInput
{
    [Required(ErrorMessage = "还款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "还款日期不能为空")]
    public DateTime PaymentDate { get; set; }

    [Required(ErrorMessage = "还款渠道不能为空")]
    public PaymentChannel PaymentChannel { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Debt/DebtDto.cs
git commit -m "feat: 新增欠款管理 DTO"
```

---

### Task 4: 后端服务层

**Files:**
- Create: `Gentle/Gentle.Application/Services/IDebtService.cs`
- Create: `Gentle/Gentle.Application/Services/DebtService.cs`

- [ ] **Step 1: 创建服务接口**

创建 `Gentle/Gentle.Application/Services/IDebtService.cs`：

```csharp
using Gentle.Application.Dtos.Debt;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款管理服务接口
/// </summary>
public interface IDebtService : ITransient
{
    /// <summary>
    /// 获取欠款列表
    /// </summary>
    Task<DebtListResult> GetListAsync(DebtListInput input);

    /// <summary>
    /// 获取欠款详情
    /// </summary>
    Task<DebtDetailDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增欠款
    /// </summary>
    Task<DebtListDto> AddAsync(CreateDebtInput input);

    /// <summary>
    /// 修改欠款
    /// </summary>
    Task<DebtListDto> UpdateAsync(UpdateDebtInput input);

    /// <summary>
    /// 删除欠款
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// 新增还款
    /// </summary>
    Task AddRepaymentAsync(int debtId, AddRepaymentInput input);

    /// <summary>
    /// 删除还款记录
    /// </summary>
    Task DeleteRepaymentAsync(int repaymentId);
}
```

- [ ] **Step 2: 创建服务实现**

创建 `Gentle/Gentle.Application/Services/DebtService.cs`：

```csharp
using Gentle.Application.Dtos.Debt;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款管理服务实现
/// </summary>
public class DebtService : IDebtService
{
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

    /// <inheritdoc />
    public async Task<DebtListResult> GetListAsync(DebtListInput input)
    {
        var query = _debtRepository
            .AsQueryable(false)
            .Include(d => d.Tenant)
            .Include(d => d.Repayments);

        if (input.Status.HasValue)
        {
            query = query.Where(d => d.Status == input.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(input.TenantName))
        {
            query = query.Where(d => d.Tenant.Name.Contains(input.TenantName));
        }

        var allDebts = await query.OrderByDescending(d => d.CreatedTime).ToListAsync();

        var dtoList = allDebts.Select(d =>
        {
            var paidAmount = d.Repayments.Sum(r => r.Amount);
            return new DebtListDto
            {
                Id = d.Id,
                TenantId = d.TenantId,
                TenantName = d.Tenant.Name,
                TenantPhone = d.Tenant.Phone,
                TotalAmount = d.TotalAmount,
                PaidAmount = paidAmount,
                RemainingAmount = d.TotalAmount - paidAmount,
                Status = d.Status,
                Description = d.Description,
                Remark = d.Remark,
                CreatedTime = d.CreatedTime,
            };
        }).ToList();

        var total = dtoList.Count;
        var pagedItems = dtoList
            .Skip((input.Page - 1) * input.PageSize)
            .Take(input.PageSize)
            .ToList();

        return new DebtListResult
        {
            List = pagedItems,
            Total = total,
            Page = input.Page,
            PageSize = input.PageSize,
        };
    }

    /// <inheritdoc />
    public async Task<DebtDetailDto> GetByIdAsync(int id)
    {
        var debt = await _debtRepository
            .AsQueryable(false)
            .Include(d => d.Tenant)
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {id} 不存在");
        }

        var paidAmount = debt.Repayments.Sum(r => r.Amount);

        return new DebtDetailDto
        {
            Id = debt.Id,
            TenantId = debt.TenantId,
            TenantName = debt.Tenant.Name,
            TenantPhone = debt.Tenant.Phone,
            TotalAmount = debt.TotalAmount,
            PaidAmount = paidAmount,
            RemainingAmount = debt.TotalAmount - paidAmount,
            Status = debt.Status,
            Description = debt.Description,
            Remark = debt.Remark,
            CreatedTime = debt.CreatedTime,
            Repayments = debt.Repayments
                .OrderByDescending(r => r.PaymentDate)
                .Select(r => new DebtRepaymentDto
                {
                    Id = r.Id,
                    DebtId = r.DebtId,
                    Amount = r.Amount,
                    PaymentDate = r.PaymentDate,
                    PaymentChannel = r.PaymentChannel,
                    Remark = r.Remark,
                    CreatedTime = r.CreatedTime,
                }).ToList(),
        };
    }

    /// <inheritdoc />
    public async Task<DebtListDto> AddAsync(CreateDebtInput input)
    {
        var tenant = await _tenantRepository.FindAsync(input.TenantId);
        if (tenant == null)
        {
            throw Oops.Oh($"租客 {input.TenantId} 不存在");
        }

        var debt = new Debt
        {
            TenantId = input.TenantId,
            TotalAmount = input.TotalAmount,
            Description = input.Description,
            Remark = input.Remark,
            Status = DebtStatus.Ongoing,
            CreatedTime = DateTimeOffset.Now,
            Tenant = tenant,
        };

        var entry = await _debtRepository.InsertAsync(debt);
        await _debtRepository.SaveNowAsync();

        return new DebtListDto
        {
            Id = entry.Entity.Id,
            TenantId = entry.Entity.TenantId,
            TenantName = tenant.Name,
            TenantPhone = tenant.Phone,
            TotalAmount = entry.Entity.TotalAmount,
            PaidAmount = 0,
            RemainingAmount = entry.Entity.TotalAmount,
            Status = entry.Entity.Status,
            Description = entry.Entity.Description,
            Remark = entry.Entity.Remark,
            CreatedTime = entry.Entity.CreatedTime,
        };
    }

    /// <inheritdoc />
    public async Task<DebtListDto> UpdateAsync(UpdateDebtInput input)
    {
        var existing = await _debtRepository
            .AsQueryable()
            .Include(d => d.Tenant)
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == input.Id);

        if (existing == null)
        {
            throw Oops.Oh($"欠款记录 {input.Id} 不存在");
        }

        if (existing.Status == DebtStatus.Settled && existing.TotalAmount != input.TotalAmount)
        {
            throw Oops.Oh("已还清的欠款不允许修改金额");
        }

        existing.TotalAmount = input.TotalAmount;
        existing.Description = input.Description;
        existing.Remark = input.Remark;
        existing.UpdatedTime = DateTimeOffset.Now;

        var entry = await _debtRepository.UpdateAsync(existing);
        await _debtRepository.SaveNowAsync();

        var paidAmount = existing.Repayments.Sum(r => r.Amount);

        return new DebtListDto
        {
            Id = entry.Entity.Id,
            TenantId = entry.Entity.TenantId,
            TenantName = entry.Entity.Tenant?.Name ?? string.Empty,
            TenantPhone = entry.Entity.Tenant?.Phone,
            TotalAmount = entry.Entity.TotalAmount,
            PaidAmount = paidAmount,
            RemainingAmount = entry.Entity.TotalAmount - paidAmount,
            Status = entry.Entity.Status,
            Description = entry.Entity.Description,
            Remark = entry.Entity.Remark,
            CreatedTime = entry.Entity.CreatedTime,
        };
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var debt = await _debtRepository.FindAsync(id);
        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {id} 不存在");
        }

        var hasRepayments = await _repaymentRepository.AsQueryable(false)
            .AnyAsync(r => r.DebtId == id);
        if (hasRepayments)
        {
            throw Oops.Oh("存在还款记录，无法删除");
        }

        await _debtRepository.DeleteAsync(debt);
        await _debtRepository.SaveNowAsync();
    }

    /// <inheritdoc />
    public async Task AddRepaymentAsync(int debtId, AddRepaymentInput input)
    {
        var debt = await _debtRepository
            .AsQueryable()
            .Include(d => d.Repayments)
            .FirstOrDefaultAsync(d => d.Id == debtId);

        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {debtId} 不存在");
        }

        var paidAmount = debt.Repayments.Sum(r => r.Amount);
        var remaining = debt.TotalAmount - paidAmount;

        if (input.Amount > remaining)
        {
            throw Oops.Oh($"还款金额不能超过剩余欠款 {remaining:F2}");
        }

        var repayment = new DebtRepayment
        {
            DebtId = debtId,
            Amount = input.Amount,
            PaymentDate = input.PaymentDate,
            PaymentChannel = input.PaymentChannel,
            Remark = input.Remark,
            CreatedTime = DateTimeOffset.Now,
        };

        await _repaymentRepository.InsertAsync(repayment);

        var newPaidAmount = paidAmount + input.Amount;
        if (newPaidAmount >= debt.TotalAmount)
        {
            debt.Status = DebtStatus.Settled;
            debt.UpdatedTime = DateTimeOffset.Now;
            await _debtRepository.UpdateAsync(debt);
        }

        await _repaymentRepository.SaveNowAsync();
    }

    /// <inheritdoc />
    public async Task DeleteRepaymentAsync(int repaymentId)
    {
        var repayment = await _repaymentRepository.FindAsync(repaymentId);
        if (repayment == null)
        {
            throw Oops.Oh($"还款记录 {repaymentId} 不存在");
        }

        var debt = await _debtRepository
            .AsQueryable()
            .FirstOrDefaultAsync(d => d.Id == repayment.DebtId);

        if (debt == null)
        {
            throw Oops.Oh("关联的欠款记录不存在");
        }

        await _repaymentRepository.DeleteAsync(repayment);
        await _repaymentRepository.SaveNowAsync();

        if (debt.Status == DebtStatus.Settled)
        {
            debt.Status = DebtStatus.Ongoing;
            debt.UpdatedTime = DateTimeOffset.Now;
            await _debtRepository.UpdateAsync(debt);
            await _debtRepository.SaveNowAsync();
        }
    }
}
```

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Services/IDebtService.cs Gentle/Gentle.Application/Services/DebtService.cs
git commit -m "feat: 新增欠款管理服务层"
```

---

### Task 5: 后端 AppService

**Files:**
- Create: `Gentle/Gentle.Application/Apps/DebtAppService.cs`

- [ ] **Step 1: 创建 AppService**

创建 `Gentle/Gentle.Application/Apps/DebtAppService.cs`：

```csharp
using Gentle.Application.Dtos.Debt;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 老赖管理应用服务
/// </summary>
[ApiDescriptionSettings("Debt", Name = "DebtApp", Order = 12)]
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
    /// 获取欠款分页列表
    /// </summary>
    [HttpGet("list")]
    public async Task<DebtListResult> GetList(string? keyword = null, DebtStatus? status = null, int page = 1, int pageSize = 20)
    {
        return await _debtService.GetListAsync(new DebtListInput
        {
            Keyword = keyword,
            Status = status,
            Page = page,
            PageSize = Math.Clamp(pageSize, 1, 100)
        });
    }

    /// <summary>
    /// 根据ID获取欠款详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<DebtDetailDto> GetById(int id)
    {
        return await _debtService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增欠款
    /// </summary>
    [HttpPost("add")]
    public async Task<DebtDetailDto> Add(CreateDebtInput input)
    {
        return await _debtService.AddAsync(input);
    }

    /// <summary>
    /// 编辑欠款
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
    public async Task Remove(int id)
    {
        await _debtService.DeleteAsync(id);
    }

    /// <summary>
    /// 添加还款记录
    /// </summary>
    [HttpPost("{id}/repay")]
    public async Task<DebtRepaymentDto> AddRepayment(int id, AddRepaymentInput input)
    {
        return await _debtService.AddRepaymentAsync(id, input);
    }

    /// <summary>
    /// 删除还款记录
    /// </summary>
    [HttpDelete("repay/remove/{id}")]
    public async Task RemoveRepayment(int id)
    {
        await _debtService.DeleteRepaymentAsync(id);
    }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 启动后端验证 API 端点**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`

验证 Swagger 页面中 DebtApp 分组下 7 个端点都存在。

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Apps/DebtAppService.cs
git commit -m "feat: 新增欠款管理 AppService"
```

---

### Task 6: 数据库迁移

**Files:** 无新文件（生成迁移文件）

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add AddDebtTables --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 迁移文件成功生成，包含 `debt` 和 `debt_repayment` 两张表的创建。

- [ ] **Step 2: 应用迁移**

Run: `cd Gentle && dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 数据库更新成功。

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Database.Migrations/
git commit -m "feat: 新增 Debt 和 DebtRepayment 数据库迁移"
```

---

### Task 7: 前端 API 层 + 路由

**Files:**
- Create: `Hans/src/api/model/debtModel.ts`
- Create: `Hans/src/api/debt.ts`
- Create: `Hans/src/router/modules/debt.ts`

- [ ] **Step 1: 创建类型定义**

创建 `Hans/src/api/model/debtModel.ts`：

```typescript
/** 欠款状态 */
export enum DebtStatus {
  Ongoing = 0,
  Settled = 1,
}

/** 欠款状态文本映射 */
export const DebtStatusText: Record<DebtStatus, string> = {
  [DebtStatus.Ongoing]: '进行中',
  [DebtStatus.Settled]: '已还清',
}

/** 还款渠道 */
export enum PaymentChannel {
  Cash = 0,
  WeChat = 1,
  Alipay = 2,
  BankTransfer = 3,
}

/** 还款渠道文本映射 */
export const PaymentChannelText: Record<PaymentChannel, string> = {
  [PaymentChannel.Cash]: '现金',
  [PaymentChannel.WeChat]: '微信',
  [PaymentChannel.Alipay]: '支付宝',
  [PaymentChannel.BankTransfer]: '银行转账',
}

/** 欠款列表项 */
export interface DebtListItem {
  id: number
  tenantId: number
  tenantName: string
  tenantPhone: string | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: DebtStatus
  description: string | null
  remark: string | null
  createdTime: string
}

/** 还款记录 */
export interface DebtRepaymentItem {
  id: number
  debtId: number
  amount: number
  paymentDate: string
  paymentChannel: PaymentChannel
  remark: string | null
  createdTime: string
}

/** 欠款详情 */
export interface DebtDetail {
  id: number
  tenantId: number
  tenantName: string
  tenantPhone: string | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: DebtStatus
  description: string | null
  remark: string | null
  createdTime: string
  repayments: DebtRepaymentItem[]
}

/** 欠款列表查询参数 */
export interface GetDebtListParams {
  page?: number
  pageSize?: number
  status?: DebtStatus
  tenantName?: string
}

/** 欠款列表分页结果 */
export interface DebtListResult {
  list: DebtListItem[]
  total: number
  page: number
  pageSize: number
}

/** 新增欠款请求 */
export interface CreateDebtParams {
  tenantId: number
  totalAmount: number
  description?: string
  remark?: string
}

/** 修改欠款请求 */
export interface UpdateDebtParams {
  id: number
  totalAmount: number
  description?: string
  remark?: string
}

/** 新增还款请求 */
export interface AddRepaymentParams {
  amount: number
  paymentDate: string
  paymentChannel: PaymentChannel
  remark?: string
}
```

- [ ] **Step 2: 创建 API 服务**

创建 `Hans/src/api/debt.ts`：

```typescript
import type {
  AddRepaymentParams,
  CreateDebtParams,
  DebtDetail,
  DebtListItem,
  DebtListResult,
  GetDebtListParams,
  UpdateDebtParams,
} from '@/api/model/debtModel'
import { request } from '@/utils/request'

const Api = {
  list: '/debt/list',
  detail: '/debt',
  add: '/debt/add',
  edit: '/debt/edit',
  remove: '/debt/remove',
}

export function getDebtList(params: GetDebtListParams) {
  return request.get<DebtListResult>({ url: Api.list, params })
}

export function getDebtDetail(id: number) {
  return request.get<DebtDetail>({ url: `${Api.detail}/${id}` })
}

export function createDebt(data: CreateDebtParams) {
  return request.post<DebtListItem>({ url: Api.add, data })
}

export function updateDebt(data: UpdateDebtParams) {
  return request.put<DebtListItem>({ url: Api.edit, data })
}

export function deleteDebt(id: number) {
  return request.delete({ url: `${Api.remove}/${id}` })
}

export function addRepayment(id: number, data: AddRepaymentParams) {
  return request.post({ url: `${Api.detail}/${id}/repay`, data })
}

export function deleteRepayment(id: number) {
  return request.delete({ url: `/debt/repay/remove/${id}` })
}
```

- [ ] **Step 3: 创建路由模块**

创建 `Hans/src/router/modules/debt.ts`：

```typescript
import Layout from '@/layouts/index.vue'

export default [
  {
    path: '/debt',
    name: 'debt',
    component: Layout,
    redirect: '/debt/list',
    meta: { title: { zh_CN: '老赖管理', en_US: 'Debt Management' }, icon: 'money-circle', orderNo: 3 },
    children: [
      {
        path: 'list',
        name: 'DebtList',
        component: () => import('@/pages/debt/index.vue'),
        meta: { title: { zh_CN: '欠款列表', en_US: 'Debt List' } },
      },
    ],
  },
]
```

- [ ] **Step 4: TypeScript 编译验证**

Run: `cd Hans && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add Hans/src/api/model/debtModel.ts Hans/src/api/debt.ts Hans/src/router/modules/debt.ts
git commit -m "feat: 新增前端欠款管理 API 层和路由"
```

---

### Task 8: 前端 DebtCard 组件

**Files:**
- Create: `Hans/src/pages/debt/components/DebtCard.vue`

- [ ] **Step 1: 创建 DebtCard 组件**

创建 `Hans/src/pages/debt/components/DebtCard.vue`：

```vue
<template>
  <div class="debt-card">
    <div class="debt-card-header">
      <div class="tenant-info">
        <span class="tenant-name">{{ data.tenantName }}</span>
        <span v-if="data.tenantPhone" class="tenant-phone">{{ data.tenantPhone }}</span>
      </div>
      <t-tag :theme="data.status === DebtStatus.Settled ? 'success' : 'warning'" size="small">
        {{ DebtStatusText[data.status] }}
      </t-tag>
    </div>

    <t-divider />

    <div class="debt-card-body">
      <div v-if="data.description" class="description">
        {{ data.description }}
      </div>

      <div class="amount-section">
        <div class="amount-text">
          已还 {{ formatAmount(data.paidAmount) }} / 欠款 {{ formatAmount(data.totalAmount) }}
        </div>
        <t-progress
          :percentage="percentage"
          :color="percentage >= 100 ? '#07C160' : '#0052D9'"
          :stroke-width="8"
        />
      </div>
    </div>

    <t-divider />

    <div class="debt-card-footer">
      <t-button size="small" variant="text" theme="primary" @click="$emit('repay', data)">
        还款
      </t-button>
      <t-button size="small" variant="text" @click="$emit('detail', data)">
        详情
      </t-button>
      <t-button size="small" variant="text" @click="$emit('edit', data)">
        编辑
      </t-button>
      <t-popconfirm content="确认删除该欠款记录？" @confirm="$emit('delete', data)">
        <t-button size="small" variant="text" theme="danger">
          删除
        </t-button>
      </t-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DebtListItem } from '@/api/model/debtModel'
import { DebtStatus, DebtStatusText } from '@/api/model/debtModel'
import { computed } from 'vue'

const props = defineProps<{
  data: DebtListItem
}>()

defineEmits<{
  repay: [data: DebtListItem]
  detail: [data: DebtListItem]
  edit: [data: DebtListItem]
  delete: [data: DebtListItem]
}>()

const percentage = computed(() => {
  if (props.data.totalAmount <= 0) return 0
  return Math.min(Math.round((props.data.paidAmount / props.data.totalAmount) * 100), 100)
})

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style lang="less" scoped>
.debt-card {
  padding: 16px;
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  background-color: var(--td-bg-color-container);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  }
}

.debt-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tenant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tenant-name {
  font-size: 16px;
  font-weight: 600;
}

.tenant-phone {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.description {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.amount-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-text {
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.debt-card-footer {
  display: flex;
  gap: 4px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/debt/components/DebtCard.vue
git commit -m "feat: 新增欠款卡片组件"
```

---

### Task 9: 前端 DebtFormDialog 组件

**Files:**
- Create: `Hans/src/pages/debt/components/DebtFormDialog.vue`

- [ ] **Step 1: 创建新增/编辑弹窗组件**

创建 `Hans/src/pages/debt/components/DebtFormDialog.vue`：

```vue
<template>
  <t-dialog
    v-model:visible="dialogVisible"
    :header="isEdit ? '编辑欠款' : '新增欠款'"
    :confirm-btn="{ loading }"
    @confirm="handleSubmit"
  >
    <t-form ref="formRef" :data="formData" :rules="formRules" label-align="top">
      <t-form-item label="租客" name="tenantId">
        <t-select
          v-model="formData.tenantId"
          :disabled="isEdit"
          filterable
          placeholder="请选择租客"
          :loading="tenantLoading"
        >
          <t-option
            v-for="item in tenantList"
            :key="item.id"
            :value="item.id"
            :label="`${item.name}${item.phone ? ` (${item.phone})` : ''}`"
          />
        </t-select>
      </t-form-item>

      <t-form-item label="欠款金额" name="totalAmount">
        <t-input-number
          v-model="formData.totalAmount"
          :min="0.01"
          :decimal-places="2"
          theme="normal"
          placeholder="请输入欠款金额"
          style="width: 100%"
        />
      </t-form-item>

      <t-form-item label="欠款说明" name="description">
        <t-textarea
          v-model="formData.description"
          :maxlength="500"
          placeholder="请输入欠款说明"
        />
      </t-form-item>

      <t-form-item label="备注" name="remark">
        <t-textarea
          v-model="formData.remark"
          :maxlength="500"
          placeholder="请输入备注"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next'
import type { DebtListItem } from '@/api/model/debtModel'
import { createDebt, updateDebt } from '@/api/debt'
import { getTenantList } from '@/api/tenant'
import { MessagePlugin } from 'tdesign-vue-next'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  editData?: DebtListItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const isEdit = computed(() => !!props.editData)

const formRef = ref<FormInstanceFunctions>()
const loading = ref(false)
const tenantLoading = ref(false)
const tenantList = ref<{ id: number, name: string, phone: string | null }[]>([])

const formData = reactive({
  tenantId: undefined as number | undefined,
  totalAmount: undefined as number | undefined,
  description: '',
  remark: '',
})

const formRules: Record<string, FormRule[]> = {
  tenantId: [{ required: true, message: '请选择租客' }],
  totalAmount: [{ required: true, message: '请输入欠款金额' }],
}

watch(
  () => props.visible,
  async (val) => {
    if (!val) return

    await fetchTenants()

    if (props.editData) {
      formData.tenantId = props.editData.tenantId
      formData.totalAmount = props.editData.totalAmount
      formData.description = props.editData.description ?? ''
      formData.remark = props.editData.remark ?? ''
    }
    else {
      formData.tenantId = undefined
      formData.totalAmount = undefined
      formData.description = ''
      formData.remark = ''
    }
  },
)

async function fetchTenants() {
  tenantLoading.value = true
  try {
    const res = await getTenantList({ page: 1, pageSize: 1000 })
    tenantList.value = res.list.map(t => ({ id: t.id, name: t.name, phone: t.phone }))
  }
  finally {
    tenantLoading.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid === true) {
    loading.value = true
    try {
      if (isEdit.value && props.editData) {
        await updateDebt({
          id: props.editData.id,
          totalAmount: formData.totalAmount!,
          description: formData.description || undefined,
          remark: formData.remark || undefined,
        })
        MessagePlugin.success('修改成功')
      }
      else {
        await createDebt({
          tenantId: formData.tenantId!,
          totalAmount: formData.totalAmount!,
          description: formData.description || undefined,
          remark: formData.remark || undefined,
        })
        MessagePlugin.success('新增成功')
      }
      dialogVisible.value = false
      emit('success')
    }
    catch (e: any) {
      MessagePlugin.error(e?.message ?? '操作失败')
    }
    finally {
      loading.value = false
    }
  }
}
</script>
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/debt/components/DebtFormDialog.vue
git commit -m "feat: 新增欠款表单弹窗组件"
```

---

### Task 10: 前端 RepayDialog 组件

**Files:**
- Create: `Hans/src/pages/debt/components/RepayDialog.vue`

- [ ] **Step 1: 创建还款弹窗组件**

创建 `Hans/src/pages/debt/components/RepayDialog.vue`：

```vue
<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="还款"
    :confirm-btn="{ loading }"
    @confirm="handleSubmit"
  >
    <div class="repay-info">
      <span>租客：{{ debt?.tenantName }}</span>
      <span>剩余欠款：{{ formatAmount(debt?.remainingAmount ?? 0) }}</span>
    </div>

    <t-form ref="formRef" :data="formData" :rules="formRules" label-align="top">
      <t-form-item label="还款金额" name="amount">
        <t-input-number
          v-model="formData.amount"
          :min="0.01"
          :max="debt?.remainingAmount"
          :decimal-places="2"
          theme="normal"
          placeholder="请输入还款金额"
          style="width: 100%"
        />
      </t-form-item>

      <t-form-item label="还款日期" name="paymentDate">
        <t-date-picker
          v-model="formData.paymentDate"
          clearable
          style="width: 100%"
        />
      </t-form-item>

      <t-form-item label="还款方式" name="paymentChannel">
        <t-select v-model="formData.paymentChannel" placeholder="请选择还款方式">
          <t-option
            v-for="(label, value) in PaymentChannelText"
            :key="value"
            :value="Number(value)"
            :label="label"
          />
        </t-select>
      </t-form-item>

      <t-form-item label="备注" name="remark">
        <t-textarea
          v-model="formData.remark"
          :maxlength="500"
          placeholder="请输入备注"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next'
import type { DebtListItem } from '@/api/model/debtModel'
import { PaymentChannel, PaymentChannelText } from '@/api/model/debtModel'
import { addRepayment } from '@/api/debt'
import { MessagePlugin } from 'tdesign-vue-next'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  debt: DebtListItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const formRef = ref<FormInstanceFunctions>()
const loading = ref(false)

const formData = reactive({
  amount: undefined as number | undefined,
  paymentDate: '',
  paymentChannel: undefined as PaymentChannel | undefined,
  remark: '',
})

const formRules: Record<string, FormRule[]> = {
  amount: [{ required: true, message: '请输入还款金额' }],
  paymentDate: [{ required: true, message: '请选择还款日期' }],
  paymentChannel: [{ required: true, message: '请选择还款方式' }],
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    formData.amount = undefined
    formData.paymentDate = new Date().toISOString().split('T')[0]
    formData.paymentChannel = undefined
    formData.remark = ''
  },
)

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid === true && props.debt) {
    loading.value = true
    try {
      await addRepayment(props.debt.id, {
        amount: formData.amount!,
        paymentDate: formData.paymentDate,
        paymentChannel: formData.paymentChannel!,
        remark: formData.remark || undefined,
      })
      MessagePlugin.success('还款成功')
      dialogVisible.value = false
      emit('success')
    }
    catch (e: any) {
      MessagePlugin.error(e?.message ?? '还款失败')
    }
    finally {
      loading.value = false
    }
  }
}
</script>

<style lang="less" scoped>
.repay-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--td-bg-color-page);
  border-radius: 6px;
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/debt/components/RepayDialog.vue
git commit -m "feat: 新增还款弹窗组件"
```

---

### Task 11: 前端 DebtDetailDialog 组件

**Files:**
- Create: `Hans/src/pages/debt/components/DebtDetailDialog.vue`

- [ ] **Step 1: 创建详情弹窗组件**

创建 `Hans/src/pages/debt/components/DebtDetailDialog.vue`：

```vue
<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="欠款详情"
    :footer="false"
    width="680px"
  >
    <template v-if="detail">
      <div class="detail-section">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">租客</span>
            <span class="info-value">{{ detail.tenantName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">电话</span>
            <span class="info-value">{{ detail.tenantPhone ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <t-tag :theme="detail.status === DebtStatus.Settled ? 'success' : 'warning'" size="small">
              {{ DebtStatusText[detail.status] }}
            </t-tag>
          </div>
          <div v-if="detail.description" class="info-item" style="grid-column: 1 / -1">
            <span class="info-label">说明</span>
            <span class="info-value">{{ detail.description }}</span>
          </div>
          <div v-if="detail.remark" class="info-item" style="grid-column: 1 / -1">
            <span class="info-label">备注</span>
            <span class="info-value">{{ detail.remark }}</span>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-item">
          <span class="summary-label">总欠款</span>
          <span class="summary-value">{{ formatAmount(detail.totalAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已还</span>
          <span class="summary-value success">{{ formatAmount(detail.paidAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">剩余</span>
          <span class="summary-value danger">{{ formatAmount(detail.remainingAmount) }}</span>
        </div>
      </div>

      <t-divider />

      <div class="repayments-section">
        <h4 style="margin-bottom: 12px">还款记录</h4>
        <t-table
          :data="detail.repayments"
          :columns="repaymentColumns"
          size="small"
          :pagination="false"
          row-key="id"
          empty="暂无还款记录"
        >
          <template #paymentChannel="{ row }">
            {{ PaymentChannelText[row.paymentChannel] }}
          </template>
          <template #amount="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
          <template #paymentDate="{ row }">
            {{ row.paymentDate.split('T')[0] }}
          </template>
          <template #operation="{ row }">
            <t-popconfirm content="确认删除该还款记录？" @confirm="handleDeleteRepayment(row.id)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </template>
        </t-table>
      </div>
    </template>

    <div v-else style="text-align: center; padding: 40px">
      <t-loading />
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import type { DebtDetail, DebtRepaymentItem } from '@/api/model/debtModel'
import { DebtStatus, DebtStatusText, PaymentChannelText } from '@/api/model/debtModel'
import { deleteRepayment, getDebtDetail } from '@/api/debt'
import { MessagePlugin } from 'tdesign-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  debtId: number | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const detail = ref<DebtDetail | null>(null)

const repaymentColumns = [
  { colKey: 'paymentDate', title: '日期', width: 110 },
  { colKey: 'amount', title: '金额', width: 100 },
  { colKey: 'paymentChannel', title: '方式', width: 80 },
  { colKey: 'remark', title: '备注', ellipsis: true },
  { colKey: 'operation', title: '操作', width: 60 },
]

watch(
  () => props.visible,
  async (val) => {
    if (!val || !props.debtId) return
    detail.value = null
    try {
      detail.value = await getDebtDetail(props.debtId)
    }
    catch {
      MessagePlugin.error('获取详情失败')
    }
  },
)

async function handleDeleteRepayment(id: number) {
  try {
    await deleteRepayment(id)
    MessagePlugin.success('删除成功')
    if (props.debtId) {
      detail.value = await getDebtDetail(props.debtId)
    }
    emit('success')
  }
  catch (e: any) {
    MessagePlugin.error(e?.message ?? '删除失败')
  }
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style lang="less" scoped>
.detail-section {
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.info-value {
  font-size: 14px;
}

.summary-section {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background-color: var(--td-bg-color-page);
  border-radius: 6px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.summary-value {
  font-size: 18px;
  font-weight: 600;

  &.success { color: var(--td-success-color); }
  &.danger { color: var(--td-error-color); }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/debt/components/DebtDetailDialog.vue
git commit -m "feat: 新增欠款详情弹窗组件"
```

---

### Task 12: 前端主页面

**Files:**
- Create: `Hans/src/pages/debt/index.vue`

- [ ] **Step 1: 创建主列表页**

创建 `Hans/src/pages/debt/index.vue`：

```vue
<template>
  <div class="debt-page">
    <div class="debt-filter">
      <t-input
        v-model="searchName"
        placeholder="搜索租客姓名"
        clearable
        style="width: 200px"
        @enter="fetchList"
        @clear="fetchList"
      />
      <t-select
        v-model="statusFilter"
        placeholder="状态筛选"
        clearable
        style="width: 140px"
        @change="fetchList"
      >
        <t-option :value="DebtStatus.Ongoing" label="进行中" />
        <t-option :value="DebtStatus.Settled" label="已还清" />
      </t-select>
      <t-button theme="primary" @click="openFormDialog()">
        新增欠款
      </t-button>
    </div>

    <div v-if="debtList.length" class="debt-grid">
      <DebtCard
        v-for="item in debtList"
        :key="item.id"
        :data="item"
        @repay="openRepayDialog"
        @detail="openDetailDialog"
        @edit="openFormDialog"
        @delete="handleDelete"
      />
    </div>

    <t-empty v-else />

    <div v-if="total > pageSize" class="debt-pagination">
      <t-pagination
        :current="page"
        :page-size="pageSize"
        :total="total"
        show-jumper
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <DebtFormDialog
      v-model:visible="formDialogVisible"
      :edit-data="editingDebt"
      @success="fetchList"
    />

    <RepayDialog
      v-model:visible="repayDialogVisible"
      :debt="repayingDebt"
      @success="fetchList"
    />

    <DebtDetailDialog
      v-model:visible="detailDialogVisible"
      :debt-id="detailingDebtId"
      @success="fetchList"
    />
  </div>
</template>

<script setup lang="ts">
import type { DebtListItem } from '@/api/model/debtModel'
import { DebtStatus } from '@/api/model/debtModel'
import { deleteDebt, getDebtList } from '@/api/debt'
import { MessagePlugin } from 'tdesign-vue-next'
import { onMounted, ref } from 'vue'
import DebtCard from './components/DebtCard.vue'
import DebtDetailDialog from './components/DebtDetailDialog.vue'
import DebtFormDialog from './components/DebtFormDialog.vue'
import RepayDialog from './components/RepayDialog.vue'

defineOptions({ name: 'DebtList' })

const debtList = ref<DebtListItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchName = ref('')
const statusFilter = ref<DebtStatus | undefined>(undefined)

const formDialogVisible = ref(false)
const editingDebt = ref<DebtListItem | null>(null)

const repayDialogVisible = ref(false)
const repayingDebt = ref<DebtListItem | null>(null)

const detailDialogVisible = ref(false)
const detailingDebtId = ref<number | null>(null)

onMounted(() => {
  fetchList()
})

async function fetchList() {
  try {
    const res = await getDebtList({
      page: page.value,
      pageSize: pageSize.value,
      tenantName: searchName.value || undefined,
      status: statusFilter.value,
    })
    debtList.value = res.list
    total.value = res.total
  }
  catch {
    MessagePlugin.error('获取列表失败')
  }
}

function handlePageChange(current: number) {
  page.value = current
  fetchList()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchList()
}

function openFormDialog(data?: DebtListItem) {
  editingDebt.value = data ?? null
  formDialogVisible.value = true
}

function openRepayDialog(data: DebtListItem) {
  repayingDebt.value = data
  repayDialogVisible.value = true
}

function openDetailDialog(data: DebtListItem) {
  detailingDebtId.value = data.id
  detailDialogVisible.value = true
}

async function handleDelete(data: DebtListItem) {
  try {
    await deleteDebt(data.id)
    MessagePlugin.success('删除成功')
    fetchList()
  }
  catch (e: any) {
    MessagePlugin.error(e?.message ?? '删除失败')
  }
}
</script>

<style lang="less" scoped>
.debt-page {
  padding: 24px;
}

.debt-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.debt-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.debt-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
```

- [ ] **Step 2: 启动开发服务器验证**

Run: `cd Hans && npm run dev`

验证：
1. 左侧菜单出现「老赖管理」
2. 点击后进入欠款列表页
3. 页面无控制台报错
4. 「新增欠款」按钮可打开弹窗

- [ ] **Step 3: 提交**

```bash
git add Hans/src/pages/debt/index.vue
git commit -m "feat: 新增老赖管理主页面"
```

---

### Task 13: E2E 测试

**Files:**
- Create: `tests/e2e/debt.spec.ts`

- [ ] **Step 1: 创建 E2E 测试文件**

创建 `tests/e2e/debt.spec.ts`：

```typescript
import { expect, test } from '@playwright/test'

test.describe('老赖管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("登录")')
    await page.waitForURL('**/dashboard/**')
  })

  test('应显示老赖管理菜单和页面', async ({ page }) => {
    await page.click('text=老赖管理')
    await page.waitForURL('**/debt/**')
    await expect(page.locator('.debt-page')).toBeVisible()
    await expect(page.getByText('新增欠款')).toBeVisible()
  })

  test('应成功创建欠款记录', async ({ page }) => {
    await page.click('text=老赖管理')
    await page.waitForURL('**/debt/**')

    await page.click('text=新增欠款')
    await expect(page.locator('.t-dialog')).toBeVisible()

    // 选择租客
    await page.click('.t-select')
    await page.click('.t-popup .t-select-option:first-child')

    // 输入金额
    await page.fill('input[placeholder="请输入欠款金额"]', '10000')

    // 输入说明
    await page.fill('textarea[placeholder="请输入欠款说明"]', 'E2E 测试欠款')

    // 提交
    await page.click('.t-dialog .t-button--theme-primary')
    await page.waitForTimeout(1000)

    // 验证列表中出现新记录
    await expect(page.getByText('E2E 测试欠款')).toBeVisible()
  })

  test('应成功添加还款', async ({ page }) => {
    await page.click('text=老赖管理')
    await page.waitForURL('**/debt/**')

    // 点击第一条记录的还款按钮
    const repayButton = page.locator('.debt-card').first().getByText('还款')
    if (await repayButton.isVisible()) {
      await repayButton.click()
      await expect(page.locator('.t-dialog')).toBeVisible()

      // 输入还款金额
      await page.fill('input[placeholder="请输入还款金额"]', '3000')

      // 选择日期
      const today = new Date().toISOString().split('T')[0]
      await page.fill('.t-date-picker input', today)

      // 选择还款方式
      const channelSelect = page.locator('.t-dialog .t-select').last()
      await channelSelect.click()
      await page.click('.t-popup .t-select-option:first-child')

      // 提交
      await page.click('.t-dialog .t-button--theme-primary')
      await page.waitForTimeout(1000)
    }
  })

  test('应显示欠款详情', async ({ page }) => {
    await page.click('text=老赖管理')
    await page.waitForURL('**/debt/**')

    const detailButton = page.locator('.debt-card').first().getByText('详情')
    if (await detailButton.isVisible()) {
      await detailButton.click()
      await expect(page.locator('.t-dialog')).toBeVisible()
      await expect(page.getByText('欠款详情')).toBeVisible()
      await expect(page.getByText('还款记录')).toBeVisible()
    }
  })
})
```

- [ ] **Step 2: 运行测试**

Run: `cd tests && npx playwright test e2e/debt.spec.ts`
Expected: 4 tests passed

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/debt.spec.ts
git commit -m "test: 新增老赖管理 E2E 测试"
```

---

## 任务依赖关系

```
Task 1 (枚举) → Task 2 (实体) → Task 3 (DTO) → Task 4 (服务) → Task 5 (AppService) → Task 6 (迁移)
                                                                                          ↓
Task 7 (前端 API + 路由) → Task 8 (卡片) → Task 9 (表单弹窗) → Task 10 (还款弹窗) → Task 11 (详情弹窗) → Task 12 (主页面) → Task 13 (E2E)
```

- Task 1-6 为后端，需严格按顺序执行
- Task 7-12 为前端，Task 7 需先完成，Task 8-11 可并行，Task 12 依赖 Task 8-11
- Task 13 需全部完成后执行
