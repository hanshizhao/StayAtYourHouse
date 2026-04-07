# 房东租约管理设计文档

## 背景

用户是二手房东，房间从上游房东处租入再转租。当前系统缺少对上游房东租约信息的管理，需要新增"房东租约"对象，记录每个房间对应的房东信息、租金、费用等。

## 方案选择

**选定方案 A：新增独立实体 `LandlordLease`**

理由：
- 房东租约是独立的业务概念，值得有自己的实体
- 房间列表抽屉作为交互入口，足够方便
- 实现复杂度适中
- 未来扩展性好（如支持历史租约）

排除方案：
- B（Room 实体直接扩字段）：Room 实体会臃肿，逻辑不清晰
- C（独立管理页面 + 列表联动）：功能重复，工作量大

## 数据模型

### 新实体 `LandlordLease`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `Id` | `int` | 自动 | 主键（继承自 Entity） |
| `RoomId` | `int` | 是 | 关联房间 ID（唯一约束，一对一） |
| `Room` | `Room` | - | 导航属性 |
| `LandlordName` | `string` | 是 | 房东姓名 |
| `LandlordPhone` | `string?` | 否 | 联系电话 |
| `StartDate` | `DateTime` | 是 | 起租日期 |
| `EndDate` | `DateTime?` | 否 | 到期日期（留空表示无固定期限） |
| `MonthlyRent` | `decimal` | 是 | 月租金（元） |
| `PaymentMethod` | `PaymentMethod` | 是 | 付款方式（枚举） |
| `DepositMonths` | `int?` | 否 | 押金月数（如押一付三中的"押一"） |
| `WaterPrice` | `decimal?` | 否 | 房东收的水费单价（元/吨） |
| `ElectricPrice` | `decimal?` | 否 | 房东收的电费单价（元/度） |
| `ElevatorFee` | `decimal?` | 否 | 电梯费（元/月） |
| `PropertyFee` | `decimal?` | 否 | 物业费（元/月） |
| `InternetFee` | `decimal?` | 否 | 网络费（元/月） |
| `OtherFees` | `string?` | 否 | 其他费用描述 |
| `Remark` | `string?` | 否 | 备注 |

### 付款方式枚举 `PaymentMethod`

| 值 | 名称 | 说明 |
|---|---|---|
| 0 | `Monthly` | 月付 |
| 1 | `Quarterly` | 季付（押一付三） |
| 2 | `SemiAnnual` | 半年付 |
| 3 | `Annual` | 年付 |
| 4 | `Custom` | 自定义（备注说明） |

### Room 实体变更

- 新增导航属性 `LandlordLease`（一对一）
- `CostPrice`、`WaterPrice`、`ElectricPrice` 标记废弃，不删除（避免迁移复杂）
- `Profit` 计算逻辑改为 `RentPrice - (LandlordLease?.MonthlyRent ?? 0)`

### 利润计算影响范围

以下位置均需从 `CostPrice` 切换为 `LandlordLease.MonthlyRent`：

- **`Mapper.cs`** Room -> RoomDto 映射：`Profit` 改为 `src.LandlordLease != null ? src.LandlordLease.MonthlyRent : 0`
- **`ReportService.cs`** 月度支出计算：`rental.Room.CostPrice` 改为读取 `LandlordLease.MonthlyRent`
- **`RoomProfitRankingDto.cs`**：`MonthlyProfit` 计算逻辑更新
- **`ReportService.cs`** 利润排名查询：`CostPrice` 改为从 `LandlordLease` 读取
- **`VacantRoomDto`** 中 `CostPrice` 字段改为从 `LandlordLease` 映射

### 废弃字段过渡策略

Room 上的 `CostPrice`、`WaterPrice`、`ElectricPrice` 过渡方案：

1. **后端**：`CreateRoomInput` 和 `UpdateRoomInput` 中这些字段改为可选（去掉 `[Required]`），默认值 0
2. **前端**：房间新建/编辑表单中隐藏这三个字段，改由 LandlordLease 管理
3. **已有数据**：无需迁移，旧数据保留在 Room 表中，新逻辑从 LandlordLease 读取
4. **列表利润**：`GetList` 查询中 LEFT JOIN `LandlordLease`，在 SQL 层面计算 `Profit = RentPrice - ISNULL(LandlordLease.MonthlyRent, Room.CostPrice)`，优先取 LandlordLease 的值，回退到 CostPrice

## 后端 API

### 新增 `LandlordLeaseAppService`

路由前缀：`api/landlord-lease`，API 分组 `"Housing"`，需 `[Authorize]`。

| HTTP 方法 | 路由 | 方法 | 说明 |
|---|---|---|---|
| GET | `room/{roomId}` | `GetByRoomId(int roomId)` | 根据房间 ID 获取房东租约，不存在返回 null |
| POST | `add` | `Add(CreateLandlordLeaseInput input)` | 创建房东租约 |
| PUT | `edit` | `Edit(UpdateLandlordLeaseInput input)` | 更新房东租约 |
| DELETE | `remove/{id}` | `Remove(int id)` | 删除房东租约 |

