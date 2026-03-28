# 租赁记录页面设计规格

## 概述

新增独立的租赁记录列表页面，支持按房间筛选，每条记录可展开查看关联账单。

## 需求

- 独立页面展示所有租赁记录
- 支持按小区/楼栋/房间号筛选
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

### 2. 修改 `RentalRecordService.GetListAsync`

文件：`Gentle/Gentle.Application/Services/RentalRecordService.cs`

- 查询租赁记录时 `Include(r => r.Bills)` 加载关联账单
- 通过 AutoMapper 将 `Bill` 实体映射为 `BillDto`
- 批量加载，避免 N+1 查询问题

### 3. 修改 `RentalRecordService.GetByIdAsync`

同上，`Include` 账单数据。

### 4. 无需新增 API 端点

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

### 2. 新建租赁记录页面

文件：`Hans/src/pages/housing/rental/index.vue`

**页面结构：**

- 顶部筛选栏：小区选择器、楼栋输入、房间号输入、状态选择（全部/在租中/已终止）、搜索按钮
- 主体表格：使用 TDesign `t-table` 可展开行功能

**表格列：**

| 列名       | 字段              | 宽度  | 说明               |
|------------|-------------------|-------|--------------------|
| ID         | id                | 80    |                    |
| 房间信息   | roomInfo          | 200   | 小区+楼栋+房间号   |
| 租客姓名   | tenantName        | 120   |                    |
| 入住日期   | checkInDate       | 120   |                    |
| 退租日期   | checkOutDate      | 120   | 无则显示 -         |
| 租期类型   | leaseTypeText     | 100   |                    |
| 月租金     | monthlyRent       | 100   | 格式化为 ¥xxx.xx   |
| 押金       | deposit           | 100   | 格式化为 ¥xxx.xx   |
| 押金状态   | depositStatusText | 100   | Tag 标签           |
| 租住状态   | statusText        | 100   | Tag 标签           |
| 操作       | -                 | 120   | 查看详情           |

**展开行内容（账单子表格）：**

| 列名     | 字段         | 宽度 | 说明             |
|----------|-------------|------|------------------|
| 账单周期 | periodText  | 220  |                  |
| 应收日期 | dueDate     | 120  |                  |
| 租金     | rentAmount  | 100  | ¥xxx.xx          |
| 水费     | waterFee    | 100  | ¥xxx.xx 或 -     |
| 电费     | electricFee | 100  | ¥xxx.xx 或 -     |
| 总金额   | totalAmount | 100  | ¥xxx.xx          |
| 状态     | statusText  | 100  | Tag 标签         |
| 实收金额 | paidAmount  | 100  | ¥xxx.xx 或 -     |
| 收款日期 | paidDate    | 120  | 或 -             |

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

复用现有 `getRentalList` API，传入筛选参数：

```typescript
getRentalList({
  status: selectedStatus,
  roomId: selectedRoomId,
})
```

## 涉及文件清单

### 后端
- `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs` — 新增 Bills 属性
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
