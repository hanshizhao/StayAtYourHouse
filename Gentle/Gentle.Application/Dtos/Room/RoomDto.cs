using System.ComponentModel.DataAnnotations;
using Gentle.Application.Dtos.LandlordLease;
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
    /// 出租价（月租金）
    /// </summary>
    public decimal RentPrice { get; set; }

    /// <summary>
    /// 利润（出租价 - 房东月租金）
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
    /// 电梯费（月固定费用）
    /// </summary>
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月固定费用）
    /// </summary>
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月固定费用）
    /// </summary>
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月固定费用）
    /// </summary>
    public decimal? OtherFees { get; set; }

    /// <summary>
    /// 房间状态
    /// </summary>
    public RoomStatus Status { get; set; }

    /// <summary>
    /// 是否已提交安居码
    /// </summary>
    public bool? AnjuCodeSubmitted { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string? TenantName { get; set; }

    /// <summary>
    /// 租赁开始日期
    /// </summary>
    public DateTime? RentalStartDate { get; set; }

    /// <summary>
    /// 租赁结束日期
    /// </summary>
    public DateTime? RentalEndDate { get; set; }

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

    /// <summary>
    /// 房东租约信息
    /// </summary>
    public LandlordLeaseDto? LandlordLease { get; set; }

    /// <summary>
    /// 房东租约状态
    /// </summary>
    public LeaseStatus LandlordLeaseStatus { get; set; }

    /// <summary>
    /// 房东租约过期天数（正数=已过期天数，负数=距到期天数）
    /// </summary>
    public int? LandlordLeaseExpiredDays { get; set; }

    /// <summary>
    /// 租客租约状态
    /// </summary>
    public LeaseStatus TenantLeaseStatus { get; set; }

    /// <summary>
    /// 租客租约过期天数（正数=已过期天数，负数=距到期天数）
    /// </summary>
    public int? TenantLeaseExpiredDays { get; set; }

    /// <summary>
    /// 租客月租金
    /// </summary>
    public decimal? TenantMonthlyRent { get; set; }
}

/// <summary>
/// 房间列表查询参数
/// </summary>
public class RoomListInput
{
    /// <summary>
    /// 小区ID
    /// </summary>
    public int? CommunityId { get; set; }

    /// <summary>
    /// 房间状态
    /// </summary>
    public RoomStatus? Status { get; set; }

    /// <summary>
    /// 是否有租约异常
    /// </summary>
    public bool? HasLeaseAlert { get; set; }

    /// <summary>
    /// 页码（从1开始）
    /// </summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页数量
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// 房间列表分页结果
/// </summary>
public class RoomListResult
{
    /// <summary>
    /// 房间列表
    /// </summary>
    public List<RoomDto> List { get; set; } = [];

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; }
}
