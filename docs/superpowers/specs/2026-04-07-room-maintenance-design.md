# 房间维修管理功能设计

## 概述

为房间添加维修信息管理功能。用户可以从房间管理页或维修管理页添加报修记录，维修记录以待办形式融入 Dashboard 待办面板，完成后可标记完成。同时提供独立的维修管理页面统一查看和管理所有维修记录。

## 需求

1. 在房间管理页表格行内新增"维修"按钮，跳转到报修表单页（房间预选）
2. 新增左侧边栏"维修管理"菜单页，支持添加报修、查看/筛选/编辑/完成/删除维修记录
3. Dashboard 待办面板融入维修类型，点击维修待办弹出详情对话框可直接完成
4. 维修记录包含：描述、报修日期、状态、完成日期、费用、照片、维修人员/联系方式、优先级

## 方案选择

**方案 A：扩展现有待办聚合模式（已选）**

沿用水电费和催收房租的聚合模式，新增 `MaintenanceRecord` 实体作为第三种待办数据源。

理由：当前仅 3 种待办类型，现有聚合模式完全够用，改动最小、风险低。

## 数据模型

### 实体 `MaintenanceRecord`

```
[Table("maintenance_record")]
MaintenanceRecord : Entity<int>
├── RoomId            int              关联房间（必填），[Index]
├── Room              Room             导航属性
├── Description       string           维修描述（必填），[Required, MaxLength(500)]
├── Priority          enum             优先级：Urgent=0, Normal=1, Low=2
├── Status            enum             状态：Pending=0, InProgress=1, Completed=2
├── ReportDate        DateTime         报修日期，[Column(TypeName = "date")]
├── CompletedDate     DateTime?        完成日期（可空）
├── Cost              decimal?         维修费用（可空），[Range(0, double.MaxValue), Column(TypeName = "decimal(10,2)")]
├── RepairPerson      string?          维修人员姓名（可空），[MaxLength(50)]
├── RepairPhone       string?          维修人员电话（可空），[MaxLength(20)]
├── Images            string?          照片路径 JSON 数组（可空）
├── Remark            string?          备注（可空），[MaxLength(500)]
```

### 新增枚举

- `MaintenancePriority`: `Urgent=0`, `Normal=1`, `Low=2`
- `MaintenanceStatus`: `Pending=0`, `InProgress=1`, `Completed=2`

### 现有枚举变更

- `TodoType` 新增 `Maintenance=2`

### 现有实体变更

- `Room` 新增导航属性 `ICollection<MaintenanceRecord> MaintenanceRecords`

## 后端 API 设计

### 新增 `MaintenanceAppService`（路由 `api/maintenance`）

| 方法   | 路由            | 功能                                  |
|--------|-----------------|---------------------------------------|
| GET    | `/list`         | 分页查询（按 status/roomId/priority 筛选） |
| GET    | `/{id}`         | 获取单条维修记录详情                    |
| POST   | `/add`          | 新增维修记录                           |
| PUT    | `/edit`         | 编辑维修记录                           |
| POST   | `/{id}/complete`| 标记完成（设 CompletedDate、Status=Completed） |
| DELETE | `/remove/{id}`  | 删除维修记录                           |

### 新增 DTO

- `MaintenanceAddInput`: RoomId, Description, Priority, ReportDate, Cost?, RepairPerson?, RepairPhone?, Images?, Remark?
- `MaintenanceUpdateInput`: Id, Description, Priority, ReportDate, Cost?, RepairPerson?, RepairPhone?, Images?, Remark?
- `MaintenanceListFilter`: Status?, RoomId?, Priority?, Page, PageSize
- `MaintenanceDetailDto`: 全部字段 + StatusText（状态文本）+ PriorityText（优先级文本）+ RoomInfo（格式：`"{CommunityName} {Building}栋 {RoomNumber}号"`）+ CreatedTime

### 图片上传（一期范围）

一期 Images 字段仅支持手动输入图片路径（JSON 数组格式），不实现文件上传 API。后续迭代中再添加图片上传功能。

### 待办系统改动

- `TodoType` 枚举新增 `Maintenance=2`
- `TodoAppService.GetList` 的 type 参数验证扩展，新增 `"maintenance"` 合法值
- `TodoService.GetTodoListAsync` 的 type 参数验证扩展，新增 `"maintenance"` 合法值
- `TodoService.GetTodoListAsync` 新增第三种数据源：查询 `Status != Completed` 的 MaintenanceRecord
- 新增私有方法 `MapFromMaintenanceRecord` 映射为 `TodoItemDto`
- `TodoItemDto` 新增维修相关字段：`RoomName`, `Priority`, `MaintenanceCost`
- `TodoItemDto.CreatedTime` 从三元表达式改为 switch 表达式，覆盖 Utility/Rental/Maintenance 三种类型
- `TodoListResult` 新增 `MaintenanceCount`

## 前端设计

### 新增路由模块 `maintenance`

左侧边栏新增"维修管理"菜单（图标：tools/wrench）：

