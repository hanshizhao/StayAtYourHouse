# 安居码提交状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在租赁记录表格中新增"安居码"列，展示租客是否已提交安居码，并提供确认提交的交互功能。

**Architecture:** 后端在 RentalRecord 实体新增 `IsAnJuCodeSubmitted` 布尔字段，新增专用确认 API。服务层使用 `[UnitOfWork]` 模式。前端通过新增表格列 + DialogPlugin 确认弹窗实现交互。

**Tech Stack:** .NET 10 (Furion), EF Core, Vue 3, TDesign, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `Gentle/Gentle.Core/Entities/RentalRecord.cs` | Modify | 新增 `IsAnJuCodeSubmitted` 属性 |
| `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | Modify | 新增 `IsAnJuCodeSubmitted` 字段 |
| `Gentle/Gentle.Application/Services/IRentalRecordService.cs` | Modify | 新增 `ConfirmAnJuCodeAsync` 接口方法 |
| `Gentle/Gentle.Application/Services/RentalRecordService.cs` | Modify | 实现 `ConfirmAnJuCodeAsync` |
| `Gentle/Gentle.Application/Apps/RentalAppService.cs` | Modify | 新增 `ConfirmAnJuCode` API 端点 |
| `Gentle/Gentle.Database.Migrations/` | Create | EF Core 迁移 |
| `Hans/src/api/model/rentalModel.ts` | Modify | 新增 `isAnJuCodeSubmitted` 字段 |
| `Hans/src/api/rental.ts` | Modify | 新增 `confirmAnjuCode` API 函数 |
| `Hans/src/pages/housing/rental/index.vue` | Modify | 新增表格列和确认交互 |

---

### Task 1: 后端实体 — 新增 IsAnJuCodeSubmitted 属性

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/RentalRecord.cs:138` (在 `CheckOutRemark` 属性之后)

- [ ] **Step 1: 在 RentalRecord 实体中新增属性**

在 `CheckOutRemark` 属性（第 138 行）之后、`HasData` 方法（第 143 行）之前，添加：

```csharp
    /// <summary>
    /// 是否已提交安居码
    /// </summary>
    public bool IsAnJuCodeSubmitted { get; set; } = false;
```

- [ ] **Step 2: 在 RentalRecordDto 中新增字段**

在 `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` 的 `UtilityBills` 属性之前添加：

```csharp
    /// <summary>
    /// 是否已提交安居码
    /// </summary>
    public bool IsAnJuCodeSubmitted { get; set; }
```

- [ ] **Step 3: 验证后端构建通过**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Core/Entities/RentalRecord.cs Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs
git commit -m "feat: 租赁记录实体新增 IsAnJuCodeSubmitted 属性"
```

---

### Task 2: 后端服务层 — 新增 ConfirmAnJuCodeAsync 方法

**Files:**
- Modify: `Gentle/Gentle.Application/Services/IRentalRecordService.cs:47` (在 `DeleteAsync` 之后)
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs:293` (在 `DeleteAsync` 实现之后)

- [ ] **Step 1: 在 IRentalRecordService 接口中新增方法**

在 `DeleteAsync` 声明（第 47 行）之后添加：

```csharp
    /// <summary>
    /// 确认安居码提交
    /// </summary>
    Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id);
```

- [ ] **Step 2: 在 RentalRecordService 中实现方法**

在 `DeleteAsync` 实现（第 293 行 `}` 之后）、`CalculateContractEndDate` 方法之前添加：

```csharp
    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id)
    {
        var record = await _repository
            .AsQueryable()
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
        {
            throw Oops.Oh("租赁记录不存在");
        }

        // 幂等：已提交则直接返回
        if (record.IsAnJuCodeSubmitted)
        {
            return record.Adapt<RentalRecordDto>();
        }

        record.IsAnJuCodeSubmitted = true;
        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        // 重新查询以获取完整导航属性
        var updatedRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        return updatedRecord!.Adapt<RentalRecordDto>();
    }
```

- [ ] **Step 3: 验证后端构建通过**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Application/Services/IRentalRecordService.cs Gentle/Gentle.Application/Services/RentalRecordService.cs
git commit -m "feat: 服务层新增 ConfirmAnJuCodeAsync 方法"
```

---

### Task 3: 后端 API 层 — 新增确认接口端点

**Files:**
- Modify: `Gentle/Gentle.Application/Apps/RentalAppService.cs:119` (在 `Remove` 方法之后)

- [ ] **Step 1: 在 RentalAppService 中新增 API 端点**

在 `Remove` 方法（第 119 行 `}` 之后）添加：

```csharp
    /// <summary>
    /// 确认安居码提交
    /// </summary>
    [HttpPost("confirm-anju-code/{id}")]
    public async Task<RentalRecordDto> ConfirmAnJuCode(int id)
    {
        return await _rentalRecordService.ConfirmAnJuCodeAsync(id);
    }
