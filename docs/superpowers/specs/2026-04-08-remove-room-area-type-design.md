# 删除 Room 的 Area 和 RoomType 属性

## 背景

房间管理中的"面积"(Area) 和"类型"(RoomType) 两个属性不再需要，需从数据库、后端、前端三层完整移除。

## 设计

### 后端修改（8 文件）

| 文件 | 操作 |
|------|------|
| `Gentle.Core/Entities/Room.cs` | 删除 `Area`（decimal?）和 `RoomType`（string?）属性 |
| `Application/Dtos/Room/RoomDto.cs` | 删除 Area、RoomType 属性 |
| `Application/Dtos/Room/CreateRoomInput.cs` | 删除 Area、RoomType 属性 |
| `Application/Dtos/Room/UpdateRoomInput.cs` | 删除 Area、RoomType 属性 |
| `Application/Dtos/Report/HousingOverviewDto.cs` | 删除 VacantRoomDto 中的 Area、RoomType |
| `Application/Dtos/Report/RoomProfitRankingDto.cs` | 删除 RoomProfitRankingDto 中的 Area、RoomType |
| `Application/Services/RoomService.cs` | 删除 UpdateAsync 中 `existing.Area` 和 `existing.RoomType` 赋值 |
| `Application/Services/ReportService.cs` | 删除 4 处 Area/RoomType 手动赋值（VacantRoomDto 和 RoomProfitRankingDto 构建） |

### 数据库迁移

新增 EF Core 迁移，删除 Room 表的 `Area` 和 `RoomType` 两列。

### 前端修改（4 文件）

| 文件 | 操作 |
|------|------|
| `src/api/model/roomModel.ts` | 删除 RoomItem、CreateRoomParams、UpdateRoomParams 中的 area/roomType |
| `src/pages/housing/room/index.vue` | 删除表格列定义、模板插槽、表单字段、类型定义、数据初始化/回填/提交中的 area/roomType |
| `src/pages/housing/room/detail.vue` | 删除面积和类型展示 |
| `src/pages/tenant/check-in.vue` | 删除面积/类型展示、接口定义、数据赋值 |

### 无需修改

- `Mapper.cs` — Mapster 按约定映射，属性删除后自动失效
- `RoomAppService.cs` — 无直接引用 Area/RoomType

## 风险

- 数据库迁移将永久删除这两列的已有数据，不可逆。业务已确认不需要这些数据。
