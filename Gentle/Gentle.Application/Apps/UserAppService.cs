using BCrypt.Net;
using Furion.DatabaseAccessor;
using Furion.FriendlyException;
using Gentle.Application.Dtos.User;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Apps;

/// <summary>den
/// 用户管理服务
/// </summary>
[ApiDescriptionSettings("System", Name = "User", Order = 2)]
public class UserAppService : IDynamicApiController
{
    private readonly IRepository<User> _userRepository;

    /// <summary>
    /// 受保护的用户名列表（种子数据用户，不可修改/删除/禁用）
    /// </summary>
    private static readonly HashSet<string> ProtectedUsernames = new() { "zhs" };

    public UserAppService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// 检查用户是否受保护
    /// </summary>
    /// <param name="user">用户实体</param>
    /// <exception cref="SystemException">如果用户受保护则抛出异常</exception>
    private static void CheckProtectedUser(User user)
    {
        if (ProtectedUsernames.Contains(user.Username))
        {
            throw Oops.Oh($"想害我？");
        }
    }

    /// <summary>
    /// 获取用户列表
    /// </summary>
    /// <returns>用户列表</returns>
    [HttpGet("")]
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
    /// <param name="id">用户ID</param>
    /// <returns>用户详情</returns>
    [HttpGet("{id}")]
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
    /// <param name="input">创建用户输入</param>
    /// <returns>创建的用户</returns>
    [HttpPost("")]
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
            IsEnabled = true,
            CreatedTime = DateTimeOffset.Now
        };

        var entry = await _userRepository.InsertAsync(user);
        return entry.Entity.Adapt<UserDto>();
    }

    /// <summary>
    /// 更新用户
    /// </summary>
    /// <param name="id">用户ID</param>
    /// <param name="input">更新用户输入</param>
    /// <returns>更新后的用户</returns>
    [HttpPut("{id}")]
    public async Task<UserDto> Update(int id, UpdateUserInput input)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        CheckProtectedUser(user);

        user.DisplayName = input.DisplayName;

        var entry = await _userRepository.UpdateAsync(user);
        return entry.Entity.Adapt<UserDto>();
    }

    /// <summary>
    /// 重置密码
    /// </summary>
    /// <param name="id">用户ID</param>
    /// <param name="input">重置密码输入</param>
    [HttpPut("{id}/password")]
    public async Task ResetPassword(int id, ResetPasswordInput input)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        CheckProtectedUser(user);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(input.NewPassword);
        await _userRepository.UpdateAsync(user);
    }

    /// <summary>
    /// 禁用/启用用户
    /// </summary>
    /// <param name="id">用户ID</param>
    [HttpPut("{id}/toggle")]
    public async Task Toggle(int id)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        CheckProtectedUser(user);

        user.IsEnabled = !user.IsEnabled;
        await _userRepository.UpdateAsync(user);
    }

    /// <summary>
    /// 删除用户
    /// </summary>
    /// <param name="id">用户ID</param>
    [HttpDelete("{id}")]
    public async Task Delete(int id)
    {
        var user = await _userRepository.FindAsync(id);
        if (user == null)
        {
            throw Oops.Oh($"用户 {id} 不存在");
        }

        CheckProtectedUser(user);

        await _userRepository.DeleteAsync(user);
    }
}
