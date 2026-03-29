using Gentle.Core.Enums;
using Gentle.Application.Dtos.Meter;
using Gentle.Application.Dtos.Rental;

namespace Gentle.Application.Dtos.Todo;

/// <summary>
/// 待办事项 DTO
/// </summary>
/// <remarks>
/// 统一的水电费和催收房租待办数据结构。
/// 水电费待办使用 Amount, Period, UtilityBill 字段。
/// 催收房租待办使用 TenantName, MonthlyRent, DeferralCount, RentalReminder 字段。
/// </remarks>
public class TodoItemDto
{
    /// <summary>
    /// 待办类型
    /// </summary>
    public TodoType Type { get; set; }

    /// <summary>
    /// 待办ID
    /// </summary>
    /// <remarks>
    /// 水电费待办为 UtilityBill.Id，催收房租待办为 RentalReminder.Id
    /// </remarks>
    public int Id { get; set; }

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    #region 水电费待办专用字段

    /// <summary>
    /// 账单金额（水电费专用）
    /// </summary>
    public decimal? Amount { get; set; }

    /// <summary>
    /// 账单周期（水电费专用）
    /// </summary>
    public string? Period { get; set; }

    /// <summary>
    /// 水电账单详情（水电费专用）
    /// </summary>
    public UtilityBillDto? UtilityBill { get; set; }

    #endregion

    #region 催收房租待办专用字段

    /// <summary>
    /// 租客姓名（催收房租专用）
    /// </summary>
    public string? TenantName { get; set; }

    /// <summary>
    /// 月租金（催收房租专用）
    /// </summary>
    public decimal? MonthlyRent { get; set; }

    /// <summary>
    /// 宽限次数（催收房租专用）
    /// </summary>
    public int DeferralCount { get; set; }

    /// <summary>
    /// 催收提醒详情（催收房租专用）
    /// </summary>
    public RentalReminderDto? RentalReminder { get; set; }

    #endregion

    /// <summary>
    /// 统一的创建时间（用于排序）
    /// </summary>
    /// <remarks>
    /// 水电费待办返回 UtilityBill.CreatedTime，催收房租待办返回 RentalReminder.CreatedTime。
    /// </remarks>
    public DateTimeOffset CreatedTime => Type == TodoType.Utility
        ? UtilityBill?.CreatedTime ?? DateTimeOffset.MinValue
        : RentalReminder?.CreatedTime ?? DateTimeOffset.MinValue;
}
