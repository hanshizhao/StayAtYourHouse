using Gentle.Application.Dtos.Debt;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款服务实现
/// </summary>
public class DebtService : IDebtService
{
    private readonly IRepository<Core.Entities.Debt> _debtRepository;
    private readonly IRepository<Core.Entities.DebtRepayment> _repaymentRepository;
    private readonly IRepository<Core.Entities.Tenant> _tenantRepository;

    public DebtService(
        IRepository<Core.Entities.Debt> debtRepository,
        IRepository<Core.Entities.DebtRepayment> repaymentRepository,
        IRepository<Core.Entities.Tenant> tenantRepository)
    {
        _debtRepository = debtRepository;
        _repaymentRepository = repaymentRepository;
        _tenantRepository = tenantRepository;
    }

    /// <inheritdoc />
    public async Task<DebtListResult> GetListAsync(DebtListInput input)
    {
        var baseQuery = _debtRepository.AsQueryable(false);

        if (!string.IsNullOrWhiteSpace(input.Keyword))
        {
            baseQuery = baseQuery.Where(d =>
                d.Debtor.Name.Contains(input.Keyword) ||
                (d.Debtor.Phone != null && d.Debtor.Phone.Contains(input.Keyword)));
        }

        if (input.Status.HasValue)
        {
            baseQuery = baseQuery.Where(d => d.Status == input.Status.Value);
        }

        var total = await baseQuery.CountAsync();

        var list = await baseQuery
            .Include(d => d.Debtor)
            .Include(d => d.Repayments)
            .AsSplitQuery()
            .OrderByDescending(d => d.CreatedTime)
            .Skip((input.Page - 1) * input.PageSize)
            .Take(input.PageSize)
            .ToListAsync();

        var dtos = list.Select(d => new DebtListDto
        {
            Id = d.Id,
            TenantId = d.DebtorId,
            TenantName = d.Debtor.Name,
            TenantPhone = d.Debtor.Phone,
            TotalAmount = d.TotalAmount,
            PaidAmount = d.Repayments.Sum(r => r.Amount),
            Status = d.Status,
            Description = d.Description,
            CreatedTime = d.CreatedTime
        }).ToList();

        return new DebtListResult
        {
            List = dtos,
            Total = total,
            Page = input.Page,
            PageSize = input.PageSize
        };
    }

    /// <inheritdoc />
    public async Task<DebtDetailDto> GetByIdAsync(int id)
    {
        var debt = await _debtRepository.AsQueryable(false)
            .Include(d => d.Debtor)
            .Include(d => d.Repayments.OrderByDescending(r => r.PaymentDate))
            .AsSplitQuery()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {id} 不存在");
        }

