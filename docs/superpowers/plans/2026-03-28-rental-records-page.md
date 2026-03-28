# 租赁记录页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立的租赁记录分页列表页面，支持按房间筛选，每条记录可展开查看关联账单。

**Architecture:** 后端在 `RentalRecordDto` 中嵌套 `List<BillDto> Bills`，新增分页查询 API `GET /api/rental/page`。前端新建 Vue 页面，使用 TDesign 可展开行表格 + 后端分页。

**Tech Stack:** .NET 10 / Furion / Mapster / EF Core | Vue 3 / TDesign Vue Next / TypeScript

**Spec:** `docs/superpowers/specs/2026-03-28-rental-records-page-design.md`

---

## 文件结构

### 后端（修改）
| 文件 | 职责 |
|------|------|
| `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | 新增 `Bills` 属性 |
| `Gentle/Gentle.Application/Mapper.cs` | 新增 Bills 集合映射 |
| `Gentle/Gentle.Application/Services/IRentalRecordService.cs` | 新增 `GetPagedListAsync` 接口 |
| `Gentle/Gentle.Application/Services/RentalRecordService.cs` | 实现分页查询 + Include Bills + 修改 GetByIdAsync |
| `Gentle/Gentle.Application/Apps/RentalAppService.cs` | 新增 `GET /api/rental/page` 端点 + `RentalRecordListResult` 类 |

### 前端（修改/新建）
| 文件 | 职责 |
|------|------|
| `Hans/src/api/model/rentalModel.ts` | 扩展 `RentalRecordDto` 类型 + 新增分页类型 |
| `Hans/src/api/rental.ts` | 新增 `getRentalPage` 函数 |
| `Hans/src/pages/housing/rental/index.vue` | **新建** 租赁记录列表页面 |
| `Hans/src/router/modules/housing.ts` | 新增路由 |

---

## Task 1: 后端 — 扩展 RentalRecordDto + Mapster 映射

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`
- Modify: `Gentle/Gentle.Application/Mapper.cs`

- [ ] **Step 1: 在 RentalRecordDto 中新增 Bills 属性**

在 `RentalRecordDto.cs` 的 `CreatedTime` 属性之前新增：

```csharp
using Gentle.Application.Dtos.Bill;

/// <summary>
/// 关联账单列表
/// </summary>
public List<BillDto>? Bills { get; set; }
```

注意：需要添加 `using Gentle.Application.Dtos.Bill;` 到文件顶部。

- [ ] **Step 2: 在 Mapper.cs 中新增 Bills 映射**

将现有的 `RentalRecord -> RentalRecordDto` 配置（第 42-48 行）替换为：

```csharp
// RentalRecord -> RentalRecordDto 映射配置
config.NewConfig<RentalRecord, RentalRecordDto>()
    .Map(dest => dest.TenantId, src => src.RenterId)
    .Map(dest => dest.TenantName, src => src.Renter != null ? src.Renter.Name : string.Empty)
    .Map(dest => dest.RoomInfo, src => src.Room != null && src.Room.Community != null
        ? $"{src.Room.Community.Name} {src.Room.Building}栋 {src.Room.RoomNumber}号"
        : string.Empty)
    .Map(dest => dest.Bills, src => src.Bills);
```

新增了最后一行 `.Map(dest => dest.Bills, src => src.Bills)`。

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: 构建成功，无错误

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs Gentle/Gentle.Application/Mapper.cs
git commit -m "feat: RentalRecordDto 新增 Bills 嵌套属性及 Mapster 映射"
```

---

## Task 2: 后端 — 新增分页查询接口和实现

**Files:**
- Modify: `Gentle/Gentle.Application/Services/IRentalRecordService.cs`
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs`

- [ ] **Step 1: 在 IRentalRecordService 中新增分页接口**

在接口文件 `IRentalRecordService.cs` 的 `DeleteAsync` 方法之后新增：

```csharp
/// <summary>
/// 分页获取租住记录列表
/// </summary>
/// <param name="status">状态筛选（可选）</param>
/// <param name="roomId">房间ID筛选（可选）</param>
/// <param name="tenantId">租客ID筛选（可选）</param>
/// <param name="page">页码（从1开始）</param>
/// <param name="pageSize">每页数量</param>
Task<(List<RentalRecordDto> Items, int Total)> GetPagedListAsync(
    RentalStatus? status = null,
    int? roomId = null,
    int? tenantId = null,
    int page = 1,
    int pageSize = 20);
```

