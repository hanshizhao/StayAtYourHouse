using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Tenant;

/// <summary>
/// 更新租客请求
/// </summary>
public class UpdateTenantInput
{
    /// <summary>
    /// 租客ID
    /// </summary>
    [Required(ErrorMessage = "租客ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    [Required(ErrorMessage = "租客姓名不能为空")]
    [MaxLength(50, ErrorMessage = "租客姓名长度不能超过50个字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 联系电话
    /// </summary>
    [Required(ErrorMessage = "联系电话不能为空")]
    [MaxLength(20, ErrorMessage = "联系电话长度不能超过20个字符")]
    [RegularExpression(@"^1[3-9]\d{9}$", ErrorMessage = "手机号格式不正确")]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 身份证号
    /// </summary>
    [MinLength(15, ErrorMessage = "身份证号长度不能少于15个字符")]
    [MaxLength(18, ErrorMessage = "身份证号长度不能超过18个字符")]
    [RegularExpression(@"^(\d{15}|\d{18}|\d{17}[\dXx])$", ErrorMessage = "身份证号格式不正确")]
    public string? IdCard { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    public Gender Gender { get; set; }

    /// <summary>
    /// 紧急联系人
    /// </summary>
    [MaxLength(100, ErrorMessage = "紧急联系人长度不能超过100个字符")]
    public string? EmergencyContact { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
}
