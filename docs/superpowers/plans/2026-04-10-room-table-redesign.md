# 房间列表表格重设计 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除房间列表的安居码、已租时长、到期天数三列，改用行展开展示租客信息（姓名、租期、安居码）。

**Architecture:** 后端 RoomDto 删减冗余字段、新增租客相关字段；RoomService 添加 Renter Include 并调整映射；前端删列加展开行，清理死代码。

**Tech Stack:** .NET 10 (Furion), Vue 3 + TDesign Vue Next, Playwright E2E

---

### Task 1: 后端 RoomDto 字段调整

**Files:**
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs:91-99`

- [ ] **Step 1: 删除 LeaseDuration 和 DaysUntilExpiry 字段，新增 TenantName、RentalStartDate、RentalEndDate**

将 `RoomDto.cs` 第 91-99 行：

```csharp
    /// <summary>
    /// 已租时长（如"1年2月16天"）
    /// </summary>
    public string? LeaseDuration { get; set; }

    /// <summary>
    /// 到期天数（负数表示已过期天数）
    /// </summary>
    public int? DaysUntilExpiry { get; set; }
```

替换为：

```csharp
    /// <summary>
    /// 租客姓名
    /// </summary>
    public string? TenantName { get; set; }

    /// <summary>
    /// 租期开始日期
    /// </summary>
    public DateTime? RentalStartDate { get; set; }

    /// <summary>
    /// 租期结束日期
    /// </summary>
    public DateTime? RentalEndDate { get; set; }
```

- [ ] **Step 2: 验证后端编译通过**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/Room/RoomDto.cs
git commit -m "refactor: RoomDto 删除 LeaseDuration/DaysUntilExpiry，新增 TenantName/RentalStartDate/RentalEndDate"
```

---

### Task 2: 后端 RoomService 映射逻辑调整

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:51-59` (查询部分)
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:66-76` (映射部分)
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:80-112` (移除 CalculateLeaseDuration)
- Modify: `Gentle/Gentle.Application/Gentle.Application.xml` (同步 XML 文档)

- [ ] **Step 1: 添加 Renter Include**

在 `RoomService.cs` 第 51-55 行的活跃租赁记录查询中添加 `.Include(r => r.Renter)`：

```csharp
        var activeRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Where(r => r.Status == RentalStatus.Active && roomIds.Contains(r.RoomId))
            .OrderByDescending(r => r.CreatedTime)
            .ToListAsync();
```

- [ ] **Step 2: 调整映射逻辑**

将第 68-74 行的映射部分：

```csharp
                if (rentalByRoomId.TryGetValue(r.Id, out var rental))
                {
                    dto.AnjuCodeSubmitted = rental.IsAnJuCodeSubmitted;
                    dto.LeaseDuration = CalculateLeaseDuration(rental.CheckInDate.Date, today);
                    dto.DaysUntilExpiry = (int)(rental.ContractEndDate.Date - today).TotalDays;
                }
```

替换为：

```csharp
                if (rentalByRoomId.TryGetValue(r.Id, out var rental))
                {
                    dto.AnjuCodeSubmitted = rental.IsAnJuCodeSubmitted;
                    dto.TenantName = rental.Renter?.Name;
                    dto.RentalStartDate = rental.CheckInDate;
                    dto.RentalEndDate = rental.ContractEndDate;
                }
```

同时移除 `today` 变量（第 49 行 `var today = DateTime.Today;`），因为不再需要。

- [ ] **Step 3: 移除 CalculateLeaseDuration 方法**

删除第 80-112 行的 `CalculateLeaseDuration` 方法。

- [ ] **Step 4: 更新 Gentle.Application.xml**

移除 `LeaseDuration` 和 `DaysUntilExpiry` 的 XML 文档条目，添加新字段的 XML 文档条目。同时移除 `CalculateLeaseDuration` 方法的 XML 文档条目。

- [ ] **Step 5: 验证后端编译通过**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 6: 提交**

```bash
git add Gentle/Gentle.Application/Services/RoomService.cs Gentle/Gentle.Application/Gentle.Application.xml
git commit -m "refactor: RoomService 调整租客信息映射，移除 CalculateLeaseDuration"
```

---

### Task 3: 前端 RoomItem 类型调整

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts:46-48`

- [ ] **Step 1: 更新 RoomItem 接口**

将 `roomModel.ts` 第 46-48 行：

```typescript
  anjuCodeSubmitted?: boolean | null;
  leaseDuration?: string | null;
  daysUntilExpiry?: number | null;
```

替换为：

```typescript
  anjuCodeSubmitted?: boolean | null;
  tenantName?: string | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
```

- [ ] **Step 2: 验证前端类型检查通过**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add Hans/src/api/model/roomModel.ts
git commit -m "refactor: RoomItem 类型删除 leaseDuration/daysUntilExpiry，新增 tenantName/rentalStartDate/rentalEndDate"
```

---

### Task 4: 前端表格重设计 — 删列、加展开行、清理死代码

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

- [ ] **Step 1: 删除三列配置**

将 `columns` 数组（第 670-682 行）中删除这三行：

```typescript
  { colKey: 'anjuCodeSubmitted', title: '安居码', width: 80 },
  { colKey: 'leaseDuration', title: '已租时长', width: 110 },
  { colKey: 'daysUntilExpiry', title: '到期天数', width: 100 },
```

- [ ] **Step 2: 删除三个模板槽**

删除第 66-80 行的三个模板槽：

```html
        <template #anjuCodeSubmitted="{ row }">
          ...
        </template>
        <template #leaseDuration="{ row }">
          ...
        </template>
        <template #daysUntilExpiry="{ row }">
          ...
        </template>
