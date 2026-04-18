# 房间管理页面重设计

## 背景

当前房间列表页（`/housing/room`）采用传统表格布局，租约信息分散（房东租约需要打开抽屉才能看到），利润信息不显示，租约到期/逾期状态无预警。需要重新设计为卡片布局，让关键信息一目了然。

**原型图**：`docs/superpowers/prototypes/room-card-redesign-prototype.png`
**原型结构参考**：`docs/superpowers/prototypes/room-card-redesign-spec.md`（从 Pencil 原型提取的完整设计 Token、尺寸、颜色、间距）

## 设计方案：分区卡片布局

### 页面整体结构

- 顶部：页面标题 + 新增按钮
- 筛选栏：小区、房间状态、异常租约三个下拉筛选 + 统计摘要
- 主体：响应式卡片网格（大屏 3 列、中屏 2 列、小屏 1 列），卡片间距 16px
- 底部：后端分页器
- 空状态：使用 TDesign `t-empty` 组件，显示"暂无房间数据"

### 单张卡片结构

每张卡片分三个区域：

#### 头部

- 左侧：小区名 + 楼栋号 + 房间号（如"XX小区 1栋 101"），可点击跳转详情页
- 右侧：房间状态标签，颜色规则：空置(绿)、已出租(黄)、装修中(蓝)、已收回(灰)

#### 中部 — 左右两栏对称布局

**房东租约（左栏）**：

| 展示项 | 数据来源 | 无数据时 |
|--------|---------|---------|
| 月租金额 | `LandlordLease.MonthlyRent` | 灰色文字"未添加房东租约" |
| 到期日期 | `LandlordLease.EndDate`，显示 `MM-DD` | 同上 |
| 租约状态标签 | 根据日期计算（见状态规则） | 标签显示 `--` |

**租客租约（右栏）**：

| 展示项 | 数据来源 | 无数据时 |
|--------|---------|---------|
| 租客姓名 | `RentalRecord.Render.Name` | 灰色文字"暂无租客" |
| 月租金额 | `RentalRecord.MonthlyRent`（有租客时）或 `Room.RentPrice`（无租客时） | 同上 |
| 到期日期 | `RentalRecord.ContractEndDate`，显示 `MM-DD` | 同上 |
| 租约状态标签 | 根据日期计算（见状态规则） | 标签显示 `--` |

#### 底部

- 利润金额计算规则：
  - **有租客时**：`RentalRecord.MonthlyRent - LandlordLease.MonthlyRent`，标注"实际利润"
  - **无租客时**：`Room.RentPrice - LandlordLease.MonthlyRent`，标注"预期利润"
  - 正数绿色 `+¥N 盈利`，负数红色 `-¥N 亏损`
- 利润条：简单进度条，以收入端租金为基准，绿色填充表示盈利比例
- 无房东租约时显示 `--`
- 右下角操作按钮：编辑、房东租约（打开现有抽屉）、维修、删除（图标按钮，hover 显示 tooltip）

### 租约状态标签规则

阈值：**7 天**

计算基础：仅基于**活跃的 RentalRecord**（`Status == RentalStatus.Active`），不包含已退租记录。

| 状态 | 条件 | 颜色 | 文字 |
|------|------|------|------|
| 正常 | 到期日 > 今天 + 7天 | 绿色 success | `正常` |
| 即将到期 | 今天 <= 到期日 <= 今天 + 7天 | 黄色 warning | `即将到期` |
| 已逾期 | 到期日 < 今天 | 红色 danger | `已逾期 N天` |
| 无租约 | 不存在租约记录，或 LandlordLease.EndDate 为 null | 灰色 default | `--` |

逾期天数 = (今天 - 到期日).Days

### 筛选区域

| 筛选项 | 选项 | 说明 |
|--------|------|------|
| 小区 | 动态加载小区列表 | 复用现有逻辑 |
| 状态 | 全部 / 空置 / 已出租 / 装修中 / 已收回 | 复用现有 RoomStatus |
| 异常租约 | 全部 / 有异常 | 异常 = 任意一方租约即将到期或已逾期 |

筛选区域右侧显示统计摘要：`共 N 间 | 异常 N 间`

## 后端改动

### 新增枚举

文件：`Gentle/Gentle.Core/Enums/LeaseStatus.cs`

```
Normal=0, ExpiringSoon=1, Expired=2, None=3
```

扩展方法 `LeaseStatusExtensions.cs`（与 `RoomStatusExtensions.cs` 同模式）：正常、即将到期、已逾期、--

### RoomDto 新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `LandlordLeaseStatus` | `LeaseStatus` | 房东租约状态（默认 None） |
| `LandlordLeaseExpiredDays` | `int` | 房东租约逾期天数（未逾期为 0） |
| `TenantLeaseStatus` | `LeaseStatus` | 租客租约状态（默认 None） |
| `TenantLeaseExpiredDays` | `int` | 租客租约逾期天数（默认 0） |
| `TenantMonthlyRent` | `decimal?` | 租客实际月租（来自活跃 RentalRecord.MonthlyRent，无租客时为 null） |

使用不可空 `LeaseStatus`，`None` 作为默认值，避免可空类型与枚举 None 的歧义。

### RoomService 改动

- `GetListAsync` 新增参数：`bool? hasLeaseAlert`（筛选异常租约）、`int page`、`int pageSize`
- 返回类型改为 `PagedResult<RoomDto>`（包含 `Total`、`Items`、`Page`、`PageSize`）
- 计算上述 5 个新字段的逻辑
- 租约状态计算仅基于活跃 RentalRecord

### RoomAppService 改动

- 新增筛选参数透传：`hasLeaseAlert`、`page`、`pageSize`
- API 响应格式变更：从 `List<RoomDto>` 改为 `PagedResult<RoomDto>`

## 前端改动

| 文件 | 改动 |
|------|------|
| `Hans/src/pages/housing/room/index.vue` | 重写为卡片布局，移除前端分页和内存过滤逻辑，改用后端参数 |
| `Hans/src/api/model/roomModel.ts` | 新增 LeaseStatus 类型、RoomItem 新增字段、分页参数类型 |
| `Hans/src/api/room.ts` | API 调用新增筛选和分页参数，响应类型改为分页结构 |

### 前端新增类型

```typescript
enum LeaseStatus {
  Normal = 0,
  ExpiringSoon = 1,
  Expired = 2,
  None = 3,
}

interface RoomListParams {
  communityId?: number
  status?: RoomStatus
  hasLeaseAlert?: boolean
  page: number
  pageSize: number
}

interface PagedResult<T> {
  total: number
  items: T[]
  page: number
  pageSize: number
}
```

### 交互细节

- 卡片点击头部可跳转到房间详情页
- 空置房间的租客栏统一显示"暂无租客"
- 无房东租约的房间在房东栏显示"未添加房东租约"
- 操作按钮使用 TDesign 图标按钮，hover 显示 tooltip
- 新增房间按钮保留现有弹窗逻辑
- "房东租约"按钮点击后打开现有的房东租约抽屉（复用现有 Drawer 组件）
