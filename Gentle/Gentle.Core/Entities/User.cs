using System;
using System.Collections.Generic;
using Furion.DatabaseAccessor;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 用户实体
/// </summary>
public class User : Entity<int>, IEntitySeedData<User>
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

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<User> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return new[]
        {
            new User
            {
                Id = 1,
                Username = "zhs",
                // gentle8023 的 BCrypt 哈希
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("gentle8023"),
                DisplayName = "管理员",
                IsEnabled = true,
                CreatedTime = DateTime.Parse("2024-01-01")
            }
        };
    }
}
