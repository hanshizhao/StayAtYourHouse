using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Bill;

/// <summary>
/// 催收请求 DTO
/// </summary>
public class CollectInput
{
    /// <summary>
    /// 账单ID
    /// </summary>
    [Required(ErrorMessage = "账单ID不能为空")]
    public int BillId { get; set; }

    /// <summary>
    /// 催收结果
    /// </summary>
    [Required(ErrorMessage = "催收结果不能为空")]
    public CollectResult Result { get; set; }

    /// <summary>
    /// 实收金额（仅当催收成功时有效）
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "实收金额必须大于0")]
    public decimal? PaidAmount { get; set; }

    /// <summary>
    /// 宽限截止日期（仅当催收结果为宽限时有效）
    /// </summary>
    public DateTime? GraceUntil { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
