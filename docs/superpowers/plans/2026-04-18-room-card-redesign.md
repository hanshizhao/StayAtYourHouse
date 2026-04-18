# 房间管理卡片重设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将房间管理页面从表格布局重设计为卡片布局，展示房东/租客租约信息、利润和租约状态预警。

**Architecture:** 后端新增 LeaseStatus 枚举和租约状态计算逻辑，改用服务端分页；前端将 t-table 替换为响应式卡片网格，复用现有的弹窗和抽屉组件。

**Tech Stack:** .NET 10 (Furion), Vue 3 + TypeScript, TDesign Vue Next, Mapster

**设计参考:** `docs/prototypes/room-card-redesign-prototype.pen`（Pencil 原型，通过 Pencil 工具读取精确参数）
**设计文档:** `docs/superpowers/specs/2026-04-18-room-card-redesign-design.md`

---

## 文件结构

### 后端新增文件
- `Gentle/Gentle.Core/Enums/LeaseStatus.cs` — 租约状态枚举
- `Gentle/Gentle.Core/Enums/LeaseStatusExtensions.cs` — 租约状态扩展方法

### 后端修改文件
- `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` — 新增5个字段 + 分页输入/输出类
- `Gentle/Gentle.Application/Services/IRoomService.cs` — 更新 GetListAsync 签名
- `Gentle/Gentle.Application/Services/RoomService.cs` — 实现租约状态计算和服务端分页
- `Gentle/Gentle.Application/Apps/RoomAppService.cs` — 更新 API 参数和返回类型

### 前端修改文件
- `Hans/src/api/model/roomModel.ts` — 新增 LeaseStatus、分页类型、RoomItem 新字段
- `Hans/src/api/room.ts` — API 调用适配分页
- `Hans/src/pages/housing/room/index.vue` — 重写为卡片布局

---

### Task 1: 新增 LeaseStatus 枚举及扩展方法

**Files:**
- Create: `Gentle/Gentle.Core/Enums/LeaseStatus.cs`
- Create: `Gentle/Gentle.Core/Enums/LeaseStatusExtensions.cs`

- [ ] **Step 1: 创建 LeaseStatus 枚举**

参照 `RoomStatus.cs` 的模式：

```csharp
// Gentle/Gentle.Core/Enums/LeaseStatus.cs
namespace Gentle.Core.Enums;

/// <summary>
/// 租约状态
/// </summary>
public enum LeaseStatus
{
    /// <summary>
    /// 正常
    /// </summary>
    Normal = 0,

    /// <summary>
    /// 即将到期
    /// </summary>
    ExpiringSoon = 1,

    /// <summary>
    /// 已逾期
    /// </summary>
    Expired = 2,

    /// <summary>
    /// 无租约
    /// </summary>
    None = 3,
}
```

- [ ] **Step 2: 创建 LeaseStatusExtensions**

参照 `RoomStatusExtensions.cs` 的模式：

```csharp
// Gentle/Gentle.Core/Enums/LeaseStatusExtensions.cs
namespace Gentle.Core.Enums;

/// <summary>
/// 租约状态扩展方法
/// </summary>
public static class LeaseStatusExtensions
{
    /// <summary>
    /// 获取租约状态文本
    /// </summary>
    public static string ToText(this LeaseStatus status) => status switch
    {
        LeaseStatus.Normal => "正常",
        LeaseStatus.ExpiringSoon => "即将到期",
        LeaseStatus.Expired => "已逾期",
        LeaseStatus.None => "--",
        _ => "--"
    };
}
```

- [ ] **Step 3: 验证后端编译**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Core/Enums/LeaseStatus.cs Gentle/Gentle.Core/Enums/LeaseStatusExtensions.cs
git commit -m "feat: 新增 LeaseStatus 租约状态枚举及扩展方法"
```

---

### Task 2: RoomDto 新增字段和分页类型

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs`

- [ ] **Step 1: 在 RoomDto.cs 末尾新增字段和分页类型**

