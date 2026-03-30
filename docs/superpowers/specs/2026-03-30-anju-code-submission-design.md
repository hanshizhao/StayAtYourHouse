# 安居码提交状态功能设计

## 概述

在租赁记录页面（`/housing/rental`）的表格中新增"安居码"列，用于展示租客是否已提交安居码信息。未提交时提供快捷操作入口，管理员确认后可标记为已提交。

## 需求

- 表格新增第二列"安居码"，位于租客姓名列之后
- 已提交：显示 ✅ 图标
- 未提交：显示红色链接"未提交"，点击后弹出确认弹窗
- 确认弹窗显示租客姓名和房间信息，确认后标记为已提交
- 只记录是否已提交（布尔值），不记录提交时间和确认人
- 安居码状态归属于 RentalRecord 实体，每条租赁记录独立

## 数据层

### 后端实体变更

文件：`Gentle/Gentle.Core/Entities/RentalRecord.cs`

新增属性：

```csharp
/// <summary>
/// 是否已提交安居码
/// </summary>
public bool IsAnJuCodeSubmitted { get; set; } = false;
```

- 数据库列名：`is_an_ju_code_submitted`
- 默认值：`false`
- 需要生成 EF Core 迁移

### DTO 变更

文件：`Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`

新增字段：

```csharp
public bool IsAnJuCodeSubmitted { get; set; }
```

### 前端类型变更

文件：`Hans/src/api/model/rentalModel.ts`

`RentalRecordDto` 接口新增：

```typescript
isAnJuCodeSubmitted: boolean
```

## API 层

### 新增 API

文件：`Gentle/Gentle.Application/Apps/RentalAppService.cs`

```
POST /api/rental/confirm-anju-code/{id}
```

- 入参：路径参数 `id`（租赁记录 ID）
- 无请求体
- 返回：更新后的 `RentalRecordDto`
- 逻辑：将 `IsAnJuCodeSubmitted` 设为 `true` 并保存
- 校验：记录不存在时 `throw Oops.Oh("租赁记录不存在")`
- 需要 `[Authorize]` 认证

### 前端 API

文件：`Hans/src/api/rental.ts`

```typescript
export function confirmAnjuCode(id: number) {
  return request.post<RentalRecordDto>(`/rental/confirm-anju-code/${id}`)
}
```

## 前端 UI

### 表格列配置

文件：`Hans/src/pages/housing/rental/index.vue`

新增列：

```typescript
{ colKey: 'isAnJuCodeSubmitted', title: '安居码', width: 100 }
```

位置：租客姓名列之后（第二列）。

### 列内容渲染

- 已提交（`isAnJuCodeSubmitted === true`）：显示 ✅ 图标
- 未提交（`isAnJuCodeSubmitted === false`）：渲染 `<t-link theme="danger" underline>未提交</t-link>`
  - 点击触发确认弹窗
  - 弹窗使用 TDesign `DialogPlugin.confirm`
  - 弹窗内容：显示租客姓名和房间信息
  - 确认后调用 `confirmAnjuCode(id)`
  - 成功后刷新列表数据

## 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `Gentle/Gentle.Core/Entities/RentalRecord.cs` | 修改：新增属性 |
| `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | 修改：新增字段 |
| `Gentle/Gentle.Application/Apps/RentalAppService.cs` | 修改：新增确认 API |
| `Gentle/Gentle.Database.Migrations/` | 新增：EF Core 迁移 |
| `Hans/src/api/model/rentalModel.ts` | 修改：新增字段 |
| `Hans/src/api/rental.ts` | 修改：新增 API 函数 |
| `Hans/src/pages/housing/rental/index.vue` | 修改：新增列和交互逻辑 |
