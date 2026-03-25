namespace Gentle.Core.Enums;

/// <summary>
/// 账单状态枚举
/// </summary>
public enum BillStatus
{
    /// <summary>
    /// 待收款
    /// </summary>
    Pending = 0,

    /// <summary>
    /// 宽限中
    /// </summary>
    Grace = 1,

    /// <summary>
    /// 已收款
    /// </summary>
    Paid = 2,

    /// <summary>
    /// 已逾期
    /// </summary>
    Overdue = 3
}
