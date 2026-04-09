# 房间列表租约信息显示 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在房间管理列表页面新增三列租约信息（安居码状态、已租时长、到期天数），数据由后端从活跃租约记录实时计算。

**Architecture:** 后端 RoomService.GetListAsync 查询活跃 RentalRecord，计算租期和到期天数后填充到 RoomDto 平铺字段。前端直接渲染，无需额外计算逻辑。

**Tech Stack:** .NET 10 (Furion) / Vue 3 + TDesign + TypeScript / Playwright E2E

---

## 文件结构

| 文件 | 责任 | 操作 |
|------|------|------|
| `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` | 新增 3 个 nullable 字段 | 修改 |
| `Gentle/Gentle.Application/Services/RoomService.cs` | GetListAsync 增加租约查询 + CalculateLeaseDuration 方法 | 修改 |
| `Hans/src/api/model/roomModel.ts` | RoomItem 接口新增 3 个字段 | 修改 |
| `Hans/src/pages/housing/room/index.vue` | columns 新增 3 列 + 3 个 template slot | 修改 |
| `tests/e2e/feat-150-room-list-rental-info.spec.ts` | E2E 静态验证测试 | 创建 |

---

### Task 1: 后端 RoomDto 新增 3 个租约字段

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs:83-105`

- [ ] **Step 1: 在 RoomDto 的 `Status` 属性之后添加 3 个新字段**

在 `public RoomStatus Status { get; set; }` 之后、`ContractImage` 之前插入：

```csharp
    /// <summary>
    /// 安居码是否已提交（null=无活跃租约）
    /// </summary>
    public bool? AnjuCodeSubmitted { get; set; }

    /// <summary>
    /// 已租时长（如"1年2月16天"，null=无活跃租约）
    /// </summary>
    public string? LeaseDuration { get; set; }

    /// <summary>
    /// 距离到期天数（正数=剩余天数，负数=已过期天数，null=无活跃租约）
    /// </summary>
    public int? DaysUntilExpiry { get; set; }
```

- [ ] **Step 2: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: `0 个错误`

- [ ] **Step 3: Commit**

```bash
git add Gentle/Gentle.Application/Dtos/Room/RoomDto.cs
git commit -m "feat: RoomDto 新增 3 个租约信息字段（FEAT-150）"
```

---

### Task 2: 后端 RoomService 增加租约查询和计算逻辑

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:26-54`

- [ ] **Step 1: 修改 GetListAsync，查询活跃租约并填充字段**

将现有 `GetListAsync` 方法替换为：

```csharp
    /// <inheritdoc />
    public async Task<List<RoomDto>> GetListAsync(int? communityId, RoomStatus? status)
    {
        var query = _repository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Include(r => r.LandlordLease)
            .AsQueryable();

        // 按小区筛选
        if (communityId.HasValue)
        {
            query = query.Where(r => r.CommunityId == communityId.Value);
        }

        // 按状态筛选
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var list = await query.ToListAsync();

        // 查询活跃租约记录（先 ToListAsync 再内存分组，避免 LINQ GroupBy+First 翻译失败）
        var roomIds = list.Select(r => r.Id).ToList();
        var activeRentalsList = await _rentalRecordRepository.AsQueryable(false)
            .Where(r => r.Status == RentalStatus.Active && roomIds.Contains(r.RoomId))
            .ToListAsync();

        var activeRentals = activeRentalsList
            .GroupBy(r => r.RoomId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.ContractEndDate).First());

        var today = DateTime.Today;

        // 内存排序（SQLite 兼容）
        return list
            .OrderBy(r => r.Community.Name)
            .ThenBy(r => r.Building)
            .ThenBy(r => r.RoomNumber)
            .Select(room =>
            {
                var dto = room.Adapt<RoomDto>();
                if (activeRentals.TryGetValue(room.Id, out var rental))
                {
                    dto.AnjuCodeSubmitted = rental.IsAnJuCodeSubmitted;
                    dto.LeaseDuration = CalculateLeaseDuration(rental.CheckInDate, today);
                    dto.DaysUntilExpiry = (rental.ContractEndDate.Date - today).Days;
                }
                return dto;
            })
            .ToList();
    }
```

