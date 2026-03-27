using System.Text.Json.Serialization;

namespace Gentle.Application.Dtos.Report;

/// <summary>
/// 房源概览统计
/// </summary>
public class HousingOverviewDto
{
    /// <summary>
    /// 总房源数
    /// </summary>
    public int TotalRooms { get; set; }

    /// <summary>
    /// 已出租数量
    /// </summary>
    public int RentedCount { get; set; }

    /// <summary>
    /// 空置数量
    /// </summary>
    public int VacantCount { get; set; }

    /// <summary>
    /// 装修中数量
    /// </summary>
    public int RenovatingCount { get; set; }

    /// <summary>
    /// 出租率（百分比）
    /// </summary>
    public decimal OccupancyRate => TotalRooms > 0
        ? Math.Round((decimal)RentedCount / TotalRooms * 100, 2)
        : 0;

    /// <summary>
    /// 小区统计
    /// </summary>
    public List<CommunityStatsDto> CommunityStats { get; set; } = new();

    /// <summary>
    /// 空置房源列表
    /// </summary>
    public List<VacantRoomDto> VacantRooms { get; set; } = new();
}

/// <summary>
/// 小区统计
/// </summary>
public class CommunityStatsDto
{
    /// <summary>
    /// 小区ID
    /// </summary>
    public int CommunityId { get; set; }

    /// <summary>
    /// 小区名称
    /// </summary>
    public string CommunityName { get; set; } = string.Empty;

    /// <summary>
    /// 总房源数
    /// </summary>
    public int TotalRooms { get; set; }

    /// <summary>
    /// 已出租数量
    /// </summary>
    public int RentedCount { get; set; }

    /// <summary>
    /// 空置数量
    /// </summary>
    public int VacantCount { get; set; }

    /// <summary>
    /// 装修中数量
    /// </summary>
    public int RenovatingCount { get; set; }

    /// <summary>
    /// 出租率
    /// </summary>
    public decimal OccupancyRate => TotalRooms > 0
        ? Math.Round((decimal)RentedCount / TotalRooms * 100, 2)
        : 0;
}

/// <summary>
/// 空置房源
/// </summary>
public class VacantRoomDto
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
    /// 出租价
    /// </summary>
    public decimal RentPrice { get; set; }

    /// <summary>
    /// 成本价
    /// </summary>
    public decimal CostPrice { get; set; }

    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }

    /// <summary>
    /// 空置天数
    /// </summary>
    public int? VacantDays { get; set; }
}
