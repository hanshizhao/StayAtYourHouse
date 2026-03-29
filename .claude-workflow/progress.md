# 统一水电费账单 - 进度追踪

## 模块信息

- **模块名称**: 统一水电费账单
- **版本**: 1.0.0
- **创建日期**: 2026-03-28
- **计划文档**: docs/superpowers/plans/2026-03-28-unified-utility-billing.md

## 完成进度

| 功能 ID | 描述 | 状态 | 完成时间 |
|---------|------|------|----------|
| FEAT-043 | 删除后端 Bill/CollectionRecord 实体和枚举文件 | ✅ 已通过 | 2026-03-28T14:30:00Z |
| FEAT-044 | 删除后端 Bill 服务层和 DTO | ✅ 已通过 | 2026-03-29T00:30:00Z |
| FEAT-045 | 清理后端共享文件中的 Bill 引用 | ✅ 已通过 | 2026-03-29T12:00:00Z |
| FEAT-046 | 清理 ReportService 中的 Bill 引用 | ✅ 已通过 | 2026-03-29T15:30:00Z |
| FEAT-047 | 清理 RentalRecordService 中的 Bill 引用 | ✅ 已通过 | 2026-03-29T16:30:00Z |
| FEAT-048 | 修改 UtilityBillStatus 枚举（移除 Merged） | ✅ 已通过 | 2026-03-29T17:30:00Z |
| FEAT-049 | 清理 MeterService 和 UtilityBillDto 中的 Merged 引用 | ✅ 已通过 | 2026-03-29T19:00:00Z |
| FEAT-050 | UtilityBill 增加 RentalRecordId 字段 | ✅ 已通过 | 2026-03-29T22:00:00Z |
| FEAT-051 | RentalRecord 新增 UtilityBills 导航属性并更新查询 | ✅ 已通过 | 2026-03-30T00:00:00Z |
| FEAT-052 | 数据库迁移 | ✅ 已通过 | 2026-03-30T01:30:00Z |
| FEAT-053 | 删除前端 Bill 相关文件 | ✅ 已通过 | 2026-03-30T02:00:00Z |
| FEAT-054 | 前端租赁记录页展示 UtilityBills | ⏳ 待处理 | - |
| FEAT-055 | 前端水电费类型清理和页面适配 | ⏳ 待处理 | - |
| FEAT-056 | 清理 E2E 测试文件 | ⏳ 待处理 | - |
| FEAT-057 | 最终验证 | ⏳ 待处理 | - |

## 统计

- **已完成**: 11/15 (73.3%)
- **进行中**: 0
- **待处理**: 4

## 更新日志

### 2026-03-30

- **FEAT-053 验证通过**: 删除前端 Bill 相关文件
  - 删除 Hans/src/pages/bill/ 目录
  - 删除 Hans/src/api/bill.ts, Hans/src/api/model/billModel.ts, Hans/src/router/modules/bill.ts
  - 清理 rentalModel.ts 中的 BillItem 引用，新增 UtilityBillItem 引用
  - 清理 reportModel.ts：删除 CollectionReport、OverdueBillInfo、GraceBillInfo 类型
  - 清理 report.ts：删除 getTodayTodos API 和催收报表相关代码
  - 删除催收统计报表页面和路由
  - 静态验证测试 5/5 通过
  - 编译错误符合预期（3 个错误将在 FEAT-054/055 中清理）

- **FEAT-052 验证通过**: 数据库迁移
  - 生成迁移文件：删除 collection_record 和 bill 表
  - utility_bill 表新增 rental_record_id 列
  - 将 utility_bill 中 status = 2 的记录改为 status = 1
  - 迁移应用成功

- **FEAT-051 验证通过**: RentalRecord 新增 UtilityBills 导航属性并更新查询
  - RentalRecord 实体新增 UtilityBills 导航属性
  - RentalRecordDto 新增 UtilityBills 属性
  - RentalRecordService 查询添加 .Include(r => r.UtilityBills)
  - Mapper 添加 UtilityBills 映射

### 2026-03-29

- **FEAT-050 验证通过**: UtilityBill 增加 RentalRecordId 字段
  - UtilityBill 实体新增 RentalRecordId 属性（int? 可空）
  - UtilityBill 实体新增 RentalRecord 导航属性
  - MeterService.CreateUtilityBillAsync 改为查询活跃租约并关联
  - 无活跃租约时不创建账单
  - dotnet build 构建成功（0 警告，0 错误）
  - 所有 5 个测试通过

- **FEAT-049 验证通过**: 清理 MeterService 和 UtilityBillDto 中的 Merged 引用

- **FEAT-048 验证通过**: 修改 UtilityBillStatus 枚举（移除 Merged）

- **FEAT-047 验证通过**: 清理 RentalRecordService 中的 Bill 引用

- **FEAT-046 验证通过**: 清理 ReportService 中的 Bill 引用

### 2026-03-28

- **FEAT-045 验证通过**: 清理后端共享文件中的 Bill 引用

- **FEAT-044 验证通过**: 删除后端 Bill 服务层和 DTO

- **FEAT-043 验证通过**: 删除后端 Bill/CollectionRecord 实体和枚举文件
