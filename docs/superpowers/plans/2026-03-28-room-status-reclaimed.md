# 房间状态新增「已收回」实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为房间新增「已收回」状态，覆盖房东收回房间的业务场景。

**Architecture:** 在现有 RoomStatus 枚举中新增 Reclaimed 值，后端增加状态转换校验和报表排除，前端扩展类型定义和 UI 映射。无新页面、新路由或数据库迁移。

**Tech Stack:** .NET 10 (Furion)、Vue 3 + TypeScript + TDesign

---

### Task 1: 后端枚举扩展

**Files:**
- Modify: `Gentle/Gentle.Core/Enums/RoomStatus.cs:6-22`

- [ ] **Step 1: 在 RoomStatus 枚举中新增 Reclaimed = 3**

在 `Gentle/Gentle.Core/Enums/RoomStatus.cs` 的枚举定义中，在 `Renovating = 2` 之后添加：

```csharp
    /// <summary>
    /// 已收回
    /// </summary>
    Reclaimed = 3
```

注意：`Renovating = 2` 后面没有逗号，需要添加逗号。

- [ ] **Step 2: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Core/Enums/RoomStatus.cs
git commit -m "feat: RoomStatus 枚举新增 Reclaimed（已收回）"
```

---

### Task 2: 后端状态转换校验 + 状态文本映射

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:104-158` (UpdateAsync)
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:72-101` (AddAsync)
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs:312-321` (GetRoomStatusText)

- [ ] **Step 1: 在 RoomService.UpdateAsync 中添加状态转换校验**

在 `RoomService.cs` 的 `UpdateAsync` 方法中，在字段更新（`existing.CommunityId = ...`）之前，添加状态转换校验：

```csharp
        // 状态转换校验
        if (input.Status == RoomStatus.Reclaimed && existing.Status != RoomStatus.Vacant)
        {
            throw Oops.Oh("仅空置状态的房间可以收回");
        }
        if (existing.Status == RoomStatus.Reclaimed && input.Status != RoomStatus.Vacant)
        {
            throw Oops.Oh("已收回的房间只能恢复为空置状态");
        }
```

插入位置：在 `existing.CommunityId = input.CommunityId;`（第 137 行）之前。

- [ ] **Step 2: 在 RoomService.AddAsync 中添加创建校验**

在 `RoomService.cs` 的 `AddAsync` 方法中，在 `var room = input.Adapt<Room>();`（第 92 行）之后添加：

```csharp
        // 不允许新建时直接设为已收回，覆盖为默认的空置状态
        if (room.Status == RoomStatus.Reclaimed)
        {
            room.Status = RoomStatus.Vacant;
        }
```

- [ ] **Step 3: 更新 RentalRecordService.GetRoomStatusText**

在 `RentalRecordService.cs` 的 `GetRoomStatusText` 方法中，在 `RoomStatus.Renovating => "装修中"` 后添加：

```csharp
            RoomStatus.Reclaimed => "已收回",
```

- [ ] **Step 4: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Services/RoomService.cs Gentle/Gentle.Application/Services/RentalRecordService.cs
git commit -m "feat: 房间状态转换校验 + 状态文本映射更新"
```

---

### Task 3: 后端报表排除 Reclaimed 房间

**Files:**
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs:114-190` (GetHousingOverviewAsync)
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs:193-244` (GetRoomProfitRankingAsync)

- [ ] **Step 1: 在 GetHousingOverviewAsync 中排除 Reclaimed**

在 `ReportService.cs` 的 `GetHousingOverviewAsync` 方法中，修改 rooms 查询（第 117-120 行），添加 Where 条件排除 Reclaimed：

```csharp
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Where(r => r.Status != RoomStatus.Reclaimed)
            .ToListAsync();
```

这样 `TotalRooms`、`RentedCount`、`VacantCount`、`RenovatingCount` 以及小区统计都自动排除已收回房间。

- [ ] **Step 2: 在 GetRoomProfitRankingAsync 中排除 Reclaimed**

在 `GetRoomProfitRankingAsync` 方法中，修改 rooms 查询（第 199-202 行），添加 Where 条件：

```csharp
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Where(r => r.Status != RoomStatus.Reclaimed)
            .ToListAsync();
```

同时在状态文本 switch 中添加 Reclaimed 映射（虽然已被排除，但为健壮性）：

```csharp
                Status = room.Status switch
                {
                    RoomStatus.Vacant => "空置",
                    RoomStatus.Rented => "已出租",
                    RoomStatus.Renovating => "装修中",
                    RoomStatus.Reclaimed => "已收回",
                    _ => "未知"
                },
```

- [ ] **Step 3: 验证编译通过**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Services/ReportService.cs
git commit -m "feat: 报表统计排除已收回房间"
```

---

