# 租赁记录页面设计规格

## 概述

新增独立的租赁记录列表页面，支持按房间筛选，每条记录可展开查看关联账单。

## 需求

- 独立页面展示所有租赁记录
- 支持按房间筛选（前端级联选择：小区 → 房间）
- 支持按租住状态筛选（在租中/已终止）
- 每条记录可展开查看关联账单列表（完整租赁生命周期）
- 后端已存在 `RentalRecord` 实体和 `Bill` 实体，关联关系为 `Bill.RentalRecordId → RentalRecord.Id`

## 方案

采用嵌套加载方式：`RentalRecordDto` 直接包含 `List<BillDto> Bills`，前端一次请求获取完整数据。

## 后端改动

### 1. 扩展 `RentalRecordDto`

文件：`Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`

新增属性：

```csharp
/// <summary>
/// 关联账单列表
/// </summary>
public List<Application.Dtos.Bill.BillDto>? Bills { get; set; }
```

注意：嵌套的 `BillDto` 中 `TenantName` 和 `RoomInfo` 字段将为空（`string.Empty`），因为这些信息已在父级 `RentalRecordDto` 中展示。前端展开行账单子表格不需要显示这两个字段。

### 2. 修改 Mapster 映射配置

文件：`Gentle/Gentle.Application/Mapper.cs`

在 `RentalRecord -> RentalRecordDto` 映射中新增 Bills 映射：

```csharp
config.NewConfig<RentalRecord, RentalRecordDto>()
    .Map(dest => dest.TenantId, src => src.RenterId)
    .Map(dest => dest.TenantName, src => src.Renter != null ? src.Renter.Name : string.Empty)
    .Map(dest => dest.RoomInfo, src => src.Room != null && src.Room.Community != null
        ? $"{src.Room.Community.Name} {src.Room.Building}栋 {src.Room.RoomNumber}号"
        : string.Empty)
    .Map(dest => dest.Bills, src => src.Bills);
```

Mapster 的 `Bill -> BillDto` 已有配置（`Mapper.cs` 第 55 行），基于命名约定自动映射基础字段。嵌套集合会自动递归映射。

### 3. 修改 `RentalRecordService.GetListAsync`

文件：`Gentle/Gentle.Application/Services/RentalRecordService.cs`

- 查询租赁记录时新增 `.Include(r => r.Bills)` 加载关联账单
- EF Core 的 fix-up 机制会自动填充导航属性，无需额外 Include Bills 的子导航

### 4. 修改 `RentalRecordService.GetByIdAsync`

同上，新增 `Include` 账单数据。

### 5. 无需新增 API 端点

现有端点保持不变：
- `GET /api/rental/list` — 返回数据多了 `bills` 字段
- `GET /api/rental/{id}` — 同上

## 前端改动

### 1. 扩展 `RentalRecordDto` 类型

文件：`Hans/src/api/model/rentalModel.ts`

```typescript
import type { BillItem } from '@/api/model/billModel';

export interface RentalRecordDto {
  // ... 现有字段 ...
  /** 关联账单列表 */
  bills?: BillItem[];
}
```

注：前端类型 `BillItem` 对应后端 `BillDto`，命名差异是项目现有惯例。

### 2. 新建租赁记录页面

文件：`Hans/src/pages/housing/rental/index.vue`

**页面结构：**

- 顶部筛选栏：
  - 小区下拉选择器（加载小区列表）
  - 房间下拉选择器（根据选定小区筛选，复用 `getRoomList` API）
  - 状态选择（全部/在租中/已终止）
  - 查询按钮
- 主体表格：使用 TDesign `t-table` 可展开行功能
- 空状态：无数据时显示 `t-empty` 组件
- 加载状态：使用 `t-table` 的 `:loading` 属性

**筛选策略：** 小区和房间选择器用于确定 `roomId`，最终传给 `getRentalList({ roomId, status })`。筛选在前端级联完成，不需要修改后端 API。

**表格列：**

| 列名         | 字段              | 宽度  | 说明             |
|--------------|-------------------|-------|------------------|
| ID           | id                | 80    |                  |
| 房间信息     | roomInfo          | 200   | 小区+楼栋+房间号 |
| 租客姓名     | tenantName        | 120   |                  |
| 入住日期     | checkInDate       | 120   | yyyy-MM-dd       |
| 合同到期     | contractEndDate   | 120   | yyyy-MM-dd       |
| 退租日期     | checkOutDate      | 120   | 无则显示 -       |
| 租期类型     | leaseTypeText     | 100   |                  |
| 月租金       | monthlyRent       | 100   | 格式化 ¥xxx.xx   |
| 押金         | deposit           | 100   | 格式化 ¥xxx.xx   |
| 押金状态     | depositStatusText | 100   | Tag 标签         |
| 租住状态     | statusText        | 100   | Tag 标签         |

注：不设操作列。行本身可展开查看关联账单，无需额外操作按钮。

**展开行内容（账单子表格）：**

| 列名     | 字段         | 宽度 | 说明         |
|----------|-------------|------|--------------|
| 账单周期 | periodText  | 220  |              |
| 应收日期 | dueDate     | 120  | yyyy-MM-dd   |
| 租金     | rentAmount  | 100  | ¥xxx.xx      |
| 水费     | waterFee    | 100  | ¥xxx.xx 或 - |
| 电费     | electricFee | 100  | ¥xxx.xx 或 - |
| 总金额   | totalAmount | 100  | ¥xxx.xx      |
| 状态     | statusText  | 100  | Tag 标签     |
| 实收金额 | paidAmount  | 100  | ¥xxx.xx 或 - |
| 收款日期 | paidDate    | 120  | yyyy-MM-dd   |

账单按 `dueDate` 升序排列（最早的在前）。

### 3. 路由配置

文件：`Hans/src/router/modules/housing.ts`

新增路由：

```typescript
{
  path: 'rental',
  name: 'HousingRental',
  component: () => import('@/pages/housing/rental/index.vue'),
  meta: { title: { zh_CN: '租赁记录', en_US: 'Rental Records' } },
},
```

### 4. API 调用

复用现有 API：

```typescript
// 获取租赁记录
getRentalList({
  status: selectedStatus,
  roomId: selectedRoomId,
})

// 获取小区列表（用于筛选器）
getCommunityList()

// 获取房间列表（用于筛选器，按小区筛选）
getRoomList({ communityId })
```

### 5. 分页说明

当前 `getRentalList` API 不支持分页（返回 `RentalRecordDto[]`）。鉴于租赁记录数据量通常可控（每个房间历史记录有限），暂不添加分页。如后续数据量增大，可扩展 API 支持分页参数。

## 涉及文件清单

### 后端
- `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` — 新增 Bills 属性
- `Gentle/Gentle.Application/Mapper.cs` — 新增 Bills 集合映射
- `Gentle/Gentle.Application/Services/RentalRecordService.cs` — 查询时 Include 账单

### 前端
- `Hans/src/api/model/rentalModel.ts` — 扩展 RentalRecordDto 类型
- `Hans/src/pages/housing/rental/index.vue` — 新建页面
- `Hans/src/router/modules/housing.ts` — 新增路由

## 不做的事

- 不修改账单 API
- 不新增后端 API 端点
- 不修改现有租赁记录 API 签名
- 不在房间详情页实现（已有占位，但本次需求是独立页面）
- 不为嵌套 BillDto 填充 TenantName/RoomInfo（父级已展示）
- 不添加分页（数据量可控，后续可扩展）
