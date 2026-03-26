using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Furion.DatabaseAccessor;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 抄表记录实体验证特性
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class MeterRecordValidationAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is MeterRecord record)
        {
            // 验证本次水表读数应大于等于上次读数
            if (record.WaterReading < record.PrevWaterReading)
            {
                return new ValidationResult("本次水表读数不能小于上次读数", new[] { nameof(record.WaterReading) });
            }

            // 验证本次电表读数应大于等于上次读数
            if (record.ElectricReading < record.PrevElectricReading)
            {
                return new ValidationResult("本次电表读数不能小于上次读数", new[] { nameof(record.ElectricReading) });
            }

            // 验证用水量计算正确（允许微小误差）
            var expectedWaterUsage = record.WaterReading - record.PrevWaterReading;
            if (Math.Abs(record.WaterUsage - expectedWaterUsage) > 0.01m)
            {
                return new ValidationResult($"用水量计算错误，应为 {expectedWaterUsage}", new[] { nameof(record.WaterUsage) });
            }

            // 验证用电量计算正确（允许微小误差）
            var expectedElectricUsage = record.ElectricReading - record.PrevElectricReading;
            if (Math.Abs(record.ElectricUsage - expectedElectricUsage) > 0.01m)
            {
                return new ValidationResult($"用电量计算错误，应为 {expectedElectricUsage}", new[] { nameof(record.ElectricUsage) });
            }
        }

        return ValidationResult.Success;
    }
}

/// <summary>
/// 抄表记录实体
/// </summary>
[MeterRecordValidation]
[Table("meter_record")]
[Index(nameof(RoomId))]
public class MeterRecord : Entity<int>, IEntitySeedData<MeterRecord>
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
    /// 抄表日期
    /// </summary>
    [Required(ErrorMessage = "抄表日期不能为空")]
    [Column(TypeName = "date")]
    public DateTime MeterDate { get; set; }

    /// <summary>
    /// 本次水表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水表读数不能为负数")]
    public decimal WaterReading { get; set; }

    /// <summary>
    /// 本次电表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电表读数不能为负数")]
    public decimal ElectricReading { get; set; }

    /// <summary>
    /// 上次水表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "上次水表读数不能为负数")]
    public decimal PrevWaterReading { get; set; }

    /// <summary>
    /// 上次电表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "上次电表读数不能为负数")]
    public decimal PrevElectricReading { get; set; }

    /// <summary>
    /// 本次用水量（吨）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "用水量不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal WaterUsage { get; set; }

    /// <summary>
    /// 本次用电量（度）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "用电量不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
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
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }

    /// <summary>
    /// 关联的水电账单
    /// </summary>
    public UtilityBill? UtilityBill { get; set; }

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<MeterRecord> HasData(DbContext dbContext, Type dbContextLocator)
    {
        // 种子数据通过迁移脚本插入，避免 DateTimeOffset 时区问题
        return Array.Empty<MeterRecord>();
    }
}
