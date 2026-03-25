using System;
using Gentle.Core.Enums;
using Gentle.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Gentle.Database.Migrations;

/// <summary>
/// 设计时 DbContext 工厂，用于 EF Core CLI 工具
/// 创建一个独立的 DbContext 避免运行时依赖
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<DesignTimeDbContext>
{
    public DesignTimeDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DesignTimeDbContext>();

        // MySQL 连接字符串
        var connectionString = "Server=47.118.90.88;Port=13306;Database=sayh_db;User=sayh_db_user;Password=rSARAGP6bNChActa;";

        // 使用 Oracle 官方 MySQL 提供商
        optionsBuilder.UseMySQL(connectionString);

        return new DesignTimeDbContext(optionsBuilder.Options);
    }
}

/// <summary>
/// 设计时专用 DbContext，仅用于生成迁移
/// </summary>
public class DesignTimeDbContext : DbContext
{
    public DesignTimeDbContext(DbContextOptions<DesignTimeDbContext> options) : base(options)
    {
    }

    // 实体 DbSet
    public DbSet<User> Users => Set<User>();
    public DbSet<Community> Communities => Set<Community>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<RentalRecord> RentalRecords => Set<RentalRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 User 实体
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("sys_user");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(200);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(50);
        });

        // 配置 User 种子数据
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "zhs",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("gentle8023"),
            DisplayName = "管理员",
            IsEnabled = true,
            CreatedTime = DateTime.Parse("2024-01-01")
        });

        // 配置 Community 实体
        modelBuilder.Entity<Community>(entity =>
        {
            entity.ToTable("community");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.PropertyPhone).HasMaxLength(20);
        });

        // 配置 Room 实体
        modelBuilder.Entity<Room>(entity =>
        {
            entity.ToTable("room");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Community).WithMany().HasForeignKey(e => e.CommunityId);
            entity.Property(e => e.Building).IsRequired().HasMaxLength(20);
            entity.Property(e => e.RoomNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.RoomType).HasMaxLength(20);
        });

        // 配置 Tenant 实体
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenant");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.IdCard).HasMaxLength(18);
            entity.Property(e => e.EmergencyContact).HasMaxLength(100);
        });

        // 配置 RentalRecord 实体
        modelBuilder.Entity<RentalRecord>(entity =>
        {
            entity.ToTable("rental_record");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Renter).WithMany().HasForeignKey(e => e.RenterId);
            entity.HasOne(e => e.Room).WithMany().HasForeignKey(e => e.RoomId);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.Property(e => e.CheckOutRemark).HasMaxLength(500);
        });
    }
}
