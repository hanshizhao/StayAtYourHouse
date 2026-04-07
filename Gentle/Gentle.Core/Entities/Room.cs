using System.Collections.Generic;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;

namespace Gentle.Core.Entities;

/// <summary>
/// 房间实体
/// </summary>
public class Room : Entity<int>
{
    /// <summary>
    /// 所属小区 ID
    /// </summary>
    public int CommunityId { get; set; }

    /// <summary>
    /// 所属小区
    /// </summary>
    public Community Community { get; set; } = null!;

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
    /// 房间类型（如：一室一厅、两室一厅）
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
    public RoomStatus Status { get; set; } = RoomStatus.Vacant;

    /// <summary>
    /// 合同图片路径
    /// </summary>
    public string? ContractImage { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 抄表记录集合
    /// </summary>
    public ICollection<MeterRecord> MeterRecords { get; set; } = new List<MeterRecord>();

    /// <summary>
    /// 水电账单集合
    /// </summary>
    public ICollection<UtilityBill> UtilityBills { get; set; } = new List<UtilityBill>();

    /// <summary>
    /// 维修记录集合
    /// </summary>
    public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();

    /// <summary>
    /// 房东租约（一对一）
    /// </summary>
    public LandlordLease? LandlordLease { get; set; }
}