- [ ] **Step 2: 在 RentalRecordService 中实现分页查询**

在 `RentalRecordService.cs` 的 `DeleteAsync` 方法之后、`CalculateContractEndDate` 方法之前新增：

```csharp
/// <inheritdoc />
public async Task<(List<RentalRecordDto> Items, int Total)> GetPagedListAsync(
    RentalStatus? status = null,
    int? roomId = null,
    int? tenantId = null,
    int page = 1,
    int pageSize = 20)
{
    // 分页参数边界验证
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;

    var query = _repository
        .AsQueryable(false)
        .Include(r => r.Renter)
        .Include(r => r.Room)
            .ThenInclude(room => room.Community)
        .Include(r => r.Bills)
        .AsQueryable();

    // 状态筛选
    if (status.HasValue)
    {
        query = query.Where(r => r.Status == status.Value);
    }

    // 房间筛选
    if (roomId.HasValue)
    {
        query = query.Where(r => r.RoomId == roomId.Value);
    }

    // 租客筛选
    if (tenantId.HasValue)
    {
        query = query.Where(r => r.RenterId == tenantId.Value);
    }

    // 获取总数
    var total = await query.CountAsync();

    // 分页
    var items = await query
        .OrderByDescending(r => r.CreatedTime)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    var dtos = items.Adapt<List<RentalRecordDto>>();
    return (dtos, total);
}
```

- [ ] **Step 3: 修改 GetByIdAsync 加载 Bills**

将 `GetByIdAsync` 方法中的查询改为（添加 `.Include(r => r.Bills)`）：

```csharp
var record = await _repository
    .AsQueryable(false)
    .Include(r => r.Renter)
    .Include(r => r.Room)
        .ThenInclude(room => room.Community)
    .Include(r => r.Bills)
    .FirstOrDefaultAsync(r => r.Id == id);
```

- [ ] **Step 4: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Services/IRentalRecordService.cs Gentle/Gentle.Application/Services/RentalRecordService.cs
git commit -m "feat: RentalRecordService 新增分页查询方法 GetPagedListAsync"
```

---

## Task 3: 后端 — 新增分页 API 端点

**Files:**
- Modify: `Gentle/Gentle.Application/Apps/RentalAppService.cs`

- [ ] **Step 1: 在 RentalAppService 中新增分页端点**

在 `Remove` 方法之后新增：

```csharp
/// <summary>
/// 分页获取租住记录列表
/// </summary>
/// <param name="status">状态筛选（active/terminated）</param>
/// <param name="roomId">房间ID筛选</param>
/// <param name="tenantId">租客ID筛选</param>
/// <param name="page">页码</param>
/// <param name="pageSize">每页数量</param>
[HttpGet("page")]
public async Task<RentalRecordListResult> GetPage(
    string? status = null,
    int? roomId = null,
    int? tenantId = null,
    int page = 1,
    int pageSize = 20)
{
    RentalStatus? statusEnum = null;
    if (!string.IsNullOrEmpty(status))
    {
        statusEnum = status.ToLower() switch
        {
            "active" => RentalStatus.Active,
            "terminated" => RentalStatus.Terminated,
            _ => null
        };
    }

    var (items, total) = await _rentalRecordService.GetPagedListAsync(
        statusEnum, roomId, tenantId, page, pageSize);

    return new RentalRecordListResult
    {
        Items = items,
        Total = total,
        Page = page,
        PageSize = pageSize
    };
}
```

- [ ] **Step 2: 在文件底部新增 RentalRecordListResult 类**

在 `RentalAppService` 类的结束大括号之后，文件末尾新增：

```csharp
/// <summary>
/// 租住记录分页结果
/// </summary>
public class RentalRecordListResult
{
    /// <summary>
    /// 租住记录列表
    /// </summary>
    public List<RentalRecordDto> Items { get; set; } = [];

    /// <summary>
    /// 总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; }
}
```

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: 构建成功

- [ ] **Step 4: 启动后端验证 API 可访问**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`

