using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.LandlordLease;

/// <summary>
/// 房东租约输出 DTO
/// </summary>
public class LandlordLeaseDto
{
    /// <summary>
    /// 租约ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 房东姓名
    /// </summary>
    public string LandlordName { get; set; } = string.Empty;

    /// <summary>
    /// 房东电话
    /// </summary>
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
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 付款方式
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; }

    /// <summary>
    /// 付款方式文本
    /// </summary>
    public string PaymentMethodText => PaymentMethod switch
    {
        PaymentMethod.Monthly => "月付",
        PaymentMethod.Quarterly => "季付",
        PaymentMethod.SemiAnnual => "半年付",
        PaymentMethod.Annual => "年付",
        PaymentMethod.Custom => "自定义",
        _ => "未知"
    };

    /// <summary>
    /// 押金金额
    /// </summary>
    public decimal? Deposit { get; set; }

    /// <summary>
    /// 押金月数
    /// </summary>
    public int? DepositMonths { get; set; }

    /// <summary>
    /// 水费单价（元/吨）
    /// </summary>
    public decimal? WaterPrice { get; set; }

    /// <summary>
    /// 电费单价（元/度）
    /// </summary>
    public decimal? ElectricPrice { get; set; }

    /// <summary>
    /// 电梯费（月）
    /// </summary>
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    public decimal? OtherFees { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }

    /// <summary>
    /// 所属房间信息
    /// </summary>
    public string? RoomInfo { get; set; }
}
