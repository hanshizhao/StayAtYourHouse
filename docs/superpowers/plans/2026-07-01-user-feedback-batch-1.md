# 用户反馈整改批次一 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复房东用户反馈的 9 条问题（第 2 条暂缓），覆盖续租算期、待办逾期显示、安居码登记人员、房间回收、自然排序、抄表固定费用、空置自愈、合同上传、报修房间显示。

**Architecture:** Vue3 前端 (Hans/) + .NET10/Furion 后端 (Gentle/)。前端无单测框架（靠 `build:type` 类型检查 + Playwright E2E），后端用 xUnit + Moq + EF InMemory。改动跨前后端，按"批次 A 纯前端/小后端 → 批次 B 后端含迁移 → 批次 C 独立上传功能"推进。

**Tech Stack:** Vue3 + TDesign + Pinia(dayjs)；.NET10 + Furion + EF Core + Mapster；xUnit/Moq；Playwright。

## Global Constraints

- 后端必须遵循 Furion 规范：实体继承 `Entity<int>`、API 用 `IDynamicApiController`（放 `Apps/`）、服务用 `ITransient`、异常用 `throw Oops.Oh(...)`、仓储用 `IRepository<T>` 构造注入。
- EF Core 迁移命令必须带 `--startup-project Gentle.Web.Entry`：`dotnet ef migrations add <Name> --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`。
- 前端 Vue SFC 块顺序 `<template>` → `<script>` → `<style scoped>`；ESLint 用 `@antfu/eslint-config`（强制 import 排序）。
- API 响应格式 `{ code: 0, data: T }`。
- 后端测试运行：`dotnet test`（在 `Gentle/` 下）。
- 前端类型检查：`cd Hans && npm run build:type`（不输出文件，仅 vue-tsc）。
- 前端 E2E：`cd tests && npx playwright test e2e/<file>`（必须从 `tests/` 运行）。
- token 持久化在 `localStorage` 的 `user` 键下（pinia-plugin-persistedstate，paths:['token']），运行时通过 `useUserStore().token` 取。

## 测试策略说明（重要）

- **后端**：可单测的纯逻辑（排序提取数字、费用计算公式、状态自愈判定）用 xUnit 写单元测试。涉及 EF 异步查询 / Furion `Oops.Oh` 的方法，沿用现有测试类的做法（Moq repository，测参数校验与边界；`Oops.Oh` 在测试环境会抛框架异常，测"异常分支被触发"即可）。
- **前端**：无单测框架，验证手段 = `npm run build:type`（类型）+ `npm run lint`（风格）+ 手动/E2E。涉及交互联动的（续租算期、上传 token、报修房间显示）补充 E2E 或手动验证步骤。
- **数据库迁移类任务**：生成迁移后 `dotnet ef migrations list` 确认存在；不在此环境连真实库。

---

## 批次 A：纯前端 / 极小后端改动（低风险）

### Task 1: 第 6 条 — 房间列表自然数排序（后端）

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:96-100`（排序）、新增私有方法
- Test: `Gentle/Gentle.Tests/Services/RoomSortTests.cs`（新建）

**Interfaces:**
- Produces: `private static int RoomService.ExtractLeadingNumber(string? s)` — 供本类排序使用。

- [ ] **Step 1: 写失败测试**

新建 `Gentle/Gentle.Tests/Services/RoomSortTests.cs`：

```csharp
using System.Reflection;
using Gentle.Application.Services;
using Xunit;

namespace Gentle.Tests.Services;

public class RoomSortTests
{
    // 通过反射调用私有静态方法 ExtractLeadingNumber
    private static int InvokeExtract(string? s)
    {
        var method = typeof(RoomService)
            .GetMethod("ExtractLeadingNumber", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);
        return (int)method!.Invoke(null, new object?[] { s })!;
    }

