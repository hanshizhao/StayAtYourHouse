# 删除 Room 的 Area 和 RoomType 属性 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从全栈（后端实体/DTO/服务、数据库、前端类型/页面、E2E测试）中删除 Room 的 Area 和 RoomType 两个属性。

**Architecture:** 纯删除操作，从后端实体层开始，逐层向上清理 DTO、服务、前端类型和页面，最后生成数据库迁移。

**Tech Stack:** .NET 10 (Furion), Vue 3 (TDesign), TypeScript, EF Core, Playwright

---

### Task 1: 后端实体 + DTO 删除 Area/RoomType

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/Room.cs:32-40` — 删除 Area 和 RoomType 属性
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs:36-44` — 删除 Area 和 RoomType 属性
- Modify: `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs:31-40` — 删除 Area 和 RoomType 属性（含 RoomType 的 MaxLength 验证）
- Modify: `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs:37-46` — 删除 Area 和 RoomType 属性（含 RoomType 的 MaxLength 验证）

- [ ] **Step 1: 删除 Room 实体中的 Area 和 RoomType**

在 `Gentle/Gentle.Core/Entities/Room.cs` 中删除第 32-40 行（`RoomNumber` 属性后、`CostPrice` 属性前）：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型（如：一室一厅、两室一厅）
    /// </summary>
    public string? RoomType { get; set; }
```

- [ ] **Step 2: 删除 RoomDto 中的 Area 和 RoomType**

在 `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` 中删除第 36-44 行：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }
```

- [ ] **Step 3: 删除 CreateRoomInput 中的 Area 和 RoomType**

在 `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs` 中删除第 31-40 行：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    [MaxLength(50, ErrorMessage = "房间类型长度不能超过50个字符")]
    public string? RoomType { get; set; }
```

- [ ] **Step 4: 删除 UpdateRoomInput 中的 Area 和 RoomType**

在 `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs` 中删除第 37-46 行：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    [MaxLength(50, ErrorMessage = "房间类型长度不能超过50个字符")]
    public string? RoomType { get; set; }
```

- [ ] **Step 5: Commit（构建验证移至 Task 2 完成后）**

> 注意：Task 1 和 Task 2 必须一起完成后再验证构建，因为 ReportService 仍引用已删除的 Area/RoomType，单独验证 Task 1 会构建失败。

```bash
git add Gentle/Gentle.Core/Entities/Room.cs Gentle/Gentle.Application/Dtos/Room/RoomDto.cs Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs
git commit -m "refactor: 删除 Room 实体和 DTO 中的 Area、RoomType 属性"
```

---

### Task 2: 后端 Service + Report DTO 删除 Area/RoomType

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:165-166` — 删除 UpdateAsync 中的 Area/RoomType 赋值
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs:190-191,247-248` — 删除 4 处 Area/RoomType 赋值
- Modify: `Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs:131-139` — 删除 VacantRoomDto 中的 Area/RoomType
- Modify: `Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs:68-76` — 删除 RoomProfitRankingDto 中的 Area/RoomType

- [ ] **Step 1: 删除 RoomService.UpdateAsync 中的赋值**

在 `Gentle/Gentle.Application/Services/RoomService.cs` 第 165-166 行删除：

```csharp
    // 删除以下两行：
    existing.Area = input.Area;
    existing.RoomType = input.RoomType;
```

- [ ] **Step 2: 删除 ReportService 中的赋值**

在 `Gentle/Gentle.Application/Services/ReportService.cs` 中：

**位置 1**（约第 190-191 行，VacantRoomDto 构建）删除：
```csharp
    Area = r.Area,
    RoomType = r.RoomType,
```

**位置 2**（约第 247-248 行，RoomProfitRankingDto 构建）删除：
```csharp
    Area = room.Area,
    RoomType = room.RoomType
```

- [ ] **Step 3: 删除 HousingOverviewDto.VacantRoomDto 中的属性**

