using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 水电账单实体验证特性
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class UtilityBillValidationAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is UtilityBill bill)
        {
            // 验证账单周期结束日期应晚于开始日期
            if (bill.PeriodEnd <= bill.PeriodStart)
            {
                return new ValidationResult("账单周期结束日期必须晚于开始日期", new[] { nameof(bill.PeriodEnd) });
            }

            // 验证实收金额不能超过总金额
            if (bill.PaidAmount.HasValue && bill.PaidAmount.Value > bill.TotalAmount)
            {
                return new ValidationResult("实收金额不能超过总金额", new[] { nameof(bill.PaidAmount) });
            }

            // 验证收款日期仅在已收取状态下有效
            if (bill.Status != UtilityBillStatus.Paid && bill.PaidDate.HasValue)
            {
                return new ValidationResult("仅已收取状态可填写收款日期", new[] { nameof(bill.PaidDate) });
            }

            // 验证已收取状态必须有实收金额
            if (bill.Status == UtilityBillStatus.Paid && !bill.PaidAmount.HasValue)
            {
                return new ValidationResult("已收取状态必须填写实收金额", new[] { nameof(bill.PaidAmount) });
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// 水电账单实体
/// </summary>
[UtilityBillValidation]
[Table("utility_bill")]
[Index(nameof(RoomId))]
[Index(nameof(MeterRecordId))]
[Index(nameof(RentalRecordId))]
public class UtilityBill : Entity<int>, IEntitySeedData<UtilityBill>
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
    /// 租客ID（可选，如果房间当前无租客则可能为空）
    /// </summary>
    public int? BillTenantId { get; set; }

    /// <summary>
    /// 租客导航属性
    /// </summary>
    public Tenant? BillTenant { get; set; }

    /// <summary>
    /// 租住记录ID（关联活跃租约）
    /// </summary>
    public int? RentalRecordId { get; set; }

    /// <summary>
    /// 租住记录导航属性
    /// </summary>
    public RentalRecord? RentalRecord { get; set; }

    /// <summary>
    /// 抄表记录ID
    /// </summary>
    [Required(ErrorMessage = "抄表记录ID不能为空")]
    public int MeterRecordId { get; set; }

    /// <summary>
    /// 抄表记录导航属性
    /// </summary>
    public MeterRecord MeterRecord { get; set; } = null!;

    /// <summary>
    /// 账单周期开始日期
    /// </summary>
    [Required(ErrorMessage = "账单周期开始日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 账单周期结束日期
    /// </summary>
    [Required(ErrorMessage = "账单周期结束日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 用水量（吨）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "用水量不能为负数")]
    public decimal WaterUsage { get; set; }

    /// <summary>
    /// 用电量（度）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "用电量不能为负数")]
    public decimal ElectricUsage { get; set; }

    /// <summary>
    /// 水费（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水费不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal WaterFee { get; set; }

    /// <summary>
    /// 电费（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电费不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal ElectricFee { get; set; }

    /// <summary>
    /// 总金额（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "总金额不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 账单状态
    /// </summary>
    public UtilityBillStatus Status { get; set; } = UtilityBillStatus.Pending;

    /// <summary>
    /// 实收金额（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "实收金额不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// 收款日期
    /// </summary>
    [Column(TypeName = "date")]
    public DateTime? PaidDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<UtilityBill> HasData(DbContext dbContext, Type dbContextLocator)
    {
        // 种子数据通过迁移脚本插入，避免 DateTimeOffset 时区问题
        return Array.Empty<UtilityBill>();
    }
}
