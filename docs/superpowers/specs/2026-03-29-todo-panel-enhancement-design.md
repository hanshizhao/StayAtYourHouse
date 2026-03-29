# 待办事项卡片增强设计

## 概述

扩展现有落地页待办事项卡片，支持两种待办类型：收水电费 + 催收房租。 提供筛选、弹窗处理、宽限记录、续租等功能。

## 需求总结

| 项目 | 内容 |
|------|------|
| **待办类型** | 收水电费 + 催收房租 |
| **筛选方式** | 下拉框筛选待办类型（全部/收水电费/催收房租） |
| **收水电费** | 点击弹窗收款（复用现有弹窗），计入当月收入 |
| **催收房租** | 合同到期前3天自动触发 |
| **催收-宽限** | 手动指定下次催收日期，记录所有宽限历史 |
| **催收-续租** | 弹窗填写续租信息，押金自动继承，租金计入入住月份 |

## 数据模型

### 新增实体：RentalReminder（催收提醒）

```csharp
// 文件：Gentle/Core/Entities/RentalReminder.cs
public class RentalReminder : Entity<int>
{
    /// <summary>关联的租赁记录ID</summary>
    public int RentalRecordId { get; set; }

    /// <summary>提醒日期</summary>
    public DateTime ReminderDate { get; set; }

    /// <summary>状态（0=待处理, 1=已宽限, 2=已完成）</summary>
    public RentalReminderStatus Status { get; set; }

    /// <summary>创建时间</summary>
    public override DateTime CreatedTime { get; set; } = DateTime.Now;

    // 导航属性
    public RentalRecord RentalRecord { get; set; } = null!;
}

public enum RentalReminderStatus
{
    Pending = 0,    // 待处理
    Deferred = 1,   // 已宽限
    Completed = 2   // 已完成（续租）
}
```

### 新增实体：RentalDeferral（宽限记录）

```csharp
// 文件：Gentle/Core/Entities/RentalDeferral.cs
public class RentalDeferral : Entity<int>
{
    /// <summary>关联的催收提醒ID</summary>
    public int RentalReminderId { get; set; }

    /// <summary>原计划提醒日期</summary>
    public DateTime OriginalReminderDate { get; set; }

    /// <summary>宽限到的日期</summary>
    public DateTime DeferredToDate { get; set; }

    /// <summary>宽限原因/备注</summary>
    public string? Remark { get; set; }

    /// <summary>创建时间</summary>
    public override DateTime CreatedTime { get; set; } = DateTime.Now;

    // 导航属性
    public RentalReminder RentalReminder { get; set; } = null!;
}
```

### 关系说明

- `RentalReminder` 关联 `RentalRecord`（一对多：一个租赁记录可以有多个提醒）
- `RentalDeferral` 关联 `RentalReminder`（一对多：一个提醒可以有多条宽限记录）

## API 设计

### 1. 获取待办事项列表

```
GET /api/todo/list?type={utility|rental}&pageSize=10
```

**查询参数：**
- `type`: 筛选类型（可选，不传则返回全部）
  - `utility`: 收水电费
  - `rental`: 催收房租
- `pageSize`: 每页数量，默认10

**响应：**
```json
{
  "items": [
    {
      "id": 1,
      "type": "utility",
      "roomInfo": "XX小区1栋101室",
      "amount": 256.80,
      "period": "2026-03-01 ~ 2026-03-31",
      "status": "pending"
    },
    {
      "id": 1,
      "type": "rental",
      "roomInfo": "XX小区1栋102室",
      "tenantName": "张三",
      "tenantPhone": "138****1234",
      "monthlyRent": 2000.00,
      "contractEndDate": "2026-04-01",
      "checkInDate": "2025-04-01",
      "leaseType": 0,
      "leaseTypeText": "月租",
      "deferralCount": 1,
      "lastDeferredDate": "2026-04-03"
    }
  ],
  "total": 5,
  "utilityCount": 3,
  "rentalCount": 2
}
```

### 2. 水电费收款（复用现有）

```
POST /api/meter-app/pay
```

复用现有水电费收款 API。

### 3. 催收房租 - 宽限处理

```
POST /api/rental-reminder/{id}/defer
```

**请求体：**
```json
{
  "deferredToDate": "2026-04-05",
  "remark": "租客说过几天发工资"
}
```

**响应：**
```json
{
  "success": true,
  "newReminderDate": "2026-04-05"
}
```

### 4. 催收房租 - 续租处理

```
POST /api/rental-reminder/{id}/renew
```

**请求体：**
```json
{
  "leaseType": 0,
  "monthlyRent": 2200.00,
  "contractEndDate": "2027-04-01",
  "contractImage": "xxx.jpg",
  "remark": "续租备注"
}
```

**响应：**
```json
{
  "success": true,
  "newRentalRecordId": 123
}
```

