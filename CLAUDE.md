# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 语言设置

请用中文作答。

## 项目概述

这是一个包含全栈 Web 应用的 monorepo：

- **Hans/** - Vue 3 前端（基于 TDesign 的管理后台）
- **Gentle/** - .NET 10 后端（Furion 框架）

## 命令

### Hans（前端）

```bash
cd Hans

# 开发
npm run dev           # 在 3002 端口启动开发服务器

# 构建
npm run build         # 生产环境构建（含类型检查）
npm run build:test    # 测试环境构建

# 代码检查
npm run lint          # 运行 ESLint
npm run lint:fix      # 自动修复 ESLint 问题
npm run stylelint     # 运行 Stylelint
npm run stylelint:fix # 自动修复 Stylelint 问题

# 类型检查
npm run build:type    # 仅 TypeScript 类型检查（不输出文件）
```

### Gentle（后端）

```bash
cd Gentle

# 运行 API 服务器
dotnet run --project Gentle.Web.Entry

# 构建
dotnet build

# Entity Framework 数据库迁移
# 注意：必须指定 --startup-project 参数，让 EF Core 从依赖注入中获取 DbContext
dotnet ef migrations add <MigrationName> --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
dotnet ef migrations list --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```

## 架构

### 前端（Hans）

- **框架**: Vue 3 + Vite + TypeScript
- **UI 组件库**: TDesign Vue Next
- **状态管理**: Pinia（带持久化插件）
- **路由**: Vue Router，路由文件按模块组织在 `src/router/modules/`
- **HTTP 请求**: 自定义 Axios 封装，位于 `src/utils/request/`
- **国际化**: Vue i18n，语言包位于 `src/locales/lang/`

关键目录：

- `src/pages/` - 页面组件，按功能组织（dashboard、list、form 等）
- `src/layouts/` - 布局组件（header、sidebar、content）
- `src/store/modules/` - Pinia 状态仓库（user、permission、setting、tabs-router）
- `src/api/` - API 服务函数及对应的类型定义

API 响应格式要求 `{ code: 0, data: T }` 结构。

## 开发规范

### 前端

- 所有新代码使用 TypeScript
- Vue 单文件组件块顺序：`<template>` → `<script>` → `<style scoped>`
- ESLint 使用 `@antfu/eslint-config` 配置，启用 `simple-import-sort`
- 强制执行导入语句排序

### 后端

**⚠️ Furion 框架强制规范（开发后端前必读）**

开发 .NET 后端时，**必须先调用 `furion-best-practices` skill**：

- 在对话开始时说 "使用 furion-best-practices skill"
- 或直接输入 `/furion-best-practices`

核心速查：

| 功能      | ✅ Furion 方式                             | ❌ 传统方式                      |
| --------- | ------------------------------------------ | -------------------------------- |
| 实体定义  | `class Xxx : Entity<int>`                  | 手动定义 Id                      |
| DbContext | 继承`AppDbContext<T>`，无需 DbSet          | 手动添加`DbSet<Xxx>`             |
| 种子数据  | `IEntitySeedData<TEntity, TLocator>`       | `OnModelCreating` 中 `HasData()` |
| 创建 API  | `class XxxService : IDynamicApiController` | `class XxxController`            |
| API 位置  | `Application/Apps/` 目录                   | `Web.Entry/Controllers/`         |
| 服务注册  | `class Xxx : ITransient`                   | `services.AddTransient()`        |
| 异常抛出  | `throw Oops.Oh("消息")`                    | `throw new Exception()`          |
| 仓储注入  | `IRepository<TEntity>` 构造函数注入        | `DbContext` 直接使用             |

## 环境配置

前端环境变量文件：

- `.env` - 基础配置
- `.env.development` - 开发环境配置
- `.env.test` - 测试构建配置
- `.env.site` - 站点部署配置

关键环境变量：

- `VITE_API_URL_PREFIX` - API 前缀（默认：`/api`）
- `VITE_API_URL` - 后端 API 地址
