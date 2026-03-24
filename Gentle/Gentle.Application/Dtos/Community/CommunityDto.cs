namespace Gentle.Application.Dtos.Community;

/// <summary>
/// 小区列表项
/// </summary>
public class CommunityDto
{
    /// <summary>
    /// 小区ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 小区名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 小区地址
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// 物业电话
    /// </summary>
    public string? PropertyPhone { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}
