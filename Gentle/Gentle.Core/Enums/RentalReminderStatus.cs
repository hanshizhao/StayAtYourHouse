namespace Gentle.Core.Enums;

/// <summary>
/// 催收提醒状态
/// </summary>
public enum RentalReminderStatus
{
    /// <summary>
    /// 待处理
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 已宽限
    /// </summary>
    Deferred = 1,

    /// <summary>
    /// 已完成
    /// </summary>
    Completed = 2
}
