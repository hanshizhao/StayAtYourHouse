# 用户反馈整改批次一设计规格

> 日期：2026-07-01
> 来源：房东用户反馈 10 条
> 状态：待评审

## 概述

本文档汇总房东用户反馈的 10 条问题/建议，逐条给出根因分析与整改方案。其中第 2 条「老赖改名」用户决定暂不处理，实际整改 9 条。

整改按性质分三类：

| 类别 | 条目 |
|------|------|
| Bug 修复（逻辑/数据缺陷） | #5 房间删不掉、#6 排序错乱、#8 状态不同步、#10 报修显示数字 |
| 缺失功能补全 | #1 续租自动算到期日、#7 抄表加固定费用、#9 合同图片上传 |
| 新增功能 | #3 待办显示到期日/逾期、#4 安居码登记多名字 |

---

## 第 1 条：续租月数自动计算合同到期日

### 问题

续租弹窗（`RenewRentalDialog.vue`）里「租期月数」和「合同到期日」是两个互不联动的字段，用户改月数后到期日纹丝不动，必须手动用日期选择器挑一天。

而同项目「修改租约」弹窗（`EditRentalDialog.vue`）已实现此联动，且后端办理入住时也按统一公式计算，前后端本应一致。

### 现状代码

- 续租弹窗：`Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue:35-47`（月数输入框，无 change 监听）、`:58-65`（到期日手动选）
- 现成工具：`Hans/src/utils/date.ts:45-54` `calculateContractEndDate(checkInDate, leaseMonths)`，算法 = `入住日.addMonths(月数).addDays(-1)`
- 参照实现：`Hans/src/pages/tenant/components/EditRentalDialog.vue:170-196`（已有联动逻辑）
- 后端续租：`Gentle/Gentle.Application/Services/RentalReminderService.cs:113-132`，新租约 `CheckInDate = 原合同到期日`（续租起始日 = 原到期日，已确认）

### 方案

1. 在 `RenewRentalDialog.vue` 引入 `calculateContractEndDate`。
2. 监听「租期月数」变化 → 用「**原合同到期日** + 月数 − 1 天」自动填「合同到期日」。
   - 原合同到期日来自续租弹窗已有的 `originalContractEndDate`（`RenewRentalDialog.vue:26-29` 已展示）。
3. 保留日期选择器，用户**仍可手动覆盖**（应对"续一年零半个月"等非整月场景）。
4. 与后端公式一致：后端 `CheckInDate.AddMonths(n).AddDays(-1)`，前端 `dayjs(checkInDate).add(n,'month').subtract(1,'day')`，两者等价。

### 验收

- 续租弹窗输入月数 2，到期日自动跳到「原到期日 + 2 月 − 1 天」。
- 手动改到期日后不被月数覆盖，直到再次改月数。

---

## 第 2 条：老赖改名（暂不处理）

用户决定暂不处理，跳过。「老赖」目前仅出现在前端 5 处文案，后端实体为 `Debt`，如后续需要改名随时可做（纯改文案，零风险）。

---

## 第 3 条：待办面板显示合同到期日与逾期天数

### 问题

待办面板（Dashboard 首屏）的卡片上只显示类型、房间、金额/租客名，**不显示合同到期日，也无逾期天数**。

### 现状代码

- 面板：`Hans/src/pages/dashboard/base/components/TodoPanel.vue:32-66`（卡片渲染，三类待办）
- 后端 DTO 已带 `contractEndDate`：`Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs`（催收房租类），前端类型 `Hans/src/api/model/todoModel.ts` 已有该字段
- 待办三类：水电费、催收房租、维修；「到期/逾期」概念仅对「催收房租」有意义

### 方案

- **显示范围**：仅「催收房租」类待办卡片增加（水电费、维修类不加）。
- **到期日**：显示 `item.contractEndDate`（后端已有字段，无需加字段）。
- **逾期/剩余天数**：前端用 `dayjs().startOf('day').diff(到期日, 'day')` 实时计算：
  - 结果 < 0（未到期）→ 显示「剩 N 天到期」
  - 结果 ≥ 0（已到期）→ 显示「已逾期 N 天」，红色高亮
- 前端实时算的好处：不会因时间流逝导致后端数据过期；后端零改动。

### 改动点

- `TodoPanel.vue` 催收房租分支（`:50-60` 附近）新增到期日 + 逾期天数行。
- 可在 `src/utils/date.ts` 加一个 `getDaysUntil(date)` 工具函数复用。