在 `RoomDto` 类的 `LandlordLease` 属性后面新增 5 个字段，并新增 `RoomListInput` 和 `RoomListResult` 类（参照 `TenantDto.cs` 中的 `TenantListInput`/`TenantListResult` 模式）：

```csharp
// 在 RoomDto 类中，LandlordLease 属性后面添加：

    /// <summary>
    /// 房东租约状态
    /// </summary>
    public LeaseStatus LandlordLeaseStatus { get; set; } = LeaseStatus.None;

    /// <summary>
    /// 房东租约逾期天数
    /// </summary>
    public int LandlordLeaseExpiredDays { get; set; }

    /// <summary>
    /// 租客租约状态
    /// </summary>
    public LeaseStatus TenantLeaseStatus { get; set; } = LeaseStatus.None;

    /// <summary>
    /// 租客租约逾期天数
    /// </summary>
    public int TenantLeaseExpiredDays { get; set; }

    /// <summary>
    /// 租客实际月租（来自活跃 RentalRecord，无租客时为 null）
    /// </summary>
    public decimal? TenantMonthlyRent { get; set; }
```

在命名空间末尾新增两个类：

```csharp
/// <summary>
/// 房间列表查询参数
/// </summary>
public class RoomListInput
{
    /// <summary>
    /// 小区ID
    /// </summary>
    public int? CommunityId { get; set; }

    /// <summary>
    /// 房间状态
    /// </summary>
    public RoomStatus? Status { get; set; }

    /// <summary>
    /// 是否有租约异常（即将到期或已逾期）
    /// </summary>
    public bool? HasLeaseAlert { get; set; }

    /// <summary>
    /// 页码（从1开始）
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; } = 12;
}

/// <summary>
/// 分页房间列表结果
/// </summary>
public class RoomListResult
{
    /// <summary>
    /// 房间列表
    /// </summary>
    public List<RoomDto> List { get; set; } = [];

    /// <summary>
    /// 总数量
    /// </summary>
    public int Total { get; set; }
}
```

需要在文件顶部添加 `using Gentle.Core.Enums;`（如果还没有的话）。

- [ ] **Step 2: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: Commit**

```bash
git add Gentle/Gentle.Application/Dtos/Room/RoomDto.cs
git commit -m "feat: RoomDto 新增租约状态字段和分页类型"
```

---

### Task 3: 后端服务层实现租约状态计算和分页

**Files:**
- Modify: `Gentle/Gentle.Application/Services/IRoomService.cs`
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs`

- [ ] **Step 1: 更新 IRoomService 接口**

将 `GetListAsync` 签名改为接受 `RoomListInput`，返回 `RoomListResult`：

```csharp
// 替换原有的 GetListAsync 签名
Task<RoomListResult> GetListAsync(RoomListInput input);
```

- [ ] **Step 2: 替换 RoomService.GetListAsync 方法**

**重要：只替换 `GetListAsync` 方法，保留构造函数、字段声明和其他所有方法（GetByIdAsync、AddAsync、UpdateAsync、DeleteAsync）。**

核心改动：
1. 接收 `RoomListInput` 参数
2. 计算房东和租客的租约状态（7天阈值）
3. 按 `HasLeaseAlert` 筛选异常租约
4. 服务端分页（Skip/Take + CountAsync，参照 TenantService 模式）
5. 填充新增的 5 个 DTO 字段
6. Profit 计算改为：有租客时用 TenantMonthlyRent - LandlordLease.MonthlyRent，无租客时用 RentPrice - LandlordLease.MonthlyRent

添加一个私有辅助方法用于计算租约状态：

```csharp
private const int LeaseAlertThresholdDays = 7;

