using Gentle.Application.Dtos.Bill;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Gentle.Application.Apps;

/// <summary>
/// 账单管理应用服务
/// </summary>
[ApiDescriptionSettings("Bill", Name = "BillApp", Order = 30)]
[Route("api/bill-app")]
[Authorize]
public class BillAppService : IDynamicApiController
{
    private readonly IBillService _billService;
    private readonly ILogger<BillAppService> _logger;

    public BillAppService(IBillService billService, ILogger<BillAppService> logger)
    {
        _billService = billService;
        _logger = logger;
    }

    /// <summary>
    /// 获取账单列表
    /// </summary>
    /// <param name="status">状态筛选（pending/grace/paid/overdue）</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="month">月份筛选（格式：yyyy-MM）</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    [HttpGet("get-list")]
    public async Task<BillListResult> GetList(
        string? status = null,
        int? communityId = null,
        string? month = null,
        int page = 1,
        int pageSize = 20)
    {
        BillStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status))
        {
            statusEnum = status.ToLower() switch
            {
                "pending" => BillStatus.Pending,
                "grace" => BillStatus.Grace,
                "paid" => BillStatus.Paid,
                "overdue" => BillStatus.Overdue,
                _ => null
            };

            // 记录无效的状态参数
            if (statusEnum == null)
            {
                _logger.LogWarning("无效的账单状态参数: {Status}，已忽略。有效值: pending, grace, paid, overdue", status);
            }
        }

        var (items, total) = await _billService.GetListAsync(statusEnum, communityId, month, page, pageSize);
        return new BillListResult
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// 根据ID获取账单详情
    /// </summary>
    [HttpGet("get-by-id/{id}")]
    public async Task<BillDto> GetById(int id)
    {
        return await _billService.GetByIdAsync(id);
    }

    /// <summary>
    /// 催收处理
    /// </summary>
    [HttpPost("collect")]
    public async Task<BillDto> Collect(CollectInput input)
    {
        return await _billService.CollectAsync(input);
    }

    /// <summary>
    /// 获取今日待办账单
    /// </summary>
    [HttpGet("get-today-todos")]
    public async Task<TodoBillsDto> GetTodayTodos()
    {
        return await _billService.GetTodayTodosAsync();
    }

    /// <summary>
    /// 删除账单
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _billService.DeleteAsync(id);
    }
}

/// <summary>
/// 账单列表结果
/// </summary>
public class BillListResult
{
    /// <summary>
    /// 账单列表
    /// </summary>
    public List<BillDto> Items { get; set; } = [];

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; }
}