        return MapToDetailDto(debt);
    }

    /// <inheritdoc />
    public async Task<DebtDetailDto> AddAsync(CreateDebtInput input)
    {
        var tenant = await _tenantRepository.FindAsync(input.TenantId);
        if (tenant == null)
        {
            throw Oops.Oh($"租客 {input.TenantId} 不存在");
        }

        var debt = new Core.Entities.Debt
        {
            DebtorId = input.TenantId,
            TotalAmount = input.TotalAmount,
            Description = input.Description,
            Remark = input.Remark,
            Status = DebtStatus.Ongoing,
            CreatedTime = DateTimeOffset.Now
        };

        var entry = await _debtRepository.InsertAsync(debt);
        await _debtRepository.SaveNowAsync();

        var saved = await _debtRepository.AsQueryable(false)
            .Include(d => d.Debtor)
            .Include(d => d.Repayments)
            .AsSplitQuery()
            .FirstAsync(d => d.Id == entry.Entity.Id);

        return MapToDetailDto(saved);
    }

    /// <inheritdoc />
    public async Task<DebtDetailDto> UpdateAsync(UpdateDebtInput input)
    {
        var debt = await _debtRepository.FindAsync(input.Id);
        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {input.Id} 不存在");
        }

        debt.TotalAmount = input.TotalAmount;
        debt.Description = input.Description;
        debt.Remark = input.Remark;

        var paidAmount = await GetPaidAmountAsync(debt.Id);
        if (paidAmount >= debt.TotalAmount)
        {
            debt.Status = DebtStatus.Settled;
        }
        else
        {
            debt.Status = DebtStatus.Ongoing;
        }

        await _debtRepository.UpdateAsync(debt);
        await _debtRepository.SaveNowAsync();

        var updated = await _debtRepository.AsQueryable(false)
            .Include(d => d.Debtor)
            .Include(d => d.Repayments.OrderByDescending(r => r.PaymentDate))
            .AsSplitQuery()
            .FirstAsync(d => d.Id == debt.Id);

        return MapToDetailDto(updated);
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
            throw Oops.Oh("该欠款存在还款记录，无法删除");
        }

        await _debtRepository.DeleteAsync(debt);
        await _debtRepository.SaveNowAsync();
    }

    /// <inheritdoc />
    public async Task<DebtRepaymentDto> AddRepaymentAsync(int debtId, AddRepaymentInput input)
    {
        var debt = await _debtRepository.FindAsync(debtId);
        if (debt == null)
        {
            throw Oops.Oh($"欠款记录 {debtId} 不存在");
        }

        var paidAmount = await GetPaidAmountAsync(debtId);
        var remaining = debt.TotalAmount - paidAmount;

        if (input.Amount > remaining)
        {
            throw Oops.Oh($"还款金额 {input.Amount} 超过剩余欠款 {remaining}");
        }

        var repayment = input.Adapt<Core.Entities.DebtRepayment>();
        repayment.DebtId = debtId;
        repayment.CreatedTime = DateTimeOffset.Now;

        var entry = await _repaymentRepository.InsertAsync(repayment);

        paidAmount += input.Amount;
        if (paidAmount >= debt.TotalAmount)
        {
            debt.Status = DebtStatus.Settled;
            await _debtRepository.UpdateAsync(debt);
        }

        await _debtRepository.SaveNowAsync();

        return entry.Entity.Adapt<DebtRepaymentDto>();
    }

    /// <inheritdoc />
    public async Task DeleteRepaymentAsync(int repaymentId)
    {
        var repayment = await _repaymentRepository.FindAsync(repaymentId);
        if (repayment == null)
        {
            throw Oops.Oh($"还款记录 {repaymentId} 不存在");
        }

        var debtId = repayment.DebtId;

        await _repaymentRepository.DeleteAsync(repayment);

        var debt = await _debtRepository.FindAsync(debtId);
        if (debt != null && debt.Status == DebtStatus.Settled)
        {
            var paidAmount = await GetPaidAmountAsync(debtId);
            if (paidAmount < debt.TotalAmount)
            {
                debt.Status = DebtStatus.Ongoing;
                await _debtRepository.UpdateAsync(debt);
            }
        }

        await _debtRepository.SaveNowAsync();
    }

    private async Task<decimal> GetPaidAmountAsync(int debtId)
    {
        return await _repaymentRepository.AsQueryable(false)
            .Where(r => r.DebtId == debtId)
            .SumAsync(r => r.Amount);
    }

    private static DebtDetailDto MapToDetailDto(Core.Entities.Debt debt)
    {
        var paidAmount = debt.Repayments.Sum(r => r.Amount);

        return new DebtDetailDto
        {
            Id = debt.Id,
            TenantId = debt.DebtorId,
            TenantName = debt.Debtor.Name,
            TenantPhone = debt.Debtor.Phone,
            TotalAmount = debt.TotalAmount,
            PaidAmount = paidAmount,
            Status = debt.Status,
            Description = debt.Description,
            Remark = debt.Remark,
            CreatedTime = debt.CreatedTime,
            Repayments = debt.Repayments.Select(r => new DebtRepaymentDto
            {
                Id = r.Id,
                DebtId = r.DebtId,
                Amount = r.Amount,
                PaymentDate = r.PaymentDate,
                PaymentChannel = r.PaymentChannel,
                Remark = r.Remark,
                CreatedTime = r.CreatedTime
            }).ToList()
        };
    }
}
