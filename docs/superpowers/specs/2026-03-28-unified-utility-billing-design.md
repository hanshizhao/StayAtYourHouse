# 统一水电费账单设计规格

## 背景

当前系统存在两套独立的账单体系：

| 实体 | 关联 | 用途 | 问题 |
|------|------|------|------|
| Bill（房租账单） | RentalRecordId → 租住记录 | 月租催收，催收成功后自动生成下一期 | **不符合实际业务**——房租是签合同时一次性付清的，不存在月度催收 |
| UtilityBill（水电账单） | RoomId → 房间 | 抄表后生成水电费 | 与 Bill 完全独立，无法在租住记录中查看 |

实际业务模型：

- 房租在签合同时一次性付清（押金 + 全部租金），记录在 RentalRecord 上
- 系统中真正需要"账单"的只有水电费，按抄表周期单独收取
- 合同到期时，未缴水电费从押金中扣除

## 设计决策

1. **删除 Bill 及催收体系**：月租账单不符合实际业务
2. **UtilityBill 成为唯一账单**：水电费按抄表周期收取
3. **UtilityBill 增加 RentalRecordId**：直接关联租住记录，替代间接关联
4. **无租客时抄表仅记录**：不生成账单，等有租客后再抄表时才产生账单

## 业务流程

```
签合同 → 交钱（押金+全部租金）→ 入住
                                    │
                      ┌─────────────┘
                      ↓
                 日常运营阶段
                 ┌─ 抄表 → 生成 UtilityBill → 收取
                 └─ 无月租催收（房租已付清）
                      │
                      ↓
                 合同到期前
                 ├─ 续租 → 补交新周期租金 → 延长合同
                 ├─ 宽限 → 短期延期
                 └─ 退租 → 押金 - 未缴水电费 = 退款
```

## 要删除的

### 后端文件（直接删除）

| 文件 | 说明 |
|------|------|
| `Gentle.Core/Entities/Bill.cs` | Bill 实体（含 BillValidationAttribute） |
| `Gentle.Core/Entities/CollectionRecord.cs` | 催收记录实体 |
| `Gentle.Core/Enums/BillStatus.cs` | 账单状态枚举 |
| `Gentle.Core/Enums/CollectResult.cs` | 催收结果枚举 |
| `Gentle.Application/Apps/BillAppService.cs` | 账单 API 入口（含 BillListResult 类） |
| `Gentle.Application/Services/IBillService.cs` | 账单服务接口 |
| `Gentle.Application/Services/BillService.cs` | 账单服务实现 |
| `Gentle.Application/Dtos/Bill/` | 整个目录（BillDto、CollectInput、CollectionRecordDto、TodoBillsDto） |

### 后端文件（清理引用）

| 文件 | 改动 |
|------|------|
| `Gentle.Core/Entities/RentalRecord.cs` | 删除 `ICollection<Bill> Bills` 导航属性 |
| `Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` | 删除 `List<BillDto>? Bills` 属性 |
| `Gentle.Application/Mapper.cs` | 删除 Bill→BillDto、CollectionRecord→CollectionRecordDto 映射 |
| `Gentle.Application/Services/ReportService.cs` | 删除催收报表逻辑（依赖 Bill），后续按需重新设计 |
| `Gentle.Database.Migrations/Migrations/DefaultDbContextModelSnapshot.cs` | EF 快照会随迁移自动更新 |

### 前端文件（直接删除）

| 文件 | 说明 |
|------|------|
| `Hans/src/pages/bill/` | 整个目录（index.vue、components/CollectDialog.vue） |
| `Hans/src/api/bill.ts` | Bill API |
| `Hans/src/api/model/billModel.ts` | Bill 类型定义 |
| `Hans/src/router/modules/bill.ts` | Bill 路由 |

### 前端文件（清理引用）

| 文件 | 改动 |
|------|------|
| `Hans/src/api/model/rentalModel.ts` | 删除 `bills?: BillItem[]` 属性和 BillItem 导入 |
| `Hans/src/pages/housing/rental/index.vue` | 展开行改为展示 UtilityBill（见下方改造部分） |
| `Hans/src/pages/dashboard/base/components/TodoPanel.vue` | 删除 Bill 待办，后续改为展示 UtilityBill 待办 |
| `Hans/src/pages/report/collection/index.vue` | 删除催收统计报表页（依赖 Bill），后续按需重新设计 |

## 要改造的

### 1. UtilityBill 实体

**文件**: `Gentle.Core/Entities/UtilityBill.cs`

新增字段：

```
RentalRecordId : int?          (新增，关联租住记录，可选——无租客抄表时为 null)
RentalRecord   : RentalRecord? (新增，导航属性)
```