### 新增 DTO

- **`LandlordLeaseDto`**（输出）— 包含所有字段 + `RoomInfo`（string 类型，格式为 "X栋XXX"，在 Mapper.cs 中映射为 `src.Room.Building + "栋" + src.Room.RoomNumber`）
- **`CreateLandlordLeaseInput`**（创建输入）— 必填：`RoomId`、`LandlordName`（最大 50 字符）、`StartDate`、`MonthlyRent`（> 0）、`PaymentMethod`
- **`UpdateLandlordLeaseInput`**（更新输入）— 必填：`Id` + 同创建的必填字段

输入校验规则：
- `LandlordPhone`：选填，如填写需符合手机号格式（11 位数字）
- `MonthlyRent`：必须 > 0，最大 999999
- `DepositMonths`：如填写，范围 0-36
- `WaterPrice` / `ElectricPrice`：如填写，必须 > 0
- 所有金额字段（`ElevatorFee`、`PropertyFee`、`InternetFee`）：如填写，必须 >= 0

### 业务规则

1. 创建时校验 `RoomId` 对应的房间存在
2. 创建时校验该房间尚未关联房东租约（一对一约束）
3. 更新/删除时校验租约存在
4. 房间处于"已出租"状态时，允许删除房东租约（删除后利润按成本 0 计算，用户自行负责）
5. `EndDate` 如填写，必须 >= `StartDate`

### RoomAppService 变更

- `RoomDto` 新增 `LandlordLease` 属性（类型 `LandlordLeaseDto?`）
- `GetById` 查询新增 `.Include(r => r.LandlordLease)`，Mapster 映射 LandlordLease 到 DTO
- `GetList` 查询新增 `.Include(r => r.LandlordLease)`，Profit 字段映射改为优先取 `LandlordLease.MonthlyRent`，回退到 `CostPrice`
- `Mapper.cs` 中 Room 相关映射需更新，包括 Profit 计算和 LandlordLease 子映射

## 前端交互

### 房间列表页变更

在操作列新增"房东租约"按钮（图标按钮），点击后打开右侧 Drawer。

### Drawer 内容

- **无租约**：显示空状态 + "添加房东租约"按钮，点击后展示表单
- **有租约**：展示模式显示租约信息卡片，右上角有"编辑"和"删除"按钮；点击编辑切换为表单模式

### 表单字段

| 字段 | 组件 | 必填 | 说明 |
|------|------|------|------|
| 房东姓名 | Input | 是 | |
| 联系电话 | Input | 否 | |
| 起租日期 | DatePicker | 是 | |
| 到期日期 | DatePicker | 否 | 留空表示无固定期限 |
| 月租金 | InputNumber | 是 | 单位：元 |
| 付款方式 | Select | 是 | 枚举选项 |
| 押金月数 | InputNumber | 否 | |
| 水费单价 | InputNumber | 否 | 单位：元/吨 |
| 电费单价 | InputNumber | 否 | 单位：元/度 |
| 电梯费 | InputNumber | 否 | 单位：元/月 |
| 物业费 | InputNumber | 否 | 单位：元/月 |
| 网络费 | InputNumber | 否 | 单位：元/月 |
| 其他费用 | Textarea | 否 | |
| 备注 | Textarea | 否 | |

### 展示卡片分组

- **房东信息**：姓名、联系电话
- **租约信息**：起租日期、到期日期、月租金、付款方式、押金月数
- **费用信息**：水费单价、电费单价、电梯费、物业费、网络费
- **其他**：其他费用、备注

### 前端文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/api/model/landlordLeaseModel.ts` | 新增 | TS 类型定义（PaymentMethod 枚举、LandlordLeaseItem 接口） |
| `src/api/landlordLease.ts` | 新增 | API 调用函数（getByRoomId、create、update、remove） |
| `src/pages/housing/room/index.vue` | 修改 | 新增"房东租约"按钮 + Drawer（展示/编辑/新建） |
| `src/pages/housing/room/detail.vue` | 修改 | 价格信息卡片重构：保留出租价和押金，移除成本价/水费/电费，新增"房东租约"独立卡片 |

### detail.vue 改造方案

价格信息卡片保留 Room 自身字段：
- 出租价（RentPrice）、押金（Deposit）

新增"房东租约"卡片（从 `roomDetail.landlordLease` 读取），分三组：
- **租约信息**：月租金、起租日期、到期日期、付款方式、押金月数
- **费用信息**：水费单价、电费单价、电梯费、物业费、网络费
- **房东信息**：姓名、联系电话

如无房东租约，显示空状态提示。

成本价（CostPrice）字段从价格信息卡片中移除，不再展示。

### 列表利润列处理

`GetList` 查询新增 `.Include(r => r.LandlordLease)`，Profit 计算优先取 `LandlordLease.MonthlyRent`，无租约时回退到 `CostPrice`。"成本价"列暂时保留显示。
