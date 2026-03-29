using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 催收提醒 DTO
/// </summary>
/// <remarks>
/// 用于前端显示催收房租待办信息。
/// </remarks>
public class RentalReminderDto
{
    /// <summary>
    /// 提醒ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租赁记录ID
    /// </summary>
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 月租金（元）
    /// </summary>
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 合同到期日期
    /// </summary>
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 提醒日期
    /// </summary>
    public DateTime ReminderDate { get; set; }

    /// <summary>
    /// 提醒状态
    /// </summary>
    public RentalReminderStatus Status { get; set; }

    /// <summary>
    /// 提醒状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        RentalReminderStatus.Pending => "待处理",
        RentalReminderStatus.Deferred => "已宽限",
        RentalReminderStatus.Completed => "已完成",
        _ => "未知"
    };

    /// <summary>
    /// 宽限次数
    /// </summary>
    public int DeferralCount { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