在 `Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs` 约第 131-139 行删除：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }
```

- [ ] **Step 4: 删除 RoomProfitRankingDto 中的属性**

在 `Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs` 约第 68-76 行删除：

```csharp
    // 删除以下内容：
    /// <summary>
    /// 面积（平方米）
    /// </summary>
    public decimal? Area { get; set; }

    /// <summary>
    /// 房间类型
    /// </summary>
    public string? RoomType { get; set; }
```

- [ ] **Step 5: 验证后端构建**

Run: `cd Gentle && dotnet build`
Expected: 构建成功，无错误

- [ ] **Step 6: Commit**

```bash
git add Gentle/Gentle.Application/Services/RoomService.cs Gentle/Gentle.Application/Services/ReportService.cs Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs
git commit -m "refactor: 删除 Service 和 Report DTO 中的 Area、RoomType 引用"
```

---

### Task 3: 数据库迁移

**Files:**
- Generate: `Gentle/Gentle.Database.Migrations/Migrations/<timestamp>_RemoveRoomAreaAndRoomType.cs` — 新迁移文件

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add RemoveRoomAreaAndRoomType --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 生成迁移文件，包含删除 Area 和 RoomType 两列的 Down/Up 操作

- [ ] **Step 2: 检查迁移文件**

打开生成的迁移文件，确认 Up 方法包含：
```csharp
migrationBuilder.DropColumn("Area", "Rooms");
migrationBuilder.DropColumn("RoomType", "Rooms");
```

- [ ] **Step 3: 应用迁移**

Run: `cd Gentle && dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 迁移成功应用

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Database.Migrations/
git commit -m "chore: 数据库迁移 - 删除 Room 表的 Area 和 RoomType 列"
```

---

### Task 4: 前端类型定义和页面删除 area/roomType

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts:36-37,66-67,86-87` — 删除 3 个接口中的 area/roomType
- Modify: `Hans/src/pages/housing/room/index.vue` — 删除表格列、模板、表单字段、类型定义、数据
- Modify: `Hans/src/pages/housing/room/detail.vue:47-52` — 删除面积/类型展示
- Modify: `Hans/src/pages/housing/community/index.vue:248` — 删除小区房间弹窗表格的 roomType 列
- Modify: `Hans/src/pages/tenant/check-in.vue` — 删除面积/类型展示和数据

- [ ] **Step 1: 删除 roomModel.ts 中的 area/roomType**

在 `Hans/src/api/model/roomModel.ts` 中删除：

- `RoomItem` 接口中的 `area?: number;` 和 `roomType?: string;`（第 36-37 行）
- `CreateRoomParams` 接口中的 `area?: number;` 和 `roomType?: string;`（第 66-67 行）
- `UpdateRoomParams` 接口中的 `area?: number;` 和 `roomType?: string;`（第 86-87 行）

- [ ] **Step 2: 删除房间列表页 index.vue 中的 area/roomType**

在 `Hans/src/pages/housing/room/index.vue` 中删除以下所有引用：

1. **模板插槽**（第 55-60 行）：
```html
<template #area="{ row }">
  <span>{{ row.area ? `${row.area}㎡` : '-' }}</span>
</template>
<template #roomType="{ row }">
  <span>{{ row.roomType || '-' }}</span>
</template>
```

2. **表单字段**（第 148-170 行）— 两个 `<t-col :span="6">` 块（面积输入框和房间类型输入框）

3. **表格列配置**（第 627-628 行）：
```typescript
{ colKey: 'area', title: '面积', width: 90 },
{ colKey: 'roomType', title: '类型', width: 100 },
```

4. **类型定义**（第 601-602 行）：
```typescript
area?: number;
roomType?: string;
```

5. **表单数据初始化**（第 674-675 行）：
```typescript
area: undefined,
roomType: '',
```

6. **编辑数据回填**（第 856-857 行）：
```typescript
area: row.area,
roomType: row.roomType,
```

7. **创建请求参数**（第 881-882 行）：
```typescript
area: formData.value.area,
roomType: formData.value.roomType || undefined,
```

8. **更新请求参数**（第 898-899 行）：
```typescript
area: formData.value.area,
roomType: formData.value.roomType || undefined,
```

