using Furion;
using System.Reflection;

namespace Gentle.Web.Entry;

public class SingleFilePublish : ISingleFilePublish
{
    public Assembly[] IncludeAssemblies()
    {
        return Array.Empty<Assembly>();
    }

    public string[] IncludeAssemblyNames()
    {
        return new[]
        {
            "Gentle.Application",
            "Gentle.Core",
            "Gentle.EntityFramework.Core",
            "Gentle.Web.Core"
        };
    }
}