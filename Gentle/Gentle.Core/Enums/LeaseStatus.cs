namespace Gentle.Core.Enums;

/// <summary>
/// 租约状态枚举
/// </summary>
public enum LeaseStatus
{
    /// <summary>
    /// 正常
    /// </summary>
    Normal = 0,

    /// <summary>
    /// 即将到期（7天内）
    /// </summary>
    ExpiringSoon = 1,

    /// <summary>
    /// 已过期
    /// </summary>
    Expired = 2,

    /// <summary>
    /// 无租约
    /// </summary>
    None = 3
}
