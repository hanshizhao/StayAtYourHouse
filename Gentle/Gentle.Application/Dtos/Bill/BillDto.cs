using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Bill;

/// <summary>
/// 账单 DTO
/// </summary>
public class BillDto
{
    /// <summary>
    /// 账单ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租住记录ID
    /// </summary>
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 账单周期开始日期
    /// </summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 账单周期结束日期
    /// </summary>
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 账单周期文本
    /// </summary>
    public string PeriodText => $"{PeriodStart:yyyy-MM-dd} ~ {PeriodEnd:yyyy-MM-dd}";

    /// <summary>
    /// 应收日期
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 租金金额
    /// </summary>
    public decimal RentAmount { get; set; }

    /// <summary>
    /// 水费
    /// </summary>
    public decimal? WaterFee { get; set; }

    /// <summary>
    /// 电费
    /// </summary>
    public decimal? ElectricFee { get; set; }

    /// <summary>
    /// 总金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 账单状态
    /// </summary>
    public BillStatus Status { get; set; }

    /// <summary>
    /// 账单状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        BillStatus.Pending => "待收款",
        BillStatus.Grace => "宽限中",
        BillStatus.Paid => "已收款",
        BillStatus.Overdue => "已逾期",
        _ => "未知"
    };

    /// <summary>
    /// 实收金额
    /// </summary>
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// 收款日期
    /// </summary>
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// 宽限截止日期
    /// </summary>
    public DateTime? GraceUntil { get; set; }

    /// <summary>
    /// 剩余天数（距离应收日期）
    /// </summary>
    public int? DaysRemaining
    {
        get
        {
            if (Status == BillStatus.Paid) return null;
            var targetDate = GraceUntil ?? DueDate;
            var days = (int)(targetDate - DateTime.Today).TotalDays;
            return days;
        }
    }

    /// <summary>
    /// 催收记录列表
    /// </summary>
    public List<CollectionRecordDto>? CollectionRecords { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
