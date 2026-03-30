using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Rental;

/// <summary>
/// 续租输入
/// </summary>
/// <remarks>
/// 用于提交租赁续租请求。
/// </remarks>
public class RenewRentalInput
{
    /// <summary>
    /// 租期月数
    /// </summary>
    /// <remarks>
    /// 必填，1-36个月。
    /// </remarks>
    [Range(1, 36, ErrorMessage = "租期月数必须在1到36之间")]
    public int LeaseMonths { get; set; } = 1;

    /// <summary>
    /// 月租金
    /// </summary>
    /// <remarks>
    /// 必填，必须大于 0。
    /// </remarks>
    [Required(ErrorMessage = "月租金不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "月租金必须大于 0")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 合同到期日
    /// </summary>
    /// <remarks>
    /// 必填，新合同的到期日期。
    /// </remarks>
    [Required(ErrorMessage = "合同到期日不能为空")]
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 合同图片
    /// </summary>
    /// <remarks>
    /// 可选，合同照片 URL。
    /// </remarks>
    public string? ContractImage { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    /// <remarks>
    /// 可选，续租备注信息。
    /// </remarks>
    public string? Remark { get; set; }
}