> 注：`_rentalRecordRepository` 已在构造函数中注入，无需额外配置。使用 `ToListAsync` + 内存 `GroupBy` 模式（与 ReportService 一致），避免 LINQ GroupBy+First 无法翻译为 SQL。

- [ ] **Step 2: 添加 CalculateLeaseDuration 私有方法**

在 RoomService 类的末尾（`DeleteAsync` 方法之后，类的 `}` 之前）添加：

```csharp
    /// <summary>
    /// 计算租期时长，返回格式化字符串（如"1年2月16天"、"5月3天"、"15天"）
    /// </summary>
    private static string CalculateLeaseDuration(DateTime checkInDate, DateTime today)
    {
        if (today < checkInDate)
            return "0天";

        // 计算年数
        var years = 0;
        while (checkInDate.AddYears(years + 1) <= today)
            years++;

        var shifted = checkInDate.AddYears(years);

        // 计算月数
        var months = 0;
        while (shifted.AddMonths(months + 1) <= today)
            months++;

        var shifted2 = shifted.AddMonths(months);

        // 计算天数
        var days = (today - shifted2).Days;

        // 拼接字符串，省略为0的部分
        var parts = new List<string>();
        if (years > 0) parts.Add($"{years}年");
        if (months > 0) parts.Add($"{months}月");
        if (days > 0) parts.Add($"{days}天");

        return parts.Count > 0 ? string.Join("", parts) : "0天";
    }
```

- [ ] **Step 3: 确保引用了 System.Collections.Generic（用于 List<string>）**

RoomService.cs 顶部的 using 已有 `using Gentle.Core.Enums;`（需确保有 `RentalStatus` 可用）。检查 using 行，如果没有 `using System.Collections.Generic;` 则添加。

> 实际上 `List<string>` 在 .NET 10 中由 global using 自动引入，通常不需要显式添加。

- [ ] **Step 4: 验证构建**

Run: `cd Gentle && dotnet build`
Expected: `0 个错误`

- [ ] **Step 5: Commit**

```bash
git add Gentle/Gentle.Application/Services/RoomService.cs
git commit -m "feat: RoomService.GetListAsync 增加活跃租约查询和计算（FEAT-151）"
```

---

### Task 3: 前端 TypeScript 类型新增字段

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts:30-50`

- [ ] **Step 1: 在 RoomItem 接口添加 3 个字段**

在 `status: RoomStatus;` 之后、`contractImage?: string;` 之前插入：

```typescript
  anjuCodeSubmitted?: boolean | null;
  leaseDuration?: string | null;
  daysUntilExpiry?: number | null;
```

- [ ] **Step 2: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add Hans/src/api/model/roomModel.ts
git commit -m "feat: RoomItem 类型新增 3 个租约信息字段（FEAT-152）"
```

---

### Task 4: 前端列表页新增 3 列

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

- [ ] **Step 1: 在 columns 数组中插入 3 个新列**

在 `status` 列之后、`remark` 列之前插入：

```typescript
  { colKey: 'anjuCodeSubmitted', title: '安居码', width: 80 },
  { colKey: 'leaseDuration', title: '已租时长', width: 110 },
  { colKey: 'daysUntilExpiry', title: '到期天数', width: 100 },
```

- [ ] **Step 2: 在 template 中添加 3 个 slot**

在 `#status` template slot 之后、`#remark` template slot 之前插入：

```html
        <template #anjuCodeSubmitted="{ row }">
          <t-tag v-if="row.anjuCodeSubmitted === true" theme="success" variant="light">已提交</t-tag>
          <t-tag v-else-if="row.anjuCodeSubmitted === false" theme="danger" variant="light">未提交</t-tag>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #leaseDuration="{ row }">
          <span v-if="row.leaseDuration">{{ row.leaseDuration }}</span>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #daysUntilExpiry="{ row }">
          <span v-if="row.daysUntilExpiry != null">
            <span v-if="row.daysUntilExpiry > 0" style="color: var(--td-brand-color)">还剩{{ row.daysUntilExpiry }}天</span>
            <span v-else-if="row.daysUntilExpiry === 0" style="color: var(--td-warning-color)">今天到期</span>
            <span v-else style="color: var(--td-error-color)">已过期{{ Math.abs(row.daysUntilExpiry) }}天</span>
          </span>
          <span v-else class="text-secondary">-</span>
        </template>
```

