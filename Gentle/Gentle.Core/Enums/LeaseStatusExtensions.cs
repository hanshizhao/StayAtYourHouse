namespace Gentle.Core.Enums;

/// <summary>
/// LeaseStatus 枚举扩展方法
/// </summary>
public static class LeaseStatusExtensions
{
    /// <summary>
    /// 获取租约状态的中文文本
    /// </summary>
    public static string ToText(this LeaseStatus status)
    {
        return status switch
        {
            LeaseStatus.Normal => "正常",
            LeaseStatus.ExpiringSoon => "即将到期",
            LeaseStatus.Expired => "已过期",
            LeaseStatus.None => "无租约",
            _ => "未知"
        };
    }
}
