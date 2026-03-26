using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

using IndexAttribute = Microsoft.EntityFrameworkCore.IndexAttribute;

namespace Gentle.Core.Entities;

/// <summary>
/// 催收记录实体验证特性
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class CollectionRecordValidationAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is CollectionRecord record)
        {
            // 验证宽限截止日期：当结果为宽限时，应填写宽限截止日期
            if (record.Result == CollectResult.Grace && !record.GraceUntil.HasValue)
            {
                return new ValidationResult("催收结果为宽限时，必须填写宽限截止日期", new[] { nameof(record.GraceUntil) });
            }

            // 验证非宽限时，不应填写宽限截止日期
            if (record.Result != CollectResult.Grace && record.GraceUntil.HasValue)
            {
                return new ValidationResult("催收结果非宽限时，不应填写宽限截止日期", new[] { nameof(record.GraceUntil) });
            }

            // 验证宽限截止日期应晚于催收日期
            if (record.GraceUntil.HasValue && record.GraceUntil.Value <= record.CollectDate)
            {
                return new ValidationResult("宽限截止日期必须晚于催收日期", new[] { nameof(record.GraceUntil) });
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// 催收记录实体
/// </summary>
[CollectionRecordValidation]
[Table("collection_record")]
[Index(nameof(BillId))]
public class CollectionRecord : Entity<int>, IEntitySeedData<CollectionRecord>
{
    /// <summary>
    /// 账单ID
    /// </summary>
    [Required(ErrorMessage = "账单ID不能为空")]
    public int BillId { get; set; }

    /// <summary>
    /// 账单导航属性
    /// </summary>
    public Bill Bill { get; set; } = null!;

    /// <summary>
    /// 催收日期
    /// </summary>
    [Required(ErrorMessage = "催收日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime CollectDate { get; set; }

    /// <summary>
    /// 催收结果
    /// </summary>
    public CollectResult Result { get; set; }

    /// <summary>
    /// 宽限截止日期（仅当结果为宽限时有效）
    /// </summary>
    [Column(TypeName = "date")]
    public DateTime? GraceUntil { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<CollectionRecord> HasData(DbContext dbContext, Type dbContextLocator)
    {
        // 种子数据通过迁移脚本插入，避免 DateTimeOffset 时区问题
        return Array.Empty<CollectionRecord>();
    }
}
