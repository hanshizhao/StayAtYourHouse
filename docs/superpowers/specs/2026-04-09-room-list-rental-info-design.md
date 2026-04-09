# 房间列表租约信息显示设计

**日期**: 2026-04-09
**状态**: 已确认

## 概述

在房间管理列表页面新增三列租约信息：安居码提交状态、已租时长、到期天数。数据来源于活跃租约记录（RentalRecord），由后端实时计算，无需数据库迁移。

## 需求细节

### 三项显示信息

| 信息 | 数据来源 | 空房间显示 | 有租约时显示 |
|------|---------|-----------|-------------|
| 安居码提交状态 | `RentalRecord.IsAnJuCodeSubmitted` | `-` | 绿色"已提交" / 红色"未提交" |
| 已租时长 | `RentalRecord.CheckInDate` → 计算 | `-` | "1年2月16天" 格式 |
| 到期天数 | `RentalRecord.ContractEndDate` → 计算 | `-` | 正数"还剩X天"(蓝) / 负数"已过期X天"(红) / 0"今天到期"(橙) |

### 租期显示格式规则

- 有年有月有天：`1年2月16天`
- 年为0省略：`5月3天`
- 月为0省略：`1年16天`
- 仅天：`15天`
- 仅年：`1年`
- 仅月：`5月`

### 列位置

在现有"状态"列之后插入三个新列，在"备注"列之前。

## 后端设计

### RoomDto 新增字段（平铺）

```csharp
public bool? AnjuCodeSubmitted { get; set; }   // 安居码是否提交（null=无租约）
public string? LeaseDuration { get; set; }      // "1年2月16天"（null=无租约）
public int? DaysUntilExpiry { get; set; }        // 正数=剩余天数，负数=已过期天数（null=无租约）
```

### RoomService.GetListAsync 改动

1. 查询所有房间后，收集 RoomId 列表
2. 通过已注入的 `_rentalRecordRepository` 批量查出 `Status == Active && RoomId in ids` 的租约记录
3. 若同一 RoomId 存在多条 Active 记录，取 `ContractEndDate` 最新的一条（正常业务不应出现，做防御性处理）
4. 构建 `Dictionary<int, RentalRecord>` 以 RoomId 为 key
5. 遍历房间 DTO 列表，匹配活跃租约记录并填充三个字段
6. 无匹配的房间字段保持 `null`

### 租期计算工具方法

新增私有方法 `CalculateLeaseDuration(DateTime checkInDate, DateTime today)` 返回格式化字符串：

```
算法（使用 DateTime 逐步递减，避免手工日历计算）：
1. years = 0; while (checkInDate.AddYears(years + 1) <= today) years++
2. shifted = checkInDate.AddYears(years)
3. months = 0; while (shifted.AddMonths(months + 1) <= today) months++
4. shifted2 = shifted.AddMonths(months)
5. days = (today - shifted2).Days
6. 根据年/月/天的值按格式规则拼接，省略为0的部分
```

### 不需要数据库迁移

三个字段均为实时计算，不持久化到数据库。

## 前端设计

### TypeScript 类型（roomModel.ts）

RoomItem 接口新增：

```typescript
anjuCodeSubmitted?: boolean | null
leaseDuration?: string | null
daysUntilExpiry?: number | null
```

### 列表页（index.vue）新增列

| 列 key | 标题 | 宽度 | 渲染 |
|--------|------|------|------|
| `anjuCodeSubmitted` | 安居码 | 80 | Tag 组件：true→绿"已提交"，false→红"未提交"，null→`-` |
| `leaseDuration` | 已租时长 | 110 | 直接显示字符串或`-` |
| `daysUntilExpiry` | 到期天数 | 100 | 正数→蓝色文字，负数→红色文字，0→橙色文字，null→`-` |

## 涉及文件

| 文件 | 改动类型 |
|------|---------|
| `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` | 新增3个字段 |
| `Gentle/Gentle.Application/Services/RoomService.cs` | GetListAsync 增加租约查询 + 计算方法 |
| `Hans/src/api/model/roomModel.ts` | RoomItem 新增3个字段 |
| `Hans/src/pages/housing/room/index.vue` | 新增3列 |
| `tests/e2e/feat-XXX-room-list-rental-info.spec.ts` | E2E 测试 |
