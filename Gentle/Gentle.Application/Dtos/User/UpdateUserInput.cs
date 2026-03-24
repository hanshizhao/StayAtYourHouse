using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 更新用户请求
/// </summary>
public class UpdateUserInput
{
    /// <summary>
    /// 显示名称
    /// </summary>
    [Required(ErrorMessage = "显示名称不能为空")]
    public string DisplayName { get; set; } = string.Empty;
}
