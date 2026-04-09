# Room 新增固定费用属性

## 背景

房东租约（LandlordLease）中包含 6 种费用：水费、电费、电梯费、物业费、网络费、其他费用。但房间（Room）实体只有水费和电费两个费用属性，无法反映租客实际支付的电梯费、物业费、网络费和其他费用。

Room 和 LandlordLease 上的同名费用含义不同：
- **Room 上的费用**：租客实际支付的价格
- **LandlordLease 上的费用**：房东合同中约定的价格

两者可能存在差价。

## 需求

在 Room 实体上新增 4 个固定月费属性：电梯费、物业费、网络费、其他费用，与 LandlordLease 结构对称。

### 约束

- 新增费用为固定月费，和水费/电费（按量计费）不同
- 这些固定费用和房租一起收取，与水电费账单独立
- 不影响现有账单计算逻辑
- 列表表格不加新列，只在编辑/查看抽屉中展示

## 设计

### 方案

在 Room 实体上直接添加 4 个独立字段（与 LandlordLease 对称），而非单字段汇总。

选择理由：业务已明确需要区分各项费用，且后续固定费用和房租一起收取时需要按类型计算。单字段方案无法支持分类查看。

### 后端变更

#### Room 实体（`Gentle.Core/Entities/Room.cs`）

新增 4 个属性：

```csharp
/// <summary>电梯费（月）</summary>
public decimal? ElevatorFee { get; set; }

/// <summary>物业费（月）</summary>
public decimal? PropertyFee { get; set; }

/// <summary>网络费（月）</summary>
public decimal? InternetFee { get; set; }

/// <summary>其他费用（月）</summary>
public decimal? OtherFees { get; set; }
```

#### DTO 变更

- **RoomDto** — 新增 4 个只读属性
- **CreateRoomInput** — 新增 4 个可选属性，带 `[Range(0, double.MaxValue)]` 验证
- **UpdateRoomInput** — 同 CreateRoomInput

#### 数据库迁移

添加 EF Core 迁移，4 列均为 nullable decimal。

### 前端变更

#### TypeScript Model（`Hans/src/api/model/roomModel.ts`）

`RoomItem`、`CreateRoomParams`、`UpdateRoomParams` 新增 4 个可选字段。

#### 房间页面（`Hans/src/pages/housing/room/index.vue`）

- **列表表格**：不加新列
- **编辑/新建抽屉**：在现有水费、电费输入框之后追加 4 个输入框
  - 使用 `t-input-number` 组件，与现有费用输入框样式一致
  - 单位标注"元/月"（区别于水费"元/吨"、电费"元/度"）
  - 保持 2 列网格布局
- **表单数据类型** `RoomFormData`：新增 4 个可选字段
- **创建/编辑方法** `handleCreate`、`handleEdit`、`handleSubmit`：同步新字段

#### 无需改动

- LandlordLease 抽屉：已有这些字段
- 列表表格：不加新列

### E2E 测试

以下测试文件需更新，补充新字段的输入和断言：

- `feat-004-room-api.spec.ts` — Room API 创建/更新测试
- `feat-006-room-page.spec.ts` — Room 页面编辑抽屉测试
- 其他引用 Room 字段结构的测试文件

## 变更文件清单

| 文件 | 变更 |
|------|------|
| `Gentle.Core/Entities/Room.cs` | 新增 4 个属性 |
| `Gentle.Application/Dtos/Room/RoomDto.cs` | 新增 4 个属性 |
| `Gentle.Application/Dtos/Room/CreateRoomInput.cs` | 新增 4 个属性 |
| `Gentle.Application/Dtos/Room/UpdateRoomInput.cs` | 新增 4 个属性 |
| `Gentle.Application/Services/RoomService.cs` | 确认映射正确 |
| `Gentle.Database.Migrations/Migrations/` | 新增迁移文件 |
| `Hans/src/api/model/roomModel.ts` | 新增 4 个字段 |
| `Hans/src/pages/housing/room/index.vue` | 抽屉新增 4 个输入框 |
| `tests/e2e/feat-004-room-api.spec.ts` | 补充新字段测试 |
| `tests/e2e/feat-006-room-page.spec.ts` | 补充新字段测试 |