### 5. 获取宽限记录列表

```
GET /api/rental-reminder/{id}/deferrals
```

**响应：**
```json
{
  "items": [
    {
      "id": 1,
      "originalReminderDate": "2026-04-01",
      "deferredToDate": "2026-04-03",
      "remark": "等过几天发工资",
      "createdTime": "2026-04-01T10:00:00"
    },
    {
      "id": 2,
      "originalReminderDate": "2026-04-03",
      "deferredToDate": "2026-04-10",
      "remark": "家里有事再宽限",
      "createdTime": "2026-04-03T14:00:00"
    }
  ],
  "total": 2
}
```

## 前端组件设计

### TodoPanel 组件改造

```
┌─────────────────────────────────────────┐
│ 2026年3月29日         [全部▼] 待办 5 项 │
├─────────────────────────────────────────┤
│ 💧 XX小区1栋101室                        │
│    水电费待收款 ¥256.80             >   │
├─────────────────────────────────────────┤
│ 🏠 XX小区1栋102室                        │
│    催收房租 ¥2000.00  合同明天到期 >   │
└─────────────────────────────────────────┘

筛选选项：
- 全部
- 收水电费
- 催收房租
```

**交互说明：**
- 水电费待办：显示房间、金额、周期，图标使用水滴
- 催收房租待办：显示房间、租客、月租金、合同到期日，图标使用房屋
- 点击待办项触发对应弹窗

### 催收房租弹窗（RentalReminderDialog.vue）

```
┌────────────────────────────────────────────────────┐
│                    催收房租                        │
├────────────────────────────────────────────────────┤
│ 房间：XX小区1栋102室                              │
│ 租客：张三  电话：138****1234                     │
│ 入住日期：2025-04-01                               │
│ 合同到期：2026-04-01                               │
│ 月租金：¥2000.00                                   │
│ 租期类型：月租                                      │
│                                                    │
│ 已宽限 [1] 次，最近宽限至 2026-04-03    ← 可点击  │
├────────────────────────────────────────────────────┤
│     [宽限几日]         [确认续租]         [取消]    │
└────────────────────────────────────────────────────┘
```

**交互说明：**
- 点击宽限次数链接，弹出宽限记录弹窗
- 点击"宽限几日"按钮，弹出宽限弹窗
- 点击"确认续租"按钮，弹出续租弹窗

### 宽限弹窗（DeferDialog.vue）

```
┌────────────────────────────────────┐
│         设置宽限日期              │
├────────────────────────────────────┤
│ 宽限至：[ 日期选择器 ]           │
│ 备注：[ 文本框 ]                │
├────────────────────────────────────┤
│      [取消]        [确定]        │
└────────────────────────────────────┘
```

**字段说明：**
- 宽限至：日期选择器，最小值为明天，默认值为原提醒日期+3天
- 备注：可选填写宽限原因

### 续租弹窗（RenewRentalDialog.vue）

```
┌────────────────────────────────────────────────────┐
│                    续租确认                        │
├────────────────────────────────────────────────────┤
│ 租客：张三（不可修改）                            │
│ 房间：XX小区1栋102室（不可修改）                   │
│                                                    │
│ 上个租期：2025-04-01 ~ 2026-04-01                 │
│                                                    │
│ 新租期类型：[月租 ▼]                             │
│ 新月租金：[  2200.00  ] ← 默认=上月租金            │
│ 新合同到期日：[ 2027-04-01 ] ← 根据租期类型自动计算  │
│ 合同图片：[ 上传 ]                               │
│ 备注：[ 文本框 ]                                  │
├────────────────────────────────────────────────────┤
│ 押金 ¥2000.00 自动继承（无需重新收取）            │
├────────────────────────────────────────────────────┤
│      [取消]                 [确认续租]            │
└────────────────────────────────────────────────────┘
```

**字段说明：**
- 新租期类型：下拉选择（月租/半年租/年租）
- 新月租金：默认值为上月租金，可修改
- 新合同到期日：根据租期类型自动计算（月租+1月，半年+6月，年租+12月），可手动修改
- 合同图片：可选上传
- 备注：可选填写
- 押金自动继承提示：显示原租赁记录的押金金额

### 宽限记录弹窗（DeferralRecordsDialog.vue）

```
┌────────────────────────────────────────────────────┐
│              宽限记录                        [×]    │
├────────────────────────────────────────────────────┤
│  序号  │ 原计划日期  │ 宽限至│  备注            │
├────────────────────────────────────────────────────┤
│   1   │ 2026-04-01 │ 2026-04-03 │ 等过几天发工资   │
│   2   │ 2026-04-03 │ 2026-04-10 │ 家里有事再宽限   │
└────────────────────────────────────────────────────┘
```