private static (LeaseStatus status, int expiredDays) CalculateLeaseStatus(DateTime? endDate)
{
    if (!endDate.HasValue)
        return (LeaseStatus.None, 0);

    var today = DateTime.Today;
    var daysUntilExpiry = (endDate.Value.Date - today).Days;

    if (daysUntilExpiry < 0)
        return (LeaseStatus.Expired, Math.Abs(daysUntilExpiry));

    if (daysUntilExpiry <= LeaseAlertThresholdDays)
        return (LeaseStatus.ExpiringSoon, 0);

    return (LeaseStatus.Normal, 0);
}
```

GetListAsync 实现：

```csharp
public async Task<RoomListResult> GetListAsync(RoomListInput input)
{
    var query = _repository
        .AsQueryable(false)
        .Include(r => r.Community)
        .Include(r => r.LandlordLease)
        .AsQueryable();

    if (input.CommunityId.HasValue)
        query = query.Where(r => r.CommunityId == input.CommunityId.Value);

    if (input.Status.HasValue)
        query = query.Where(r => r.Status == input.Status.Value);

    var allRooms = await query
        .OrderBy(r => r.Community.Name)
        .ThenBy(r => r.Building)
        .ThenBy(r => r.RoomNumber)
        .ToListAsync();

    // 查询活跃租住记录
    var roomIds = allRooms.Select(r => r.Id).ToHashSet();
    var activeRentals = await _rentalRecordRepository
        .AsQueryable(false)
        .Include(r => r.Renter)
        .Where(r => r.Status == RentalStatus.Active && roomIds.Contains(r.RoomId))
        .OrderByDescending(r => r.CreatedTime)
        .ToListAsync();

    var rentalByRoomId = activeRentals
        .GroupBy(r => r.RoomId)
        .ToDictionary(g => g.Key, g => g.First());

    // 映射 DTO 并计算租约状态
    var dtos = allRooms.Select(r =>
    {
        var dto = r.Adapt<RoomDto>();

        // 房东租约状态
        var landlordStatus = CalculateLeaseStatus(r.LandlordLease?.EndDate);
        dto.LandlordLeaseStatus = landlordStatus.status;
        dto.LandlordLeaseExpiredDays = landlordStatus.expiredDays;

        // 租客租约信息
        if (rentalByRoomId.TryGetValue(r.Id, out var rental))
        {
            dto.AnjuCodeSubmitted = rental.IsAnJuCodeSubmitted;
            dto.TenantName = rental.Renter?.Name;
            dto.RentalStartDate = rental.CheckInDate;
            dto.RentalEndDate = rental.ContractEndDate;
            dto.TenantMonthlyRent = rental.MonthlyRent;

            var tenantStatus = CalculateLeaseStatus(rental.ContractEndDate);
            dto.TenantLeaseStatus = tenantStatus.status;
            dto.TenantLeaseExpiredDays = tenantStatus.expiredDays;

            // 利润：有租客时用租客实际月租
            if (r.LandlordLease != null)
                dto.Profit = rental.MonthlyRent - r.LandlordLease.MonthlyRent;
        }
        else
        {
            // 利润：无租客时用标价
            if (r.LandlordLease != null)
                dto.Profit = r.RentPrice - r.LandlordLease.MonthlyRent;
        }

        return dto;
    }).ToList();

    // 按异常租约筛选
    if (input.HasLeaseAlert.HasValue && input.HasLeaseAlert.Value)
    {
        dtos = dtos.Where(d =>
            d.LandlordLeaseStatus == LeaseStatus.ExpiringSoon ||
            d.LandlordLeaseStatus == LeaseStatus.Expired ||
            d.TenantLeaseStatus == LeaseStatus.ExpiringSoon ||
            d.TenantLeaseStatus == LeaseStatus.Expired
        ).ToList();
    }

    var total = dtos.Count; // 注意：HasLeaseAlert 过滤在内存中执行，因为依赖计算字段。适用于房间数量较少（<1000）的场景。

    // 服务端分页
    var paged = dtos
        .Skip((input.Page - 1) * input.PageSize)
        .Take(input.PageSize)
        .ToList();

    return new RoomListResult { List = paged, Total = total };
}
```

- [ ] **Step 3: 验证编译**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Application/Services/IRoomService.cs Gentle/Gentle.Application/Services/RoomService.cs
git commit -m "feat: RoomService 实现租约状态计算和服务端分页"
```

