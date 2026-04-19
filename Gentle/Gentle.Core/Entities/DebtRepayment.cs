using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 还款记录实体
/// </summary>
[Table("debt_repayment")]
[Index(nameof(DebtId))]
public class DebtRepayment : Entity<int>, IEntitySeedData<DebtRepayment>
{
    /// <summary>
    /// 关联欠款 ID
    /// </summary>
    [Required]
    public int DebtId { get; set; }

    /// <summary>
    /// 本次还款金额
    /// </summary>
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// 还款日期
    /// </summary>
    [Required]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// 还款方式
    /// </summary>
    [Required]
    public PaymentChannel PaymentChannel { get; set; } = PaymentChannel.Cash;

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500)]
    public string? Remark { get; set; }

    /// <summary>
    /// 关联欠款
    /// </summary>
    public Debt Debt { get; set; } = null!;

    /// <summary>
    /// 种子数据
    /// </summary>
    public IEnumerable<DebtRepayment> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return Array.Empty<DebtRepayment>();
    }
}