### Task 4: 前端类型定义 + 枚举扩展

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts:1-20`

- [ ] **Step 1: 扩展 RoomStatus 枚举和 RoomStatusText**

在 `Hans/src/api/model/roomModel.ts` 中：

1. 在 `RoomStatus` 枚举的 `Renovating = 2` 后添加 `Reclaimed = 3`
2. 在 `RoomStatusText` 中添加 `[RoomStatus.Reclaimed]: '已收回'`

完整修改后：

```typescript
export enum RoomStatus {
  /** 空置 */
  Vacant = 0,
  /** 已出租 */
  Rented = 1,
  /** 装修中 */
  Renovating = 2,
  /** 已收回 */
  Reclaimed = 3,
}

export const RoomStatusText: Record<RoomStatus, string> = {
  [RoomStatus.Vacant]: '空置',
  [RoomStatus.Rented]: '已出租',
  [RoomStatus.Renovating]: '装修中',
  [RoomStatus.Reclaimed]: '已收回',
};
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/api/model/roomModel.ts
git commit -m "feat: 前端 RoomStatus 枚举新增 Reclaimed"
```

---

### Task 5: 前端房间列表页适配

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue:347-351` (statusOptions)
- Modify: `Hans/src/pages/housing/room/index.vue:428-435` (getStatusTheme)

- [ ] **Step 1: 更新 statusOptions 筛选选项**

在 `index.vue` 的 `statusOptions` 数组（第 347 行）中添加 Reclaimed 选项：

```typescript
const statusOptions: SelectOption[] = [
  { label: '空置', value: RoomStatus.Vacant },
  { label: '已出租', value: RoomStatus.Rented },
  { label: '装修中', value: RoomStatus.Renovating },
  { label: '已收回', value: RoomStatus.Reclaimed },
];
```

- [ ] **Step 2: 更新 getStatusTheme 函数**

修改 `getStatusTheme` 函数（第 428 行），扩展返回类型和映射：

```typescript
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',
  };
  return themes[status];
}
```

- [ ] **Step 3: 提交**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间列表页支持已收回状态筛选和展示"
```

---

### Task 6: 前端房间详情页适配

**Files:**
- Modify: `Hans/src/pages/housing/room/detail.vue:136-141` (getStatusTheme)

- [ ] **Step 1: 更新 detail.vue 的 getStatusTheme 函数**

与列表页相同的修改：

```typescript
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',
  };
  return themes[status];
}
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/housing/room/detail.vue
git commit -m "feat: 房间详情页支持已收回状态展示"
```

---

### Task 7: E2E 测试验证

**Files:**
- Create: `tests/e2e/feat-036-room-status-reclaimed.spec.ts`

- [ ] **Step 1: 编写 E2E 测试**

创建 `tests/e2e/feat-036-room-status-reclaimed.spec.ts`，测试覆盖：

1. **枚举一致性**: 验证前后端 RoomStatus 枚举值对齐
2. **状态转换校验**:
   - 空置 → 已收回：成功
   - 已出租 → 已收回：失败（错误提示）
   - 已收回 → 空置：成功
   - 已收回 → 已出租：失败（错误提示）
   - 装修中 → 已收回：失败（错误提示）
3. **创建房间**: 不允许直接创建为已收回状态
4. **报表排除**: 已收回房间不出现在房源概览和利润排行统计中
5. **前端展示**: 房间列表页筛选器包含「已收回」选项，Tag 显示正确

参考现有 E2E 测试模式（如 `feat-035-rental-e2e.spec.ts`）。

- [ ] **Step 2: 运行后端确保可用**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Gentle && dotnet run --project Gentle.Web.Entry &`

等待服务器启动完成。

- [ ] **Step 3: 运行前端开发服务器**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse/Hans && npm run dev &`

等待服务器启动完成。

- [ ] **Step 4: 运行 E2E 测试**

Run: `cd C:/Users/hansh/Desktop/StayAtYourHouse && npx playwright test tests/e2e/feat-036-room-status-reclaimed.spec.ts`
Expected: ALL TESTS PASSED

- [ ] **Step 5: 提交**

```bash
git add tests/e2e/feat-036-room-status-reclaimed.spec.ts
git commit -m "test: E2E 测试验证房间已收回状态功能"
```

---

### Task 8: 更新功能列表

**Files:**
- Modify: `.claude-workflow/feature_list.json`

- [ ] **Step 1: 添加 FEAT-036 条目**

在 `feature_list.json` 中新增：

```json
{
  "id": "FEAT-036",
  "name": "房间状态新增「已收回」",
  "description": "新增 Reclaimed 房间状态，支持房东收回房间场景。仅空置房间可收回，可恢复为空置，报表统计中排除已收回房间。",
  "status": "passed"
}
```

- [ ] **Step 2: 提交**

```bash
git add .claude-workflow/feature_list.json
git commit -m "chore: 更新功能列表 FEAT-036"
```
