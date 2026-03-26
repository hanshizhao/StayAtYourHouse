namespace Gentle.Application.Dtos.Bill;

/// <summary>
/// 待办账单 DTO
/// </summary>
public class TodoBillsDto
{
    /// <summary>
    /// 逾期账单（已超过应收日期且未收款）
    /// </summary>
    public List<BillDto> Overdue { get; set; } = [];

    /// <summary>
    /// 宽限到期账单（今日宽限截止）
    /// </summary>
    public List<BillDto> GraceExpiring { get; set; } = [];

    /// <summary>
    /// 今日到期账单（应收日期为今日）
    /// </summary>
    public List<BillDto> DueToday { get; set; } = [];

    /// <summary>
    /// 即将到期账单（3天内到期）
    /// </summary>
    public List<BillDto> Upcoming { get; set; } = [];

    /// <summary>
    /// 各类待办数量汇总
    /// </summary>
    public TodoSummary Summary => new()
    {
        OverdueCount = Overdue.Count,
        GraceExpiringCount = GraceExpiring.Count,
        DueTodayCount = DueToday.Count,
        UpcomingCount = Upcoming.Count,
        TotalCount = Overdue.Count + GraceExpiring.Count + DueToday.Count + Upcoming.Count
    };
}

/// <summary>
/// 待办汇总 DTO
/// </summary>
public class TodoSummary
{
    /// <summary>
    /// 逾期数量
    /// </summary>
    public int OverdueCount { get; set; }

    /// <summary>
    /// 宽限到期数量
    /// </summary>
    public int GraceExpiringCount { get; set; }

    /// <summary>
    /// 今日到期数量
    /// </summary>
    public int DueTodayCount { get; set; }

    /// <summary>
    /// 即将到期数量
    /// </summary>
    public int UpcomingCount { get; set; }

    /// <summary>
    /// 总待办数量
    /// </summary>
    public int TotalCount { get; set; }
}
