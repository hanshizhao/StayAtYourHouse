using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Gentle.Core.Entities;

/// <summary>
/// 暂收提醒实体
/// </summary>
[Table("rental_reminder")]
public class RentalReminder : Entity<int>
{
    /// <summary>
    /// 租赁记录ID
    /// </summary>
    [Required(ErrorMessage = "租赁记录ID不能为空")]
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 提醒日期
    /// </summary>
    [Required(ErrorMessage = "提醒日期不能为空")]
    public DateTime ReminderDate { get; set; }

    /// <summary>
    /// 提醒状态
    /// </summary>
    public RentalReminderStatus Status { get; set; } = RentalReminderStatus.Pending;

    // TODO: FEAT-060 - 在创建 RentalDeferral 实体后取消注释
    // public ICollection<RentalDeferral> Deferrals { get; set; } = new List<RentalDeferral>();

    /// <summary>
    /// 租赁记录导航属性
    /// </summary>
    public RentalRecord RentalRecord { get; set; } = null!;

    /// <summary>
    /// 房间信息（通过 RentalRecord 关联获取，不映射到数据库）
    /// </summary>
    [NotMapped]
    public Room? Room => RentalRecord?.Room;

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
