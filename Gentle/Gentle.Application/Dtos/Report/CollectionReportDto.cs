namespace Gentle.Application.Dtos.Report;

/// <summary>
/// 催收统计报表
/// </summary>
public class CollectionReportDto
{
    /// <summary>
    /// 年份
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// 月份
    /// </summary>
    public int Month { get; set; }

    /// <summary>
    /// 月份文本（如：2026年1月）
    /// </summary>
    public string MonthText => Month > 0 ? $"{Year}年{Month}月" : $"{Year}年全年";

    /// <summary>
    /// 本月应收账单数
    /// </summary>
    public int TotalBills { get; set; }

    /// <summary>
    /// 本月应收总金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 已收款账单数
    /// </summary>
    public int PaidBills { get; set; }

    /// <summary>
    /// 已收款金额
    /// </summary>
    public decimal PaidAmount { get; set; }

    /// <summary>
    /// 待收款账单数
    /// </summary>
    public int PendingBills { get; set; }

    /// <summary>
    /// 待收款金额
    /// </summary>
    public decimal PendingAmount { get; set; }

    /// <summary>
    /// 逾期账单数
    /// </summary>
    public int OverdueBills { get; set; }

    /// <summary>
    /// 逾期金额
    /// </summary>
    public decimal OverdueAmount { get; set; }

    /// <summary>
    /// 宽限中账单数
    /// </summary>
    public int GraceBills { get; set; }

    /// <summary>
    /// 宽限中金额
    /// </summary>
    public decimal GraceAmount { get; set; }

    /// <summary>
    /// 收款率（百分比）
    /// </summary>
    public decimal CollectionRate => TotalAmount > 0
        ? Math.Round(PaidAmount / TotalAmount * 100, 2)
        : 0;

    /// <summary>
    /// 逾期名单
    /// </summary>
    public List<OverdueBillDto> OverdueList { get; set; } = new();

    /// <summary>
    /// 宽限名单
    /// </summary>
    public List<GraceBillDto> GraceList { get; set; } = new();
}

/// <summary>
/// 逾期账单
/// </summary>
public class OverdueBillDto
{
    /// <summary>
    /// 账单ID
    /// </summary>
    public int BillId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 房间信息
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 应收日期
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 应收金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 逾期天数
    /// </summary>
    public int OverdueDays { get; set; }

    /// <summary>
    /// 账单周期
    /// </summary>
    public string PeriodText { get; set; } = string.Empty;
}

/// <summary>
/// 宽限中账单
/// </summary>
public class GraceBillDto
{
    /// <summary>
    /// 账单ID
    /// </summary>
    public int BillId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 房间信息
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 应收日期
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 宽限截止日期
    /// </summary>
    public DateTime GraceUntil { get; set; }

    /// <summary>
    /// 剩余宽限天数
    /// </summary>
    public int RemainingDays { get; set; }

    /// <summary>
    /// 应收金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 账单周期
    /// </summary>
    public string PeriodText { get; set; } = string.Empty;
}
