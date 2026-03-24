using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 重置密码请求
/// </summary>
public class ResetPasswordInput
{
    /// <summary>
    /// 新密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(6, ErrorMessage = "密码至少6个字符")]
    public string NewPassword { get; set; } = string.Empty;
}
