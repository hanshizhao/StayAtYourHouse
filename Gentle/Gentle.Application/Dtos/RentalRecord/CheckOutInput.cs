using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 退租请求
/// </summary>
public class CheckOutInput
{
    /// <summary>
    /// 租住记录ID
    /// </summary>
    [Required(ErrorMessage = "租住记录ID不能为空")]
    public int RentalRecordId { get; set; }

    /// <summary>
    /// 退租日期
    /// </summary>
    [Required(ErrorMessage = "退租日期不能为空")]
    public DateTime CheckOutDate { get; set; }

    /// <summary>
    /// 押金处理方式
    /// </summary>
    [Required(ErrorMessage = "押金处理方式不能为空")]
    public DepositStatus DepositStatus { get; set; }

    /// <summary>
    /// 押金抵扣金额（当押金状态为 Deducted 时使用）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金抵扣金额不能为负数")]
    public decimal? DepositDeduction { get; set; }

    /// <summary>
    /// 抵扣说明
    /// </summary>
    public string? DeductionNote { get; set; }

    /// <summary>
    /// 退租备注
    /// </summary>
    public string? CheckOutRemark { get; set; }
}
