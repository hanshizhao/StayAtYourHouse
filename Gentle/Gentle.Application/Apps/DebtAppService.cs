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
    /// <param name="keyword">搜索关键字（租客姓名/电话）</param>
    /// <param name="status">欠款状态筛选</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量</param>
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
