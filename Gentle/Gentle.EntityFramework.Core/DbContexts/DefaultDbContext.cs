using Furion.DatabaseAccessor;
using Microsoft.EntityFrameworkCore;

namespace Gentle.EntityFramework.Core;

[AppDbContext("Gentle", DbProvider.Sqlite)]
public class DefaultDbContext : AppDbContext<DefaultDbContext>
{
    public DefaultDbContext(DbContextOptions<DefaultDbContext> options) : base(options)
    {
    }
}
