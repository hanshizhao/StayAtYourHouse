# Room 新增固定费用属性 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Room 实体新增电梯费、物业费、网络费、其他费用 4 个固定月费属性，实现全栈 CRUD。

**Architecture:** 在 Room 实体上添加 4 个 nullable decimal 字段（与 LandlordLease 对称），同步更新 DTO、Service 映射、前端 Model 和编辑抽屉 UI，最后补充 E2E 测试。

**Tech Stack:** .NET 10 (Furion)、Vue 3 + TypeScript + TDesign、Playwright E2E

**Spec:** `docs/superpowers/specs/2026-04-09-room-fixed-fees-design.md`

---

### Task 1: 后端实体与 DTO 变更

**Files:**
- Modify: `Gentle/Gentle.Core/Entities/Room.cs:50-55` (ElectricPrice 之后)
- Modify: `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs:58-59` (ElectricPrice 之后)
- Modify: `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs:50-54` (ElectricPrice 之后)
- Modify: `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs:56-60` (ElectricPrice 之后)
- Modify: `Gentle/Gentle.Application/Services/RoomService.cs:168` (ElectricPrice 赋值之后)

- [ ] **Step 1: 修改 Room 实体**

在 `Gentle/Gentle.Core/Entities/Room.cs` 的 `ElectricPrice` 属性之后添加：

```csharp
    /// <summary>
    /// 电梯费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电梯费不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "物业费不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "网络费不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "其他费用不能为负数")]
    [Column(TypeName = "decimal(10,2)")]
    public decimal? OtherFees { get; set; }
```

需要在文件顶部添加 using：
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
```

- [ ] **Step 2: 修改 RoomDto**

在 `Gentle/Gentle.Application/Dtos/Room/RoomDto.cs` 的 `ElectricPrice` 属性之后添加：

```csharp
    /// <summary>
    /// 电梯费（月）
    /// </summary>
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    public decimal? OtherFees { get; set; }
```

- [ ] **Step 3: 修改 CreateRoomInput**

在 `Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs` 的 `ElectricPrice` 属性之后添加：

```csharp
    /// <summary>
    /// 电梯费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电梯费必须大于等于0")]
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "物业费必须大于等于0")]
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "网络费必须大于等于0")]
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "其他费用必须大于等于0")]
    public decimal? OtherFees { get; set; }
```

- [ ] **Step 4: 修改 UpdateRoomInput**

在 `Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs` 的 `ElectricPrice` 属性之后添加（与 CreateRoomInput 相同的 4 个属性）：

```csharp
    /// <summary>
    /// 电梯费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电梯费必须大于等于0")]
    public decimal? ElevatorFee { get; set; }

    /// <summary>
    /// 物业费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "物业费必须大于等于0")]
    public decimal? PropertyFee { get; set; }

    /// <summary>
    /// 网络费（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "网络费必须大于等于0")]
    public decimal? InternetFee { get; set; }

    /// <summary>
    /// 其他费用（月）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "其他费用必须大于等于0")]
    public decimal? OtherFees { get; set; }
```

- [ ] **Step 5: 修改 RoomService.UpdateAsync 映射**

在 `Gentle/Gentle.Application/Services/RoomService.cs` 的 `UpdateAsync` 方法中，在 `existing.ElectricPrice = input.ElectricPrice;` 之后添加：

```csharp
            existing.ElevatorFee = input.ElevatorFee;
            existing.PropertyFee = input.PropertyFee;
            existing.InternetFee = input.InternetFee;
            existing.OtherFees = input.OtherFees;
