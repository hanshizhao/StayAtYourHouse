using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 修改租约请求
/// </summary>
public class UpdateRentalRecordInput
{
    /// <summary>
    /// 入住日期
    /// </summary>
    [Required(ErrorMessage = "入住日期不能为空")]
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// 租期月数
    /// </summary>
    [Range(1, 36, ErrorMessage = "租期月数必须在1到36之间")]
    public int LeaseMonths { get; set; }

    /// <summary>
    /// 合同结束日期
    /// </summary>
    [Required(ErrorMessage = "合同结束日期不能为空")]
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 月租金
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "月租金必须大于0")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金不能为负数")]
    public decimal Deposit { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [StringLength(500, ErrorMessage = "备注不能超过500字")]
    public string? Remark { get; set; }
}
