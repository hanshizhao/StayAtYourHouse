using Furion;
using Microsoft.Extensions.DependencyInjection;

namespace Gentle.EntityFramework.Core;

public class Startup : AppStartup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddDatabaseAccessor(options =>
        {
            options.AddDbPool<DefaultDbContext>();
        }, "Gentle.Database.Migrations");
    }
}
