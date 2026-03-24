# 用户登录模块实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为二房东房源管理系统添加用户登录模块，支持账号密码登录和用户管理功能。

**Architecture:** 后端使用 Furion 框架 + JWT 认证，密码使用 BCrypt 哈希存储。前端改造现有 mock 登录为真实 API 调用。初始管理员通过 EF Core 种子数据创建。

**Tech Stack:** .NET 10, Furion, Entity Framework Core, SQLite, BCrypt.Net-Next, JWT, Vue 3, TypeScript, TDesign

---

## Task 1: 创建 User 实体

**Files:**
- Create: `Gentle/Gentle.Core/Entities/User.cs`

**Step 1: 创建 User 实体文件**

```csharp
using Furion.DatabaseAccessor;

namespace Gentle.Core.Entities;

/// <summary>
/// 用户实体
/// </summary>
public class User : Entity<int>
{
    /// <summary>
    /// 用户名（登录账号）
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码哈希
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginTime { get; set; }
}
```

**Step 2: 验证文件创建**

Run: `dotnet build Gentle/Gentle.Core`
Expected: Build succeeded

**Step 3: 提交**

```bash
git add Gentle/Gentle.Core/Entities/User.cs
git commit -m "feat: add User entity for authentication"
```

---

## Task 2: 配置 JWTSettings

**Files:**
- Modify: `Gentle/Gentle.Web.Entry/appsettings.json`

**Step 1: 添加 JWT 配置**

```json
{
  "$schema": "https://gitee.com/dotnetchina/Furion/raw/v4/schemas/v4/furion-schema.json",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AllowedHosts": "*",
  "JWTSettings": {
    "ValidateIssuerSigningKey": true,
    "IssuerSigningKey": "Gentle_Secret_Key_2024_Min_16_Chars",
    "ValidateIssuer": true,
    "ValidIssuer": "Gentle",
    "ValidateAudience": true,
    "ValidAudience": "Hans",
    "ValidateLifetime": true,
    "ExpiredTime": 1440
  }
}
```

**Step 2: 提交**

```bash
git add Gentle/Gentle.Web.Entry/appsettings.json
git commit -m "feat: add JWT settings configuration"
```

---

## Task 3: 添加 BCrypt.Net-Next 包

**Files:**
- Modify: `Gentle/Gentle.Application/Gentle.Application.csproj`

**Step 1: 添加 BCrypt 包引用**

Run: `cd Gentle && dotnet add Gentle.Application package BCrypt.Net-Next`

**Step 2: 验证安装**

Run: `cd Gentle && dotnet restore`
Expected: Restore succeeded

**Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Gentle.Application.csproj
git commit -m "feat: add BCrypt.Net-Next package for password hashing"
```

---

## Task 4: 创建 Auth DTO

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/Auth/LoginInput.cs`
- Create: `Gentle/Gentle.Application/Dtos/Auth/LoginOutput.cs`
- Create: `Gentle/Gentle.Application/Dtos/Auth/ProfileOutput.cs`

**Step 1: 创建 LoginInput**

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Auth;

/// <summary>
/// 登录请求
/// </summary>
public class LoginInput
{
    /// <summary>
    /// 账号
    /// </summary>
    [Required(ErrorMessage = "账号不能为空")]
    public string Account { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    public string Password { get; set; } = string.Empty;
}
```

**Step 2: 创建 LoginOutput**

```csharp
namespace Gentle.Application.Dtos.Auth;

/// <summary>
/// 登录响应
/// </summary>
public class LoginOutput
{
    /// <summary>
    /// JWT Token
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 过期时间（秒）
    /// </summary>
    public int ExpiresIn { get; set; }
}
```

**Step 3: 创建 ProfileOutput**

```csharp
namespace Gentle.Application.Dtos.Auth;

/// <summary>
/// 当前用户信息
/// </summary>
public class ProfileOutput
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
}
```

**Step 4: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: Build succeeded

**Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Auth/
git commit -m "feat: add Auth DTOs (LoginInput, LoginOutput, ProfileOutput)"
```

---

## Task 5: 创建 User DTO

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/User/UserDto.cs`
- Create: `Gentle/Gentle.Application/Dtos/User/CreateUserInput.cs`
- Create: `Gentle/Gentle.Application/Dtos/User/UpdateUserInput.cs`
- Create: `Gentle/Gentle.Application/Dtos/User/ResetPasswordInput.cs`

**Step 1: 创建 UserDto**

```csharp
namespace Gentle.Application.Dtos.User;

