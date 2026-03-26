namespace Gentle.Application.Dtos.Meter;

/// <summary>
/// 抄表记录列表结果
/// </summary>
public class MeterListResult
{
    /// <summary>
    /// 抄表记录列表
    /// </summary>
    public List<MeterRecordDto> Items { get; set; } = [];

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

/// <summary>
/// 水电账单列表结果
/// </summary>
public class UtilityBillListResult
{
    /// <summary>
    /// 水电账单列表
    /// </summary>
    public List<UtilityBillDto> Items { get; set; } = [];

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