- [ ] **Step 3: 删除详情页 detail.vue 中的面积/类型展示**

在 `Hans/src/pages/housing/room/detail.vue` 中删除第 47-52 行：

```html
<t-descriptions-item label="面积">
  {{ roomDetail.area ? `${roomDetail.area}㎡` : '-' }}
</t-descriptions-item>
<t-descriptions-item label="房型">
  {{ roomDetail.roomType || '-' }}
</t-descriptions-item>
```

- [ ] **Step 4: 删除小区房间弹窗中的 roomType 列**

在 `Hans/src/pages/housing/community/index.vue` 约第 248 行删除：

```typescript
{ colKey: 'roomType', title: '类型', width: 120 },
```

- [ ] **Step 5: 删除入住登记页 check-in.vue 中的 area/roomType**

在 `Hans/src/pages/tenant/check-in.vue` 中删除：

1. **模板展示**（第 99-106 行）— 面积和房型两个 `<div class="info-item">` 块

2. **接口类型**（第 314-315 行）：
```typescript
area?: number;
roomType?: string;
```

3. **数据赋值**（第 404-405 行）：
```typescript
area: room.area,
roomType: room.roomType,
```

- [ ] **Step 6: 验证前端构建**

Run: `cd Hans && npm run build`
Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 7: Commit**

```bash
git add Hans/src/api/model/roomModel.ts Hans/src/pages/housing/room/index.vue Hans/src/pages/housing/room/detail.vue Hans/src/pages/housing/community/index.vue Hans/src/pages/tenant/check-in.vue
git commit -m "refactor: 前端删除 Room 的 area、roomType 属性"
```

---

### Task 5: E2E 测试更新

**Files:**
- Modify: `tests/e2e/feat-002-room-entity.spec.ts:111-123` — 修改测试用例
- Modify: `tests/e2e/feat-004-room-api.spec.ts:450-451,473-474` — 删除测试数据中的 area/roomType
- Modify: `tests/e2e/feat-011-checkin-checkout-api.spec.ts:79` — 删除测试数据中的 area
- Modify: `tests/e2e/feat-022-meter-api.spec.ts:76` — 删除测试数据中的 area

- [ ] **Step 1: 修改 feat-002-room-entity.spec.ts**

将第 111 行的测试标题从：
```
test('9. 验证可选属性 - Area, RoomType, ContractImage, Remark', async () => {
```
改为：
```
test('9. 验证可选属性 - ContractImage, Remark', async () => {
```

删除第 119-120 行的 Area/RoomType 断言：
```typescript
// 删除：
expect(content).toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
expect(content).toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
```

- [ ] **Step 2: 修改 feat-004-room-api.spec.ts**

在完整属性测试数据中删除（约第 450-451 行）：
```typescript
// 删除：
area: 85.5,
roomType: '两室一厅',
```

在响应断言中删除（约第 473-474 行）：
```typescript
// 删除：
expect(result.data.area).toBe(testData.area);
expect(result.data.roomType).toBe(testData.roomType);
```

- [ ] **Step 3: 修改 feat-011-checkin-checkout-api.spec.ts**

在房间创建数据中删除（约第 79 行）：
```typescript
// 删除：
area: 50,
```

- [ ] **Step 4: 修改 feat-022-meter-api.spec.ts**

在房间创建数据中删除（约第 76 行）：
```typescript
// 删除：
area: 50,
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/feat-002-room-entity.spec.ts tests/e2e/feat-004-room-api.spec.ts tests/e2e/feat-011-checkin-checkout-api.spec.ts tests/e2e/feat-022-meter-api.spec.ts
git commit -m "test: 更新 E2E 测试，删除 Room 的 Area/RoomType 引用"
```

---

### Task 6: 最终验证

- [ ] **Step 1: 后端构建验证**

Run: `cd Gentle && dotnet build`
Expected: 构建成功

- [ ] **Step 2: 前端构建验证**

Run: `cd Hans && npm run build`
Expected: 构建成功

- [ ] **Step 3: 运行 E2E 测试**

Run: `cd tests && npm run test`
Expected: 所有测试通过