/// <summary>
/// 用户列表项
/// </summary>
public class UserDto
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginTime { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedTime { get; set; }
}
```

**Step 2: 创建 CreateUserInput**

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 创建用户请求
/// </summary>
public class CreateUserInput
{
    /// <summary>
    /// 用户名
    /// </summary>
    [Required(ErrorMessage = "用户名不能为空")]
    [MinLength(2, ErrorMessage = "用户名至少2个字符")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(6, ErrorMessage = "密码至少6个字符")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 显示名称
    /// </summary>
    [Required(ErrorMessage = "显示名称不能为空")]
    public string DisplayName { get; set; } = string.Empty;
}
```

**Step 3: 创建 UpdateUserInput**

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 更新用户请求
/// </summary>
public class UpdateUserInput
{
    /// <summary>
    /// 显示名称
    /// </summary>
    [Required(ErrorMessage = "显示名称不能为空")]
    public string DisplayName { get; set; } = string.Empty;
}
```

**Step 4: 创建 ResetPasswordInput**

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.User;

/// <summary>
/// 重置密码请求
/// </summary>
public class ResetPasswordInput
{
    /// <summary>
    /// 新密码
    /// </summary>
    [Required(ErrorMessage = "密码不能为空")]
    [MinLength(6, ErrorMessage = "密码至少6个字符")]
    public string NewPassword { get; set; } = string.Empty;
}
```

**Step 5: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: Build succeeded

**Step 6: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/User/
git commit -m "feat: add User DTOs (UserDto, CreateUserInput, UpdateUserInput, ResetPasswordInput)"
```

---

## Task 6: 实现 AuthAppService

**Files:**
- Create: `Gentle/Gentle.Application/Apps/AuthAppService.cs`

**Step 1: 创建 AuthAppService**

```csharp
using BCrypt.Net;
using Furion.DatabaseAccessor;
using Furion.DataEncryption;
using Furion.FriendlyException;
using Gentle.Application.Dtos.Auth;
using Gentle.Core.Entities;
using Microsoft.AspNetCore.Authorization;
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
        var jwtSettings = App.GetOptions<JWTSettingsOptions>();
        var expires = jwtSettings?.ExpiredTime ?? 1440;

        var token = JWTEncryption.Encrypt(jwtSettings, new Dictionary<string, object>
        {
            { "UserId", user.Id },
            { "Username", user.Username }
        });

        return new LoginOutput
        {
            Token = token,
            ExpiresIn = expires * 60 // 转换为秒
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
```

**Step 2: 添加 GlobalUsing（如需要）**

检查 `Gentle.Application/GlobalUsings.cs`，确保包含：
```csharp
global using System.Collections.Generic;
```

**Step 3: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: Build succeeded

**Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Apps/AuthAppService.cs
git commit -m "feat: implement AuthAppService (login, profile, logout)"
```

---

## Task 7: 实现 UserAppService

**Files:**
- Create: `Gentle/Gentle.Application/Apps/UserAppService.cs`

**Step 1: 创建 UserAppService**

```csharp
using BCrypt.Net;
using Furion.DatabaseAccessor;
using Furion.FriendlyException;
using Gentle.Application.Dtos.User;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.AspNetCore.Authorization;
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
```

**Step 2: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: Build succeeded

**Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Apps/UserAppService.cs
git commit -m "feat: implement UserAppService (CRUD, reset password, toggle)"
```

---

## Task 8: 添加初始管理员种子数据

**Files:**
- Modify: `Gentle/Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs`

**Step 1: 添加种子数据配置**

```csharp
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 User 种子数据
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "zhs",
            // gentle8023 的 BCrypt 哈希
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("gentle8023"),
            DisplayName = "管理员",
            IsEnabled = true,
            CreatedTime = DateTime.Parse("2024-01-01")
        });
    }
}
```

**Step 2: 添加 BCrypt 包引用到 EF Core 项目**

Run: `cd Gentle && dotnet add Gentle.EntityFramework.Core package BCrypt.Net-Next`

**Step 3: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: Build succeeded

**Step 4: 提交**

```bash
git add Gentle/Gentle.EntityFramework.Core/
git commit -m "feat: add initial admin user seed data"
```

---

## Task 9: 创建前端 Auth API

**Files:**
- Create: `Hans/src/api/auth.ts`
- Create: `Hans/src/api/model/authModel.ts`

**Step 1: 创建 authModel.ts**

```typescript
export interface LoginParams {
  account: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
}