```

- [ ] **Step 3: 添加 t-table 的展开行属性和模板**

在 `<t-table>` 标签上添加 `expanded-row-keys` 和 `@expand-change`：

```html
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        :expanded-row-keys="expandedRowKeys"
        data-testid="room-table"
        @page-change="handlePageChange"
        @expand-change="handleExpandChange"
      >
```

在 `#op` 模板槽之后、`</t-table>` 之前添加展开行模板：

```html
        <template #expandedRow="{ row }">
          <div v-if="row.tenantName" class="expanded-row">
            <div class="expanded-item">
              <span class="expanded-label">租客</span>
              <span class="expanded-value">{{ row.tenantName }}</span>
            </div>
            <div class="expanded-item">
              <span class="expanded-label">租期开始</span>
              <span class="expanded-value">{{ row.rentalStartDate?.split('T')[0] || '-' }}</span>
            </div>
            <div class="expanded-item">
              <span class="expanded-label">租期结束</span>
              <span
                class="expanded-value"
                :class="{ 'text-expired': row.rentalEndDate && new Date(row.rentalEndDate) < new Date() }"
              >{{ row.rentalEndDate?.split('T')[0] || '-' }}</span>
            </div>
            <div class="expanded-item">
              <span class="expanded-label">安居码</span>
              <t-tag v-if="row.anjuCodeSubmitted === true" theme="success" variant="light" size="small">已提交</t-tag>
              <t-tag v-else-if="row.anjuCodeSubmitted === false" theme="danger" variant="light" size="small">未提交</t-tag>
              <span v-else class="text-secondary">-</span>
            </div>
          </div>
          <div v-else class="expanded-row-empty">暂无租客信息</div>
        </template>
```

- [ ] **Step 4: 添加展开行相关的 script 逻辑**

在状态定义区域添加 `expandedRowKeys`：

```typescript
const expandedRowKeys = ref<number[]>([]);
```

添加 `handleExpandChange` 函数（放在 `handlePageChange` 之后）：

```typescript
/** 展开/折叠行 */
function handleExpandChange(options: { expandedRowKeys: number[] }) {
  expandedRowKeys.value = options.expandedRowKeys;
}
```

在 `handlePageChange` 函数中添加展开状态重置：

```typescript
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.defaultCurrent = pageInfo.current;
  pagination.value.defaultPageSize = pageInfo.pageSize;
  expandedRowKeys.value = [];
}
```

- [ ] **Step 5: 删除 getExpiryClass 函数及其 JSDoc 注释**

删除第 841-846 行（含注释）：

```typescript
/** 获取到期天数样式 */
function getExpiryClass(days: number): string {
  if (days > 0) return 'expiry-positive';
  if (days === 0) return 'expiry-zero';
  return 'expiry-negative';
}
```

- [ ] **Step 6: 删除过期 CSS 类，添加展开行样式**

删除 `.expiry-positive`、`.expiry-zero`、`.expiry-negative` 三个 CSS 类（第 1248-1261 行）。

在 `.remark-text` 样式块之后添加展开行样式：

```less
  .expanded-row {
    display: flex;
    gap: 32px;
    padding: 8px 0;
  }

  .expanded-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .expanded-label {
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }

  .expanded-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .text-expired {
    color: var(--td-error-color);
  }

  .expanded-row-empty {
    padding: 8px 0;
    font-size: 13px;
    color: var(--td-text-color-placeholder);
  }
```

- [ ] **Step 7: 验证前端构建通过**

Run: `cd Hans && npm run build:type`
Expected: 无错误

- [ ] **Step 8: 提交**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间列表改用行展开展示租客信息，删除安居码/已租时长/到期天数列"
```

---

### Task 5: E2E 测试更新

**Files:**
- Modify: `tests/e2e/feat-152-room-model-rental-fields.spec.ts`
- Modify: `tests/e2e/feat-153-room-list-rental-columns.spec.ts`
- Modify: `tests/e2e/feat-154-room-list-rental-info.spec.ts`

- [ ] **Step 1: 读取现有 E2E 测试文件，按以下指导更新断言**

**feat-152（模型字段）：**
- 移除对 `leaseDuration`、`daysUntilExpiry` 的断言
- 添加对 `tenantName`、`rentalStartDate`、`rentalEndDate` 的断言
- 验证这些字段类型为 `string | null`

**feat-153（列表列）：**
- 移除对 `anjuCodeSubmitted`、`leaseDuration`、`daysUntilExpiry` 列的断言
- 验证 `columns` 数组不包含这三个 `colKey`
- 验证表格存在 `expanded-row-keys` 属性和 `#expandedRow` 模板
- 验证 `expandedRowKeys` ref 存在
- 验证 `getExpiryClass` 函数已移除

**feat-154（综合集成）：**
- 移除旧三列的渲染断言
- 添加展开行断言：点击展开箭头后可见租客信息
- 验证空置房间展开后显示"暂无租客信息"
- 验证已出租房间展开后显示租客姓名、租期日期、安居码状态

- [ ] **Step 2: 运行测试验证**

Run: `cd tests && npx playwright test e2e/feat-152-room-model-rental-fields.spec.ts e2e/feat-153-room-list-rental-columns.spec.ts e2e/feat-154-room-list-rental-info.spec.ts`
Expected: 所有测试通过

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/feat-152-room-model-rental-fields.spec.ts tests/e2e/feat-153-room-list-rental-columns.spec.ts tests/e2e/feat-154-room-list-rental-info.spec.ts
git commit -m "test: 更新 E2E 测试匹配房间列表展开行结构"
```