验证：浏览器访问 `https://localhost:5001/api/rental/page` 应返回 JSON（可能需要登录 token）。

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Apps/RentalAppService.cs
git commit -m "feat: RentalAppService 新增分页查询端点 GET /api/rental/page"
```

---

## Task 4: 前端 — 扩展类型和 API

**Files:**
- Modify: `Hans/src/api/model/rentalModel.ts`
- Modify: `Hans/src/api/rental.ts`

- [ ] **Step 1: 在 rentalModel.ts 中扩展 RentalRecordDto**

在文件顶部新增 `BillItem` 的 import（在现有 import 之后）：

```typescript
import type { BillItem } from '@/api/model/billModel';
```

在 `RentalRecordDto` 接口中，`createdTime` 字段之后新增：

```typescript
/** 关联账单列表 */
bills?: BillItem[];
```

在文件末尾新增分页类型：

```typescript
/**
 * 租赁记录分页查询参数
 */
export interface RentalPageParams {
  /** 状态筛选（active/terminated） */
  status?: string;
  /** 房间ID筛选 */
  roomId?: number;
  /** 租客ID筛选 */
  tenantId?: number;
  /** 页码（从1开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 租赁记录分页结果
 */
export interface RentalPageResult {
  items: RentalRecordDto[];
  total: number;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 2: 在 rental.ts 中新增分页查询函数**

在 `Api` 常量中新增：

```typescript
Page: '/rental/page',
```

在文件末尾新增：

```typescript
/**
 * 分页获取租赁记录
 */
export function getRentalPage(params: RentalPageParams) {
  return request.get<RentalPageResult>({
    url: Api.Page,
    params,
  });
}
```

更新文件顶部的 import：

```typescript
import type { CheckInInput, CheckOutInput, RentalPageParams, RentalPageResult, RentalRecordDto } from '@/api/model/rentalModel';
```

- [ ] **Step 3: 构建验证**

Run: `cd Hans && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: 提交**

```bash
git add Hans/src/api/model/rentalModel.ts Hans/src/api/rental.ts
git commit -m "feat: 前端新增租赁记录分页查询类型和 API"
```

---

## Task 5: 前端 — 新增路由

**Files:**
- Modify: `Hans/src/router/modules/housing.ts`

- [ ] **Step 1: 在 housing.ts 中新增租赁记录路由**

在 `room/detail/:id` 路由之后新增：

```typescript
{
  path: 'rental',
  name: 'HousingRental',
  component: () => import('@/pages/housing/rental/index.vue'),
  meta: { title: { zh_CN: '租赁记录', en_US: 'Rental Records' } },
},
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/router/modules/housing.ts
git commit -m "feat: 新增租赁记录页面路由 /housing/rental"
```

---

## Task 6: 前端 — 新建租赁记录页面

**Files:**
- Create: `Hans/src/pages/housing/rental/index.vue`

- [ ] **Step 1: 创建页面目录**

Run: `mkdir -p Hans/src/pages/housing/rental`

- [ ] **Step 2: 创建租赁记录页面**

创建 `Hans/src/pages/housing/rental/index.vue`，完整代码如下：

```vue
<template>
  <div class="rental-record-list">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部筛选栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-select
            v-model="filterCommunityId"
            :options="communityOptions"
            placeholder="选择小区"
            clearable
            style="width: 200px"
            @change="handleCommunityChange"
          />
          <t-select
            v-model="filterRoomId"
            :options="roomOptions"
            placeholder="选择房间"
            clearable
            :disabled="!filterCommunityId"
            style="width: 240px"
          />
          <t-select
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          />
          <t-button theme="primary" @click="handleSearch">查询</t-button>
        </div>
      </t-row>

