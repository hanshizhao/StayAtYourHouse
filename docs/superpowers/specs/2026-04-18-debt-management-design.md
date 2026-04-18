# 老赖管理功能设计

## 背景

租客欠款后往往分多次还款（如今天还 300，明天还 500），缺乏系统化的追踪手段，容易出错和遗漏。需要一个独立的欠款管理模块，支持多笔欠款、多次还款的精细追踪。

## 需求

- 独立菜单「老赖管理」，展示所有有欠款的租客
- 一个租客可有多笔独立欠款，手动录入金额和说明
- 每笔欠款可分多次还款，记录金额、日期、方式、备注
- 已还清的保留显示，标记为「已还清」

## 数据模型

### Debt（欠款记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| Id | int (PK) | 自增主键 |
| TenantId | int (FK → Tenant) | 关联租客 |
| TotalAmount | decimal | 总欠款金额 |
| Status | DebtStatus 枚举 | Ongoing(0) / Settled(1) |
| Description | string? | 欠款说明 |
| CreatedDate | DateTime | 创建时间 |
| Remark | string? | 备注 |

Navigation: `Tenant`

### DebtRepayment（还款记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| Id | int (PK) | 自增主键 |
| DebtId | int (FK → Debt) | 关联欠款 |
| Amount | decimal | 本次还款金额 |
| PaymentDate | DateTime | 还款日期 |
| PaymentMethod | RepaymentMethod 枚举 | Cash(0) / WeChat(1) / Alipay(2) / BankTransfer(3) |
| Remark | string? | 备注 |

Navigation: `Debt`

### 新增枚举

- **DebtStatus**: `Ongoing = 0`（进行中），`Settled = 1`（已还清）
- **RepaymentMethod**: `Cash = 0`，`WeChat = 1`，`Alipay = 2`，`BankTransfer = 3`

### 金额计算

已还金额和剩余金额通过 `DebtRepayment` 表聚合计算，不冗余存储，避免数据不一致。

## 后端 API

在 `Gentle.Application/Apps/` 下新增 `DebtAppService`，实现 `IDynamicApiController`。

服务层在 `Gentle.Application/Services/` 下新增 `IDebtService` / `DebtService`，使用 `IRepository<Debt>` 构造函数注入。

### 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/debt/list` | 欠款列表（分页、状态筛选、租客搜索） |
| GET | `/api/debt/{id}` | 欠款详情（含还款记录） |
| POST | `/api/debt/add` | 新增欠款 |
| PUT | `/api/debt/edit` | 修改欠款 |
| DELETE | `/api/debt/remove/{id}` | 删除欠款（仅限无还款记录） |
| POST | `/api/debt/{id}/repay` | 新增还款记录 |
| DELETE | `/api/debt/repay/remove/{id}` | 删除还款记录 |

### 业务逻辑

- 新增还款时：聚合该欠款下所有还款金额，若 >= TotalAmount，自动将 Status 更新为 Settled
- 删除还款时：若欠款状态为 Settled，回退为 Ongoing
- 删除欠款时：已有还款记录则拒绝删除

## 前端页面

### 路由与菜单

- 路由：`/debt`
- 菜单：左侧独立菜单项「老赖管理」
- 页面文件：`src/pages/debt/index.vue`

### 主列表页

搜索/筛选栏：租客姓名搜索 + 状态筛选（全部/进行中/已还清）

欠款卡片列表（参考现有房间管理卡片布局）：

每张卡片展示：
- 租客姓名、电话
- 欠款说明
- 金额进度：`已还 8,000 / 欠款 20,000`，带进度条
- 状态标签（进行中/已还清）
- 操作按钮：还款、详情、编辑、删除

底部分页控件。

### 弹窗

- **还款弹窗（RepayDialog）**：还款金额（必填）、还款日期（默认今天）、还款方式（下拉）、备注
- **详情弹窗（DebtDetailDialog）**：欠款基本信息 + 还款记录表格（日期、金额、方式、备注）+ 汇总（总欠款、已还、剩余）
- **新增/编辑弹窗（DebtFormDialog）**：选择租客（下拉搜索）、欠款金额（必填）、欠款说明、备注

### 文件组织

```
src/pages/debt/
├── index.vue
└── components/
    ├── DebtCard.vue
    ├── RepayDialog.vue
    ├── DebtDetailDialog.vue
    └── DebtFormDialog.vue

src/api/debt.ts
src/router/modules/debt.ts
```