```

- [ ] **Step 6: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 7: 提交**

```bash
git add Gentle/Gentle.Core/Entities/Room.cs Gentle/Gentle.Application/Dtos/Room/RoomDto.cs Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs Gentle/Gentle.Application/Services/RoomService.cs
git commit -m "feat: Room 实体新增电梯费、物业费、网络费、其他费用属性"
```

---

### Task 2: 数据库迁移

**Files:**
- Create: `Gentle/Gentle.Database.Migrations/Migrations/<timestamp>_AddRoomFixedFees.cs`

- [ ] **Step 1: 生成迁移**

Run: `cd Gentle && dotnet ef migrations add AddRoomFixedFees --project Gentle.Database.Migrations --startup-project Gentle.Web.Entry`
Expected: 迁移文件生成成功，包含 4 列 nullable decimal(10,2) 新增

- [ ] **Step 2: 验证迁移文件**

检查生成的迁移文件中 `Up` 方法包含：
- `AddColumn("Rooms", "ElevatorFee", ...)`
- `AddColumn("Rooms", "PropertyFee", ...)`
- `AddColumn("Rooms", "InternetFee", ...)`
- `AddColumn("Rooms", "OtherFees", ...)`

所有列类型应为 `decimal(10,2)` 且 nullable。

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Database.Migrations/Migrations/
git commit -m "feat: 添加 AddRoomFixedFees 数据库迁移"
```

---

### Task 3: 前端 TypeScript Model 变更

**Files:**
- Modify: `Hans/src/api/model/roomModel.ts`

- [ ] **Step 1: 更新 RoomItem 接口**

在 `RoomItem` 接口的 `electricPrice` 之后添加：

```typescript
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
```

- [ ] **Step 2: 更新 CreateRoomParams 接口**

在 `CreateRoomParams` 接口的 `electricPrice` 之后添加：

```typescript
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
```

- [ ] **Step 3: 更新 UpdateRoomParams 接口**

在 `UpdateRoomParams` 接口的 `electricPrice` 之后添加：

```typescript
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
```

- [ ] **Step 4: 提交**

```bash
git add Hans/src/api/model/roomModel.ts
git commit -m "feat: 前端 Room Model 新增固定费用字段"
```

---

### Task 4: 前端房间编辑抽屉 UI

**Files:**
- Modify: `Hans/src/pages/housing/room/index.vue`

- [ ] **Step 1: 更新 RoomFormData 接口**

在 `RoomFormData` 接口（约第 554 行）的 `electricPrice` 之后添加：

```typescript
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
```

- [ ] **Step 2: 更新 formData 初始值**

在 `formData` ref（约第 623 行）的 `electricPrice` 之后添加：

```typescript
  elevatorFee: undefined,
  propertyFee: undefined,
  internetFee: undefined,
  otherFees: undefined,
```

- [ ] **Step 3: 更新编辑抽屉模板 — 添加输入框**

在模板中"费用设置"区域的 `</t-row>` 标签（约第 207 行）之后，添加两个新的 `<t-row>` 块，保持每行 2 列布局：

```html
        <t-row :gutter="24">
          <t-col :span="6">
            <t-form-item label="电梯费" name="elevatorFee">
              <t-input-number
                v-model="formData.elevatorFee"
                theme="normal"
                placeholder="电梯费"
                :min="0"
                :decimal-places="2"
                suffix="元/月"
                data-testid="room-elevator-fee-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="物业费" name="propertyFee">
              <t-input-number
                v-model="formData.propertyFee"
                theme="normal"
                placeholder="物业费"
                :min="0"
                :decimal-places="2"
                suffix="元/月"
                data-testid="room-property-fee-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="6">
            <t-form-item label="网络费" name="internetFee">
              <t-input-number
                v-model="formData.internetFee"
                theme="normal"
                placeholder="网络费"
                :min="0"
                :decimal-places="2"
                suffix="元/月"
                data-testid="room-internet-fee-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="其他费用" name="otherFees">
              <t-input-number
                v-model="formData.otherFees"
                theme="normal"
                placeholder="其他费用"
                :min="0"
                :decimal-places="2"
                suffix="元/月"
                data-testid="room-other-fees-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
```

- [ ] **Step 4: 更新 handleCreate 方法**

在 `handleCreate` 方法中（约第 779 行），`formData` 重置对象中 `electricPrice` 之后添加：

```typescript
    elevatorFee: undefined,
    propertyFee: undefined,
    internetFee: undefined,
    otherFees: undefined,
```

- [ ] **Step 5: 更新 handleEdit 方法**

