using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Meter;

/// <summary>
/// 水电账单 DTO
/// </summary>
public class UtilityBillDto
{
    /// <summary>
    /// 账单ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 租客ID
    /// </summary>
    public int? TenantId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string? TenantName { get; set; }

    /// <summary>
    /// 抄表记录ID
    /// </summary>
    public int MeterRecordId { get; set; }

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
    /// 用水量（吨）
    /// </summary>
    public decimal WaterUsage { get; set; }

    /// <summary>
    /// 用电量（度）
    /// </summary>
    public decimal ElectricUsage { get; set; }

    /// <summary>
    /// 水费（元）
    /// </summary>
    public decimal WaterFee { get; set; }

    /// <summary>
    /// 电费（元）
    /// </summary>
    public decimal ElectricFee { get; set; }

    /// <summary>
    /// 总金额（元）
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 账单状态
    /// </summary>
    public UtilityBillStatus Status { get; set; }

    /// <summary>
    /// 账单状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        UtilityBillStatus.Pending => "待收取",
        UtilityBillStatus.Paid => "已收取",
        _ => "未知"
    };

    /// <summary>
    /// 关联的租赁记录ID
    /// </summary>
    public int? RentalRecordId { get; set; }

    /// <summary>
    /// 实收金额（元）
    /// </summary>
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// 收款日期
    /// </summary>
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