export interface ProfileResult {
  id: number;
  username: string;
  displayName: string;
}
```

**Step 2: 创建 auth.ts**

```typescript
import type { LoginParams, LoginResult, ProfileResult } from '@/api/model/authModel';
import { request } from '@/utils/request';

const Api = {
  Login: '/auth/login',
  Profile: '/auth/profile',
  Logout: '/auth/logout',
};

export function login(data: LoginParams) {
  return request.post<LoginResult>({
    url: Api.Login,
    data,
  });
}

export function getProfile() {
  return request.get<ProfileResult>({
    url: Api.Profile,
  });
}

export function logout() {
  return request.post({
    url: Api.Logout,
  });
}
```

**Step 3: 提交**

```bash
git add Hans/src/api/auth.ts Hans/src/api/model/authModel.ts
git commit -m "feat: add frontend auth API"
```

---

## Task 10: 创建前端 User API

**Files:**
- Create: `Hans/src/api/user.ts`
- Create: `Hans/src/api/model/userModel.ts`

**Step 1: 创建 userModel.ts**

```typescript
export interface UserItem {
  id: number;
  username: string;
  displayName: string;
  isEnabled: boolean;
  lastLoginTime?: string;
  createdTime: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  displayName: string;
}

export interface UpdateUserParams {
  displayName: string;
}

export interface ResetPasswordParams {
  newPassword: string;
}
```

**Step 2: 创建 user.ts**

```typescript
import type { CreateUserParams, ResetPasswordParams, UpdateUserParams, UserItem } from '@/api/model/userModel';
import { request } from '@/utils/request';

const Api = {
  List: '/user',
  Detail: '/user',
  Create: '/user',
  Update: '/user',
  ResetPassword: '/user',
  Toggle: '/user',
};

export function getUserList() {
  return request.get<UserItem[]>({
    url: Api.List,
  });
}

export function getUserById(id: number) {
  return request.get<UserItem>({
    url: `${Api.Detail}/${id}`,
  });
}

export function createUser(data: CreateUserParams) {
  return request.post<UserItem>({
    url: Api.Create,
    data,
  });
}

export function updateUser(id: number, data: UpdateUserParams) {
  return request.put<UserItem>({
    url: `${Api.Update}/${id}`,
    data,
  });
}

export function resetPassword(id: number, data: ResetPasswordParams) {
  return request.put({
    url: `${Api.ResetPassword}/${id}/password`,
    data,
  });
}

export function toggleUser(id: number) {
  return request.put({
    url: `${Api.Toggle}/${id}/toggle`,
  });
}
```

**Step 3: 提交**

```bash
git add Hans/src/api/user.ts Hans/src/api/model/userModel.ts
git commit -m "feat: add frontend user management API"
```

---

## Task 11: 改造 userStore 调用真实 API

**Files:**
- Modify: `Hans/src/store/modules/user.ts`

**Step 1: 改造 user.ts**

```typescript
import { defineStore } from 'pinia';

import { getProfile, login, logout } from '@/api/auth';
import { usePermissionStore } from '@/store';
import type { UserInfo } from '@/types/interface';

