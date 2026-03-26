using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 租住记录实体验证特性
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class RentalRecordValidationAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is RentalRecord record)
        {
            // 验证退租日期应晚于入住日期
            if (record.CheckOutDate.HasValue && record.CheckOutDate.Value <= record.CheckInDate)
            {
                return new ValidationResult("退租日期必须晚于入住日期", new[] { nameof(record.CheckOutDate) });
            }

            // 验证合同结束日期应晚于入住日期
            if (record.ContractEndDate <= record.CheckInDate)
            {
                return new ValidationResult("合同结束日期必须晚于入住日期", new[] { nameof(record.ContractEndDate) });
            }

            // 验证押金抵扣金额不应超过押金
            if (record.DepositDeduction.HasValue && record.DepositDeduction.Value > record.Deposit)
            {
                return new ValidationResult("押金抵扣金额不能超过押金金额", new[] { nameof(record.DepositDeduction) });
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// 租住记录实体
/// </summary>
[RentalRecordValidation]
[Table("rental_record")]
public class RentalRecord : Entity<int>, IEntitySeedData<RentalRecord>
{
    /// <summary>
    /// 租客ID
    /// </summary>
    [Required(ErrorMessage = "租客ID不能为空")]
    public int RenterId { get; set; }

    /// <summary>
    /// 租客导航属性
    /// </summary>
    public Tenant Renter { get; set; } = null!;

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
    /// 入住日期
    /// </summary>
    [Required(ErrorMessage = "入住日期不能为空")]
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// 租期类型
    /// </summary>
    public LeaseType LeaseType { get; set; } = LeaseType.Monthly;

    /// <summary>
    /// 合同结束日期
    /// </summary>
    [Required(ErrorMessage = "合同结束日期不能为空")]
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 月租金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "月租金不能为负数")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金不能为负数")]
    public decimal Deposit { get; set; }

    /// <summary>
    /// 押金状态
    /// </summary>
    public DepositStatus DepositStatus { get; set; } = DepositStatus.Received;

    /// <summary>
    /// 押金抵扣金额
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金抵扣金额不能为负数")]
    public decimal? DepositDeduction { get; set; }

    /// <summary>
    /// 租住状态
    /// </summary>
    public RentalStatus Status { get; set; } = RentalStatus.Active;

    /// <summary>
    /// 退租日期（如有）
    /// </summary>
    public DateTime? CheckOutDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 退租备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "退租备注长度不能超过500个字符")]
    public string? CheckOutRemark { get; set; }

    /// <summary>
    /// 账单集合
    /// </summary>
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<RentalRecord> HasData(DbContext dbContext, Type dbContextLocator)
    {
        // 种子数据通过迁移脚本插入，避免 DateTimeOffset 时区问题
        return Array.Empty<RentalRecord>();
    }
}
