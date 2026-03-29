using Gentle.Application.Dtos.Rental;

namespace Gentle.Application.Services;

/// <summary>
/// 催收提醒服务接口
/// </summary>
/// <remarks>
/// 提供催收提醒的宽限、续租和宽限记录查询功能。
/// </remarks>
public interface IRentalReminderService : ITransient
{
    /// <summary>
    /// 宽限催收提醒
    /// </summary>
    /// <param name="reminderId">催收提醒ID</param>
    /// <param name="input">宽限输入参数</param>
    /// <remarks>
    /// 创建宽限记录，更新提醒状态为 Deferred，并创建新的催收提醒。
    /// </remarks>
    Task DeferAsync(int reminderId, DeferReminderInput input);

    /// <summary>
    /// 续租处理
    /// </summary>
    /// <param name="reminderId">催收提醒ID</param>
    /// <param name="input">续租输入参数</param>
    /// <returns>新租赁记录ID</returns>
    /// <remarks>
    /// 创建新的租赁记录，继承押金，更新原租赁记录状态为已完成。
    /// </remarks>
    Task<int> RenewAsync(int reminderId, RenewRentalInput input);

    /// <summary>
    /// 获取宽限记录列表
    /// </summary>
    /// <param name="reminderId">催收提醒ID</param>
    /// <returns>宽限记录列表结果</returns>
    Task<DeferralListResult> GetDeferralsAsync(int reminderId);
}
