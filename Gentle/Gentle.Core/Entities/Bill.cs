using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 账单实体验证特性
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class BillValidationAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is Bill bill)
        {
            // 验证账单周期结束日期应晚于开始日期
            if (bill.PeriodEnd <= bill.PeriodStart)
            {
                return new ValidationResult("账单周期结束日期必须晚于开始日期", new[] { nameof(bill.PeriodEnd) });
            }

            // 验证应收日期应在账单周期内或之后
            if (bill.DueDate < bill.PeriodStart)
            {
                return new ValidationResult("应收日期不能早于账单周期开始日期", new[] { nameof(bill.DueDate) });
            }

            // 验证实收金额不能超过总金额
            if (bill.PaidAmount.HasValue && bill.PaidAmount.Value > bill.TotalAmount)
            {
                return new ValidationResult("实收金额不能超过总金额", new[] { nameof(bill.PaidAmount) });
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// 账单实体
/// </summary>
[BillValidation]
[Table("bill")]
public class Bill : Entity<int>, IEntitySeedData<Bill>
{
    /// <summary>
    /// 租住记录ID
    /// </summary>
    [Required(ErrorMessage = "租住记录ID不能为空")]
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 租住记录导航属性
    /// </summary>
    public RentalRecord RentalRecord { get; set; } = null!;

    /// <summary>
    /// 账单周期开始日期
    /// </summary>
    [Required(ErrorMessage = "账单周期开始日期不能为空")]
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 账单周期结束日期
    /// </summary>
    [Required(ErrorMessage = "账单周期结束日期不能为空")]
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 应收日期
    /// </summary>
    [Required(ErrorMessage = "应收日期不能为空")]
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 租金金额
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "租金金额必须大于0")]
    public decimal RentAmount { get; set; }

    /// <summary>
    /// 水费
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水费不能为负数")]
    public decimal? WaterFee { get; set; }

    /// <summary>
    /// 电费
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电费不能为负数")]
    public decimal? ElectricFee { get; set; }

    /// <summary>
    /// 总金额
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "总金额必须大于0")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 账单状态
    /// </summary>
    public BillStatus Status { get; set; } = BillStatus.Pending;

    /// <summary>
    /// 实收金额
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "实收金额不能为负数")]
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
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<Bill> HasData(DbContext dbContext, Type dbContextLocator)
    {
        // 种子数据通过迁移脚本插入，避免 DateTimeOffset 时区问题
        return Array.Empty<Bill>();
    }
}