### 验收

- 催收房租待办卡片显示「合同到期 2026-08-01 · 剩 5 天到期」或「合同到期 2026-06-01 · 已逾期 30 天」（红色）。
- 水电费、维修待办卡片不显示该行。

---

## 第 4 条：安居码登记多个名字

### 问题

一套房常有三四个人都要登记安居码，当前数据模型「一房一租约一租客一安居码布尔标记」，无法记录多个人的名字。

### 需求边界（已与用户确认）

用户需求为**轻量备忘**——只要能在安居码处记下多个名字（如"张三、李四、王五"），纯文字记录，**不需要每人独立核验状态**。

### 方案

- 在租约实体 `RentalRecord` 上新增字段 `AnJuCodeRegisteredNames`（`string?`，多行文本）。
- 与现有 `IsAnJuCodeSubmitted` 布尔标记并列：勾选「已提交安居码」时可填写「登记人员」多个名字。
- 入口：办理入住页、租赁记录列表的安居码确认操作处，均可填写/查看。

### 改动点

后端：
- `Gentle/Gentle.Core/Entities/RentalRecord.cs` 加字段 `AnJuCodeRegisteredNames`
- 新增 EF Core 迁移
- DTO：`RentalRecordDto.cs`、`CreateRentalRecordInput`/`UpdateRentalRecordInput`（或入住/续租对应 Input）加字段
- `RentalRecordService.ConfirmAnJuCodeAsync`（`:316-349`）接收 names 一并保存

前端：
- 类型 `Hans/src/api/model/rentalModel.ts` 加字段
- 入住办理 `Hans/src/pages/tenant/check-in.vue` 加多行文本输入
- 租赁列表 `Hans/src/pages/housing/rental/index.vue` 安居码列/确认弹窗展示与编辑

### 验收

- 一套房登记安居码时可填"张三、李四、王五"，保存后在租赁列表可见。

---

## 第 5 条：已退租房间无法删除

### 问题

租客退租后房间删不掉，报「该房间存在租赁记录，无法删除」。

### 根因

删除校验 `RoomService.cs:263-264` `AnyAsync(r => r.RoomId == id)` 只判断「有无任何租赁记录」，不分在租/已退租，导致历史退租记录同样阻止删除。

### 方案（已确认：转回收，不物理删除）

系统已有 `Reclaimed`（已回收）状态（见 `2026-03-28-room-status-reclaimed-design.md`）。将「删除房间」按钮语义改为「回收房间」：

1. **后端 `RoomService.DeleteAsync` 改造**：
   - 校验改为只查 **Active** 租约：`AnyAsync(r => r.RoomId == id && r.Status == RentalStatus.Active)`。有 Active → 抛「房间有在租租客，请先办理退租」。
   - 无 Active 租约 → 将 `room.Status` 置为 `Reclaimed`（而非物理删除），保存。
   - 历史 Terminated 退租记录全部保留，账目可追溯。
2. **前端**：
   - 「删除房间」按钮文案/确认弹窗改为「回收此房间？回收后房间从列表隐藏，历史记录保留，可在编辑中恢复为空置」。
   - 成功提示改为「房间已回收」。
3. 与现有手动改状态入口（编辑表单 Vacant⇄Reclaimed）统一，不产生冲突。

### 改动点

- `Gentle/Gentle.Application/Services/RoomService.cs:248-272`（`DeleteAsync`）
- `Hans/src/pages/housing/room/index.vue`（删除按钮 `:139-151`、`handleDelete`/确认逻辑 `:1058-1083`）

### 验收

- 已退租房间点「回收」→ 成功转为已回收状态，列表中隐藏。
- 有在租租客的房间点「回收」→ 提示先退租。
- 已回收房间历史退租记录仍在，账目可查。

---

## 第 6 条：房间按栋号自然顺序排序

### 问题

房间列表栋号排序错乱，「10栋」排在「2栋」前面。

### 根因

排序字段 `Building`/`RoomNumber` 均为 `string`，`.OrderBy(r => r.Building)` 按字典序，导致两位数栋号错位。

### 现状代码

`Gentle/Gentle.Application/Services/RoomService.cs:96-100`，内存排序（LINQ to Objects，非 SQL）：

