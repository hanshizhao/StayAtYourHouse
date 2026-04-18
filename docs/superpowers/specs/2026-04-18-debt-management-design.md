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

文件位置：`Gentle.Core/Entities/Debt.cs`
表名：`[Table("debt")]`
索引：`[Index(nameof(TenantId))]`

继承 `Entity<int>`（Furion 基类，自动提供 Id、CreatedTime 等字段）。

| 字段 | 类型 | 属性 | 说明 |
|------|------|------|------|
| TenantId | int | [Required] | 关联租客 FK |
| TotalAmount | decimal | [Required, Range(0.01, double.MaxValue), Column(TypeName = "decimal(10,2)")] | 总欠款金额 |
| Status | DebtStatus | [Required] | Ongoing(0) / Settled(1) |
| Description | string? | [MaxLength(500)] | 欠款说明 |
| Remark | string? | [MaxLength(500)] | 备注 |

Navigation: `Tenant`（多对一），`Repayments`（`ICollection<DebtRepayment>`，一对多）

种子数据：实现 `IEntitySeedData<Debt, MasterDbContextLocator>`，返回空数组。

### DebtRepayment（还款记录）

文件位置：`Gentle.Core/Entities/DebtRepayment.cs`
表名：`[Table("debt_repayment")]`
索引：`[Index(nameof(DebtId))]`

继承 `Entity<int>`。

| 字段 | 类型 | 属性 | 说明 |
|------|------|------|------|
| DebtId | int | [Required] | 关联欠款 FK |
| Amount | decimal | [Required, Range(0.01, double.MaxValue), Column(TypeName = "decimal(10,2)")] | 本次还款金额 |
| PaymentDate | DateTime | [Required] | 还款日期 |
| PaymentChannel | PaymentChannel 枚举 | [Required] | Cash(0) / WeChat(1) / Alipay(2) / BankTransfer(3) |
| Remark | string? | [MaxLength(500)] | 备注 |

Navigation: `Debt`（多对一）

种子数据：实现 `IEntitySeedData<DebtRepayment, MasterDbContextLocator>`，返回空数组。

### 新增枚举

文件位置：`Gentle.Core/Enums/`

- **DebtStatus.cs**: `Ongoing = 0`（进行中），`Settled = 1`（已还清）
- **PaymentChannel.cs**: `Cash = 0`，`WeChat = 1`，`Alipay = 2`，`BankTransfer = 3`

注意：命名为 `PaymentChannel` 而非 `RepaymentMethod`，避免与已有 `PaymentMethod`（付款频率）枚举混淆。

### 金额计算

已还金额和剩余金额通过 `DebtRepayment` 表聚合计算，不冗余存储，避免数据不一致。

## 后端 API

### AppService

文件位置：`Gentle.Application/Apps/DebtAppService.cs`

属性：
- `[Authorize]`
- `[ApiDescriptionSettings("Debt", Name = "DebtApp", Order = 12)]`
- 实现 `IDynamicApiController`
- 路由：`[Route("api/debt")]`

### 服务层

文件位置：`Gentle.Application/Services/IDebtService.cs`、`DebtService.cs`

`IDebtService : ITransient`（Furion 自动注册），使用 `IRepository<Debt>` + `IRepository<DebtRepayment>` 构造函数注入。

### DTO

文件位置：`Gentle.Application/Dtos/Debt/`

| DTO | 用途 |
|-----|------|
| `DebtListDto` | 列表输出（含计算字段 PaidAmount、RemainingAmount、TenantName、TenantPhone） |
| `DebtDetailDto` | 详情输出（含 Repayments 列表） |
| `CreateDebtInput` | 新增欠款输入（TenantId、TotalAmount、Description、Remark） |
| `UpdateDebtInput` | 修改欠款输入（Id、TotalAmount、Description、Remark） |
| `AddRepaymentInput` | 新增还款输入（Amount、PaymentDate、PaymentChannel、Remark） |
| `DebtRepaymentDto` | 还款记录输出 |

### 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `list` | 欠款列表（分页、状态筛选、租客搜索） |
| GET | `{id}` | 欠款详情（含还款记录） |
| POST | `add` | 新增欠款 |
| PUT | `edit` | 修改欠款 |
| DELETE | `remove/{id}` | 删除欠款（仅限无还款记录） |
| POST | `{id}/repay` | 新增还款记录 |
| DELETE | `repay/remove/{id}` | 删除还款记录 |

### 业务逻辑

- 新增还款时：验证还款金额不超过剩余欠款（`TotalAmount - 已还总额`）；若还清则自动将 Status 更新为 Settled
- 删除还款时：若欠款状态为 Settled，回退为 Ongoing
- 修改欠款时：若 Status 为 Settled，禁止修改 TotalAmount（防止已还清状态失效）
- 删除欠款时：已有还款记录则拒绝删除

## 前端页面

### 路由与菜单

- 路由：`/debt`
- 菜单：左侧独立菜单项「老赖管理」
- 页面文件：`src/pages/debt/index.vue`
- 路由 meta `orderNo`：待定（根据现有菜单顺序分配）

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
src/api/model/debtModel.ts
src/router/modules/debt.ts
```
