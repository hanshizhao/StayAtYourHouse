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

- **`LandlordLeaseDto`**（输出）— 包含所有字段 + `RoomInfo`（楼栋+房间号）
- **`CreateLandlordLeaseInput`**（创建输入）— 必填：`RoomId`、`LandlordName`、`StartDate`、`MonthlyRent`、`PaymentMethod`
- **`UpdateLandlordLeaseInput`**（更新输入）— 必填：`Id` + 同创建的必填字段

### 业务规则

1. 创建时校验 `RoomId` 对应的房间存在
2. 创建时校验该房间尚未关联房东租约（一对一约束）
3. 更新/删除时校验租约存在

### RoomAppService 变更

- `GetById` 返回的 `RoomDto` 新增 `LandlordLease` 字段（Mapster 映射）
- `GetList` 不变（列表不加载房东租约，避免 N+1 查询）

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
- **租约信息**：起租日期、月租金、付款方式、押金月数
- **费用信息**：水费单价、电费单价、电梯费、物业费、网络费
- **其他**：其他费用、备注

### 前端文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/api/model/landlordLeaseModel.ts` | 新增 | TS 类型定义 |
| `src/api/landlordLease.ts` | 新增 | API 调用函数 |
| `src/pages/housing/room/index.vue` | 修改 | 新增抽屉和按钮 |
| `src/pages/housing/room/detail.vue` | 修改 | 成本价等字段替换为房东租约信息 |

### 列表利润列处理

现有"成本价"列暂时保留，利润计算改为从 `LandlordLease.MonthlyRent` 读取。
