using Gentle.Application.Dtos.Report;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 统计报表 API 服务
/// </summary>
[ApiDescriptionSettings("Report", Name = "ReportApp", Order = 50)]
[Route("api/report-app")]
[Authorize]
public class ReportAppService : IDynamicApiController
{
    private readonly IReportService _reportService;

    public ReportAppService(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// 获取收支统计报表
    /// </summary>
    /// <param name="year">年份，默认当前年份</param>
    /// <returns>收支统计报表</returns>
    public async Task<IncomeReportDto> GetIncomeReport(int? year = null)
    {
        return await _reportService.GetIncomeReportAsync(year ?? DateTime.Today.Year);
    }

    /// <summary>
    /// 获取房源概览统计
    /// </summary>
    /// <returns>房源概览统计</returns>
    public async Task<HousingOverviewDto> GetHousingOverview()
    {
        return await _reportService.GetHousingOverviewAsync();
    }

    /// <summary>
    /// 获取房间利润排行
    /// </summary>
    /// <param name="sortBy">排序字段：monthly（月利润，默认）、yearly（年利润）</param>
    /// <param name="limit">返回数量限制，默认50，最大200</param>
    /// <returns>房间利润排行列表</returns>
    public async Task<List<RoomProfitRankingDto>> GetProfitRanking(string? sortBy = null, int limit = 50)
    {
        return await _reportService.GetRoomProfitRankingAsync(sortBy ?? "monthly", limit);
    }

    /// <summary>
    /// 获取催收统计报表
    /// </summary>
    /// <param name="year">年份，默认当前年份</param>
    /// <param name="month">月份（可选，不传则统计全年）</param>
    /// <returns>催收统计报表</returns>
    public async Task<CollectionReportDto> GetCollectionReport(int? year = null, int? month = null)
    {
        return await _reportService.GetCollectionReportAsync(
            year ?? DateTime.Today.Year,
            month);
    }
}
