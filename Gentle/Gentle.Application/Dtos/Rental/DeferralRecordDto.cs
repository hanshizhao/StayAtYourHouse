namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 宽限记录 DTO
/// </summary>
/// <remarks>
/// 用于前端展示租赁提醒的宽限历史记录。
/// </remarks>
public class DeferralRecordDto
{
    /// <summary>
    /// 宽限记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 原始提醒日期
    /// </summary>
    public DateTime OriginalReminderDate { get; set; }

    /// <summary>
    /// 宽限后日期
    /// </summary>
    public DateTime DeferredToDate { get; set; }

    /// <summary>
    /// 宽限天数
    /// </summary>
    public int DeferralDays => (DeferredToDate - OriginalReminderDate).Days;

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}

/// <summary>
/// 宽限记录列表结果
/// </summary>
/// <remarks>
/// 用于分页返回宽限记录列表。
/// </remarks>
public class DeferralListResult
{
    /// <summary>
    /// 宽限记录列表
    /// </summary>
    public List<DeferralRecordDto> Items { get; set; } = [];

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }
}
