using Furion.DatabaseAccessor;
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
}