- [ ] **Step 3: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间列表页新增安居码、已租时长、到期天数列（FEAT-153）"
```

---

### Task 5: E2E 测试

**Files:**
- Create: `tests/e2e/feat-154-room-list-rental-info.spec.ts`

- [ ] **Step 1: 创建 E2E 测试文件**

```typescript
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.join(__dirname, '../../');

test.describe('FEAT-154 房间列表租约信息显示', () => {
  // ── 后端：RoomDto 包含 3 个租约字段 ──
  test('RoomDto 包含 AnjuCodeSubmitted、LeaseDuration、DaysUntilExpiry', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Room/RoomDto.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, 'RoomDto 应包含 AnjuCodeSubmitted').toContain('public bool? AnjuCodeSubmitted');
    expect(content, 'RoomDto 应包含 LeaseDuration').toContain('public string? LeaseDuration');
    expect(content, 'RoomDto 应包含 DaysUntilExpiry').toContain('public int? DaysUntilExpiry');
  });

  // ── 后端：RoomService 包含租约查询和计算逻辑 ──
  test('RoomService.GetListAsync 包含活跃租约查询', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, '应查询 Active 状态的租约').toContain('RentalStatus.Active');
    expect(content, '应填充 AnjuCodeSubmitted').toContain('AnjuCodeSubmitted');
    expect(content, '应填充 LeaseDuration').toContain('LeaseDuration');
    expect(content, '应填充 DaysUntilExpiry').toContain('DaysUntilExpiry');
  });

  test('RoomService 包含 CalculateLeaseDuration 方法', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, '应包含 CalculateLeaseDuration 方法').toContain('CalculateLeaseDuration');
    expect(content, '应使用 AddYears 计算').toContain('AddYears');
    expect(content, '应使用 AddMonths 计算').toContain('AddMonths');
  });

  // ── 前端：TypeScript Model ──
  test('roomModel.ts RoomItem 包含 3 个租约字段', () => {
    const file = path.join(ROOT, 'Hans/src/api/model/roomModel.ts');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, 'RoomItem 应包含 anjuCodeSubmitted').toContain('anjuCodeSubmitted');
    expect(content, 'RoomItem 应包含 leaseDuration').toContain('leaseDuration');
    expect(content, 'RoomItem 应包含 daysUntilExpiry').toContain('daysUntilExpiry');
  });

  // ── 前端：列表页包含 3 个新列 ──
  test('room/index.vue 包含安居码、已租时长、到期天数列', () => {
    const file = path.join(ROOT, 'Hans/src/pages/housing/room/index.vue');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, '应包含安居码列').toContain("colKey: 'anjuCodeSubmitted'");
    expect(content, '应包含已租时长列').toContain("colKey: 'leaseDuration'");
    expect(content, '应包含到期天数列').toContain("colKey: 'daysUntilExpiry'");
  });

  test('room/index.vue 包含租约信息的渲染 slot', () => {
    const file = path.join(ROOT, 'Hans/src/pages/housing/room/index.vue');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content, '应包含安居码 slot').toContain('#anjuCodeSubmitted');
    expect(content, '应包含已租时长 slot').toContain('#leaseDuration');
    expect(content, '应包含到期天数 slot').toContain('#daysUntilExpiry');
  });

  // ── 后端构建 ──
  test('后端 dotnet build 成功', () => {
    const output = execSync('dotnet build', {
      cwd: path.join(ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(output).toContain('0 个错误');
  });

  // ── 前端类型检查 ──
  test('前端 npm run build:type 无类型错误', () => {
    execSync('npm run build:type', {
      cwd: path.join(ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: 'pipe',
    });
  });
});
```

- [ ] **Step 2: 运行测试**

Run: `cd tests && npx playwright test e2e/feat-154-room-list-rental-info.spec.ts`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/feat-154-room-list-rental-info.spec.ts
git commit -m "test: 房间列表租约信息 E2E 测试（FEAT-154）"
```
