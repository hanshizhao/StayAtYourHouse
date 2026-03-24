namespace Gentle.Application.Dtos.Auth;

/// <summary>
/// 登录响应
/// </summary>
public class LoginOutput
{
    /// <summary>
    /// JWT Token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 过期时间（秒）
    /// </summary>
    public int ExpiresIn { get; set; }
}