    [Theory]
    [InlineData("10栋", 10)]
    [InlineData("2栋", 2)]
    [InlineData("204", 204)]
    [InlineData("1", 1)]
    public void ExtractLeadingNumber_ParsesLeadingDigits(string input, int expected)
    {
        Assert.Equal(expected, InvokeExtract(input));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ExtractLeadingNumber_NullOrEmpty_ReturnsMaxValue(string? input)
    {
        Assert.Equal(int.MaxValue, InvokeExtract(input));
    }

    [InlineData("东栋")]      // 非数字开头
    public void ExtractLeadingNumber_NonDigitStart_ReturnsMaxValue(string input)
    {
        Assert.Equal(int.MaxValue, InvokeExtract(input));
    }

    [Fact]
    public void ExtractLeadingNumber_NaturalOrder()
    {
        // 模拟排序：1,2,10,11 应升序，而非字典序 1,10,11,2
        var buildings = new[] { "10栋", "2栋", "11栋", "1栋" };
        var sorted = buildings.OrderBy(InvokeExtract).Select(x => x).ToArray();
        Assert.Equal(new[] { "1栋", "2栋", "10栋", "11栋" }, sorted);
    }
}
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~RoomSortTests"
```
Expected: 编译失败（`ExtractLeadingNumber` 不存在）。

- [ ] **Step 3: 实现 ExtractLeadingNumber 并改排序**

在 `RoomService.cs` 第 100 行（原 `.ThenBy(r => r.RoomNumber)` 那段排序之后），先修改排序代码块（行 96-100）：

```csharp
var sorted = dtoList
    .OrderBy(r => r.CommunityName)
    .ThenBy(r => ExtractLeadingNumber(r.Building))
    .ThenBy(r => ExtractLeadingNumber(r.RoomNumber))
    .ToList();
```

在类内新增私有方法（放在类底部其他 private 方法旁）：

```csharp
/// <summary>
/// 提取字符串开头的数字，用于栋号/房号的自然数排序。
/// 纯数字开头（如 "10栋""204"）返回数值；空或非数字开头返回 int.MaxValue 排到末尾。
/// </summary>
private static int ExtractLeadingNumber(string? s)
{
    if (string.IsNullOrEmpty(s)) return int.MaxValue;
    var digits = new string(s.TakeWhile(char.IsDigit).ToArray());
    return int.TryParse(digits, out var n) ? n : int.MaxValue;
    }
```

> 注：`TakeWhile`/`IsDigit`/`TryParse` 需要 `System.Linq` 与 `using static`，文件顶部应已有 `using System.Linq;`（确认之）。

- [ ] **Step 4: 运行测试，确认通过**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~RoomSortTests"
```
Expected: 5 个测试全 PASS。

- [ ] **Step 5: 提交**

```bash
git add Gentle/Gentle.Application/Services/RoomService.cs Gentle/Gentle.Tests/Services/RoomSortTests.cs
git commit -m "fix: 房间列表按栋号/房号自然数排序（修复 10栋 排在 2栋 前）"
```

---

### Task 2: 第 10 条 — 编辑报修房间显示数字"1"（前端）

**Files:**
- Modify: `Hans/src/pages/maintenance/add.vue`（loadMaintenanceDetail、模板房间渲染）

**Interfaces:**
- Consumes: 后端报修详情已返回 `detail.roomInfo`（"{小区} {栋}栋 {房号}号"），前端当前未使用。

- [ ] **Step 1: 读现状确认行号**

读 `Hans/src/pages/maintenance/add.vue`，定位：
- `loadMaintenanceDetail`（约 316-342 行）：只用了 `detail.roomId`，丢弃 `detail.roomInfo`。
- 模板里 `<t-select>` 房间字段（约 37-52 行），`:disabled="isEdit"`。
- `formData.roomId` 定义。

- [ ] **Step 2: 新增 currentRoomInfo 响应式变量**

在 `<script setup>` 顶部 ref 定义区（靠近其它 ref 处）加：

```typescript
// 编辑模式下，后端返回的房间地址（避免依赖房间下拉的 100 条选项匹配）
const currentRoomInfo = ref('');
```

- [ ] **Step 3: loadMaintenanceDetail 保存 roomInfo**

在 `loadMaintenanceDetail`（约 316-342 行）中，赋值 `formData.value.roomId = detail.roomId` 的下一行加：

```typescript
currentRoomInfo.value = detail.roomInfo || '';
```

- [ ] **Step 4: 模板房间字段，编辑模式直接显示地址**

把房间 `<t-form-item>`（约 36-52 行）改为：编辑模式显示只读文本（房间本就 disabled 不可改），新增/非编辑模式仍用 t-select：

```vue
<t-form-item label="房间" name="roomId">
  <!-- 编辑模式：房间锁定，直接展示后端返回的地址，避免下拉选项不全时显示 roomId 数字 -->
  <div v-if="isEdit" class="room-readonly-info">
    {{ currentRoomInfo || '未知房间' }}
  </div>
  <!-- 新增模式：下拉选择 -->
  <t-select
    v-else
    v-model="formData.roomId"
    placeholder="请选择房间"
    filterable
    :loading="roomLoading"
    data-testid="room-select"
  >
    <t-option v-for="room in roomOptions" :key="room.id" :value="room.id" :label="room.fullInfo" />
  </t-select>
</t-form-item>
```

（移除原 t-select 上的 `:disabled="isEdit"`，因为编辑模式已走 v-if 分支不渲染 t-select。）

- [ ] **Step 5: 加只读样式（可选）**

在 `<style scoped>` 末尾加：

```css
.room-readonly-info {
  padding: 6px 0;
  font-size: 14px;
  color: var(--td-text-color-primary);
}
```

- [ ] **Step 6: 类型检查 + lint**

```bash
cd Hans
npm run build:type
npm run lint
```
Expected: 无错误。

- [ ] **Step 7: 提交**

```bash
git add Hans/src/pages/maintenance/add.vue
git commit -m "fix: 编辑报修时房间字段显示数字，改用后端返回的 roomInfo"
```

---

### Task 3: 第 1 条 — 续租月数自动算到期日（前端）

**Files:**
- Modify: `Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`

**Interfaces:**
- Consumes: `calculateContractEndDate(checkInDate, leaseMonths)` from `@/utils/date`；原合同到期日来自 `props.reminder.rentalReminder.contractEndDate`。

- [ ] **Step 1: 确认 calculateContractEndDate 签名**

读 `Hans/src/utils/date.ts:45-54` 确认：
```typescript
export function calculateContractEndDate(checkInDate, leaseMonths): string | null
// = dayjs(checkInDate).add(leaseMonths, 'month').subtract(1, 'day').format('YYYY-MM-DD')
```
返回 `string | null`（输入空则 null）。

- [ ] **Step 2: 引入工具函数**

在 `RenewRentalDialog.vue` 的 `<script setup>` import 区，加（注意 `@antfu/eslint-config` import 排序，按字母序插入）：

```typescript
import { calculateContractEndDate } from '@/utils/date';
```

- [ ] **Step 3: 加 watch 监听 leaseMonths 自动算到期日**

在 `RenewRentalDialog.vue` 已有的 watch（约 189-203 行监听 props.visible 的）之后，新增一个 watch：

```typescript
// 监听租期月数变化，自动计算合同到期日 = 原合同到期日 + 月数 − 1 天
// 用户仍可在日期选择器手动覆盖
watch(
  () => formData.value.leaseMonths,
  (months) => {
    if (!props.reminder) return;
    const originalEndDate = props.reminder.rentalReminder?.contractEndDate;
    if (!originalEndDate || !months) return;
    const calculated = calculateContractEndDate(originalEndDate, months);
    if (calculated) {
      formData.value.contractEndDate = calculated;
    }
  },
);
```

> 关键：起始日用 `props.reminder.rentalReminder.contractEndDate`（原合同到期日），与后端续租逻辑 `CheckInDate = 原到期日` 一致。

- [ ] **Step 4: 弹窗打开时也立即算一次（默认月数=1）**

修改原 watch（约 189-203 行监听 `props.visible` 的），在 watch 初始化 formData 后，立即调用一次计算逻辑，使弹窗一打开到期日就有默认值。把该 watch 改为：

```typescript
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.reminder) {
      formData.value = {
        leaseMonths: 1,
        monthlyRent: props.reminder.monthlyRent,
        contractEndDate: '',
        contractImage: '',
        remark: '',
      };
      contractFiles.value = [];
      // 立即按默认月数 1 算出到期日（原到期日 + 1 月 − 1 天）
      const originalEndDate = props.reminder.rentalReminder?.contractEndDate;
      if (originalEndDate) {
        const calculated = calculateContractEndDate(originalEndDate, 1);
        if (calculated) {
          formData.value.contractEndDate = calculated;
        }
      }
    }
  },
);
```

- [ ] **Step 5: 类型检查 + lint**

```bash
cd Hans
npm run build:type
npm run lint
```
Expected: 无错误。

- [ ] **Step 6: 手动验证 / E2E**

打开续租弹窗：
- 到期日应自动填为「原到期日 + 1 月 − 1 天」。
- 月数改为 2，到期日应跳到「原到期日 + 2 月 − 1 天」。
- 手动改到期日后改月数，到期日按新月数重算（符合预期，因 watch 会在月数变化时覆盖；若想保留手改值不被覆盖，记录一个 `userOverrodeEndDate` 标志，见下文可选优化）。

**可选优化（保留手改值）**：若希望用户手动改到期日后、再改月数时不覆盖手改值，加一个标志：

```typescript
const userOverrodeEndDate = ref(false);
// t-date-picker 的 @change 设 userOverrodeEndDate.value = true
// watch leaseMonths 里判断 if (userOverrodeEndDate.value) return;
```
是否做此优化由实现者判断，默认行为（月数变化即重算）已满足"月数变到期日跟着跳"的核心诉求。

- [ ] **Step 7: 提交**

```bash
git add Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue
git commit -m "feat: 续租弹窗按月数自动计算合同到期日（复用 calculateContractEndDate）"
```

---

### Task 4: 第 3 条 — 待办面板显示合同到期日与逾期天数（前端）

**Files:**
- Modify: `Hans/src/utils/date.ts`（加 `getDaysUntil` 工具）
- Modify: `Hans/src/pages/dashboard/base/components/TodoPanel.vue`

**Interfaces:**
- Produces: `getDaysUntil(date: string): number` — 今天（按日）减目标日期的天数；负数=未到期（剩N天），正数=已逾期，0=今天到期。
- Consumes: `TodoItem.contractEndDate`（催收房租类，后端已返回）。

- [ ] **Step 1: 在 date.ts 加 getDaysUntil**

在 `Hans/src/utils/date.ts` 末尾加：

```typescript
/**
 * 计算今天（按自然日，忽略时分秒）距离目标日期的天数。
 * 返回值：负数 = 未到期（剩 |n| 天）；0 = 今天到期；正数 = 已逾期 n 天。
 */
export function getDaysUntil(date: string | Date | undefined | null): number | null {
  if (!date) return null;
  const today = dayjs().startOf('day');
  const target = dayjs(date).startOf('day');
  if (!target.isValid()) return null;
  return target.diff(today, 'day');
}
```
（确认文件已 `import dayjs from 'dayjs'`。）

- [ ] **Step 2: 读 TodoPanel.vue 催收房租分支定位**

读 `Hans/src/pages/dashboard/base/components/TodoPanel.vue:32-66`（卡片渲染）和 import 区，确认催收房租（type=rental）分支的模板位置（约 50-60 行）。

- [ ] **Step 3: TodoPanel 引入 getDaysUntil + 加计算属性**

在 `<script setup>` import 区加：
```typescript
import { getDaysUntil } from '@/utils/date';
```

在 script 中加一个辅助函数（渲染时调用）：
```typescript
/** 返回催收房租待办的到期文案与主题色 */
function getExpiryInfo(contractEndDate?: string): { text: string; danger: boolean } | null {
  const days = getDaysUntil(contractEndDate);
  if (days === null) return null;
  if (days < 0) return { text: `剩 ${-days} 天到期`, danger: false };
  if (days === 0) return { text: '今天到期', danger: true };
  return { text: `已逾期 ${days} 天`, danger: true };
}
```

- [ ] **Step 4: 催收房租卡片模板加到期行**

在催收房租分支（约 50-60 行，"租客名 · 月租金"那行下方），加：
```vue
<template v-if="item.type === 'rental'">
  <!-- 原有：租客名 · 月租金 -->
  <div class="todo-card-desc">{{ item.tenantName }} · ¥{{ item.monthlyRent }}/月</div>
  <!-- 新增：合同到期日 + 逾期/剩余天数 -->
  <div v-if="item.contractEndDate" class="todo-card-expiry">
    合同到期 {{ item.contractEndDate }}
    <span
      v-for="info in [getExpiryInfo(item.contractEndDate)]"
      :key="info ? info.text : ''"
      v-show="info"
      :class="['todo-expiry-tag', info && info.danger ? 'is-danger' : '']"
      style="margin-left: 6px;"
    >· {{ info ? info.text : '' }}</span>
  </div>
</template>
```
（若原有结构不同，按实际结构调整，核心是催收房租卡片里加一行显示 `item.contractEndDate` + 逾期文案。水电费/维修分支不动。）

- [ ] **Step 5: 加逾期红色样式**

`<style scoped>` 加：
```css
.todo-expiry-tag.is-danger {
  color: var(--td-error-color);
  font-weight: 500;
}
.todo-card-expiry {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 2px;
}
```

- [ ] **Step 6: 类型检查 + lint**

```bash
cd Hans
npm run build:type
npm run lint
```
Expected: 无错误。注意 `TodoItem` 类型需有 `contractEndDate` 字段（查 `Hans/src/api/model/todoModel.ts`，催收房租类已有）。

- [ ] **Step 7: 提交**

```bash
git add Hans/src/utils/date.ts Hans/src/pages/dashboard/base/components/TodoPanel.vue
git commit -m "feat: 待办面板催收房租卡片显示合同到期日与逾期天数"
```

---

## 批次 B：后端为主（含 EF 迁移）

### Task 5: 第 5 条 — 已退租房间转「回收」状态（后端+前端）

**Files:**
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:248-272`（DeleteAsync）
- Modify: `Hans/src/pages/housing/room/index.vue`（删除按钮文案/确认/提示）
- Test: `Gentle/Gentle.Tests/Services/RoomDeleteTests.cs`（新建）

**Interfaces:**
- Consumes: `RoomStatus.Reclaimed`（已存在）、`RentalStatus.Active`。
- 行为变更：`DeleteAsync(id)` 不再物理删除；无 Active 租约时置 `Status = Reclaimed`。

- [ ] **Step 1: 写失败测试（参数校验）**

新建 `Gentle/Gentle.Tests/Services/RoomDeleteTests.cs`。由于 DeleteAsync 内部用 `FindAsync`/`AnyAsync`（EF 异步），Moq 这些较繁，沿用现有测试类风格：测"房间不存在"分支与构造是否正常。完整可单测的纯逻辑（状态判定）抽到私有静态方法后再测（见 Step 3）。

先写一个针对"是否允许回收"判定的测试（把判定逻辑抽成可测方法）：

```csharp
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Xunit;

namespace Gentle.Tests.Services;

public class RoomDeleteTests
{
    [Theory]
    [InlineData(RoomStatus.Vacant, false, true)]      // 空置 + 无活跃租约 → 可回收
    [InlineData(RoomStatus.Renovating, false, true)]  // 装修中 + 无活跃租约 → 可回收
    [InlineData(RoomStatus.Reclaimed, false, true)]   // 已回收 + 无活跃租约 → 幂等回收
    [InlineData(RoomStatus.Rented, false, false)]     // 已出租 → 不可回收（应先退租）
    [InlineData(RoomStatus.Vacant, true, false)]      // 空置但有活跃租约 → 不可回收
    public void CanReclaim_Decision(RoomStatus status, bool hasActiveRental, bool expected)
    {
        Assert.Equal(expected, RoomService.CanReclaim(status, hasActiveRental));
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~RoomDeleteTests"
```
Expected: 编译失败（`CanReclaim` 不存在）。

- [ ] **Step 3: 抽出 CanReclaim 静态方法**

在 `RoomService.cs` 加一个 `internal static` 方法（便于测试）：

```csharp
/// <summary>
/// 判断房间是否可回收（转 Reclaimed 状态）。
/// 已出租（Rented）必须先退租；有活跃租约的也不可回收。
/// </summary>
internal static bool CanReclaim(RoomStatus status, bool hasActiveRental)
{
    if (status == RoomStatus.Rented) return false;
    if (hasActiveRental) return false;
    return true;
}
```
（测试项目需能访问 internal：在 `Gentle.Application` 的 csproj 已有 `InternalsVisibleTo`？若无，则在 `Gentle.Application.csproj` 加 `<InternalsVisibleTo Include="Gentle.Tests" />`。先检查，缺则补。）

- [ ] **Step 4: 运行测试确认通过**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~RoomDeleteTests"
```
Expected: PASS。

- [ ] **Step 5: 改造 DeleteAsync 为「回收」语义**

修改 `RoomService.cs:248-272` 的 `DeleteAsync`：

```csharp
public async Task DeleteAsync(int id)
{
    var room = await _repository.FindAsync(id);
    if (room == null)
    {
        throw Oops.Oh($"房间 {id} 不存在");
    }

    // 是否有活跃租约（在租中）——历史已退租记录不再阻止回收
    var hasActiveRental = await _rentalRecordRepository.AsQueryable(false)
        .AnyAsync(r => r.RoomId == id && r.Status == RentalStatus.Active);

    if (!CanReclaim(room.Status, hasActiveRental))
    {
        // 已出租或有活跃租约
        if (room.Status == RoomStatus.Rented || hasActiveRental)
        {
            throw Oops.Oh("房间有在租租客，请先办理退租后再回收");
        }
    }

    // 回收：转为 Reclaimed 状态（不物理删除），历史租赁记录保留可追溯
    room.Status = RoomStatus.Reclaimed;
    await _repository.UpdateAsync(room);
    await _repository.SaveNowAsync();
}
```

> 说明：方法名保留 `DeleteAsync`（避免改接口/路由），但语义改为回收。前端按钮文案会改（见 Step 6）。

- [ ] **Step 6: 前端按钮文案与确认提示**

读 `Hans/src/pages/housing/room/index.vue` 的 `handleDelete`（约 1058-1083 行）和删除按钮（139-151 行）。

- 把「删除房间」tooltip（139 行）改为「回收房间」。
- 把 `handleDelete` 的确认弹窗文案改为：「确定回收此房间？回收后将从列表隐藏，历史记录保留，可在编辑中恢复为空置。」
- 成功提示从「删除成功」改为「房间已回收」。

具体改动按现有 `handleDelete`/`onConfirmDelete` 结构调整（用 `DialogPlugin.confirm`）。

- [ ] **Step 7: 类型检查 + 提交**

```bash
cd Hans && npm run build:type
```
```bash
git add Gentle/Gentle.Application/Services/RoomService.cs Gentle/Gentle.Tests/Services/RoomDeleteTests.cs Gentle/Gentle.Application/Gentle.Application.csproj Hans/src/pages/housing/room/index.vue
git commit -m "fix: 已退租房间改为转回收状态，不再被历史记录阻止（保留账目可追溯）"
```

---

### Task 6: 第 8 条 — 空置房源状态自愈（后端）

**Files:**
- Modify: `Gentle/Gentle.Application/Services/ReportService.cs:131-207`

**Interfaces:**
- Consumes: `IRepository<Room>`（确认 ReportService 是否已注入；若无则加注入）、`RentalStatus.Active`。
- 行为：GetHousingOverviewAsync 统计前，扫描 Status=Vacant 但有 Active 租约的房间，自动修正为 Rented。

- [ ] **Step 1: 读 ReportService 构造与统计段**

读 `ReportService.cs:131-207`（GetHousingOverviewAsync）及构造函数，确认：
- 是否已注入 `IRepository<Room>`（若只注入了只读的 `IRepository<RentalRecord>` 等，需加 `IRepository<Room>` 以便 UpdateAsync/SaveNowAsync）。
- 行 142-145 `activeRentals` 已查；173-174 空置判定。

- [ ] **Step 2: 抽取自愈逻辑为可测方法**

在 `ReportService.cs` 加一个 internal static 纯判定方法（便于单测）：

```csharp
/// <summary>
/// 判断一个"标记为空置"的房间是否实际已入住（存在活跃租约）。
/// </summary>
internal static bool IsVacantRoomActuallyRented(RoomStatus status, bool hasActiveRental)
{
    return status == RoomStatus.Vacant && hasActiveRental;
}
```

- [ ] **Step 3: 写单测**

新建 `Gentle/Gentle.Tests/Services/ReportStatusSelfHealTests.cs`：

```csharp
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Xunit;

namespace Gentle.Tests.Services;

public class ReportStatusSelfHealTests
{
    [Theory]
    [InlineData(RoomStatus.Vacant, true, true)]    // 标记空置但有活跃租约 → 应修正
    [InlineData(RoomStatus.Vacant, false, false)]  // 标记空置且无租约 → 正常空置
    [InlineData(RoomStatus.Rented, true, false)]   // 已出租 → 无需修正
    [InlineData(RoomStatus.Rented, false, false)]
    public void IsVacantRoomActuallyRented(RoomStatus status, bool hasActiveRental, bool expected)
    {
        Assert.Equal(expected, ReportService.IsVacantRoomActuallyRented(status, hasActiveRental));
    }
}
```

- [ ] **Step 4: 运行测试**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~ReportStatusSelfHealTests"
```
Expected: PASS。

- [ ] **Step 5: 在 GetHousingOverviewAsync 加入自愈**

确保构造函数注入 `IRepository<Room>`（若缺，加字段+参数；注意 ReportService 被 Furion DI 调用，加参数即可）。在统计开始处（约 134 行 `var rooms = ...` 之后、统计之前）加自愈扫描：

```csharp
// ===== 状态自愈：修正 Status=Vacant 但实际有活跃租约的房间 =====
var roomIds = rooms.Select(r => r.Id).ToList();
var activeRentalRoomIds = await _rentalRecordRepository.AsQueryable(false)
    .Where(r => r.Status == RentalStatus.Active && roomIds.Contains(r.RoomId))
    .Select(r => r.RoomId)
    .Distinct()
    .ToListAsync();

var staleRooms = rooms.Where(r => r.Status == RoomStatus.Vacant && activeRentalRoomIds.Contains(r.Id)).ToList();
foreach (var stale in staleRooms)
{
    stale.Status = RoomStatus.Rented;
    await _roomRepository.UpdateAsync(stale);
}
if (staleRooms.Count > 0)
{
    await _roomRepository.SaveNowAsync();
    // 更新内存中 rooms 集合的状态，使后续统计基于修正后的值
    // （stale 已是 rooms 中的引用，Status 已改，无需重新赋值）
}
```

> 注意：原 `rooms` 若是 `AsNoTracking` 查询，则 UpdateAsync 需要实体可追踪。若 ReportService 现有查询用了 `AsQueryable(false)`（不追踪），则自愈需重新 `_roomRepository.FindAsync(id)` 再改。实现时确认查询是否追踪；若不追踪，改为：`var tracked = await _roomRepository.FindAsync(stale.Id); tracked.Status = RoomStatus.Rented;` 再 UpdateAsync。**实现者必须在此确认追踪性**。

- [ ] **Step 6: 后端整体测试**

```bash
cd Gentle
dotnet test
```
Expected: 全 PASS（含原有 TodoServiceTests 等）。

- [ ] **Step 7: 提交**

```bash
git add Gentle/Gentle.Application/Services/ReportService.cs Gentle/Gentle.Tests/Services/ReportStatusSelfHealTests.cs
git commit -m "fix: 空置房源统计自愈——修正已入住却标记为空置的房间状态"
```

---

### Task 7: 第 4 条 — 安居码登记人员字段（后端含迁移 + 前端）

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/RentalRecord.cs`（加字段）
- Create: EF 迁移
- Modify: `Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs`、`CheckInInput.cs`
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs`（ConfirmAnJuCodeAsync、CheckInAsync）
- Modify: 前端 `Hans/src/api/model/rentalModel.ts`、`check-in.vue`、`housing/rental/index.vue`

**Interfaces:**
- Produces: `RentalRecord.AnJuCodeRegisteredNames : string?`（多行文本，登记人员名单）。
- API：`POST /api/rental/confirm-anju-code/{id}` 增加可选 body `{ anJuCodeRegisteredNames }`；或保持 confirm 接口不变，names 随 CheckIn 写入。**为减少改动，names 通过 CheckIn 时写入，并在 confirm 接口支持可选更新。**

- [ ] **Step 1: 实体加字段**

在 `Gentle/Gentle.Core/Entities/RentalRecord.cs` 的 `IsAnJuCodeSubmitted`（144 行）下方加：

```csharp
/// <summary>
/// 安居码登记人员名单（多人，自由文本，如"张三、李四"）
/// </summary>
public string? AnJuCodeRegisteredNames { get; set; }
```

- [ ] **Step 2: 生成迁移**

```bash
cd Gentle
dotnet ef migrations add AddAnJuCodeRegisteredNames --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```
确认生成的迁移文件含 `AddColumn<string>("AnJuCodeRegisteredNames", ...)`。

- [ ] **Step 3: DTO 加字段**

`RentalRecordDto.cs` 的 `IsAnJuCodeSubmitted`（117-120 行）下方加：
```csharp
/// <summary>
/// 安居码登记人员名单
/// </summary>
public string? AnJuCodeRegisteredNames { get; set; }
```

`CheckInInput.cs` 末尾加：
```csharp
/// <summary>
/// 安居码登记人员名单（可选）
/// </summary>
public string? AnJuCodeRegisteredNames { get; set; }
```

- [ ] **Step 4: CheckInAsync 写入 names**

读 `RentalRecordService.cs` 的 `CheckInAsync`（约 137-205），在构造 `RentalRecord` 对象处（约 163 行 new RentalRecord）加属性：
```csharp
AnJuCodeRegisteredNames = input.AnJuCodeRegisteredNames,
```

- [ ] **Step 5: ConfirmAnJuCodeAsync 支持更新 names（可选）**

读 `RentalRecordService.cs:316-349`（ConfirmAnJuCodeAsync）。当前无参。为支持事后编辑名单，给方法加可选参数：

```csharp
public async Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id, string? anJuCodeRegisteredNames = null)
{
    // ... 原有查 record 逻辑 ...
    if (record.IsAnJuCodeSubmitted)
    {
        // 已提交：若传了 names 则更新名单
        if (anJuCodeRegisteredNames != null)
        {
            record.AnJuCodeRegisteredNames = anJuCodeRegisteredNames;
            await _repository.UpdateAsync(record);
            await _repository.SaveNowAsync();
        }
        return record.Adapt<RentalRecordDto>();
    }

    record.IsAnJuCodeSubmitted = true;
    if (anJuCodeRegisteredNames != null)
    {
        record.AnJuCodeRegisteredNames = anJuCodeRegisteredNames;
    }
    await _repository.UpdateAsync(record);
    await _repository.SaveNowAsync();
    // ... 原有重查返回逻辑 ...
}
```

> Furion 动态 API：方法参数会自动从 body/route 绑定。需确认 AppService 调用处签名同步（`RentalAppService.cs:121-128`）。

- [ ] **Step 6: 后端构建 + 测试**

```bash
cd Gentle
dotnet build
dotnet test
```
Expected: 构建通过，测试 PASS。

- [ ] **Step 7: 前端类型加字段**

`Hans/src/api/model/rentalModel.ts` 的 `isAnJuCodeSubmitted`（105-106 行）下方加：
```typescript
/** 安居码登记人员名单 */
anJuCodeRegisteredNames?: string;
```
同样在 CheckIn 参数类型（`CreateCheckInParams` 或类似，查文件）加 `anJuCodeRegisteredNames?: string`。

- [ ] **Step 8: 入住页加登记人员输入**

`Hans/src/pages/tenant/check-in.vue`，在安居码/合同上传相关表单项附近，加一个多行文本：

```vue
<t-form-item label="安居码登记人员" name="anJuCodeRegisteredNames">
  <t-textarea
    v-model="formData.anJuCodeRegisteredNames"
    placeholder="多人用逗号或顿号分隔，如：张三、李四"
    :autosize="{ minRows: 2, maxRows: 4 }"
    :maxlength="200"
  />
</t-form-item>
```
（formData 加 `anJuCodeRegisteredNames: ''`，提交参数带上。）

- [ ] **Step 9: 租赁列表展示名单**

`Hans/src/pages/housing/rental/index.vue` 的安居码列（53-65 行）或确认弹窗（305-324 行），当 `row.anJuCodeRegisteredNames` 有值时展示名单（如在「已提交」标签后附文字，或 tooltip）。

- [ ] **Step 10: 类型检查 + 提交**

```bash
cd Hans && npm run build:type && npm run lint
```
```bash
git add -A
git commit -m "feat: 安居码增加登记人员名单字段（支持一套房多人登记备忘）"
```

---

### Task 8: 第 7 条 — 抄表加入固定费用（后端含迁移 + 前端）

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/MeterRecord.cs`、`UtilityBill.cs`（各加 4 字段）
- Create: EF 迁移
- Modify: `Gentle/Gentle.Application/Services/MeterService.cs`（计费 145-169、账单创建 371-414）
- Modify: DTO `MeterRecordDto.cs`、`UtilityBillDto.cs`、Mapster 映射
- Modify: 前端 `Hans/src/api/model/meterModel.ts`、`pages/utility/meter/index.vue`、账单展示页

**Interfaces:**
- Produces: 实体新增 4 字段 `ElevatorFee/PropertyFee/InternetFee/OtherFees`（`decimal?`，快照），账单 TotalAmount 改为含固定费用。

- [ ] **Step 1: 实体加 4 字段**

`MeterRecord.cs` 在 `ElectricFee`（125-127 行）下方加：
```csharp
/// <summary>电梯费（抄表时的房间月固定费用快照）</summary>
[Range(0, double.MaxValue)]
[Column(TypeName = "decimal(10,2)")]
public decimal? ElevatorFee { get; set; }

/// <summary>物业费快照</summary>
[Range(0, double.MaxValue)]
[Column(TypeName = "decimal(10,2)")]
public decimal? PropertyFee { get; set; }

/// <summary>网络费快照</summary>
[Range(0, double.MaxValue)]
[Column(TypeName = "decimal(10,2)")]
public decimal? InternetFee { get; set; }

/// <summary>其他费用快照</summary>
[Range(0, double.MaxValue)]
[Column(TypeName = "decimal(10,2)")]
public decimal? OtherFees { get; set; }
```

`UtilityBill.cs` 在 `ElectricFee`（138-140 行）下方同样加这 4 个字段。

- [ ] **Step 2: 生成迁移**

```bash
cd Gentle
dotnet ef migrations add AddMeterFixedFees --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry
```
确认迁移含对 `meter_record` 和 `utility_bill` 两表的 AddColumn。

- [ ] **Step 3: 抽取费用计算为可测方法**

在 `MeterService.cs` 加一个 internal static 方法（纯计算，便于单测）：

```csharp
/// <summary>
/// 计算固定费用合计（电梯+物业+网络+其他），null 视为 0。
/// </summary>
internal static decimal SumFixedFees(
    decimal? elevatorFee, decimal? propertyFee,
    decimal? internetFee, decimal? otherFees)
{
    return (elevatorFee ?? 0m) + (propertyFee ?? 0m)
         + (internetFee ?? 0m) + (otherFees ?? 0m);
}
```

- [ ] **Step 4: 写单测**

新建 `Gentle/Gentle.Tests/Services/MeterFeeTests.cs`：

```csharp
using Gentle.Application.Services;
using Xunit;

namespace Gentle.Tests.Services;

public class MeterFeeTests
{
    [Fact]
    public void SumFixedFees_AllNull_ReturnsZero()
    {
        Assert.Equal(0m, MeterService.SumFixedFees(null, null, null, null));
    }

    [Fact]
    public void SumFixedFees_SumsAllWithNullSkipped()
    {
        Assert.Equal(70m, MeterService.SumFixedFees(30m, 20m, null, 20m));
    }

    [Theory]
    [InlineData(0, 0, 0, 0, 0)]
    [InlineData(30, 20, 15, 10, 75)]
    public void SumFixedFees_Cases(decimal? e, decimal? p, decimal? i, decimal? o, decimal expected)
    {
        Assert.Equal(expected, MeterService.SumFixedFees(e, p, i, o));
    }
}
```

- [ ] **Step 5: 运行测试**

```bash
cd Gentle
dotnet test --filter "FullyQualifiedName~MeterFeeTests"
```
Expected: PASS。

- [ ] **Step 6: RecordAsync 写入固定费用快照**

改 `MeterService.cs:145-169` 计费段，计算并赋值到 meterRecord：

```csharp
var waterPrice = room.WaterPrice ?? 5m;
var electricPrice = room.ElectricPrice ?? 1m;
var waterFee = waterUsage * waterPrice;
var electricFee = electricUsage * electricPrice;

// 固定费用快照（取房间当前配置，null → 字段存 null，账单合计按 0）
meterRecord.WaterFee = waterFee;
meterRecord.ElectricFee = electricFee;
meterRecord.ElevatorFee = room.ElevatorFee;
meterRecord.PropertyFee = room.PropertyFee;
meterRecord.InternetFee = room.InternetFee;
meterRecord.OtherFees = room.OtherFees;
```
（确认原代码是否在此处赋值 WaterFee/ElectricFee；若是稍后赋值，相应调整位置。）

- [ ] **Step 7: 账单 CreateUtilityBillAsync 计入固定费用**

改 `MeterService.cs:371-414`，账单的 4 字段快照 + TotalAmount：

```csharp
var utilityBill = new UtilityBill
{
    // ... 原有字段 ...
    WaterFee = meterRecord.WaterFee,
    ElectricFee = meterRecord.ElectricFee,
    ElevatorFee = meterRecord.ElevatorFee,
    PropertyFee = meterRecord.PropertyFee,
    InternetFee = meterRecord.InternetFee,
    OtherFees = meterRecord.OtherFees,
    TotalAmount = meterRecord.WaterFee
                 + meterRecord.ElectricFee
                 + MeterService.SumFixedFees(
                     meterRecord.ElevatorFee, meterRecord.PropertyFee,
                     meterRecord.InternetFee, meterRecord.OtherFees),
    Status = UtilityBillStatus.Pending
};
```

- [ ] **Step 8: DTO + Mapster 加字段**

`MeterRecordDto.cs`、`UtilityBillDto.cs` 各加 4 个 `decimal?` 字段。确认 Mapster 映射（`Gentle.Application/Mapper.cs` 或自动映射）能带过同名属性——若用 `Adapt<>()` 自动映射，同名自动带；若有显式 Map 配置需补。

- [ ] **Step 9: 后端构建 + 全测试**

```bash
cd Gentle
dotnet build
dotnet test
```
Expected: 全 PASS。

- [ ] **Step 10: 前端类型加字段**

`Hans/src/api/model/meterModel.ts` 的 `MeterRecordItem`（22-42 行）加：
```typescript
elevatorFee?: number | null;
propertyFee?: number | null;
internetFee?: number | null;
otherFees?: number | null;
```
（账单类型同理加这 4 字段。）

- [ ] **Step 11: 抄表页展示固定费用**

`Hans/src/pages/utility/meter/index.vue` 的费用展示区（121-203 行），在水费/电费下方加固定费用只读展示（取自 `selectedRoom` 的配置）+ 合计更新：

```vue
<!-- 固定费用（取自房间配置，只读） -->
<div v-if="selectedRoom" class="fixed-fees">
  <div v-if="selectedRoom.elevatorFee">电梯费：¥{{ selectedRoom.elevatorFee }}</div>
  <div v-if="selectedRoom.propertyFee">物业费：¥{{ selectedRoom.propertyFee }}</div>
  <div v-if="selectedRoom.internetFee">网络费：¥{{ selectedRoom.internetFee }}</div>
  <div v-if="selectedRoom.otherFees">其他费用：¥{{ selectedRoom.otherFees }}</div>
</div>
```
合计费用计算（约 362-369 行）加上固定费用：
```typescript
const fixedTotal = (selectedRoom.elevatorFee ?? 0) + (selectedRoom.propertyFee ?? 0)
  + (selectedRoom.internetFee ?? 0) + (selectedRoom.otherFees ?? 0);
const totalFee = computed(() => waterFee.value + electricFee.value + fixedTotal);
```
（按实际 computed 结构调整。）

- [ ] **Step 12: 账单列表/详情展示明细**

水电账单列表页（`pages/utility/bill/` 或类似）的金额展示，如有明细展开，补上 4 项固定费用。

- [ ] **Step 13: 类型检查 + 提交**

```bash
cd Hans && npm run build:type && npm run lint
```
```bash
git add -A
git commit -m "feat: 抄表账单计入电梯费/物业费/网络费/其他固定费用（快照存储）"
```

---

## 批次 C：独立功能

### Task 9: 第 9 条 — 合同图片上传（后端接口 + 前端 token）

**Files:**
- Create: `Gentle/Gentle.Application/Apps/FileAppService.cs`
- Modify: `Gentle/Gentle.Web.Core/Startup.cs`（加 UseStaticFiles + wwwroot）
- Modify: `Gentle/Gentle.Web.Entry/appsettings.json`（可选：上传路径配置）
- Modify: `Hans/src/pages/tenant/check-in.vue`、`Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue`（t-upload 加 headers）

**Interfaces:**
- Produces: `POST /api/file/upload`（multipart/form-data, `IFormFile file`）→ `{ url: string }`。
- 前端：两处 t-upload 加 `:headers="uploadHeaders"`，token 从 `useUserStore().token`。

- [ ] **Step 1: 后端新建 FileAppService**

新建 `Gentle/Gentle.Application/Apps/FileAppService.cs`。遵循 Furion `IDynamicApiController` 模式（参考同目录其它 AppService）：

```csharp
using Furion.DynamicApiController;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 文件上传应用服务
/// </summary>
[ApiDescriptionSettings("File", Name = "file")]
[Authorize]
public class FileAppService : IDynamicApiController
{
    private readonly IWebHostEnvironment _env;

    public FileAppService(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// 上传文件（合同图片等），返回可访问的 URL。
    /// </summary>
    /// <param name="file">单文件，仅图片，≤10MB</param>
    [HttpPost("upload")]
    public async Task<object> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw Oops.Oh("请选择要上传的文件");
        }

        // 大小限制 10MB
        if (file.Length > 10 * 1024 * 1024)
        {
            throw Oops.Oh("文件大小不能超过 10MB");
        }

        // 类型限制：仅图片
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
        {
            throw Oops.Oh("仅支持 jpg/png/gif/webp 格式");
        }

        // 存储路径：wwwroot/uploads/contracts/{yyyyMMdd}/{guid}{ext}
        var webRoot = string.IsNullOrEmpty(_env.WebRootPath) ? "wwwroot" : _env.WebRootPath;
        var dateDir = DateTime.Now.ToString("yyyyMMdd");
        var relDir = Path.Combine("uploads", "contracts", dateDir);
        var absDir = Path.Combine(_env.ContentRootPath, webRoot == "wwwroot" ? "wwwroot" : webRoot, relDir);
        // 规范化：若 WebRootPath 为空，用 ContentRootPath/wwwroot
        absDir = Path.Combine(_env.ContentRootPath, "wwwroot", relDir);
        Directory.CreateDirectory(absDir);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var absPath = Path.Combine(absDir, fileName);
        await using var stream = new FileStream(absPath, FileMode.Create);
        await file.CopyToAsync(stream);

        var url = $"/{relDir.Replace('\\', '/')}/{fileName}";
        return new { url };
    }
}
```

> 注：`Oops.Oh` 需 `using Furion.FriendlyException;`（确认命名空间，参考其它 AppService 的 using）。Furion 动态 API 路由前缀默认 `api`，最终路径 `POST /api/file/upload`。

- [ ] **Step 2: Startup 加 UseStaticFiles**

读 `Gentle/Gentle.Web.Core/Startup.cs:26-50` 的 `Configure`。在 `app.UseAuthorization();` 之后、`app.UseInject` 之前加静态文件中间件（让上传后的图片可通过 `/uploads/...` 访问）：

```csharp
app.UseAuthorization();

// 启用静态文件服务（合同图片等上传文件通过 /uploads/... 访问）
app.UseStaticFiles();

app.UseInject(string.Empty);
```

> 静态文件放 `UseAuthorization` 后：`/uploads/**` 不受鉴权保护（任何人有 url 可访问）。合同图片属于内部资料，若需鉴权访问，需自定义静态文件中间件做 token 校验——**本期按"有 url 即可访问"实现**（与前端 t-upload 预览 `<img :src="url">` 配合，img 标签无法带 Authorization 头）。

- [ ] **Step 3: 创建 wwwroot 目录**

确保 `Gentle/Gentle.Web.Entry/wwwroot/` 目录存在（空目录加 `.gitkeep`）：

```bash
mkdir -p Gentle/Gentle.Web.Entry/wwwroot
touch Gentle/Gentle.Web.Entry/wwwroot/.gitkeep
```

- [ ] **Step 4: 后端构建**

```bash
cd Gentle
dotnet build
```
Expected: 构建成功（FileAppService 编译通过）。

- [ ] **Step 5: 前端 check-in.vue t-upload 加 headers**

读 `Hans/src/pages/tenant/check-in.vue` import 区，加：
```typescript
import { useUserStore } from '@/store';
```
（确认 store 的导出路径，参考 `request/index.ts:116` 的 `useUserStore` 导入。）

在 `<script setup>` 加 computed：
```typescript
const userStore = useUserStore();
// t-upload 不经过 Axios 拦截器，需手动注入 JWT token
const uploadHeaders = computed(() => {
  const token = userStore.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
});
```

t-upload（215-233 行）加 `:headers="uploadHeaders"`：
```vue
<t-upload
  v-model="contractFiles"
  action="/api/file/upload"
  :headers="uploadHeaders"
  :auto-upload="true"
  ...
/>
```

- [ ] **Step 6: 前端 RenewRentalDialog.vue 同样处理**

`Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue` 重复 Step 5：import useUserStore、加 uploadHeaders computed、t-upload（67-79 行）加 `:headers="uploadHeaders"`。

- [ ] **Step 7: 类型检查 + lint**

```bash
cd Hans
npm run build:type
npm run lint
```
Expected: 无错误。

- [ ] **Step 8: 提交**

```bash
git add Gentle/Gentle.Application/Apps/FileAppService.cs Gentle/Gentle.Web.Core/Startup.cs Gentle/Gentle.Web.Entry/wwwroot/.gitkeep Hans/src/pages/tenant/check-in.vue Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue
git commit -m "feat: 合同图片上传——新增后端文件接口 + 前端注入 token"
```

---

## 收尾：全量验证

### Task 10: 全量回归验证

- [ ] **Step 1: 后端全测试**

```bash
cd Gentle
dotnet test
```
Expected: 全 PASS。

- [ ] **Step 2: 前端类型 + lint**

```bash
cd Hans
npm run build:type
npm run lint
```
Expected: 无错误。

- [ ] **Step 3: E2E 回归（关键路径）**

```bash
cd tests
npx playwright test e2e/feat-011-checkin-checkout-api.spec.ts
npx playwright test e2e/feat-020-dashboard-todo.spec.ts
npx playwright test e2e/feat-023-meter-page.spec.ts
```
（视环境是否连真实后端；若 E2E 需完整服务，手动验证替代。）

- [ ] **Step 4: 逐条手动核验对照表**

按本计划开头的 9 条逐条在 UI 核验（见各 Task 的验收步骤）。

---

## Self-Review

**Spec 覆盖**：9 条整改（#1 A3, #3 A4, #4 B3, #5 B1, #6 A1, #7 B4, #8 B2, #9 C1, #10 A2）均有对应 Task。第 2 条（老赖改名）按用户决定暂缓，不纳入。✅

**Placeholder 扫描**：无 TBD/TODO；每个代码步骤均给出实际代码。Step 中标注"按实际结构/确认行号"处，是因为 Vue 模板/方法体较长需实现者按现场对齐，已给出锚点行号与目标代码。✅

**类型/命名一致性**：`AnJuCodeRegisteredNames`（实体/DTO/前端 `anJuCodeRegisteredNames` 驼峰）跨 Task 一致；`CanReclaim`/`IsVacantRoomActuallyRented`/`SumFixedFees`/`ExtractLeadingNumber`/`getDaysUntil` 在测试与实现中命名一致。✅

**风险点已标注**：B2 的 EF 追踪性、C1 的静态文件鉴权、B3/B4 的迁移。✅
