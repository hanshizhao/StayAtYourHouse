# 工作流进度文档

## 项目信息

- **项目名称**: StayAtYourHouse（二房东房源管理系统）
- **创建日期**: 2026-03-23
- **当前阶段**: 统一水电费账单

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TDesign
- **后端**: .NET 10 + Furion + MySQL + Entity Framework Core

## 模块概览

| 模块         | 优先级 | 功能数 | 状态      |
| ------------ | ------ | ------ | --------- |
| 统一水电费账单 | P0     | 15     | ⏳ 待开始 |

## 功能进度

### 统一水电费账单 (FEAT-043 ~ FEAT-057)

| ID       | 描述                                      | 状态      | 测试 |
| -------- | ----------------------------------------- | --------- | ---- |
| FEAT-043 | 删除后端 Bill/CollectionRecord 实体和枚举文件 | ✅ 已完成 | 通过 |
| FEAT-044 | 删除后端 Bill 服务层和 DTO                 | ⏳ 待开始 | -    |
| FEAT-045 | 清理后端共享文件中的 Bill 引用             | ⏳ 待开始 | -    |
| FEAT-046 | 清理 ReportService 中的 Bill 引用         | ⏳ 待开始 | -    |
| FEAT-047 | 清理 RentalRecordService 中的 Bill 引用   | ⏳ 待开始 | -    |
| FEAT-048 | 修改 UtilityBillStatus 枚举（移除 Merged） | ⏳ 待开始 | -    |
| FEAT-049 | 清理 MeterService 和 UtilityBillDto 中的 Merged 引用 | ⏳ 待开始 | -    |
| FEAT-050 | UtilityBill 增加 RentalRecordId 字段      | ⏳ 待开始 | -    |
| FEAT-051 | RentalRecord 新增 UtilityBills 导航属性   | ⏳ 待开始 | -    |
| FEAT-052 | 数据库迁移                                | ⏳ 待开始 | -    |
| FEAT-053 | 删除前端 Bill 相关文件                    | ⏳ 待开始 | -    |
| FEAT-054 | 前端租赁记录页展示 UtilityBills           | ⏳ 待开始 | -    |
| FEAT-055 | 前端水电费类型清理和页面适配              | ⏳ 待开始 | -    |
| FEAT-056 | 清理 E2E 测试文件                         | ⏳ 待开始 | -    |
| FEAT-057 | 最终验证                                  | ⏳ 待开始 | -    |

## 状态说明

- ⏳ 待开始 - 尚未开始开发
- 🚧 进行中 - 正在开发
- ✅ 已完成 - 开发完成且测试通过
- ❌ 已阻塞 - 遇到问题需要解决
- ⏭️ 已跳过 - 暂时跳过

## 更新日志

### 2026-03-28 (续)

- FEAT-043 验证通过：删除后端 Bill/CollectionRecord 实体和枚举文件
  - 已删除：Bill.cs, CollectionRecord.cs, BillStatus.cs, CollectResult.cs
  - 编译失败符合预期（后续 FEAT 将清理引用）
  - 静态测试通过：2/2

### 2026-03-28

- 清理已完成任务（FEAT-001~042）
- 初始化统一水电费账单功能模块（FEAT-043~057）
- 来源：docs/superpowers/plans/2026-03-28-unified-utility-billing.md
