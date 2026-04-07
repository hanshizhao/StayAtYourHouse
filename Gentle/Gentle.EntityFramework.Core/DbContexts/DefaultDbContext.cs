using Furion.DatabaseAccessor;
using Gentle.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gentle.EntityFramework.Core;

/// <summary>
/// 默认数据库上下文（MySQL - Oracle 官方提供商）
/// </summary>
[AppDbContext("Gentle", DbProvider.MySqlOfficial)]
public class DefaultDbContext : AppDbContext<DefaultDbContext>
{
    public DefaultDbContext(DbContextOptions<DefaultDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        // 配置迁移程序集
        optionsBuilder.UseMySQL(
            DbProvider.GetConnectionString<DefaultDbContext>(),
            mysqlOptions => mysqlOptions.MigrationsAssembly("Gentle.Database.Migrations")
        );
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 Room 与 LandlordLease 一对一关系
        modelBuilder.Entity<Room>()
            .HasOne(r => r.LandlordLease)
            .WithOne(l => l.Room)
            .HasForeignKey<LandlordLease>(l => l.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
