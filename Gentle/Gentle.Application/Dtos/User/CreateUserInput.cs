using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 创建用户请求
/// </summary>
public class CreateUserInput
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [MinLength(2, ErrorMessage = "用户名至少2个字符")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(6, ErrorMessage = "密码至少6个字符")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [Required(ErrorMessage = "显示名称不能为空")]
    public string DisplayName { get; set; } = string.Empty;
}