      <!-- 数据表格（可展开行） -->
      <t-table
        :data="data"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :expanded-row="expandedRow"
        :expanded-row-keys="expandedRowKeys"
        :header-affixed-top="headerAffixedTop"
        @page-change="handlePageChange"
        @expanded-row-keys-change="handleExpandedRowKeysChange"
      >
        <template #checkInDate="{ row }">
          {{ formatDate(row.checkInDate) }}
        </template>
        <template #contractEndDate="{ row }">
          {{ formatDate(row.contractEndDate) }}
        </template>
        <template #checkOutDate="{ row }">
          {{ row.checkOutDate ? formatDate(row.checkOutDate) : '-' }}
        </template>
        <template #monthlyRent="{ row }">
          <span class="price">¥{{ formatMoney(row.monthlyRent) }}</span>
        </template>
        <template #deposit="{ row }">
          <span class="price">¥{{ formatMoney(row.deposit) }}</span>
        </template>
        <template #depositStatusText="{ row }">
          <t-tag :theme="getDepositStatusTheme(row.depositStatus)" variant="light">
            {{ row.depositStatusText }}
          </t-tag>
        </template>
        <template #statusText="{ row }">
          <t-tag :theme="row.status === RentalStatus.Active ? 'success' : 'default'" variant="light">
            {{ row.statusText }}
          </t-tag>
        </template>
      </t-table>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import type { PageInfo, PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin, Table as TTable } from 'tdesign-vue-next';
import { computed, h, onMounted, ref } from 'vue';

import type { CommunityItem } from '@/api/model/communityModel';
import type { BillItem, RentalPageResult, RentalRecordDto } from '@/api/model/rentalModel';
import { DepositStatus, RentalStatus } from '@/api/model/rentalModel';
import type { RoomItem } from '@/api/model/roomModel';
import { getCommunityList } from '@/api/community';
import { getRentalPage } from '@/api/rental';
import { getRoomList } from '@/api/room';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'RentalRecordList',
});

// ==================== 类型定义 ====================

interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

// ==================== 状态 ====================

const settingStore = useSettingStore();

// 筛选状态
const filterCommunityId = ref<number | undefined>(undefined);
const filterRoomId = ref<number | undefined>(undefined);
const filterStatus = ref<string | undefined>(undefined);

// 下拉选项
const communityOptions = ref<{ label: string; value: number }[]>([]);
const roomOptions = ref<{ label: string; value: number }[]>([]);

// 状态选项
const statusOptions = [
  { label: '在租中', value: 'active' },
  { label: '已终止', value: 'terminated' },
];

// 表格状态
const loading = ref(false);
const data = ref<RentalRecordDto[]>([]);
const pagination = ref({
  pageSize: 20,
  total: 0,
  current: 1,
});

// 展开行
const expandedRowKeys = ref<number[]>([]);

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 表格列配置 ====================

const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'roomInfo', title: '房间信息', width: 200, ellipsis: true },
  { colKey: 'tenantName', title: '租客姓名', width: 120 },
  { colKey: 'checkInDate', title: '入住日期', width: 120 },
  { colKey: 'contractEndDate', title: '合同到期', width: 120 },
  { colKey: 'checkOutDate', title: '退租日期', width: 120 },
  { colKey: 'leaseTypeText', title: '租期类型', width: 100 },
  { colKey: 'monthlyRent', title: '月租金', width: 100 },
  { colKey: 'deposit', title: '押金', width: 100 },
  { colKey: 'depositStatusText', title: '押金状态', width: 100 },
  { colKey: 'statusText', title: '租住状态', width: 100 },
];

// ==================== 展开行渲染 ====================

const billColumns: PrimaryTableCol[] = [
  { colKey: 'periodText', title: '账单周期', width: 220 },
  { colKey: 'dueDate', title: '应收日期', width: 120, cell: (_h: any, { row }: { row: BillItem }) => formatDate(row.dueDate) },
  { colKey: 'rentAmount', title: '租金', width: 100, cell: (_h: any, { row }: { row: BillItem }) => `¥${formatMoney(row.rentAmount)}` },
  { colKey: 'waterFee', title: '水费', width: 100, cell: (_h: any, { row }: { row: BillItem }) => row.waterFee ? `¥${formatMoney(row.waterFee)}` : '-' },
  { colKey: 'electricFee', title: '电费', width: 100, cell: (_h: any, { row }: { row: BillItem }) => row.electricFee ? `¥${formatMoney(row.electricFee)}` : '-' },
  { colKey: 'totalAmount', title: '总金额', width: 100, cell: (_h: any, { row }: { row: BillItem }) => `¥${formatMoney(row.totalAmount)}` },
  { colKey: 'statusText', title: '状态', width: 100 },
  { colKey: 'paidAmount', title: '实收金额', width: 100, cell: (_h: any, { row }: { row: BillItem }) => row.paidAmount ? `¥${formatMoney(row.paidAmount)}` : '-' },
  { colKey: 'paidDate', title: '收款日期', width: 120, cell: (_h: any, { row }: { row: BillItem }) => row.paidDate ? formatDate(row.paidDate) : '-' },
];

