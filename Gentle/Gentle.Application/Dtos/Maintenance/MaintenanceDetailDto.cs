using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Maintenance;

/// <summary>
/// 维修记录详情 DTO
/// </summary>
public class MaintenanceDetailDto
{
    /// <summary>
    /// 维修记录ID
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
    /// 维修描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 优先级
    /// </summary>
    public MaintenancePriority Priority { get; set; }

    /// <summary>
    /// 优先级文本
    /// </summary>
    public string PriorityText => Priority switch
    {
        MaintenancePriority.Urgent => "紧急",
        MaintenancePriority.Normal => "普通",
        MaintenancePriority.Low => "低优先级",
        _ => "未知"
    };

    /// <summary>
    /// 维修状态
    /// </summary>
    public MaintenanceStatus Status { get; set; }

    /// <summary>
    /// 维修状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        MaintenanceStatus.Pending => "待处理",
        MaintenanceStatus.InProgress => "进行中",
        MaintenanceStatus.Completed => "已完成",
        _ => "未知"
    };

    /// <summary>
    /// 报修日期
    /// </summary>
    public DateTime ReportDate { get; set; }

    /// <summary>
    /// 完成日期
    /// </summary>
    public DateTime? CompletedDate { get; set; }

    /// <summary>
    /// 预估费用（元）
    /// </summary>
    public decimal? Cost { get; set; }

    /// <summary>
    /// 维修人员姓名
    /// </summary>
    public string? RepairPerson { get; set; }

    /// <summary>
    /// 维修人员电话
    /// </summary>
    public string? RepairPhone { get; set; }

    /// <summary>
    /// 图片（JSON数组）
    /// </summary>
    public string? Images { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
