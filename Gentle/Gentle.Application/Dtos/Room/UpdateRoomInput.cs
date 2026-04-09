using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Room;

/// <summary>
/// 更新房间请求
/// </summary>
public class UpdateRoomInput
{
    /// <summary>
    /// 房间ID
    /// </summary>
    [Required(ErrorMessage = "房间ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 所属小区ID
    /// </summary>
    [Required(ErrorMessage = "所属小区不能为空")]
    public int CommunityId { get; set; }

    /// <summary>
    /// 楼栋号
    /// </summary>
    [Required(ErrorMessage = "楼栋号不能为空")]
    [MaxLength(50, ErrorMessage = "楼栋号长度不能超过50个字符")]
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// 房间号
    /// </summary>
    [Required(ErrorMessage = "房间号不能为空")]
    [MaxLength(50, ErrorMessage = "房间号长度不能超过50个字符")]
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>
    /// 出租价（月租金）
    /// </summary>
    [Required(ErrorMessage = "出租价不能为空")]
    [Range(0, double.MaxValue, ErrorMessage = "出租价必须大于等于0")]
    public decimal RentPrice { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金必须大于等于0")]
    public decimal? Deposit { get; set; }

    /// <summary>
    /// 水费单价（元/吨）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水费单价必须大于等于0")]
    public decimal? WaterPrice { get; set; }

    /// <summary>
    /// 电费单价（元/度）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电费单价必须大于等于0")]
    public decimal? ElectricPrice { get; set; }

    /// <summary>
    /// 电梯费（月固定费用）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电梯费必须大于等于0")]
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月固定费用）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "物业费必须大于等于0")]
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月固定费用）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "网络费必须大于等于0")]
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月固定费用）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "其他费用必须大于等于0")]
    public decimal? OtherFees { get; set; }

    /// <summary>
    /// 房间状态
    /// </summary>
    public RoomStatus Status { get; set; }

    /// <summary>
    /// 合同图片路径
    /// </summary>
    public string? ContractImage { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}
