using BCrypt.Net;
using Furion.DatabaseAccessor;
using Furion.FriendlyException;
using Gentle.Application.Dtos.User;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Apps;

/// <summary>
/// 用户管理服务
/// </summary>
[ApiDescriptionSettings("System", Name = "User", Order = 2)]
public class UserAppService : IDynamicApiController
{
    private readonly IRepository<User> _userRepository;

    public UserAppService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// 获取用户列表
    /// </summary>
    public async Task<List<UserDto>> GetList()
    {
        var users = await _userRepository.AsQueryable(false)
            .OrderByDescending(u => u.CreatedTime)
            .ToListAsync();

        return users.Adapt<List<UserDto>>();
    }

    /// <summary>
    /// 获取用户详情
    /// </summary>
    public async Task<UserDto> GetById(int id)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        return user.Adapt<UserDto>();
    }

    /// <summary>
    /// 创建用户
    /// </summary>
    public async Task<UserDto> Create(CreateUserInput input)
    {
        // 检查用户名是否已存在
        var exists = await _userRepository.AsQueryable(false)
            .AnyAsync(u => u.Username == input.Username);

        if (exists)
        {
            throw Oops.Oh($"用户名 {input.Username} 已存在");
        }

        var user = new User
        {
            Username = input.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.Password),
            DisplayName = input.DisplayName,
            IsEnabled = true
        };

        var entry = await _userRepository.InsertAsync(user);
        return entry.Entity.Adapt<UserDto>();
    }

    /// <summary>
    /// 更新用户
    /// </summary>
    public async Task<UserDto> Update(int id, UpdateUserInput input)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        user.DisplayName = input.DisplayName;

        var entry = await _userRepository.UpdateAsync(user);
        return entry.Entity.Adapt<UserDto>();
    }

    /// <summary>
    /// 重置密码
    /// </summary>
    public async Task ResetPassword(int id, ResetPasswordInput input)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.NewPassword);
        await _userRepository.UpdateAsync(user);
    }

    /// <summary>
    /// 禁用/启用用户
    /// </summary>
    public async Task Toggle(int id)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        user.IsEnabled = !user.IsEnabled;
        await _userRepository.UpdateAsync(user);
    }
}
