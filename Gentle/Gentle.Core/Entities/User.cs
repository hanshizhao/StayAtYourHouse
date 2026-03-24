using System;
using Furion.DatabaseAccessor;

namespace Gentle.Core.Entities;

/// <summary>
/// 用户实体
/// </summary>
public class User : Entity<int>
{
    /// <summary>
    /// 用户名（登录账号）
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginTime { get; set; }
}
