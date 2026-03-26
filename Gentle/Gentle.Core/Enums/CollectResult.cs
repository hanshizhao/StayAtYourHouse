namespace Gentle.Core.Enums;

/// <summary>
/// 催收结果枚举
/// </summary>
public enum CollectResult
{
    /// <summary>
    /// 催收成功
    /// </summary>
    Success = 0,

    /// <summary>
    /// 宽限处理
    /// </summary>
    Grace = 1,

    /// <summary>
    /// 拒绝支付
    /// </summary>
    Refuse = 2
}
