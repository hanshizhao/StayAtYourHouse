namespace Gentle.Core.Enums;

/// <summary>
/// 押金状态枚举
/// </summary>
public enum DepositStatus
{
    /// <summary>
    /// 已收取
    /// </summary>
    Received = 0,

    /// <summary>
    /// 已退还
    /// </summary>
    Refunded = 1,

    /// <summary>
    /// 已抵扣
    /// </summary>
    Deducted = 2
}
