using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Maintenance;

/// <summary>
/// 更新维修记录输入
/// </summary>
public class MaintenanceUpdateInput
{
    /// <summary>
    /// 维修记录ID
    /// </summary>
    [Required(ErrorMessage = "维修记录ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 维修描述
    /// </summary>
    [Required(ErrorMessage = "维修描述不能为空")]
    [MaxLength(500, ErrorMessage = "维修描述长度不能超过500个字符")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 优先级
    /// </summary>
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Normal;

    /// <summary>
    /// 报修日期
    /// </summary>
    [Required(ErrorMessage = "报修日期不能为空")]
    public DateTime ReportDate { get; set; }

    /// <summary>
    /// 预估费用（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "预估费用不能为负数")]
    public decimal? Cost { get; set; }

    /// <summary>
    /// 维修人员姓名
    /// </summary>
    [MaxLength(50, ErrorMessage = "维修人员姓名长度不能超过50个字符")]
    public string? RepairPerson { get; set; }

    /// <summary>
    /// 维修人员电话
    /// </summary>
    [Phone(ErrorMessage = "维修人员电话格式不正确")]
    [MaxLength(20, ErrorMessage = "维修人员电话长度不能超过20个字符")]
    public string? RepairPhone { get; set; }

    /// <summary>
    /// 图片（JSON数组）
    /// </summary>
    [MaxLength(4000, ErrorMessage = "图片数据长度不能超过4000个字符")]
    public string? Images { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 维修状态
    /// </summary>
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;
}
