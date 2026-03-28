using Gentle.Application.Dtos.Bill;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 租住记录 DTO
/// </summary>
public class RentalRecordDto
{
    /// <summary>
    /// 记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租客ID
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 入住日期
    /// </summary>
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// 租期类型
    /// </summary>
    public LeaseType LeaseType { get; set; }

    /// <summary>
    /// 租期类型文本
    /// </summary>
    public string LeaseTypeText => LeaseType switch
    {
        LeaseType.Monthly => "月租",
        LeaseType.HalfYear => "半年租",
        LeaseType.Yearly => "年租",
        _ => "未知"
    };

    /// <summary>
    /// 合同结束日期
    /// </summary>
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 月租金
    /// </summary>
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    public decimal Deposit { get; set; }

    /// <summary>
    /// 押金状态
    /// </summary>
    public DepositStatus DepositStatus { get; set; }

    /// <summary>
    /// 押金状态文本
    /// </summary>
    public string DepositStatusText => DepositStatus switch
    {
        DepositStatus.Received => "已收取",
        DepositStatus.Refunded => "已退还",
        DepositStatus.Deducted => "已抵扣",
        _ => "未知"
    };

    /// <summary>
    /// 押金抵扣金额
    /// </summary>
    public decimal? DepositDeduction { get; set; }

    /// <summary>
    /// 租住状态
    /// </summary>
    public RentalStatus Status { get; set; }

    /// <summary>
    /// 租住状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        RentalStatus.Active => "在租中",
        RentalStatus.Terminated => "已终止",
        _ => "未知"
    };

    /// <summary>
    /// 退租日期
    /// </summary>
    public DateTime? CheckOutDate { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 退租备注
    /// </summary>
    public string? CheckOutRemark { get; set; }

    /// <summary>
    /// 关联账单列表
    /// </summary>
    public List<BillDto>? Bills { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