const InitUserInfo: UserInfo = {
  name: '',
  roles: ['all'],
};

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async login(userInfo: { account: string; password: string }) {
      const res = await login({
        account: userInfo.account,
        password: userInfo.password,
      });
      this.token = res.token;
    },
    async getUserInfo() {
      const res = await getProfile();
      this.userInfo = {
        name: res.displayName,
        roles: ['all'],
      };
    },
    async logout() {
      await logout();
      this.token = '';
      this.userInfo = { ...InitUserInfo };
    },
  },
  persist: {
    afterRestore: () => {
      const permissionStore = usePermissionStore();
      permissionStore.initRoutes();
    },
    key: 'user',
    paths: ['token'],
  },
});
```

**Step 2: 验证 TypeScript 编译**

Run: `cd Hans && npm run build:type`
Expected: No errors

**Step 3: 提交**

```bash
git add Hans/src/store/modules/user.ts
git commit -m "feat: integrate real auth API in userStore"
```

---

## Task 12: 简化 Login.vue 组件

**Files:**
- Modify: `Hans/src/pages/login/components/Login.vue`

**Step 1: 简化登录组件**

```vue
<template>
  <t-form
    ref="form"
    class="item-container"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    @submit="onSubmit"
  >
    <t-form-item name="account">
      <t-input v-model="formData.account" size="large" placeholder="请输入账号">
        <template #prefix-icon>
          <t-icon name="user" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item name="password">
      <t-input
        v-model="formData.password"
        size="large"
        :type="showPsw ? 'text' : 'password'"
        clearable
        placeholder="请输入密码"
      >
        <template #prefix-icon>
          <t-icon name="lock-on" />
        </template>
        <template #suffix-icon>
          <t-icon :name="showPsw ? 'browse' : 'browse-off'" @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <div class="check-container remember-pwd">
      <t-checkbox v-model="formData.remember">{{ t('pages.login.remember') }}</t-checkbox>
    </div>

    <t-form-item class="btn-container">
      <t-button block size="large" type="submit"> {{ t('pages.login.signIn') }} </t-button>
    </t-form-item>
  </t-form>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { t } from '@/locales';
import { useUserStore } from '@/store';

const userStore = useUserStore();

const INITIAL_DATA = {
  account: '',
  password: '',
  remember: false,
};

const FORM_RULES: Record<string, FormRule[]> = {
  account: [{ required: true, message: t('pages.login.required.account'), type: 'error' }],
  password: [{ required: true, message: t('pages.login.required.password'), type: 'error' }],
};

const form = ref<FormInstanceFunctions>();
const formData = ref({ ...INITIAL_DATA });
const showPsw = ref(false);

const router = useRouter();
const route = useRoute();

const onSubmit = async (ctx: SubmitContext) => {
  if (ctx.validateResult === true) {
    try {
      await userStore.login(formData.value);

      MessagePlugin.success('登录成功');
      const redirect = route.query.redirect as string;
      const redirectUrl = redirect ? decodeURIComponent(redirect) : '/dashboard';
      router.push(redirectUrl);
    } catch (e: any) {
      console.log(e);
      MessagePlugin.error(e.message || '登录失败');
    }
  }
};
</script>

<style lang="less" scoped>
@import '../index.less';
</style>
```

**Step 2: 验证 TypeScript 编译**

Run: `cd Hans && npm run build:type`
Expected: No errors

**Step 3: 提交**

```bash
git add Hans/src/pages/login/components/Login.vue
git commit -m "feat: simplify Login.vue to account/password only"
```

---

## Task 13: 更新登录页面入口

**Files:**
- Modify: `Hans/src/pages/login/index.vue`

**Step 1: 移除登录类型切换**

查看 `index.vue`，移除扫码登录和手机登录的切换选项，只保留账号密码登录。

如果 `index.vue` 包含类型切换逻辑，需要简化为只显示 `Login.vue` 组件。

**Step 2: 提交**

```bash
git add Hans/src/pages/login/index.vue
git commit -m "feat: remove qrcode and phone login options"
```

---

## Task 14: 验证登录流程

**Step 1: 启动后端**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`
Expected: 服务启动在 http://localhost:5000

**Step 2: 启动前端**

Run: `cd Hans && npm run dev`
Expected: 前端启动在 http://localhost:3002

**Step 3: 测试登录**

1. 访问 http://localhost:3002
2. 使用初始账号登录：
   - 账号: `zhs`
   - 密码: `gentle8023`
3. 验证登录成功并跳转到 dashboard

**Step 4: 测试 API**

Run: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"account":"zhs","password":"gentle8023"}'`
Expected: 返回 `{ "token": "...", "expiresIn": 86400 }`

---

## Task 15: 最终提交

**Step 1: 检查所有变更**

Run: `git status`

**Step 2: 推送到远程（如需要）**

```bash
git push origin main
```

---

## 验收清单

- [ ] 后端 User 实体创建完成
- [ ] JWT 配置正确
- [ ] AuthAppService 登录接口返回 token
- [ ] UserAppService CRUD 接口可用
- [ ] 初始管理员 `zhs/gentle8023` 可登录
- [ ] 前端 auth.ts API 调用正常
- [ ] 前端 user.ts API 调用正常
- [ ] userStore 使用真实 API
- [ ] Login.vue 简化为账号密码登录
- [ ] 完整登录流程测试通过