---

### Task 4: 后端 API 层适配

**Files:**
- Modify: `Gentle/Gentle.Application/Apps/RoomAppService.cs`

- [ ] **Step 1: 更新 RoomAppService.GetList**

将 `GetList` 方法改为接受 `RoomListInput`，返回 `RoomListResult`：

```csharp
/// <summary>
/// 获取房间列表（支持按小区、状态、租约异常筛选，服务端分页）
/// </summary>
[HttpGet("list")]
public async Task<RoomListResult> GetList([FromQuery] RoomListInput input)
{
    return await _roomService.GetListAsync(input);
}
```

- [ ] **Step 2: 验证编译并启动确认 API 可用**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: Commit**

```bash
git add Gentle/Gentle.Application/Apps/RoomAppService.cs
git commit -m "feat: RoomAppService 适配分页查询参数"
```

---

### Task 5: 前端 API 模型更新

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts`

- [ ] **Step 1: 新增 LeaseStatus 枚举和更新类型**

在文件中添加 LeaseStatus 枚举、更新 RoomItem 接口、更新 GetRoomListParams、新增分页结果类型：

```typescript
// 新增 LeaseStatus 枚举
export enum LeaseStatus {
  /** 正常 */
  Normal = 0,
  /** 即将到期 */
  ExpiringSoon = 1,
  /** 已逾期 */
  Expired = 2,
  /** 无租约 */
  None = 3,
}

// RoomItem 中新增 5 个字段（在 landlordLease 前面添加）：
//   landlordLeaseStatus: LeaseStatus
//   landlordLeaseExpiredDays: number
//   tenantLeaseStatus: LeaseStatus
//   tenantLeaseExpiredDays: number
//   tenantMonthlyRent?: number | null

// GetRoomListParams 更新为：
export interface GetRoomListParams {
  communityId?: number;
  status?: RoomStatus;
  hasLeaseAlert?: boolean;
  page: number;
  pageSize: number;
}

// 新增分页结果类型
export interface RoomListResult {
  list: RoomItem[];
  total: number;
}
```

- [ ] **Step 2: 更新 room.ts API 调用**

将 `getRoomList` 的返回类型从 `RoomItem[]` 改为 `RoomListResult`：

```typescript
export function getRoomList(params: GetRoomListParams) {
  return request.get<RoomListResult>({
    url: Api.List,
    params,
  });
}
```

- [ ] **Step 3: 验证类型检查**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add Hans/src/api/model/roomModel.ts Hans/src/api/room.ts
git commit -m "feat: 前端 API 模型适配分页和租约状态"
```

---

### Task 6: 前端页面重写为卡片布局

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

这是最大的改动。需要将 t-table 替换为卡片网格，同时保留现有的弹窗和抽屉逻辑。

- [ ] **Step 1: 重写模板部分**

关键改动：
1. 移除 `t-table`，替换为 CSS Grid 卡片布局（`grid-template-columns: repeat(3, 1fr)` + `gap: 16px`）
2. 页面标题栏：左侧"房间管理"标题 + 右侧"新增房间"按钮
3. 筛选栏：三个 t-select（小区、状态、异常租约）+ 右侧统计摘要"共 N 间 | 异常 N 间"
4. 每张卡片结构：头部（房间名 + 状态标签）→ 分割线 → 中部（左右两栏：房东/租客）→ 分割线 → 底部（利润 + 操作按钮）
5. 保留现有的新建/编辑弹窗（t-dialog）和房东租约抽屉（t-drawer）
6. 将前端分页改为后端分页（t-pagination 组件，传入 current/pageSize/total）
7. 空状态使用 t-empty

筛选栏和统计摘要：