```csharp
var sorted = dtoList
    .OrderBy(r => r.CommunityName)
    .ThenBy(r => r.Building)     // 字符串字典序
    .ThenBy(r => r.RoomNumber);  // 同上
```

### 方案

排序时提取字符串开头数字按数值比较（栋号、房号通常以数字开头）。在内存排序（非 EF 翻译），可自由写解析逻辑：

```csharp
var sorted = dtoList
    .OrderBy(r => r.CommunityName)
    .ThenBy(r => ExtractLeadingNumber(r.Building))
    .ThenBy(r => ExtractLeadingNumber(r.RoomNumber));
```

新增私有方法：

```csharp
private static int ExtractLeadingNumber(string? s)
{
    if (string.IsNullOrEmpty(s)) return int.MaxValue;
    var digits = new string(s.TakeWhile(char.IsDigit).ToArray());
    return int.TryParse(digits, out var n) ? n : int.MaxValue;
}
```

- 纯数字开头（"10栋""204"）→ 按数值排序。
- 非数字开头（如"东"栋）→ fallback 到 `int.MaxValue`，排到末尾。
- 前端零改动。

### 验收

- 栋号 1、2、3...、10、11 按数值升序排列，不再 1,10,11,2,3。
- 同栋内房号同理自然排序。

---

## 第 7 条：抄表录入加入固定费用（电梯费/物业费/网络费/其他）

### 问题

抄表录入只算水费、电费，账单只有两项；电梯费等房间已配置的固定费用从不计入。

### 现状代码

- 抄表前端：`Hans/src/pages/utility/meter/index.vue:121-203`（仅水/电读数）
- 抄表实体：`Gentle/Gentle.Core/Entities/MeterRecord.cs`（仅 WaterFee/ElectricFee）
- 计费逻辑：`Gentle/Gentle.Application/Services/MeterService.cs:149-169`（硬编码水+电）
- 账单实体：`Gentle/Gentle.Core/Entities/UtilityBill.cs`（仅 WaterFee/ElectricFee/TotalAmount）
- **固定费用已配置但闲置**：`Room.cs:53-57` `ElevatorFee`（注释「月固定费用」），另有 `PropertyFee`/`InternetFee`/`OtherFees`

### 方案（已确认：电梯费+物业费+网络费+其他全加）

抄表生成账单时，把房间配置的当月固定费用一并累加进账单总额，账单明细增加这几项。

#### 数据模型改动

`MeterRecord` 实体 + `UtilityBill` 实体各新增 4 个 `decimal?(10,2)` 字段：`ElevatorFee`/`PropertyFee`/`InternetFee`/`OtherFees`（记录生成账单时的快照值，避免日后房间改价影响历史账单）。
- 新增 EF Core 迁移。

#### 计费逻辑（`MeterService.RecordAsync`）

```
waterFee = 水用量 × waterPrice
electricFee = 电用量 × electricPrice
elevatorFee = room.ElevatorFee ?? 0
propertyFee = room.PropertyFee ?? 0
internetFee = room.InternetFee ?? 0
otherFees = room.OtherFees ?? 0
totalAmount = waterFee + electricFee + elevatorFee + propertyFee + internetFee + otherFees
```

- 固定费用无读数概念，直接取房间配置的当月金额。

#### 前端改动

- 抄表表单 `meter/index.vue` 的「费用计算」区，在水费/电费下方增加「电梯费/物业费/网络费/其他费用」只读展示（值取自所选房间配置），合计费用更新。
- 类型 `meterModel.ts`：`RecordMeterInput` 无需改（读数仍只水/电），`MeterRecordItem`/`LastReadingsResult` 等加 4 字段。
- 水电账单列表/详情同步展示新增明细。

### 改动点清单

后端：`MeterRecord.cs`、`UtilityBill.cs`、新迁移、`MeterService.cs:149-169` 及账单生成（`:409` 附近）、`MeterRecordDto.cs`、`UtilityBillDto.cs`、Mapster 映射
前端：`meter/index.vue`、`meterModel.ts`、水电账单列表/详情页

### 验收

- 房间配置电梯费 30、物业费 20，抄表水费 50 电费 50 → 账单合计 150，明细列出各项。
- 修改房间固定费用不影响已生成的历史账单（因快照存储）。

---

## 第 8 条：已入住房间仍挂在空置房源

### 问题

Dashboard「空置房源」列表里出现实际已入住的房间（如前岸小区10栋204）。

