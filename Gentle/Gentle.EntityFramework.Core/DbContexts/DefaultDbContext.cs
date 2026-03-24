using System;
using Furion.DatabaseAccessor;
using Gentle.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gentle.EntityFramework.Core;

[AppDbContext("Gentle", DbProvider.Sqlite)]
public class DefaultDbContext : AppDbContext<DefaultDbContext>
{
    public DefaultDbContext(DbContextOptions<DefaultDbContext> options) : base(options)
    {
        // SQLite 自动创建表
        Database.EnsureCreated();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 User 种子数据
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "zhs",
            // gentle8023 的 BCrypt 哈希
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("gentle8023"),
            DisplayName = "管理员",
            IsEnabled = true,
            CreatedTime = DateTime.Parse("2024-01-01")
        });
    }
}