```html
<div class="filter-bar">
  <div class="filter-bar__left">
    <t-select v-model="filterCommunityId" placeholder="全部小区" clearable :options="communityOptions" @change="handleFilter" />
    <t-select v-model="filterStatus" placeholder="全部状态" clearable :options="statusOptions" @change="handleFilter" />
    <t-select v-model="filterLeaseAlert" placeholder="异常租约" clearable :options="leaseAlertOptions" @change="handleFilter" />
  </div>
  <div class="filter-bar__right">
    <span class="summary-text">共 {{ pagination.total }} 间  |  异常 {{ alertCount }} 间</span>
  </div>
</div>
```

卡片中部设计（参照原型）：

```html
<!-- 中部：左右两栏 -->
<div class="card-middle">
  <!-- 左栏：房东租约 -->
  <div class="card-col landlord-col">
    <div class="col-label">房东租约</div>
    <template v-if="room.landlordLease">
      <div class="col-name">{{ room.landlordLease.landlordName }}</div>
      <div class="col-rent">
        <span class="rent-value">¥{{ formatNumber(room.landlordLease.monthlyRent) }}</span>
        <span class="rent-unit">/月</span>
      </div>
      <div class="col-date">到期 {{ formatDate(room.landlordLease.endDate) }}</div>
      <t-tag :theme="getLeaseTagTheme(room.landlordLeaseStatus)" size="small" variant="light">
        {{ getLeaseStatusText(room.landlordLeaseStatus, room.landlordLeaseExpiredDays) }}
      </t-tag>
    </template>
    <div v-else class="col-empty">未添加房东租约</div>
  </div>

  <!-- 右栏：租客租约 -->
  <div class="card-col tenant-col">
    <template v-if="room.tenantName">
      <div class="col-label">租客租约</div>
      <div class="col-name">{{ room.tenantName }}</div>
      <div class="col-rent">
        <span class="rent-value">¥{{ formatNumber(room.tenantMonthlyRent!) }}</span>
        <span class="rent-unit">/月</span>
      </div>
      <div class="col-date">到期 {{ formatDate(room.rentalEndDate!) }}</div>
      <t-tag :theme="getLeaseTagTheme(room.tenantLeaseStatus)" size="small" variant="light">
        {{ getLeaseStatusText(room.tenantLeaseStatus, room.tenantLeaseExpiredDays) }}
      </t-tag>
    </template>
    <template v-else>
      <div class="col-label">租客租约</div>
      <div class="col-empty">暂无租客</div>
    </template>
  </div>
</div>
```

卡片底部设计：

```html
<div class="card-bottom">
  <div class="profit-area">
    <div class="profit-label">{{ room.tenantName ? '实际利润' : '预期利润' }}</div>
    <div :class="['profit-value', room.profit >= 0 ? 'profit-positive' : 'profit-negative']">
      {{ room.landlordLease ? formatProfit(room.profit) : '--' }}
    </div>
  </div>
  <div class="card-actions">
    <t-tooltip content="编辑">
      <t-button theme="default" variant="text" shape="square" @click="handleEdit(room)">
        <template #icon><t-icon name="edit" /></template>
      </t-button>
    </t-tooltip>
    <t-tooltip content="房东租约">
      <t-button theme="default" variant="text" shape="square" @click="handleOpenLeaseDrawer(room)">
        <template #icon><t-icon name="file" /></template>
      </t-button>
    </t-tooltip>
    <t-tooltip content="维修">
      <t-button theme="default" variant="text" shape="square" @click="handleMaintenance(room)">
        <template #icon><t-icon name="tools" /></template>
      </t-button>
    </t-tooltip>
    <t-tooltip content="删除">
      <t-button theme="danger" variant="text" shape="square" @click="handleDelete(room)">
        <template #icon><t-icon name="delete" /></template>
      </t-button>
    </t-tooltip>
  </div>
</div>
```

- [ ] **Step 2: 重写 script 部分**