| 路径                  | 页面         | 说明                                                   |
|-----------------------|-------------|--------------------------------------------------------|
| `/maintenance/list`   | 维修记录列表 | 表格展示，支持筛选（状态/优先级/房间/日期），操作列：查看/编辑/完成/删除 |
| `/maintenance/add`    | 新增报修页   | 独立表单页，房间通过下拉选择                             |
| `/maintenance/edit/:id` | 编辑报修页 | 复用 add.vue 组件，通过路由参数 `id` 判断是新增还是编辑模式 |

### 房间管理页改动

`/housing/room` 表格操作列新增"维修"按钮，点击跳转到 `/maintenance/add?roomId=xxx`，表单中房间自动选中且不可更改。

### 维修管理列表页功能

- **筛选栏**：状态（全部/待处理/进行中/已完成）、优先级（全部/紧急/一般/低）、日期范围
- **表格列**：房间号、小区、维修描述、优先级（标签颜色）、状态（标签颜色）、费用、报修日期、操作
- **优先级标签颜色**：紧急=红色、一般=橙色、低=灰色
- **状态标签颜色**：待处理=蓝色、进行中=橙色、已完成=绿色
- **操作按钮**：查看详情、编辑（未完成时）、标记完成（未完成时）、删除
- **标记完成**：弹出确认对话框，可选填实际费用和完成备注

### Dashboard 待办面板改动

- 筛选下拉新增"维修"选项
- 维修待办项显示：房间名 + 维修描述 + 优先级标签
- 统计卡片新增维修待办数量
- 维修待办视觉样式：使用 `--maintenance` CSS 主题，图标选择 wrench/tool，Pending 和 InProgress 状态均展示（不区分）
- 点击维修待办项 → 弹出 `MaintenanceDetailDialog` 对话框：
  - 展示：房间信息、维修描述、优先级、报修日期、费用、维修人员、照片
  - 底部按钮："标记完成"（弹出二次确认）+ "前往维修管理"（跳转列表页）
  - 完成后刷新待办列表

## 文件变更清单

### 后端新增

| 文件 | 说明 |
|------|------|
| `Gentle/Gentle.Core/Entities/MaintenanceRecord.cs` | 维修记录实体 |
| `Gentle/Gentle.Core/Enums/MaintenancePriority.cs` | 优先级枚举 |
| `Gentle/Gentle.Core/Enums/MaintenanceStatus.cs` | 状态枚举 |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceAddInput.cs` | 新增 DTO |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceUpdateInput.cs` | 更新 DTO |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceListFilter.cs` | 列表筛选 DTO |
| `Gentle/Gentle.Application/Dtos/Maintenance/MaintenanceDetailDto.cs` | 详情 DTO |
| `Gentle/Gentle.Application/Services/IMaintenanceService.cs` | 服务接口 |
| `Gentle/Gentle.Application/Services/MaintenanceService.cs` | 服务实现 |
| `Gentle/Gentle.Application/Apps/MaintenanceAppService.cs` | API 控制器 |

### 后端修改

| 文件 | 说明 |
|------|------|
| `Gentle/Gentle.Core/Entities/Room.cs` | 新增 MaintenanceRecords 导航属性 |
| `Gentle/Gentle.Core/Enums/TodoType.cs` | 新增 Maintenance=2 |
| `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs` | 新增维修字段 |
| `Gentle/Gentle.Application/Dtos/Todo/TodoListResult.cs` | 新增 MaintenanceCount |
| `Gentle/Gentle.Application/Services/TodoService.cs` | 新增维修数据源 |
| `Gentle/Gentle.Application/Mapper.cs` | 新增 MaintenanceRecord 映射 |

### 前端新增

| 文件 | 说明 |
|------|------|
| `Hans/src/api/maintenance.ts` | 维修 API 服务 |
| `Hans/src/api/model/maintenanceModel.ts` | 维修类型定义 |
| `Hans/src/pages/maintenance/list.vue` | 维修记录列表页 |
| `Hans/src/pages/maintenance/add.vue` | 新增报修页 |
| ~~`Hans/src/pages/maintenance/edit.vue`~~ | ~~编辑报修页（不创建独立文件，路由直接指向 add.vue，通过路径参数 `id` 判断新增/编辑模式）~~ |
| `Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue` | 维修详情对话框 |
| `Hans/src/router/modules/maintenance.ts` | 维修路由模块 |

### 前端修改

| 文件 | 说明 |
|------|------|
| `Hans/src/pages/housing/room/index.vue` | 行内新增"维修"按钮 |
| `Hans/src/pages/dashboard/base/components/TodoPanel.vue` | 集成维修待办类型、样式、图标 |
| `Hans/src/api/model/todoModel.ts` | TodoType 新增 Maintenance=2 |
| `Hans/src/api/todo.ts` | `todoTypeToString` 函数扩展支持 Maintenance |

## 数据库迁移

新增 `MaintenanceRecord` 实体后需执行 EF Core 迁移：

```bash
dotnet ef migrations add AddMaintenanceRecord --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
dotnet ef database update --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```
