using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.LandlordLease;

/// <summary>
/// 更新房东租约请求
/// </summary>
public class UpdateLandlordLeaseInput
{
    /// <summary>
    /// 租约ID
    /// </summary>
    [Required(ErrorMessage = "租约ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 房东姓名
    /// </summary>
    [Required(ErrorMessage = "房东姓名不能为空")]
    [MaxLength(50, ErrorMessage = "房东姓名长度不能超过50个字符")]
    public string LandlordName { get; set; } = string.Empty;

    /// <summary>
    /// 房东电话
    /// </summary>
    [Phone(ErrorMessage = "房东电话格式不正确")]
    [MaxLength(20, ErrorMessage = "房东电话长度不能超过20个字符")]
    public string? LandlordPhone { get; set; }

    /// <summary>
    /// 租约开始日期
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// 租约结束日期
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// 月租金（支付给房东的金额）
    /// </summary>
    [Required(ErrorMessage = "月租金不能为空")]
    [Range(0, double.MaxValue, ErrorMessage = "月租金不能为负数")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 付款方式
    /// </summary>
    [Required(ErrorMessage = "付款方式不能为空")]
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Monthly;

    /// <summary>
    /// 押金金额
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金金额不能为负数")]
    public decimal? Deposit { get; set; }

    /// <summary>
    /// 押金月数
    /// </summary>
    [Range(0, 36, ErrorMessage = "押金月数必须在0到36之间")]
    public int? DepositMonths { get; set; }

    /// <summary>
    /// 水费单价（元/吨）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水费单价不能为负数")]
    public decimal? WaterPrice { get; set; }

    /// <summary>
    /// 电费单价（元/度）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电费单价不能为负数")]
    public decimal? ElectricPrice { get; set; }

    /// <summary>
    /// 电梯费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电梯费不能为负数")]
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "物业费不能为负数")]
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "网络费不能为负数")]
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "其他费用不能为负数")]
    public decimal? OtherFees { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}