核心改动：
1. 移除 `data` ref（全量数据）和 `tableData` computed（前端过滤），改为 `roomList` ref 直接存储 API 返回的 `list`
2. 新增 `pagination` reactive：`{ current: 1, pageSize: 12, total: 0 }`
3. `fetchData()` 方法：调用 `getRoomList({ communityId, status, hasLeaseAlert, page, pageSize })`，解构赋值 `roomList` 和 `total`
4. 新增 `hasLeaseAlert` ref 用于异常租约筛选
5. 保留现有的 CRUD 方法（handleEdit, handleDelete 等）和 landlordLease 相关方法
6. 新增辅助方法：`getLeaseTagTheme(status)`, `getLeaseStatusText(status, expiredDays)`, `formatProfit(profit)`, `formatDate(date)`, `formatNumber(num)`

```typescript
// 辅助方法
function getLeaseTagTheme(status: LeaseStatus): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case LeaseStatus.Normal: return 'success'
    case LeaseStatus.ExpiringSoon: return 'warning'
    case LeaseStatus.Expired: return 'danger'
    default: return 'default'
  }
}

function getLeaseStatusText(status: LeaseStatus, expiredDays: number): string {
  switch (status) {
    case LeaseStatus.Normal: return '正常'
    case LeaseStatus.ExpiringSoon: return '即将到期'
    case LeaseStatus.Expired: return `已逾期 ${expiredDays}天`
    default: return '--'
  }
}

function formatProfit(profit: number): string {
  if (profit > 0) return `+¥${profit.toLocaleString()}/月`
  if (profit < 0) return `-¥${Math.abs(profit).toLocaleString()}/月`
  return '¥0/月'
}
```

- [ ] **Step 3: 编写样式部分**

使用 `<style scoped>` 编写卡片样式，核心参照原型设计参数：

```css
.room-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .room-card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .room-card-grid { grid-template-columns: 1fr; }
}

.room-card {
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
}

.card-header__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.card-divider {
  height: 1px;
  background: var(--td-component-border);
}

.card-middle {
  display: flex;
  padding: 16px 20px;
}

.card-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.landlord-col {
  padding-right: 12px;
  border-right: 1px solid var(--td-component-border);
}

.tenant-col {
  padding-left: 12px;
}

.col-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-placeholder);
}

.col-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.col-rent {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.rent-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.rent-unit {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.col-date {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.col-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 14px;
  color: var(--td-text-color-placeholder);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
}

.profit-label {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.profit-value {
  font-size: 16px;
  font-weight: 600;
}

.profit-positive { color: var(--td-success-color); }
.profit-negative { color: var(--td-error-color); }

.summary-text {
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}
```

状态标签颜色映射（使用 TDesign Tag 组件的 theme 属性）：
- 空置 → `success`（绿）
- 已出租 → `warning`（黄）
- 装修中 → `primary`（蓝）
- 已收回 → `default`（灰）

- [ ] **Step 4: 验证前端类型检查和开发服务器**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

Run: `cd Hans && npm run dev`
Expected: 开发服务器启动，访问 `/housing/room` 页面可看到卡片布局

- [ ] **Step 5: Commit**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间管理页面重设计为卡片布局"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动后端**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`
Expected: API 服务启动成功

- [ ] **Step 2: 启动前端并测试**

Run: `cd Hans && npm run dev`

验证清单：
- [ ] 卡片网格正确渲染（3列布局）
- [ ] 每张卡片显示房东姓名、租金、到期、状态
- [ ] 每张卡片显示租客姓名、租金、到期、状态（已出租的房间）
- [ ] 空置房间右侧显示"暂无租客"
- [ ] 无房东租约的房间左侧显示"未添加房东租约"
- [ ] 利润显示正确（实际利润 vs 预期利润，绿色/红色）
- [ ] 租约状态标签颜色正确（绿/黄/红/灰）
- [ ] 筛选功能正常（小区、状态、异常租约）
- [ ] 分页功能正常
- [ ] 新建房间弹窗正常
- [ ] 编辑房间弹窗正常
- [ ] 房东租约抽屉正常
- [ ] 删除功能正常
- [ ] 空状态显示正确
- [ ] 响应式布局（缩放浏览器窗口）

- [ ] **Step 3: Final Commit**

```bash
git add -A
git commit -m "feat: 房间管理卡片重设计完成"
```