在 `handleEdit` 方法中（约第 794 行），`formData` 赋值对象中 `electricPrice` 之后添加：

```typescript
    elevatorFee: row.elevatorFee,
    propertyFee: row.propertyFee,
    internetFee: row.internetFee,
    otherFees: row.otherFees,
```

- [ ] **Step 6: 更新 handleSubmit 方法 — 创建 payload**

在 `handleSubmit` 中 `createRoom` 调用（约第 820 行），`electricPrice` 之后添加：

```typescript
        elevatorFee: formData.value.elevatorFee,
        propertyFee: formData.value.propertyFee,
        internetFee: formData.value.internetFee,
        otherFees: formData.value.otherFees,
```

- [ ] **Step 7: 更新 handleSubmit 方法 — 更新 payload**

在 `handleSubmit` 中 `updateRoom` 调用（约第 835 行），`electricPrice` 之后添加：

```typescript
        elevatorFee: formData.value.elevatorFee,
        propertyFee: formData.value.propertyFee,
        internetFee: formData.value.internetFee,
        otherFees: formData.value.otherFees,
```

- [ ] **Step 8: 构建验证**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误

- [ ] **Step 9: 提交**

```bash
git add Hans/src/pages/housing/room/index.vue
git commit -m "feat: 房间编辑抽屉新增固定费用输入框"
```

---

### Task 5: E2E 测试更新

**Files:**
- Modify: `tests/e2e/feat-004-room-api.spec.ts`
- Modify: `tests/e2e/feat-006-room-page.spec.ts`

- [ ] **Step 1: 更新 Room API 测试**

在 `tests/e2e/feat-004-room-api.spec.ts` 中：

1. 找到创建房间带完整属性的测试（含 `waterPrice` 和 `electricPrice` 的测试数据），在其后添加：

```typescript
      elevatorFee: 80,
      propertyFee: 150,
      internetFee: 100,
      otherFees: 50,
```

在对应的断言中，添加新字段的验证：

```typescript
    expect(result.data.elevatorFee).toBe(testData.elevatorFee);
    expect(result.data.propertyFee).toBe(testData.propertyFee);
    expect(result.data.internetFee).toBe(testData.internetFee);
    expect(result.data.otherFees).toBe(testData.otherFees);
```

2. 找到更新房间的测试用例（`updateData`），在 `updateData` 中添加新字段：

```typescript
      elevatorFee: 100,
      propertyFee: 200,
      internetFee: 120,
      otherFees: 60,
```

在更新后的断言中添加新字段验证。

- [ ] **Step 2: 更新 Room 页面测试**

在 `tests/e2e/feat-006-room-page.spec.ts` 中，找到房间编辑/创建的测试用例，添加新输入框的交互测试：

```typescript
    // 填写固定费用
    await page.fill('[data-testid="room-elevator-fee-input"] input', '80');
    await page.fill('[data-testid="room-property-fee-input"] input', '150');
    await page.fill('[data-testid="room-internet-fee-input"] input', '100');
    await page.fill('[data-testid="room-other-fees-input"] input', '50');
```

如果有编辑后验证的流程，确认新字段值正确回显。

- [ ] **Step 3: 运行测试验证**

Run: `cd tests && npx playwright test e2e/feat-004-room-api.spec.ts e2e/feat-006-room-page.spec.ts`
Expected: 所有测试 PASS

- [ ] **Step 4: 提交**

```bash
git add tests/e2e/feat-004-room-api.spec.ts tests/e2e/feat-006-room-page.spec.ts
git commit -m "feat: 更新 E2E 测试补充 Room 固定费用字段"
```

---

### Task 6: 最终验证

- [ ] **Step 1: 运行全部 Room 相关 E2E 测试**

Run: `cd tests && npx playwright test e2e/feat-002-room-entity.spec.ts e2e/feat-004-room-api.spec.ts e2e/feat-006-room-page.spec.ts`
Expected: 全部 PASS

- [ ] **Step 2: 运行后端构建**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 运行前端类型检查**

Run: `cd Hans && npm run build:type`
Expected: 无类型错误
