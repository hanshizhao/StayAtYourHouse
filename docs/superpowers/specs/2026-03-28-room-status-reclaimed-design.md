# 房间状态新增「已收回」设计规格

## 背景

当前房间状态有三种：空置（Vacant）、已出租（Rented）、装修中（Renovating）。实际业务中，房东可能收回房间不再对外出租，现有状态无法覆盖此场景。

## 需求

- 新增「已收回」（Reclaimed）房间状态
- 仅空置状态的房间可收回
- 已收回可恢复为空置（可逆操作）
- 操作入口：编辑房间表单中的状态下拉框
- 已收回的房间从统计报表中排除

## 状态流转

```
创建 → Vacant（空置）
Vacant ⇄ Renovating（装修中，手动切换）
Vacant → Rented（入住）
Rented → Vacant（退租）
Vacant → Reclaimed（收回）
Reclaimed → Vacant（恢复出租）
```

### 状态转换规则

| 当前状态 | 可转换到 |
|---------|---------|
| Vacant | Rented（入住）、Renovating（装修）、Reclaimed（收回） |
| Rented | Vacant（退租） |
| Renovating | Vacant（装修完成） |
| Reclaimed | Vacant（恢复出租） |

### 校验规则

- 入住：仅 `Vacant` 可入住（已有逻辑不变）
- 删除房间：`Rented` 状态不可删除（已有逻辑不变）
- 收回：仅 `Vacant` 可设为 `Reclaimed`
- 恢复：`Reclaimed` 可设回 `Vacant`

## 后端改动

### 1. 枚举扩展

**文件**: `Gentle.Core/Enums/RoomStatus.cs`

新增 `Reclaimed = 3`。

### 2. 状态转换校验

**文件**: `Gentle.Application/Services/RoomService.cs`

在 `UpdateAsync` 方法中新增状态转换校验：

- `Vacant` → `Reclaimed`：允许
- `Reclaimed` → `Vacant`：允许
- 其他状态 → `Reclaimed`：拒绝，抛出 `Oops.Oh("仅空置状态的房间可以收回")`
- `Reclaimed` → 非 `Vacant` 状态：拒绝，抛出 `Oops.Oh("已收回的房间只能恢复为空置状态")`

### 3. 报表排除

**文件**: `Gentle.Application/Services/ReportService.cs`

- `GetHousingOverviewAsync`：统计查询中排除 `Reclaimed` 状态的房间
- `GetRoomProfitRankingAsync`：排行查询中排除 `Reclaimed` 状态的房间

## 前端改动

### 1. 类型定义

**文件**: `Hans/src/api/model/roomModel.ts`

```typescript
export enum RoomStatus {
  Vacant = 0,
  Rented = 1,
  Renovating = 2,
  Reclaimed = 3,  // 新增
}

export const RoomStatusText: Record<RoomStatus, string> = {
  [RoomStatus.Vacant]: '空置',
  [RoomStatus.Rented]: '已出租',
  [RoomStatus.Renovating]: '装修中',
  [RoomStatus.Reclaimed]: '已收回',  // 新增
}
```

### 2. getStatusTheme 函数修改

**文件**: `Hans/src/pages/housing/room/index.vue`、`detail.vue`

两个文件中 `getStatusTheme` 函数的返回类型需扩展，添加 `Reclaimed` 映射：

```typescript
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',  // 灰色，表示退出管理
  };
  return themes[status];
}
```

### 3. 状态筛选选项

**文件**: `Hans/src/pages/housing/room/index.vue`

`statusOptions` 是硬编码数组，需新增 Reclaimed 选项：

```typescript
const statusOptions: SelectOption[] = [
  { label: '空置', value: RoomStatus.Vacant },
  { label: '已出租', value: RoomStatus.Rented },
  { label: '装修中', value: RoomStatus.Renovating },
  { label: '已收回', value: RoomStatus.Reclaimed },  // 新增
];
```

### 4. 自动适配的页面

以下页面无需手动修改：

- 编辑房间对话框的状态下拉框（枚举驱动）
- 小区管理内嵌房间列表（使用 `RoomStatusText`，已收回房间正常显示）
- 入住办理页面筛选 `Vacant`（不受影响）
- 抄表管理页面筛选 `Rented`（不受影响）
- 租赁记录页面的房间筛选（已收回房间有历史租赁记录时仍可被选中，合理）

## 后端补充改动

### 4. 状态文本映射更新

**文件**: `Gentle.Application/Services/RentalRecordService.cs`

更新 `GetRoomStatusText` 私有方法，新增 Reclaimed 映射，避免入住校验错误消息显示「未知」：

```csharp
RoomStatus.Reclaimed => "已收回",
```

**文件**: `Gentle.Application/Services/ReportService.cs`

更新 `GetRoomProfitRankingAsync` 中的状态文本 switch 表达式：

```csharp
RoomStatus.Reclaimed => "已收回",
```

### 5. 创建房间校验

**文件**: `Gentle.Application/Services/RoomService.cs`

在 `CreateAsync` 方法中校验：新建房间不允许直接设为 `Reclaimed` 状态。如果传入 `Reclaimed`，忽略并使用默认值 `Vacant`。

### 6. 报表排除精确定义

排除 `Reclaimed` 的含义：**从所有统计数字中排除**，`totalRooms` 仅计入活跃管理的房源（Vacant + Rented + Renovating），不包含已收回房间。

## 不需要改动的部分

- 入住/退租业务逻辑（`RentalRecordService`）— 入住校验仅允许 `Vacant`，已收回房间自然不可入住
- 删除房间 — `Reclaimed` 状态可删除（行为与 `Vacant`/`Renovating` 一致，仍受关联记录保护）
- 数据库迁移 — 枚举以 `int` 存储，无需迁移
- 路由配置 — 无新增页面
- API 接口 — 无新增端点，`UpdateRoomInput` 的 `Status` 字段已支持枚举值