### 根因

空置判定 100% 依赖 `Room.Status` 字段，**不查是否有活跃租约**。当 `Status` 被手动编辑覆盖回空置、或绕过入住流程补数据时，`Status` 与活跃租约不一致，系统无自愈机制。

- 判定处：`Gentle/Gentle.Application/Services/ReportService.cs:173-174` `.Where(r => r.Status == RoomStatus.Vacant)`
- `Room.Status` 默认 Vacant；唯一改为 Rented 的路径是 `RentalRecordService.CheckInAsync:184`

### 方案（已确认：查询双重校验 + 自动修正）

在 `ReportService.GetHousingOverviewAsync` 中：

1. 查询时同时取活跃租约集合（代码里 `activeRentals` 已查，`:142-145`，目前只用于算空置天数）。
2. 对每个 `Status == Vacant` 但**实际存在 Active 租约**的房间：
   - **自动修正**：`room.Status = Rented`，保存。
   - 修正后该房间不再出现在空置列表。
3. 这样既治标（204 自动消失），又治本（任何途径造成的不一致都会自愈）。

### 改动点

- `Gentle/Gentle.Application/Services/ReportService.cs:131-207`，在统计前增加一致性扫描与修正（注意：该方法当前只读，改为可能写库，需注入 `IRepository<Room>` 的 SaveNow）。
- 可考虑抽取一个 `ReconcileRoomStatusAsync()` 私有方法，供 ReportService 与 RoomService.GetListAsync 复用。

### 补充建议（可选，治本更强）

在 `RoomService.UpdateAsync:204-245` 编辑房间时增加校验：存在 Active 租约的房间不允许把状态改为 Vacant/Renovating/Reclaimed。从源头堵住人为误改。本次先做查询自愈，源头校验可列为后续优化。

### 验收

- 触发一次 Dashboard 加载后，前岸小区10栋204 自动从空置列表消失，其 `Status` 被修正为 Rented。
- 手动把一个有租客的房间状态改为空置，刷新 Dashboard 后自动修正回已出租。

---

## 第 9 条：合同图片上传失败

### 问题

入住/续租上传合同图片报「上传失败，请重试」。

### 根因（双重失败）

1. **后端无上传接口**：前端请求 `POST /api/file/upload`，后端 12 个 AppService 中无文件相关，无 `IFormFile`/保存逻辑 → **404**。
2. **前端不带 token**：TDesign `<t-upload>` 不经 Axios 封装，不带 `Authorization` 头 → 即便有接口也 401。
- 文案出处：`check-in.vue:438`、`RenewRentalDialog.vue:212` 的 `formatUploadResponse`（响应无 url 即报错）。

### 方案（已确认：存本地磁盘，从零搭）

#### 后端：新增文件上传服务

