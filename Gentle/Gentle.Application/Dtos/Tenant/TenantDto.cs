using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Tenant;

/// <summary>
/// 租客列表项
/// </summary>
public class TenantDto
{
    /// <summary>
    /// 租客ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 联系电话
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 身份证号
    /// </summary>
    public string? IdCard { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    public Gender Gender { get; set; }

    /// <summary>
    /// 性别文本
    /// </summary>
    public string GenderText => Gender == Gender.Male ? "男" : "女";

    /// <summary>
    /// 紧急联系人
    /// </summary>
    public string? EmergencyContact { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
