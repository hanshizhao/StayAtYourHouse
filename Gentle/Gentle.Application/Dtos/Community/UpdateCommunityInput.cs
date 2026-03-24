using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Community;

/// <summary>
/// 更新小区请求
/// </summary>
public class UpdateCommunityInput
{
    /// <summary>
    /// 小区ID
    /// </summary>
    [Required(ErrorMessage = "小区ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 小区名称
    /// </summary>
    [Required(ErrorMessage = "小区名称不能为空")]
    [MaxLength(100, ErrorMessage = "小区名称长度不能超过100个字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 小区地址
    /// </summary>
    [MaxLength(200, ErrorMessage = "地址长度不能超过200个字符")]
    public string? Address { get; set; }

    /// <summary>
    /// 物业电话
    /// </summary>
    [MaxLength(20, ErrorMessage = "电话长度不能超过20个字符")]
    public string? PropertyPhone { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}
