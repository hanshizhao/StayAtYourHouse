namespace Gentle.Core.Enums;

/// <summary>
/// 还款渠道枚举
/// </summary>
public enum PaymentChannel
{
    /// <summary>
    /// 现金
    /// </summary>
    Cash = 0,

    /// <summary>
    /// 微信
    /// </summary>
    WeChat = 1,

    /// <summary>
    /// 支付宝
    /// </summary>
    Alipay = 2,

    /// <summary>
    /// 银行转账
    /// </summary>
    BankTransfer = 3
}
