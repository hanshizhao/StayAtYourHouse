# 续租丢图 Bug 修复 + 续租弹窗合同图回显设计规格

> 日期：2026-07-02
> 分支：feat/renew-enddate-and-room-hard-delete
> 状态：待评审

## 概述

合同图片上传功能（提交 `68df7a4`）上线后，发现续租链路存在一个 Bug：续租弹窗（`RenewRentalDialog.vue`）提供了「上传合同」入口，前端也将 `contractImage` 提交给后端，但后端 `RentalReminderService.RenewAsync` 完全忽略了该字段，导致**续租时上传的合同图被静默丢弃**。

此外，续租弹窗相对入住页缺少图片预览回显（问题 #4），用户上传后看不到效果，也无法确认当前房间是否已有合同图。

本次整改聚焦这两点：

| # | 问题 | 类型 |
|---|------|------|
| 1 | 续租链路丢图：`RenewAsync` 忽略 `input.ContractImage` | 🔴 Bug |
| 4 | 续租弹窗缺少图片预览回显（入住页有） | 🟡 体验 |

不在本次范围内的问题（静态文件鉴权 #2、房间管理页编辑入口 #3、上传限制外置 #5）留作后续。

---

## 方案选型

经评估三个方案：

- **方案 A（采纳）**：最小透传修复。后端在现有 DTO 映射中透传 `Room.ContractImage`，`RenewAsync` 非空时覆盖；前端弹窗用透传字段回显并支持重传。复用已 Include 的 Room 数据，零新接口、零迁移。
- 方案 B：新增专用续租详情接口。职责清晰但属过度设计，数据本已随待办列表返回。
- 方案 C：合同图下沉到 RentalRecord（数据模型重构）。语义最正确但范围远超 Bug 修复，违背聚焦原则。

---

## 第 1 节：后端改动

### 1.1 `TodoItemDto.cs` — 透传合同图字段

在催收房租待办专用字段区（`#region 催收房租待办专用字段`）新增可空字段：

```csharp
/// <summary>
/// 当前合同图片路径（催收房租专用，用于续租弹窗回显）
/// </summary>
public string? ContractImage { get; set; }
```

该 DTO 本就是联合类型（水电/催收/维修各有 nullable 专用字段），新增一个 nullable 字段符合既有风格。

### 1.2 `TodoService.cs` `MapFromRentalReminder` — 映射合同图

在 `return new TodoItemDto { ... }`（约 `TodoService.cs:201-...`）中补一行：

```csharp
ContractImage = room?.ContractImage,
```

`room` 已在方法内取到（`TodoService.cs:196`），且 `GetRentalReminderTodosAsync`（`TodoService.cs:132-147`）已 `.Include(...Room)`，无需改查询。

### 1.3 `RentalReminderService.cs` `RenewAsync` — 修复丢图 Bug

**仓储注入**：`RentalReminderService` 当前只注入了 `RentalReminder`、`RentalDeferral`、`RentalRecord` 三个仓储（`RentalReminderService.cs:16-34`），**未注入 Room 仓储**。需新增：

```csharp
private readonly IRepository<Room> _roomRepository;

// 构造函数追加参数 IRepository<Room> roomRepository 并赋值
```

采用 `IRepository<Room>` + `FindAsync(originalRecord.RoomId)` 取 Room（与 `RentalRecordService.cs:259/303` 风格一致），而非改动现有 reminder 查询的 Include 结构，保持改动局部。

**覆盖逻辑**：在 `RenewAsync` 创建新租赁记录后、更新原记录前（约第 134-140 行之间）插入：

```csharp
// 续租合同图片：非空才覆盖（与入住逻辑一致）
if (!string.IsNullOrEmpty(input.ContractImage))
{
    var room = await _roomRepository.FindAsync(originalRecord.RoomId);
    if (room != null)
    {
        room.ContractImage = input.ContractImage;
        await _roomRepository.UpdateAsync(room);
    }
}
```

判断条件用 `!string.IsNullOrEmpty`，与入住逻辑（`RentalRecordService.cs:186`）保持一致。语义：续租时上传了新合同图 → 覆盖；未上传 → 保留原图。

---

## 第 2 节：前端类型与 API

### 2.1 `todoModel.ts` — `TodoItem` 增加合同图字段

在 `TodoItem` 接口（`Hans/src/api/model/todoModel.ts`）加：

```ts
/** 当前合同图片路径（催收房租待办专用，用于续租弹窗回显） */
contractImage?: string;
```

`RenewRentalInput.contractImage`（`todoModel.ts:159`）已存在，无需改。

### 2.2 API 层

无需改动。续租接口 `renewRental`（`api/todo.ts:69`）已透传整个 `RenewRentalInput`（含 `contractImage`）；待办列表接口返回的 `TodoItem` 会自动带上后端新增的 `contractImage` 字段。

---

## 第 3 节：前端 `RenewRentalDialog` UI 与交互

### 3.1 打开弹窗时初始化合同图回显

在现有 `watch(props.visible)`（`RenewRentalDialog.vue:210-232`）初始化 `formData` 时，用 `props.reminder.contractImage` 作为初始值：

