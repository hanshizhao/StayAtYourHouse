using BCrypt.Net;
using Furion.DatabaseAccessor;
using Furion.DataEncryption;
using Furion.FriendlyException;
using Gentle.Application.Dtos.Auth;
using Gentle.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Apps;

/// <summary>
/// 认证服务
/// </summary>
[ApiDescriptionSettings("Auth", Name = "Auth", Order = 1)]
public class AuthAppService : IDynamicApiController
{
    private readonly IRepository<User> _userRepository;

    public AuthAppService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// 登录
    /// </summary>
    [AllowAnonymous]
    public async Task<LoginOutput> Login(LoginInput input)
    {
        // 查找用户
        var user = await _userRepository.AsQueryable(false)
            .FirstOrDefaultAsync(u => u.Username == input.Account);

        if (user == null)
        {
            throw Oops.Oh("账号或密码错误");
        }

        // 验证密码
        if (!BCrypt.Net.BCrypt.Verify(input.Password, user.PasswordHash))
        {
            throw Oops.Oh("账号或密码错误");
        }

        // 检查是否禁用
        if (!user.IsEnabled)
        {
            throw Oops.Oh("账号已被禁用");
        }

        // 更新最后登录时间
        user.LastLoginTime = DateTime.Now;
        await _userRepository.UpdateAsync(user);

        // 生成 JWT Token
        var token = JWTEncryption.Encrypt(new Dictionary<string, object>
        {
            { "UserId", user.Id },
            { "Username", user.Username }
        });

        return new LoginOutput
        {
            Token = token,
            ExpiresIn = 1440 * 60 // 24小时，转换为秒
        };
    }

    /// <summary>
    /// 获取当前用户信息
    /// </summary>
    public async Task<ProfileOutput> Profile()
    {
        var userId = App.User?.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            throw Oops.Oh("未登录");
        }

        var user = await _userRepository.FindAsync(int.Parse(userId));
        if (user == null)
        {
            throw Oops.Oh("用户不存在");
        }

        return new ProfileOutput
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName
        };
    }

    /// <summary>
    /// 登出
    /// </summary>
    public Task Logout()
    {
        // JWT 无状态，客户端删除 token 即可
        return Task.CompletedTask;
    }
}
