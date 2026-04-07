using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Maintenance;

/// <summary>
/// 完成维修输入
/// </summary>
public class CompleteMaintenanceInput
{
    /// <summary>
    /// 实际费用（元）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "实际费用不能为负数")]
    public decimal? ActualCost { get; set; }

    /// <summary>
    /// 完成备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