function expandedRow({ row }: { row: RentalRecordDto }) {
  const bills = row.bills ?? [];
  const sortedBills = [...bills].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return h(
    'div',
    { style: 'padding: 8px 0 8px 48px;' },
    [
      h(
        'div',
        { style: 'font-weight: 500; margin-bottom: 8px; color: var(--td-text-color-secondary);' },
        `关联账单（${sortedBills.length} 条）`,
      ),
      sortedBills.length > 0
        ? h(TTable, {
            data: sortedBills,
            columns: billColumns,
            rowKey: 'id',
            size: 'small',
            bordered: true,
            pagination: false,
          })
        : h('div', { style: 'color: var(--td-text-color-placeholder);' }, '暂无账单记录'),
    ],
  );
}

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  try {
    const res = await getRentalPage({
      status: filterStatus.value,
      roomId: filterRoomId.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    data.value = res?.items ?? [];
    pagination.value.total = res?.total ?? 0;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取租赁记录失败');
  } finally {
    loading.value = false;
  }
}

async function fetchCommunities() {
  try {
    const list = await getCommunityList();
    communityOptions.value = (list ?? []).map((c: CommunityItem) => ({
      label: c.name,
      value: c.id,
    }));
  } catch {
    // 静默失败
  }
}

async function fetchRooms(communityId: number) {
  try {
    const list = await getRoomList({ communityId });
    roomOptions.value = (list ?? []).map((r: RoomItem) => ({
      label: `${r.building}栋 ${r.roomNumber}号`,
      value: r.id,
    }));
  } catch {
    // 静默失败
  }
}

// ==================== 事件处理 ====================

function handleCommunityChange(value: number | undefined) {
  filterRoomId.value = undefined;
  roomOptions.value = [];
  if (value) {
    fetchRooms(value);
  }
}

function handleSearch() {
  pagination.value.current = 1;
  fetchData();
}

function handlePageChange(pageInfo: PageInfo) {
  pagination.value.current = pageInfo.current;
  pagination.value.pageSize = pageInfo.pageSize;
  fetchData();
}

function handleExpandedRowKeysChange(keys: number[]) {
  expandedRowKeys.value = keys;
}

// ==================== 辅助函数 ====================

function getDepositStatusTheme(status: DepositStatus): 'success' | 'warning' | 'danger' {
  const themes: Record<DepositStatus, 'success' | 'warning' | 'danger'> = {
    [DepositStatus.Received]: 'success',
    [DepositStatus.Refunded]: 'warning',
    [DepositStatus.Deducted]: 'danger',
  };
  return themes[status] ?? 'success';
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchCommunities();
  fetchData();
});
</script>

<style lang="less" scoped>
.rental-record-list {
  .list-card-container {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
  }

  .left-operation-container {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-s);
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .price {
    font-weight: 500;
  }
}
</style>
```

- [ ] **Step 3: 验证页面可加载**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 4: 提交**

```bash
git add Hans/src/pages/housing/rental/index.vue
git commit -m "feat: 新增租赁记录列表页面（含展开行账单、分页、筛选）"
```

---

## Task 7: 端到端验证

- [ ] **Step 1: 后端构建**

Run: `cd Gentle && dotnet build`
Expected: 构建成功

- [ ] **Step 2: 前端构建**

Run: `cd Hans && npm run build`
Expected: 构建成功

- [ ] **Step 3: 启动后端，手动验证 API**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`

访问 `GET /api/rental/page` 验证返回数据结构包含 `items`、`total`、`page`、`pageSize` 字段，且 `items` 中每条记录包含 `bills` 数组。

- [ ] **Step 4: 启动前端，手动验证页面**

Run: `cd Hans && npm run dev`

访问 `/housing/rental` 验证：
- 页面加载显示租赁记录表格
- 筛选栏小区→房间级联正常
- 分页切换正常
- 点击行展开显示关联账单
- 账单按应收日期升序排列
