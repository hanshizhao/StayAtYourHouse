namespace Gentle.Application.Dtos.Maintenance;

/// <summary>
/// 维修记录列表结果
/// </summary>
public class MaintenanceListResult
{
    /// <summary>
    /// 维修记录列表
    /// </summary>
    public List<MaintenanceDetailDto> Items { get; set; } = [];

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
