using Gentle.Application.Dtos.Report;

namespace Gentle.Application.Services;

/// <summary>
/// 统计报表服务接口
/// </summary>
public interface IReportService : ITransient
{
    /// <summary>
    /// 获取收支统计报表
    /// </summary>
    /// <param name="year">年份</param>
    /// <returns>收支统计报表</returns>
    Task<IncomeReportDto> GetIncomeReportAsync(int year);

    /// <summary>
    /// 获取房源概览统计
    /// </summary>
    /// <returns>房源概览统计</returns>
    Task<HousingOverviewDto> GetHousingOverviewAsync();

    /// <summary>
    /// 获取房间利润排行
    /// </summary>
    /// <param name="sortBy">排序字段：monthly（月利润）、yearly（年利润）</param>
    /// <param name="limit">返回数量限制，默认50</param>
    /// <returns>房间利润排行列表</returns>
    Task<List<RoomProfitRankingDto>> GetRoomProfitRankingAsync(string sortBy = "monthly", int limit = 50);

    /// <summary>
    /// 获取催收统计报表
    /// </summary>
    /// <param name="year">年份</param>
    /// <param name="month">月份（可选，不传则统计全年）</param>
    /// <returns>催收统计报表</returns>
    Task<CollectionReportDto> GetCollectionReportAsync(int year, int? month = null);
}
