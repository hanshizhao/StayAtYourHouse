using Gentle.Application.Dtos.Bill;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 账单服务接口
/// </summary>
public interface IBillService : ITransient
{
    /// <summary>
    /// 获取账单列表
    /// </summary>
    /// <param name="status">状态筛选</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="month">月份筛选（格式：yyyy-MM）</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>账单列表</returns>
    Task<(List<BillDto> Items, int Total)> GetListAsync(BillStatus? status = null, int? communityId = null, string? month = null, int page = 1, int pageSize = 20);

    /// <summary>
    /// 根据ID获取账单详情
    /// </summary>
    /// <param name="id">账单ID</param>
    /// <returns>账单详情</returns>
    Task<BillDto> GetByIdAsync(int id);

    /// <summary>
    /// 催收处理
    /// </summary>
    /// <param name="input">催收请求</param>
    /// <returns>更新后的账单</returns>
    Task<BillDto> CollectAsync(CollectInput input);

    /// <summary>
    /// 获取今日待办账单（即将到期/今日到期/宽限到期/逾期）
    /// </summary>
    /// <returns>待办账单分组</returns>
    Task<TodoBillsDto> GetTodayTodosAsync();

    /// <summary>
    /// 删除账单
    /// </summary>
    /// <param name="id">账单ID</param>
    Task DeleteAsync(int id);
}
