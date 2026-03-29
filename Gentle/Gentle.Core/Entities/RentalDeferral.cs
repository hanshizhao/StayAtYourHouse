using Furion.DatabaseAccessor;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Gentle.Core.Entities;

/// <summary>
/// 租赁宽限记录实体
/// 记录租赁提醒的宽限历史
/// </summary>
[Table("rental_deferral")]
public class RentalDeferral : Entity<int>
{
    /// <summary>
    /// 租赁提醒ID
    /// </summary>
    [Required(ErrorMessage = "租赁提醒ID不能为空")]
    public int RentalReminderId { get; set; }

    /// <summary>
    /// 原始提醒日期
    /// </summary>
    [Required(ErrorMessage = "原始提醒日期不能为空")]
    public DateTime OriginalReminderDate { get; set; }

    /// <summary>
    /// 宽限后日期
    /// </summary>
    [Required(ErrorMessage = "宽限后日期不能为空")]
    public DateTime DeferredToDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 租赁提醒导航属性
    /// </summary>
    public RentalReminder RentalReminder { get; set; } = null!;
}