- 新增 `Gentle.Application/Apps/FileAppService.cs : IDynamicApiController`，路由 `api/file`。
- 端点 `POST api/file/upload`，接收 `IFormFile file`。
- 存储到本地磁盘，目录如 `{ContentRoot}/wwwroot/uploads/contracts/{yyyyMMdd}/{guid}{ext}`（按日期分目录避免单目录文件过多）。
- 返回 `{ url: "/uploads/contracts/.../xxx.jpg" }`（前端 `formatUploadResponse` 期望 `res.url`）。
- 配置静态文件中间件：`Program.cs` 增加 `app.UseStaticFiles()` 让 `/uploads/...` 可访问。或用 Furion 的 `App.Configuration` 配置静态资源。
- 限制：单文件 10MB（与前端一致），仅图片类型（image/*）。
- 鉴权：该接口需 `[Authorize]`（业务接口惯例），前端补 token 后即可通过。

#### 前端：补 token 头

两处 `<t-upload>`（`check-in.vue:215-233`、`RenewRentalDialog.vue:67-79`）增加 `:headers` 绑定，从本地存储取 token 注入：

```vue
<t-upload
  action="/api/file/upload"
  :headers="uploadHeaders"
  ...
/>
```

```ts
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token'); // 与 request 拦截器取 token 方式一致
  return token ? { Authorization: `Bearer ${token}` } : {};
});
```

> 实现时核对项目实际 token 存储位置（`request/index.ts:116-128` 拦截器取 token 的写法），保持一致。

### 改动点

后端：新增 `FileAppService.cs`、`Program.cs` 加 `UseStaticFiles`、（可选）`appsettings.json` 配置上传目录
前端：`check-in.vue`、`RenewRentalDialog.vue` 两处 t-upload 补 headers

### 验收

- 入住办理上传合同图片 → 成功，预览显示，保存后租约 `ContractImage` 存有路径。
- 续租弹窗上传新合同 → 成功。
- 未登录或 token 失效 → 上传失败（401），符合预期。

---

## 第 10 条：编辑报修时房间显示数字「1」

### 问题

编辑报修工单，「选择房间」下拉框部分房间不显示地址，反而显示数字（如「1」）。

### 根因

报修编辑页加载房间列表只取前 100 条（`pageSize:100`），房间总数超 100 时被编辑报修所属房间不在选项里，TDesign `<t-select>` 找不到匹配 option 即回退显示原始 value（即 roomId 数字）。

更可惜：后端报修详情已返回拼好的 `detail.roomInfo`，前端却没用，只取了 `detail.roomId`。

### 现状代码

- 编辑表单：`Hans/src/pages/maintenance/add.vue:37-52`（t-select 编辑模式 disabled，label=fullInfo）
- 加载：`add.vue:300-314` `loadRooms()` 取 `pageSize:100`；`:306` 拼接 fullInfo
- 详情赋值：`add.vue:316-342` `loadMaintenanceDetail` 只取 `detail.roomId`（`:320-322` 附近），丢弃 `detail.roomInfo`
- 后端已提供：`MaintenanceService.cs:205-207` 拼好 `RoomInfo`（"{小区} {栋}栋 {房号}号"）

### 方案

编辑模式下不依赖 100 条选项匹配，直接用后端返回的 `detail.roomInfo` 显示：

1. `loadMaintenanceDetail` 中保存 `detail.roomInfo` 到一个响应式变量 `currentRoomInfo`。
2. 编辑模式且该房间不在 `roomOptions` 时，t-select 用自定义渲染/或直接用一个只读文本展示 `currentRoomInfo`。
3. （稳妥）保留 roomOptions 加载用于"新增"模式；编辑模式房间锁定不可改，直接展示 `currentRoomInfo` 文本即可，无需 select 匹配。

实现细节二选一：
- **方案 A（推荐）**：编辑模式下把 t-select 换成一个显示 `currentRoomInfo` 的只读文本/输入框（反正编辑时房间不可改）。
- **方案 B**：仍用 t-select，但给 options 补一项 `{ id: detail.roomId, fullInfo: detail.roomInfo }` 保证能匹配上。

### 改动点

- `Hans/src/pages/maintenance/add.vue`（loadMaintenanceDetail、模板房间字段渲染）

### 验收

- 房间总数 >100 时，编辑任意报修工单，房间字段正确显示「前岸小区 10栋 204号」，不再显示数字。

---

## 实施顺序建议

按风险与依赖排序，建议分批实施：

**批次 A（前端独立、低风险、立即可做）**
- #1 续租自动算到期日（纯前端，复用现成工具）
- #3 待办显示到期日/逾期（纯前端）
- #6 房间排序（纯后端，但改动极小）
- #10 报修房间显示（纯前端）

**批次 B（后端为主，含迁移）**
- #5 房间转回收（后端逻辑改 + 前端文案）
- #8 空置状态自愈（后端 ReportService）
- #4 安居码登记人员（后端 + 迁移 + 前端）
- #7 抄表加固定费用（后端 + 迁移 + 前端，改动较大）

**批次 C（独立功能）**
- #9 合同上传（从零搭后端接口 + 前端补 token）

---

## 不在本批次范围

- 第 2 条「老赖改名」：用户决定暂不处理。
- 第 8 条的源头校验（编辑房间时阻止把有租客房间改空置）：列为后续优化，本批先做查询自愈。
- 安居码「每人独立核验状态」（需求 B）：用户明确只要记名字，不做独立核验。

---

## 风险与注意

- #4、#7 涉及 EF Core 迁移，需在测试库先验证迁移脚本。
- #7 固定费用改动面较大（实体/DTO/服务/前端/账单展示），需回归现有水电账单流程。
- #9 上传文件需考虑磁盘空间与备份；生产环境若多节点部署需改为共享存储（本次单机本地磁盘）。
- #8 改 ReportService 从只读变可写，注意事务与异常处理，避免统计接口因写库失败而整体报错。