```

- [ ] **Step 2: 验证后端构建通过**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: Commit**

```bash
git add Gentle/Gentle.Application/Apps/RentalAppService.cs
git commit -m "feat: 新增 POST /api/rental/confirm-anju-code/{id} 接口"
```

---

### Task 4: 数据库迁移

**Files:**
- Create: `Gentle/Gentle.Database.Migrations/` (自动生成)

- [ ] **Step 1: 生成 EF Core 迁移**

Run:
```bash
cd Gentle && dotnet ef migrations add AddAnJuCodeSubmittedToRentalRecord --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```
Expected: Build succeeded, migration file created

- [ ] **Step 2: 验证生成的迁移文件中包含 `is_an_ju_code_submitted` 列**

检查生成的迁移文件，确认包含 `AddColumn` 操作，列名为 `is_an_ju_code_submitted`，类型为 `boolean`，默认值为 `false`。

- [ ] **Step 3: 应用迁移到数据库**

Run:
```bash
cd Gentle && dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```
Expected: Done

- [ ] **Step 4: Commit**

```bash
git add Gentle/Gentle.Database.Migrations/
git commit -m "feat: EF Core 迁移 AddAnJuCodeSubmittedToRentalRecord"
```

---

### Task 5: 前端类型与 API — 新增 confirmAnjuCode

**Files:**
- Modify: `Hans/src/api/model/rentalModel.ts:109` (在 `utilityBills` 之前)
- Modify: `Hans/src/api/rental.ts:16` (在 `Api.Delete` 之后)

- [ ] **Step 1: 在 rentalModel.ts 中新增字段**

在 `RentalRecordDto` 接口的 `createdTime` 和 `utilityBills` 之间添加：

```typescript
  /** 是否已提交安居码 */
  isAnJuCodeSubmitted: boolean;
```

- [ ] **Step 2: 在 rental.ts 中新增 Api 常量和函数**

在 `Api` 常量的 `Delete` 之后添加：

```typescript
  ConfirmAnJuCode: '/rental/confirm-anju-code',
```

在文件末尾（`deleteRental` 函数之后）添加：

```typescript
/**
 * 确认安居码提交
 */
export function confirmAnjuCode(id: number) {
  return request.post<RentalRecordDto>({
    url: `${Api.ConfirmAnJuCode}/${id}`,
  });
}
```

- [ ] **Step 3: 验证前端类型检查通过**

Run: `cd Hans && npm run build:type`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add Hans/src/api/model/rentalModel.ts Hans/src/api/rental.ts
git commit -m "feat: 前端新增 isAnJuCodeSubmitted 字段和 confirmAnjuCode API"
```

---

### Task 6: 前端 UI — 表格新增安居码列及确认交互

**Files:**
- Modify: `Hans/src/pages/housing/rental/index.vue`

- [ ] **Step 1: 导入 DialogPlugin**

在第 115 行 `MessagePlugin` 导入旁，将：

```typescript
import { MessagePlugin } from 'tdesign-vue-next';
```

改为：

```typescript
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
```

- [ ] **Step 2: 导入 confirmAnjuCode API**

在第 124 行，将：

```typescript
import { getRentalPage } from '@/api/rental';
```

改为：

```typescript
import { confirmAnjuCode, getRentalPage } from '@/api/rental';
```

- [ ] **Step 3: 在 columns 数组中插入安居码列**

在第 150 行 `tenantName` 列之后插入新列：

```typescript
const columns: PrimaryTableCol[] = [
  { colKey: 'tenantName', title: '租客姓名', width: 120 },
  { colKey: 'isAnJuCodeSubmitted', title: '安居码', width: 100 },
  { colKey: 'roomInfo', title: '房间信息', width: 200, ellipsis: true },
  { colKey: 'checkInDate', title: '入住日期', width: 120 },
  { colKey: 'contractEndDate', title: '合同到期', width: 120 },
  { colKey: 'leaseTypeText', title: '租期类型', width: 100 },
  { colKey: 'monthlyRent', title: '月租金', width: 110 },
  { colKey: 'deposit', title: '押金', width: 110 },
  { colKey: 'status', title: '状态', width: 100 },
];
```

- [ ] **Step 4: 在 template 中添加安居码列的渲染模板**

在第 52 行 `#tenantName` 模板之后，`#roomInfo` 模板之前，添加：

```html
        <template #isAnJuCodeSubmitted="{ row }">
          <span v-if="row.isAnJuCodeSubmitted">✅</span>
          <t-link v-else theme="danger" underline @click="handleConfirmAnjuCode(row)">未提交</t-link>
        </template>
```

- [ ] **Step 5: 在 script 中添加 handleConfirmAnjuCode 函数**

在 `handleExpandChange` 函数（第 289 行）之后、`getStatusTheme` 函数之前添加：

```typescript
async function handleConfirmAnjuCode(row: RentalRecordDto) {
  const dialog = DialogPlugin.confirm({
    header: '确认安居码提交',
    body: `确认将 ${row.tenantName}（${row.roomInfo}）标记为已提交安居码？`,
    confirmBtn: '确认',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        await confirmAnjuCode(row.id);
        MessagePlugin.success('安居码确认成功');
        fetchData();
      } catch (e: unknown) {
        const error = e as { message?: string };
        MessagePlugin.error(error.message || '安居码确认失败');
      } finally {
        dialog.destroy();
      }
    },
    onClose: () => {
      dialog.destroy();
    },
  });
}
```

- [ ] **Step 6: 验证前端构建通过**

Run: `cd Hans && npm run build`
Expected: Build completed successfully

- [ ] **Step 7: Commit**

```bash
git add Hans/src/pages/housing/rental/index.vue
git commit -m "feat: 租赁记录表格新增安居码列及确认交互"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动后端服务**

Run: `cd Gentle && dotnet run --project Gentle.Web.Entry`
Expected: 服务启动成功，监听端口

- [ ] **Step 2: 启动前端开发服务器**

Run: `cd Hans && npm run dev`
Expected: 开发服务器启动在 3002 端口

- [ ] **Step 3: 浏览器验证**

1. 访问 `http://localhost:3002/housing/rental`
2. 确认表格第二列显示"安居码"列头
3. 确认未提交记录显示红色"未提交"链接
4. 点击"未提交"链接，确认弹窗显示租客姓名和房间信息
5. 点击确认，验证记录更新为 ✅ 图标
6. 再次点击已提交的行，确认 ✅ 不再可点击
