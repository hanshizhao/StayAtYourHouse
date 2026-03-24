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
}
