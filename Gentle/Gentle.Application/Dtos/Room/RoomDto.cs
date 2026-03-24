using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Room;

/// <summary>
/// 房间列表项
/// </summary>
public class RoomDto
{
    /// <summary>
    /// 房间ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 所属小区ID
    /// </summary>
    public int CommunityId { get; set; }

    /// <summary>
    /// 所属小区名称
    /// </summary>
    public string CommunityName { get; set; } = string.Empty;

    /// <summary>
    /// 楼栋号
    /// </summary>
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// 房间号
    /// </summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }

    /// <summary>
    /// 成本价（月租金成本）
    /// </summary>
    public decimal CostPrice { get; set; }

    /// <summary>
    /// 出租价（月租金）
    /// </summary>
    public decimal RentPrice { get; set; }

    /// <summary>
    /// 利润（出租价 - 成本价）
    /// </summary>
    public decimal Profit { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    public decimal? Deposit { get; set; }

    /// <summary>
    /// 水费单价（元/吨）
    /// </summary>
    public decimal? WaterPrice { get; set; }

    /// <summary>
    /// 电费单价（元/度）
    /// </summary>
    public decimal? ElectricPrice { get; set; }

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

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