- `RentalRecordId` 可空：抄表时无活跃租约则为 null，有活跃租约则自动填入

### 2. UtilityBillStatus 枚举

**文件**: `Gentle.Core/Enums/UtilityBillStatus.cs`

```csharp
public enum UtilityBillStatus
{
    Pending = 0,  // 待收取
    Paid = 1,     // 已收取
    // 删除 Merged = 2（不再需要合并概念）
}
```

### 3. MeterService 抄表逻辑

**文件**: `Gentle.Application/Services/MeterService.cs`

`CreateUtilityBillAsync` 方法改造：

- 查找该房间当前活跃的 RentalRecord
- 如果无活跃租约 → 不创建 UtilityBill（仅保存 MeterRecord）
- 如果有活跃租约 → 创建 UtilityBill，填入 `RentalRecordId`

### 4. RentalRecord 实体

**文件**: `Gentle.Core/Entities/RentalRecord.cs`

```csharp
// 删除
public ICollection<Bill> Bills { get; set; } = new List<Bill>();

// 新增
public ICollection<UtilityBill> UtilityBills { get; set; } = new List<UtilityBill>();
```

### 5. RentalRecordService 查询

**文件**: `Gentle.Application/Services/RentalRecordService.cs`

- `GetByIdAsync` / `GetPagedListAsync` 中 `.Include(r => r.Bills)` 改为 `.Include(r => r.UtilityBills)`
- RentalRecordDto 中 `List<BillDto>? Bills` 改为 `List<UtilityBillDto>? UtilityBills`

### 6. UtilityBillDto

**文件**: `Gentle.Application/Dtos/Meter/UtilityBillDto.cs`

确保包含：RentalRecordId、Status、PaidAmount、PaidDate 等所有前端需要的字段。

### 7. Mapper 配置

**文件**: `Gentle.Application/Mapper.cs`

- 删除 Bill / CollectionRecord 相关映射
- 保留 UtilityBill → UtilityBillDto 映射

### 8. 前端租赁记录页

**文件**: `Hans/src/pages/housing/rental/index.vue`

展开行改造：

- 数据源从 `rentalRow.bills` 改为 `rentalRow.utilityBills`
- 列定义更新：展示周期、水费、电费、总金额、状态、收款日期
- 删除 Bill 相关列（租金、催收等）

### 9. 前端 RentalRecord 类型

**文件**: `Hans/src/api/model/rentalModel.ts`

```typescript
// 删除
bills?: BillItem[]

// 新增
utilityBills?: UtilityBillItem[]
```

### 10. 前端水电账单页

**文件**: `Hans/src/pages/utility/bill/index.vue`

移除 Merged 状态的展示和处理。

### 11. 前端 Dashboard 待办

**文件**: `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

- 删除 `getTodayTodos` 调用（Bill 待办）
- 改为展示 Pending 状态的 UtilityBill 列表

### 12. 前端报表

**文件**: `Hans/src/pages/report/collection/index.vue`、对应路由

- 暂时删除催收统计报表页和路由
- 后续按需重新设计水电费统计报表

## 数据库迁移

### 新增迁移

```bash
dotnet ef migrations add RemoveBillAndAddUtilityBillRentalLink \
  --project Gentle.Database.Migrations \
  --startup-project Gentle.Web.Entry
```

迁移内容：

1. 删除 `collection_record` 表
2. 删除 `bill` 表
3. `utility_bill` 表新增 `rental_record_id` 列（可空 int，外键）
4. 删除 `utility_bill` 表中 `status = 2 (Merged)` 的数据（如有），或将 Merged 记录改为 Pending

### 枚举值处理

- `BillStatus` 枚举类型删除（数据库中以 int 存储，删除表后无影响）
- `CollectResult` 枚举类型删除
- `UtilityBillStatus` 枚举移除 `Merged = 2`，数据库中已有的 Merged 记录需在迁移中处理

## 不改动的部分

- **MeterRecord 实体**：抄表记录保持不变，仍独立记录每次抄表数据
- **MeterRecord.UtilityBill 导航属性**：保留，一条抄表记录对应一条水电账单
- **抄表录入流程**：MeterService.RecordAsync 核心逻辑不变，仅末尾的 CreateUtilityBillAsync 改造
- **房间管理**：Room 的水价、电价字段不变
- **租客管理**：Tenant 实体不变
- **入住/退租逻辑**：RentalRecordService 的入住校验和退租逻辑不变（退租时的水电费结算逻辑可后续增加）
- **小区管理**：Community 不变
- **用户/权限**：不变
