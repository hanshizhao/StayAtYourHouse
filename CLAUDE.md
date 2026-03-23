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
dotnet ef migrations add <MigrationName> --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
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

### 后端（Gentle）

- **框架**: Furion（高度封装的 .NET 框架）
- **数据库**: SQLite + Entity Framework Core
- **认证**: JWT，自定义 `JwtHandler`
- **API**: 通过 `IDynamicApiController` 实现动态 API 控制器

项目分层：

- `Gentle.Web.Entry` - 入口项目，最小化配置
- `Gentle.Web.Core` - 启动配置、中间件、JWT 处理器
- `Gentle.Application` - 应用服务、DTO、接口定义
- `Gentle.EntityFramework.Core` - DbContext 配置
- `Gentle.Database.Migrations` - EF Core 迁移文件
- `Gentle.Core` - 领域实体和核心逻辑

服务模式：

- 接口定义在 `Gentle.Application/System/Services/IXxxService.cs`
- 实现类通过依赖注入范围标记（`ITransient`、`IScoped`、`ISingleton`）
- 控制器实现 `IDynamicApiController` 接口以自动生成 API 路由

## 开发规范

### 前端

- 所有新代码使用 TypeScript
- Vue 单文件组件块顺序：`<template>` → `<script>` → `<style scoped>`
- ESLint 使用 `@antfu/eslint-config` 配置，启用 `simple-import-sort`
- 强制执行导入语句排序

### 后端

- 使用 .NET 10，启用预览版语言特性
- 遵循 Furion 框架的动态 API 约定
- 使用 Mapster 进行对象映射
- 全局 using 定义在 `Gentle.Application/GlobalUsings.cs`

## 环境配置

前端环境变量文件：

- `.env` - 基础配置
- `.env.development` - 开发环境配置
- `.env.test` - 测试构建配置
- `.env.site` - 站点部署配置

关键环境变量：

- `VITE_API_URL_PREFIX` - API 前缀（默认：`/api`）
- `VITE_API_URL` - 后端 API 地址
