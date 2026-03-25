using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 入住请求
/// </summary>
public class CheckInInput
{
    /// <summary>
    /// 租客ID
    /// </summary>
    [Required(ErrorMessage = "租客ID不能为空")]
    public int TenantId { get; set; }

    /// <summary>
    /// 房间ID
    /// </summary>
    [Required(ErrorMessage = "房间ID不能为空")]
    public int RoomId { get; set; }

    /// <summary>
    /// 入住日期
    /// </summary>
    [Required(ErrorMessage = "入住日期不能为空")]
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// 租期类型
    /// </summary>
    public LeaseType LeaseType { get; set; } = LeaseType.Monthly;

    /// <summary>
    /// 月租金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "月租金不能为负数")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金不能为负数")]
    public decimal Deposit { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}
