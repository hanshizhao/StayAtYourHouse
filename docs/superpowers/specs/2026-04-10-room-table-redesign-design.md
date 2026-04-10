# 房间列表表格重设计

## 背景

房间管理列表（`/housing/room`）之前添加了安居码、已租时长、到期天数三列，导致表格信息拥挤混乱。需要移除这三列，改用行展开方式展示租客租赁信息。

## 目标

- 删除安居码、已租时长、到期天数三个表格列，恢复表格简洁
- 通过行展开（Expandable Row）展示租客租约信息
- 后端 API 同步调整，提供租客姓名和租期日期

## 方案：行展开（Expandable Row）

### 前端表格结构

删除 3 列后的表格列为：

| 列 | 宽度 | 说明 |
|---|---|---|
| 小区 | 140 | 小区名称，超长截断 tooltip |
| 房间 | 140 | "X栋 Y号" |
| 出租价 | 100 | ¥X.XX |
| 押金 | 100 | ¥X.XX 或 - |
| 状态 | 90 | 标签样式：空置/已出租/装修中/已收回 |
| 备注 | 150 | 超长省略 |
| 创建时间 | 160 | 格式化日期 |
| 操作 | 220 | 固定右侧：编辑、房东租约、维修、删除 |

### 行展开内容

所有行显示展开箭头。点击展开后：

- **已出租房间**：水平排列 4 个信息块
  - 租客姓名
  - 租期开始日期
  - 租期结束日期（已过期标红）
  - 安居码状态（已提交=绿色标签，未提交=红色标签）
- **其他状态房间**：显示"暂无租客信息"

### 后端数据模型变更

**RoomDto 字段调整：**

| 操作 | 字段 | 类型 | 说明 |
|---|---|---|---|
| 保留 | `AnjuCodeSubmitted` | `bool?` | 安居码提交状态 |
| 删除 | `LeaseDuration` | `string?` | 已租时长（不再需要） |
| 删除 | `DaysUntilExpiry` | `int?` | 到期天数（不再需要） |
| 新增 | `TenantName` | `string?` | 租客姓名 |
| 新增 | `RentalStartDate` | `DateTime?` | 租期开始日期 |
| 新增 | `RentalEndDate` | `DateTime?` | 租期结束日期 |

**后端逻辑调整：**

- `RoomService.GetListAsync`：从活跃租赁记录直接映射 `TenantName`、`RentalStartDate`、`RentalEndDate`，不再计算时长和天数
- 移除 `CalculateLeaseDuration` 辅助方法（如无其他引用）

### 前端模型变更

**RoomItem 接口：**

- 删除：`leaseDuration`、`daysUntilExpiry`
- 新增：`tenantName: string | null`、`rentalStartDate: string | null`、`rentalEndDate: string | null`

### 边界情况

- 无活跃租赁记录：展开区域显示"暂无租客信息"
- 安居码未提交：红色标签"未提交"
- 租期结束日期已过：到期日期用红色文字标注

### 变更文件清单

| 文件 | 变更内容 |
|---|---|
| `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` | 删 2 字段，加 3 字段 |
| `Gentle/Gentle.Application/Services/RoomService.cs` | 调整租赁记录映射，移除 CalculateLeaseDuration |
| `Hans/src/api/model/roomModel.ts` | 同步 RoomItem 字段增删 |
| `Hans/src/pages/housing/room/index.vue` | 删 3 列，加行展开组件 |

### 不涉及的变更

- 房东租约相关代码不变
- API 路由和请求方式不变
- 前端过滤/分页逻辑不变