**显示说明：**
- 按创建时间倒序排列（最新在前）
- 如果无宽限记录，显示"暂无宽限记录"

## 业务流程

### 1. 催收房租触发流程

```
定时任务（每日凌晨）
    │
    ▼
扫描租赁记录
    │
    ▼
合同到期前3天？
    │
    ▼
创建催收提醒（RentalReminder）
```

**触发条件：**
- 租赁记录状态为 Active
- 合同到期日 = 今天 + 3天
- 不存在相同租赁记录的 Pending 状态提醒

### 2. 宽限处理流程

```
点击"宽限几日"
    │
    ▼
选择宽限日期 + 填写备注
    │
    ▼
保存宽限记录（RentalDeferral）
    │
    ▼
更新提醒状态为 Deferred
    │
    ▼
创建新的提醒（ReminderDate = 宽限日期）
```

**处理逻辑：**
1. 创建 RentalDeferral 记录
2. 更新原 RentalReminder 状态为 Deferred
3. 创建新的 RentalReminder（关联同一 RentalRecord，状态为 Pending）

### 3. 续租处理流程

```
点击"确认续租"
    │
    ▼
填写续租信息
    │
    ▼
创建新租赁记录（RentalRecord）
    │
    ├─────────────────────────────────┐
    │                                 │
    ▼                                 ▼
押金自动继承              标记原记录为 Terminated
    │
    ▼
删除/完成催收提醒
```

**处理逻辑：**
1. 创建新 RentalRecord：
   - TenantId = 原记录.TenantId
   - RoomId = 原记录.RoomId
   - CheckInDate = 原记录.ContractEndDate（或今天，取较晚者）
   - LeaseType = 用户选择
   - MonthlyRent = 用户输入
   - ContractEndDate = 用户选择
   - Deposit = 原记录.Deposit
   - DepositStatus = Received（押金已收，直接继承）
2. 更新原 RentalRecord 状态为 Terminated
3. 更新 RentalReminder 状态为 Completed

## 文件结构

### 后端新增文件

```
Gentle/
├── Gentle.Core/
│   ├── Entities/
│   │   ├── RentalReminder.cs      # 催收提醒实体
│   │   └── RentalDeferral.cs      # 宽限记录实体
│   └── Enums/
│       └── RentalReminderStatus.cs # 提醒状态枚举
├── Gentle.EntityFramework.Core/
│   └── Seeds/
│       ├── RentalReminderSeedData.cs
│       └── RentalDeferralSeedData.cs
├── Gentle.Application/
│   ├── Dtos/
│   │   ├── Todo/
│   │   │   ├── TodoItemDto.cs         # 待办事项 DTO
│   │   │   ├── TodoListResult.cs      # 待办列表结果
│   │   │   └── TodoType.cs            # 待办类型枚举
│   │   └── Rental/
│   │       ├── RentalReminderDto.cs   # 催收提醒 DTO
│   │       ├── DeferReminderInput.cs  # 宽限输入
│   │       ├── RenewRentalInput.cs    # 续租输入
│   │       └── DeferralRecordDto.cs   # 宽限记录 DTO
│   ├── Services/
│   │   ├── ITodoService.cs           # 待办服务接口
│   │   ├── TodoService.cs            # 待办服务实现
│   │   ├── IRentalReminderService.cs # 催收提醒服务接口
│   │   └── RentalReminderService.cs  # 催收提醒服务实现
│   └── Apps/
│       └── TodoAppService.cs         # 待办 API 控制器
```

### 前端新增/修改文件

```
Hans/src/
├── api/
│   ├── todo.ts                       # 待办 API
│   ├── rentalReminder.ts             # 催收提醒 API
│   └── model/
│       ├── todoModel.ts              # 待办相关类型
│       └── rentalReminderModel.ts    # 催收提醒相关类型
├── pages/dashboard/base/components/
│   ├── TodoPanel.vue                 # 修改：添加筛选和双类型支持
│   ├── PayUtilityDialog.vue          # 新增：水电费收款弹窗（从 bill 页面抽取）
│   ├── RentalReminderDialog.vue      # 新增：催收房租弹窗
│   ├── DeferDialog.vue               # 新增：宽限弹窗
│   ├── RenewRentalDialog.vue         # 新增：续租弹窗
│   └── DeferralRecordsDialog.vue     # 新增：宽限记录弹窗
```

## 注意事项

1. **定时任务**：需要在后端添加定时任务，每日凌晨扫描即将到期的租赁记录
2. **押金继承**：续租时押金自动继承，不需要重新收取
3. **宽限记录**：每次宽限都会创建新记录，可追溯历史
4. **收入统计**：续租的租金收入在入住月份一次性计入（与现有逻辑一致）
5. **复用组件**：水电费收款弹窗从 bill 页面抽取为独立组件复用
