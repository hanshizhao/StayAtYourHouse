using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 欠款实体
/// </summary>
[Table("debt")]
[Index(nameof(TenantId))]
public class Debt : Entity<int>, IEntitySeedData<Debt>
{
    /// <summary>
    /// 关联租客 ID
    /// </summary>
    [Required]
    public int TenantId { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 欠款状态
    /// </summary>
    [Required]
    public DebtStatus Status { get; set; } = DebtStatus.Ongoing;

    /// <summary>
    /// 欠款说明
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500)]
    public string? Remark { get; set; }

    /// <summary>
    /// 关联租客
    /// </summary>
    public Tenant Tenant { get; set; } = null!;

    /// <summary>
    /// 还款记录集合
    /// </summary>
    public ICollection<DebtRepayment> Repayments { get; set; } = new List<DebtRepayment>();

    /// <summary>
    /// 种子数据
    /// </summary>
    public IEnumerable<Debt> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return Array.Empty<Debt>();
    }
}
