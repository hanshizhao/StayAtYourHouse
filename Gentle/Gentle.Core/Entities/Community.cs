namespace Gentle.Core.Entities;

/// <summary>
/// 小区实体
/// </summary>
public class Community
{
    /// <summary>
    /// 主键ID
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
}
