using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 维修记录实体
/// </summary>
[Table("maintenance_record")]
[Index(nameof(RoomId))]
public class MaintenanceRecord : Entity<int>
{
    /// <summary>
    /// 房间ID
    /// </summary>
    [Required(ErrorMessage = "房间ID不能为空")]
    public int RoomId { get; set; }

    /// <summary>
    /// 房间导航属性
    /// </summary>
    public Room Room { get; set; } = null!;

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
    /// 维修状态
    /// </summary>
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending;

    /// <summary>
    /// 报修日期
    /// </summary>
    [Required(ErrorMessage = "报修日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime ReportDate { get; set; }

    /// <summary>
    /// 完成日期
    /// </summary>
    [Column(TypeName = "date")]
    public DateTime? CompletedDate { get; set; }

    /// <summary>
    /// 维修费用（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "维修费用不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
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
    /// 维修图片（JSON数组，格式：["url1", "url2"]）
    /// </summary>
    [MaxLength(4000, ErrorMessage = "维修图片数据长度不能超过4000个字符")]
    public string? Images { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