```ts
formData.value = {
  leaseMonths: 1,
  monthlyRent: props.reminder.monthlyRent,
  contractEndDate: '',
  contractImage: props.reminder.contractImage ?? '',  // ← 回显当前合同图
  remark: '',
};
```

### 3.2 预览回显 UI

在 `<t-upload>`（`RenewRentalDialog.vue:66-81`）下方，参考入住页 `check-in.vue:229-233` 的 `contract-image-preview`，增加图片预览，仅当 `formData.contractImage` 非空时显示：

```vue
<img
  v-if="formData.contractImage"
  :src="formData.contractImage"
  class="contract-image-preview"
  alt="合同图片预览"
/>
```

### 3.3 交互流程

- **弹窗打开**：若房间已有合同图 → 预览展示，`formData.contractImage` = 现有 URL。
- **用户重新上传** → `handleUploadSuccess`（`RenewRentalDialog.vue:265-278`）把新 URL 写入 `formData.contractImage`，预览自动更新为新图（已有逻辑，无需改）。
- **用户不上传** → `formData.contractImage` 保持初始值（现有 URL），提交后端；后端「非空才覆盖」逻辑下，`room.ContractImage` 实质不变（写入相同值，无害）。
- **关闭弹窗** → `handleClose`（`RenewRentalDialog.vue:314-318`）已重置 `contractFiles`；`formData` 在下次打开时由 watch 重新初始化，无需额外处理。

### 3.4 样式

在 `RenewRentalDialog.vue` 的 `<style scoped>` 内补一份 `.contract-image-preview` 定义（与入住页 `check-in.vue` 等价：限定尺寸、加边框/圆角）。因入住页该样式是 scoped，无法跨组件复用，需在本组件内重复定义。

---

## 第 4 节：测试与验证

### 4.1 后端单元测试（`RentalReminderServiceTests.cs`）

**连带改动（必做）**：因 `RentalReminderService` 构造函数新增 `_roomRepository`，测试类需补：

```csharp
private readonly Mock<IRepository<Room>> _mockRoomRepo;
// 构造函数内：
_mockRoomRepo = new Mock<IRepository<Room>>();
// _service 实例化补第 4 个参数 _mockRoomRepo.Object
```

**新增测试用例**（跟随既有 `[Fact]` + `// Arrange / Act & Assert` 风格）：

1. `RenewAsync_WithContractImage_UpdatesRoomContractImage` —— `input.ContractImage` 非空时，验证 `_mockRoomRepo` 的 `UpdateAsync` 被调用、Room 的 `ContractImage` 被赋新值。
2. `RenewAsync_WithoutContractImage_DoesNotUpdateRoom` —— `input.ContractImage` 为空时，验证 `UpdateAsync` **未**被调用（保留原图）。

> 现有 `RenewAsync` 成功路径测试受 EF Core 异步 provider 限制（类注释 `RentalReminderServiceTests.cs:22-25` 已说明），可能较难走到 Room 更新分支。若无法完整走通，退而验证「构造函数注入正确、不破坏现有测试」作为最低保障。

### 4.2 后端单元测试（`TodoServiceTests.cs`）

新增 1 个：催收提醒映射后 `TodoItemDto.ContractImage` 等于 Room 的合同图（验证 `MapFromRentalReminder` 透传）。若该方法为 private，则通过公共 `GetTodosAsync` 路径间接验证，或保持与现有同类断言一致的粒度。

### 4.3 前端 E2E（`feat-083-renew-rental-dialog.spec.ts`）

扩展现有续租弹窗测试：

1. 打开弹窗、房间已有合同图时，验证预览 `<img>` 出现且 `src` 正确。
2. （可选，依赖 mock）上传成功后预览 `src` 更新为新 URL。

### 4.4 手动验证清单

- [ ] 入住上传合同图 → 续租弹窗打开应回显该图
- [ ] 续租时重传新图 → 提交后房间合同图更新为新图
- [ ] 续租时不上传 → 提交后房间合同图保持不变
- [ ] 后端单元测试 + 前端 E2E 全绿
- [ ] `dotnet build` 与前端 `lint/type-check` 通过

---

## 涉及文件汇总

| 层 | 文件 | 改动 |
|----|------|------|
| 后端 DTO | `Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs` | 新增 `ContractImage` 字段 |
| 后端 Service | `Gentle/Gentle.Application/Services/TodoService.cs` | `MapFromRentalReminder` 映射合同图 |
| 后端 Service | `Gentle/Gentle.Application/Services/RentalReminderService.cs` | 注入 Room 仓储 + `RenewAsync` 非空覆盖 |
| 后端测试 | `Gentle/Gentle.Tests/Services/RentalReminderServiceTests.cs` | 补 Room 仓储 mock + 2 个新用例 |
| 后端测试 | `Gentle/Gentle.Tests/Services/TodoServiceTests.cs` | 1 个透传断言用例 |
| 前端类型 | `Hans/src/api/model/todoModel.ts` | `TodoItem` 加 `contractImage?` |
| 前端组件 | `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue` | 初始化回显 + 预览 UI + 样式 |
| 前端 E2E | `tests/e2e/feat-083-renew-rental-dialog.spec.ts` | 扩展回显/重传用例 |
