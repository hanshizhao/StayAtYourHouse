namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 租住记录分页结果
/// </summary>
public class RentalRecordListResult
{
    /// <summary>
    /// 租住记录列表
    /// </summary>
    public List<RentalRecordDto> Items { get; set; } = [];

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
