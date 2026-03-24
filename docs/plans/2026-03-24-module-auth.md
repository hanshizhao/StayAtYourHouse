# 用户登录模块设计

## 概述

为二房东房源管理系统添加用户登录模块，支持账号密码登录和用户管理功能。

## 需求

- 登录方式：账号密码
- 用户存储：数据库
- 用户管理：基础 CRUD（查看、新增、编辑、禁用、重置密码）

## 数据模型

### User 实体

路径：`Gentle.Core/Entities/User.cs`

```csharp
public class User : Entity<int>
{
    /// <summary>用户名（登录账号）</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>密码哈希</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>显示名称</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>是否启用</summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>最后登录时间</summary>
    public DateTime? LastLoginTime { get; set; }
}
```

设计要点：
- 密码存储 BCrypt 哈希，不明文存储
- `IsEnabled` 用于禁用用户而非删除（软删除语义）
- 不需要角色字段（单用户场景，后续可扩展）

## 后端服务

### 目录结构

```
Gentle.Application/
├── Apps/
│   └── AuthAppService.cs      # 登录/登出（公开接口）
│   └── UserAppService.cs      # 用户管理（需认证）
├── Dtos/
│   └── Auth/
│       └── LoginInput.cs      # 登录请求
│       └── LoginOutput.cs     # 登录响应（返回 token）
│   └── User/
│       └── UserDto.cs         # 用户列表项
│       └── CreateUserInput.cs # 创建用户
│       └── UpdateUserInput.cs # 更新用户
```

### API 设计

| 接口 | 方法 | 路径 | 认证 |
|------|------|------|------|
| 登录 | POST | `/api/auth/login` | 否 |
| 登出 | POST | `/api/auth/logout` | 是 |
| 获取当前用户信息 | GET | `/api/auth/profile` | 是 |
| 用户列表 | GET | `/api/user` | 是 |
| 创建用户 | POST | `/api/user` | 是 |
| 更新用户 | PUT | `/api/user/{id}` | 是 |
| 重置密码 | PUT | `/api/user/{id}/password` | 是 |
| 禁用/启用 | PUT | `/api/user/{id}/toggle` | 是 |

### 登录流程

1. 前端发送 `{ account, password }`
2. 后端验证账号密码
3. 生成 JWT token 返回 `{ token, expiresIn }`

## 前端改造

### 需要修改的文件

```
Hans/src/
├── api/
│   └── auth.ts              # 新增：登录 API
│   └── user.ts              # 新增：用户管理 API
├── store/modules/
│   └── user.ts              # 修改：调用真实 API
├── pages/login/components/
│   └── Login.vue            # 修改：移除扫码/手机登录选项
```

### auth.ts API 定义

```typescript
// 登录请求
export function login(data: { account: string; password: string }) {
  return request.post<{ token: string }>('/auth/login', data)
}

// 获取当前用户信息
export function getProfile() {
  return request.get<UserInfo>('/auth/profile')
}
```

### userStore.login() 改造

```typescript
async login(userInfo: { account: string; password: string }) {
  const res = await login(userInfo)  // 调用真实 API
  this.token = res.token
}
```

### Login.vue 简化

- 移除扫码登录、手机登录的切换选项
- 只保留账号密码表单
- 保留"记住我"复选框（可选功能）

## JWT 配置

### appsettings.json

```json
{
  "JWTSettings": {
    "ValidateIssuerSigningKey": true,
    "IssuerSigningKey": "你的密钥至少16个字符",
    "ValidateIssuer": true,
    "ValidIssuer": "Gentle",
    "ValidateAudience": true,
    "ValidAudience": "Hans",
    "ValidateLifetime": true,
    "ExpiredTime": 1440
  }
}
```

说明：
- `ExpiredTime: 1440` = 24 小时有效期
- 密钥建议用环境变量覆盖，不硬编码

### 初始管理员

首次启动时自动创建默认管理员：
- 用户名：`zhs`
- 密码：`gentle8023`
- 通过 EF Core 的 `HasData()` 种子数据实现

### JwtHandler

```csharp
public override Task<bool> PipelineAsync(...)
{
    // 已被 JWT 中间件验证通过的请求，直接返回 true
    return Task.FromResult(true);
}
```

说明：Furion 的 JWT 中间件已自动验证 token 有效性，JwtHandler 只需处理额外的授权逻辑（当前场景不需要）。

## 实现步骤

1. **后端 - 数据层**
   - 创建 `User` 实体
   - 配置 `DbContext`
   - 添加数据库迁移

2. **后端 - 服务层**
   - 配置 JWTSettings
   - 创建 Auth DTO（LoginInput、LoginOutput）
   - 创建 User DTO（UserDto、CreateUserInput、UpdateUserInput）
   - 实现 `AuthAppService`（登录、登出、获取当前用户）
   - 实现 `UserAppService`（CRUD + 重置密码）

3. **前端 - API 层**
   - 创建 `auth.ts` API
   - 创建 `user.ts` API

4. **前端 - Store 层**
   - 改造 `userStore.login()` 调用真实 API

5. **前端 - UI 层**
   - 简化 `Login.vue`，移除扫码/手机登录

6. **验证**
   - 测试登录流程
   - 测试用户管理 CRUD
