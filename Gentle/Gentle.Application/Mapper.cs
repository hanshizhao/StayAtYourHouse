using Gentle.Application.Dtos.User;
using Gentle.Core.Entities;
using Mapster;

namespace Gentle.Application;

/// <summary>
/// Mapster 映射配置
/// </summary>
public class Mapper : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // User -> UserDto 映射配置
        config.NewConfig<User, UserDto>();
    }
}
