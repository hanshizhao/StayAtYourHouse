using System.Text.Json.Serialization;

namespace Gentle.Application.Dtos.Report;

/// <summary>
/// 房间利润排行
/// </summary>
public class RoomProfitRankingDto
{
    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 小区名称
    /// </summary>
    public string CommunityName { get; set; } = string.Empty;

    /// <summary>
    /// 楼栋
    /// </summary>
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// 房间号
    /// </summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>
    /// 完整房间信息
    /// </summary>
    [JsonIgnore]
    public string RoomInfo => $"{CommunityName} {Building}栋 {RoomNumber}";

    /// <summary>
    /// 房间状态
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 房东租约月租金（成本）
    /// </summary>
    public decimal? LandlordLeaseMonthlyRent { get; set; }

    /// <summary>
    /// 出租价（月租金）
    /// </summary>
    public decimal RentPrice { get; set; }

    /// <summary>
    /// 月利润（出租价 - 房东月租金）
    /// </summary>
    public decimal MonthlyProfit { get; set; }

    /// <summary>
    /// 利润率（百分比）
    /// </summary>
    public decimal ProfitRate => RentPrice > 0
        ? Math.Round(MonthlyProfit / RentPrice * 100, 2)
        : 0;

    /// <summary>
    /// 当前租客姓名（如有）
    /// </summary>
    public string? CurrentTenantName { get; set; }

    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }

    /// <summary>
    /// 是否亏损
    /// </summary>
    public bool IsLoss => MonthlyProfit < 0;
}
