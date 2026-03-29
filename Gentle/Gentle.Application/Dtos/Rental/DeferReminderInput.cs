using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 宽限提醒输入
/// </summary>
/// <remarks>
/// 用于提交催收提醒的宽限请求。
/// </remarks>
public class DeferReminderInput
{
    /// <summary>
    /// 宽限至日期
    /// </summary>
    /// <remarks>
    /// 必填，必须是将来的日期。
    /// </remarks>
    [Required(ErrorMessage = "宽限日期不能为空")]
    public DateTime DeferredToDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    /// <remarks>
    /// 可选，记录宽限原因。
    /// </remarks>
    public string? Remark { get; set; }
}
