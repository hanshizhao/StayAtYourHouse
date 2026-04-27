# 修改租约功能设计

## 背景

当前系统租赁记录一旦创建（入住），核心字段无法修改。实际场景中，租客可能提前交了几个月房租，需要将合同结束日期延长到目标日期。目前系统无法处理此场景。

## 目标

为状态为 Active（生效中）的租赁记录提供完整编辑功能，支持修改入住日期、租期月数、合同结束日期、月租、押金、备注等字段。

## 方案

直接修改现有记录，不保存历史快照。实现简单直接，后续需要审计可扩展。

## 后端设计

### 新增 DTO

**文件**: `Gentle/Gentle.Application/Dtos/RentalRecord/UpdateRentalRecordInput.cs`

```csharp
public class UpdateRentalRecordInput
{
    public DateTime CheckInDate { get; set; }
    public int LeaseMonths { get; set; }       // 1-36
    public DateTime ContractEndDate { get; set; }
    public decimal MonthlyRent { get; set; }    // > 0
    public decimal Deposit { get; set; }        // >= 0
    public string? Remark { get; set; }         // max 500
}
```

### 新增 Service 方法

**文件**: `Gentle/Gentle.Application/Services/RentalRecordService.cs`

`UpdateAsync(int id, UpdateRentalRecordInput input)`:
1. 根据 ID 查找记录，不存在则抛异常
2. 验证状态为 Active，否则抛异常
3. 验证字段合法性（ContractEndDate > CheckInDate 等）
4. 更新字段
5. 返回更新后的 DTO

### 新增 API 端点

**文件**: `Gentle/Gentle.Application/Apps/RentalAppService.cs`

`PUT /api/rental/{id}` — 调用 UpdateAsync

## 前端设计

### 新增组件

**文件**: `Hans/src/pages/tenant/components/EditRentalDialog.vue`

弹窗内容：
- 顶部只读信息栏：租客名、房间号
- 表单字段：
  - 入住日期（CheckInDate）— 日期选择器
  - 租期月数（LeaseMonths）— 数字输入，1-36
  - 合同结束日期（ContractEndDate）— 日期选择器
  - 月租金额（MonthlyRent）— 金额输入
  - 押金金额（Deposit）— 金额输入
  - 备注（Remark）— 文本域

联动逻辑：
- 修改入住日期或租期月数 → 自动计算合同结束日期
- 修改合同结束日期 → 自动计算租期月数

### 入口

在租赁记录列表页的操作列中，为 Active 状态的记录显示"编辑"按钮。

### API 层

**文件**: `Hans/src/api/rental.ts`

新增 `updateRental(id: number, input: UpdateRentalInput)` 方法，调用 `PUT /api/rental/{id}`。

## 约束

- 仅 Active 状态的租赁记录可编辑
- 不保存修改历史快照（后续可扩展）
