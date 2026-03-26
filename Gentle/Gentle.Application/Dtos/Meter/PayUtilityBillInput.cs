using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Meter;

/// <summary>
/// 水电账单收款输入
/// </summary>
public class PayUtilityBillInput
{
    /// <summary>
    /// 账单ID
    /// </summary>
    [Required(ErrorMessage = "账单ID不能为空")]
    public int BillId { get; set; }

    /// <summary>
    /// 实收金额（可选，默认为总金额）
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "实收金额必须大于0")]
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
