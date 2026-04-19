# 工作流进度文档

## 项目信息

- **项目名称**: StayAtYourHouse
- **创建日期**: 2026-03-30
- **技术栈**: .NET 10 (Furion), Vue 3, TDesign, TypeScript, Playwright

## 模块概览

| 模块 | 优先级 | 功能数 | 状态 |
|------|--------|--------|------|
| 老赖管理 | P0 | 13 | ⏳ 待开始 |

## 功能进度

### 老赖管理 (FEAT-168 ~ FEAT-180)

| ID | 描述 | 状态 | 测试 |
|----|------|------|------|
| FEAT-168 | 后端枚举：DebtStatus 和 PaymentChannel | ⏳ 待开始 | - |
| FEAT-169 | 后端实体：Debt 和 DebtRepayment | ⏳ 待开始 | - |
| FEAT-170 | 后端 DTO：所有欠款相关 DTO | ⏳ 待开始 | - |
| FEAT-171 | 后端服务层：IDebtService 接口和 DebtService 实现 | ⏳ 待开始 | - |
| FEAT-172 | 后端 AppService：DebtAppService API 控制器 | ⏳ 待开始 | - |
| FEAT-173 | 数据库迁移：AddDebtTables | ⏳ 待开始 | - |
| FEAT-174 | 前端 API 层 + 路由：debtModel 类型定义、API 调用、路由模块 | ⏳ 待开始 | - |
| FEAT-175 | 前端 DebtCard 组件：欠款卡片展示 | ⏳ 待开始 | - |
| FEAT-176 | 前端 DebtFormDialog 组件：新增/编辑弹窗 | ⏳ 待开始 | - |
| FEAT-177 | 前端 RepayDialog 组件：还款弹窗 | ⏳ 待开始 | - |
| FEAT-178 | 前端 DebtDetailDialog 组件：详情弹窗 | ⏳ 待开始 | - |
| FEAT-179 | 前端主页面：老赖管理列表页 | ⏳ 待开始 | - |
| FEAT-180 | E2E 测试：老赖管理完整流程 | ⏳ 待开始 | - |

## 统计

- **已完成**: 0
- **进行中**: 0
- **待处理**: 13

## 更新日志

### 2026-04-19

- 初始化「老赖管理」功能模块（FEAT-168~180），来源：docs/superpowers/plans/2026-04-18-debt-management.md
- 清理已完成任务（FEAT-160~166 passed，已删除）
- 生成设计索引：docs/prototypes/2026-04-18-debt-management-design-index.md

## 状态说明

- ⏳ 待开始
- 🚧 进行中
- ✅ 已完成
- ❌ 失败
- 🔄 审查中
