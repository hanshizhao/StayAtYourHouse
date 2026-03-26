namespace Gentle.Core.Enums;

/// <summary>
/// 水电账单状态
/// </summary>
public enum UtilityBillStatus
{
    /// <summary>
    /// 待收取
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 已收取
    /// </summary>
    Paid = 1,

    /// <summary>
    /// 已合并到房租账单
    /// </summary>
    Merged = 2
}
