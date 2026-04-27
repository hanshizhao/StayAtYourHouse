# 修改租约功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为状态为 Active 的租赁记录提供完整编辑功能，支持修改入住日期、租期月数、合同结束日期、月租、押金、备注。

**Architecture:** 后端新增 UpdateRentalRecordInput DTO 和 UpdateAsync 方法，前端新增 EditRentalDialog.vue 组件，通过 PUT API 连接。

**Tech Stack:** .NET 10 (Furion), Vue 3 (TDesign), TypeScript

---

### Task 1: 后端 - 新增 UpdateRentalRecordInput DTO

**Files:**
- Create: `Gentle/Gentle.Application/Dtos/RentalRecord/UpdateRentalRecordInput.cs`

- [ ] **Step 1: 创建 DTO 文件**

```csharp
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.RentalRecord;

/// <summary>
/// 修改租约请求
/// </summary>
public class UpdateRentalRecordInput
{
    /// <summary>
    /// 入住日期
    /// </summary>
    [Required(ErrorMessage = "入住日期不能为空")]
    public DateTime CheckInDate { get; set; }

    /// <summary>
    /// 租期月数
    /// </summary>
    [Range(1, 36, ErrorMessage = "租期月数必须在1到36之间")]
    public int LeaseMonths { get; set; }

    /// <summary>
    /// 合同结束日期
    /// </summary>
    [Required(ErrorMessage = "合同结束日期不能为空")]
    public DateTime ContractEndDate { get; set; }

    /// <summary>
    /// 月租金
    /// </summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "月租金必须大于0")]
    public decimal MonthlyRent { get; set; }

    /// <summary>
    /// 押金
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "押金不能为负数")]
    public decimal Deposit { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [StringLength(500, ErrorMessage = "备注不能超过500字")]
    public string? Remark { get; set; }
}
```

- [ ] **Step 2: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Dtos/RentalRecord/UpdateRentalRecordInput.cs
git commit -m "feat: 新增 UpdateRentalRecordInput DTO"
```

---

### Task 2: 后端 - Service 层新增 UpdateAsync 方法

**Files:**
- Modify: `Gentle/Gentle.Application/Services/IRentalRecordService.cs`
- Modify: `Gentle/Gentle.Application/Services/RentalRecordService.cs`

- [ ] **Step 1: 在 IRentalRecordService 接口中添加方法签名**

在 `Gentle/Gentle.Application/Services/IRentalRecordService.cs` 的 `ConfirmAnJuCodeAsync` 方法声明之后添加：

```csharp
    /// <summary>
    /// 修改租约
    /// </summary>
    Task<RentalRecordDto> UpdateAsync(int id, UpdateRentalRecordInput input);
```

同时添加 using：

```csharp
using Gentle.Application.Dtos.RentalRecord;
```

（如果尚未存在的话）

- [ ] **Step 2: 在 RentalRecordService 中实现 UpdateAsync 方法**

在 `Gentle/Gentle.Application/Services/RentalRecordService.cs` 的 `ConfirmAnJuCodeAsync` 方法之后、`CalculateContractEndDate` 私有方法之前添加：

```csharp
    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> UpdateAsync(int id, UpdateRentalRecordInput input)
    {
        var record = await _repository
            .AsQueryable()
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"租住记录 {id} 不存在");
        }

        if (record.Status != RentalStatus.Active)
        {
            throw Oops.Oh("只有生效中的租约才能修改");
        }

        if (input.ContractEndDate <= input.CheckInDate)
        {
            throw Oops.Oh("合同结束日期必须晚于入住日期");
        }

        record.CheckInDate = input.CheckInDate;
        record.LeaseMonths = input.LeaseMonths;
        record.ContractEndDate = input.ContractEndDate;
        record.MonthlyRent = input.MonthlyRent;
        record.Deposit = input.Deposit;
        record.Remark = input.Remark;

        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        // 重新查询以获取完整导航属性
        var updatedRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        return updatedRecord!.Adapt<RentalRecordDto>();
    }
```

- [ ] **Step 3: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add Gentle/Gentle.Application/Services/IRentalRecordService.cs Gentle/Gentle.Application/Services/RentalRecordService.cs
git commit -m "feat: 租赁记录 Service 新增 UpdateAsync 方法"
```

---

### Task 3: 后端 - API 端点

**Files:**
- Modify: `Gentle/Gentle.Application/Apps/RentalAppService.cs`

- [ ] **Step 1: 在 RentalAppService 中添加 PUT 端点**

在 `Gentle/Gentle.Application/Apps/RentalAppService.cs` 的 `CheckOut` 方法之后添加：

```csharp
    /// <summary>
    /// 修改租约
    /// </summary>
    [HttpPut("{id}")]
    public async Task<RentalRecordDto> Update(int id, UpdateRentalRecordInput input)
    {
        return await _rentalRecordService.UpdateAsync(id, input);
    }
```

- [ ] **Step 2: 构建验证**

Run: `cd Gentle && dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Application/Apps/RentalAppService.cs
git commit -m "feat: 新增 PUT /api/rental/{id} 修改租约端点"
```

---

### Task 4: 前端 - 类型定义与 API 函数

**Files:**
- Modify: `Hans/src/api/model/rentalModel.ts`
- Modify: `Hans/src/api/rental.ts`

- [ ] **Step 1: 在 rentalModel.ts 中添加 UpdateRentalInput 接口**

在 `Hans/src/api/model/rentalModel.ts` 的 `CheckOutInput` 接口之后添加：

```typescript
/**
 * 修改租约请求参数
 */
export interface UpdateRentalInput {
  /** 入住日期 */
  checkInDate: string;
  /** 租期月数 */
  leaseMonths: number;
  /** 合同结束日期 */
  contractEndDate: string;
  /** 月租金 */
  monthlyRent: number;
  /** 押金 */
  deposit: number;
  /** 备注 */
  remark?: string;
}
```

- [ ] **Step 2: 在 rental.ts 中添加 API 函数**

在 `Hans/src/api/rental.ts` 中：

1. 在 import 类型中添加 `UpdateRentalInput`
2. 在 `Api` 常量中添加 `Update: '/rental'`
3. 在文件末尾添加函数：

```typescript
/**
 * 修改租约
 */
export function updateRental(id: number, data: UpdateRentalInput) {
  return request.put<RentalRecordDto>({
    url: `${Api.Update}/${id}`,
    data,
  });
}
```

- [ ] **Step 3: 提交**

```bash
git add Hans/src/api/model/rentalModel.ts Hans/src/api/rental.ts
git commit -m "feat: 前端新增 UpdateRentalInput 类型和 updateRental API"
```

---

### Task 5: 前端 - EditRentalDialog 组件

**Files:**
- Create: `Hans/src/pages/tenant/components/EditRentalDialog.vue`

- [ ] **Step 1: 创建 EditRentalDialog.vue**

组件遵循项目现有的 Dialog 模式（参考 CheckOutDialog.vue）：
- Props: `visible` (boolean), `tenant` (TenantItem | null)
- Emits: `update:visible`, `success`
- 打开时通过 `getRentalById` 获取租赁记录详情填充表单
- 联动逻辑：修改入住日期或租期月数 → 自动计算合同结束日期；修改合同结束日期 → 自动计算租期月数
- 提交时调用 `updateRental(id, formData)`

```vue
<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="修改租约"
    width="520px"
    :confirm-btn="{ content: '保存修改', loading }"
    data-testid="edit-rental-dialog"
    :on-confirm="handleSubmit"
    :on-close="handleClose"
  >
    <div v-if="rentalRecord" class="edit-rental-content">
      <!-- 租客信息 -->
      <div class="info-section">
        <div class="info-title">租客信息</div>
        <div class="info-row">
          <span class="label">租客姓名：</span>
          <span class="value">{{ tenant?.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">当前房间：</span>
          <span class="value room-info">{{ rentalRecord.roomInfo }}</span>
        </div>
      </div>

      <!-- 编辑表单 -->
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-align="right"
        label-width="100px"
        class="edit-rental-form"
      >
        <t-form-item label="入住日期" name="checkInDate">
          <t-date-picker
            v-model="formData.checkInDate"
            :enable-time-picker="false"
            :clearable="false"
            placeholder="请选择入住日期"
            data-testid="edit-checkin-date"
            @change="onCheckInDateOrMonthsChange"
          />
        </t-form-item>

        <t-form-item label="租期月数" name="leaseMonths">
          <t-input-number
            v-model="formData.leaseMonths"
            :min="1"
            :max="36"
            :step="1"
            theme="normal"
            data-testid="edit-lease-months"
            @change="onCheckInDateOrMonthsChange"
          />
          <span class="input-suffix">个月</span>
        </t-form-item>

        <t-form-item label="合同到期日" name="contractEndDate">
          <t-date-picker
            v-model="formData.contractEndDate"
            :enable-time-picker="false"
            :clearable="false"
            placeholder="请选择合同到期日"
            data-testid="edit-contract-end-date"
            @change="onContractEndDateChange"
          />
        </t-form-item>

        <t-form-item label="月租金" name="monthlyRent">
          <t-input-number
            v-model="formData.monthlyRent"
            :min="0.01"
            :decimal-places="2"
            theme="normal"
            placeholder="请输入月租金"
            data-testid="edit-monthly-rent"
          />
          <span class="input-suffix">元</span>
        </t-form-item>

        <t-form-item label="押金" name="deposit">
          <t-input-number
            v-model="formData.deposit"
            :min="0"
            :decimal-places="2"
            theme="normal"
            placeholder="请输入押金金额"
            data-testid="edit-deposit"
          />
          <span class="input-suffix">元</span>
        </t-form-item>

        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
            data-testid="edit-remark"
          />
        </t-form-item>
      </t-form>
    </div>
    <div v-else class="loading-placeholder">
      <t-loading text="加载中..." />
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { RentalRecordDto } from '@/api/model/rentalModel';
import type { TenantItem } from '@/api/model/tenantModel';
import { getRentalById, updateRental } from '@/api/rental';
import { calculateContractEndDate } from '@/utils/date';

interface Props {
  visible: boolean;
  tenant: TenantItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

interface EditFormData {
  checkInDate: string;
  leaseMonths: number;
  contractEndDate: string;
  monthlyRent: number;
  deposit: number;
  remark: string;
}

const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);
const rentalRecord = ref<RentalRecordDto | null>(null);

const formData = ref<EditFormData>({
  checkInDate: '',
  leaseMonths: 1,
  contractEndDate: '',
  monthlyRent: 0,
  deposit: 0,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  checkInDate: [{ required: true, message: '请选择入住日期', trigger: 'change' }],
  leaseMonths: [{ required: true, message: '请输入租期月数', trigger: 'blur' }],
  contractEndDate: [{ required: true, message: '请选择合同到期日', trigger: 'change' }],
  monthlyRent: [
    { required: true, message: '请输入月租金', trigger: 'blur' },
    { validator: (val: number) => val > 0, message: '月租金必须大于0', trigger: 'blur' },
  ],
  deposit: [{ validator: (val: number) => val >= 0, message: '押金不能为负数', trigger: 'blur' }],
};

// 修改入住日期或租期月数 → 自动计算合同结束日期
function onCheckInDateOrMonthsChange() {
  const endDate = calculateContractEndDate(formData.value.checkInDate, formData.value.leaseMonths);
  if (endDate) {
    formData.value.contractEndDate = endDate;
  }
}

// 修改合同结束日期 → 自动计算租期月数
function onContractEndDateChange(val: string) {
  if (!val || !formData.value.checkInDate) return;
  const checkIn = new Date(formData.value.checkInDate);
  const end = new Date(val);
  const diffMonths = (end.getFullYear() - checkIn.getFullYear()) * 12 + (end.getMonth() - checkIn.getMonth());
  const adjustedMonths = diffMonths + 1; // 因为 ContractEndDate = CheckInDate.AddMonths(n).AddDays(-1)
  if (adjustedMonths >= 1 && adjustedMonths <= 36) {
    formData.value.leaseMonths = adjustedMonths;
  }
}

watch(
  () => props.visible,
  async (newVisible) => {
    if (newVisible && props.tenant?.rentalRecordId) {
      try {
        const record = await getRentalById(props.tenant.rentalRecordId);
        rentalRecord.value = record;
        formData.value = {
          checkInDate: record.checkInDate?.split('T')[0] || '',
          leaseMonths: record.leaseMonths,
          contractEndDate: record.contractEndDate?.split('T')[0] || '',
          monthlyRent: record.monthlyRent,
          deposit: record.deposit,
          remark: record.remark || '',
        };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '获取租住记录失败';
        MessagePlugin.error(errorMessage);
        emit('update:visible', false);
      }
    }
  },
);

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  const rentalRecordId = props.tenant?.rentalRecordId;
  if (!rentalRecordId) {
    MessagePlugin.error('租住记录不存在');
    return;
  }

  loading.value = true;
  try {
    await updateRental(rentalRecordId, {
      checkInDate: formData.value.checkInDate,
      leaseMonths: formData.value.leaseMonths,
      contractEndDate: formData.value.contractEndDate,
      monthlyRent: formData.value.monthlyRent,
      deposit: formData.value.deposit,
      remark: formData.value.remark || undefined,
    });
    MessagePlugin.success('修改租约成功');
    emit('update:visible', false);
    emit('success');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '修改租约失败';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formRef.value?.reset();
  emit('update:visible', false);
}
</script>
<style lang="less" scoped>
.edit-rental-content {
  .info-section {
    padding: 16px;
    margin-bottom: 16px;
    background-color: var(--td-bg-color-container);
    border-radius: var(--td-radius-default);

    .info-title {
      margin-bottom: 12px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        flex-shrink: 0;
        width: 80px;
        color: var(--td-text-color-secondary);
      }

      .value {
        color: var(--td-text-color-primary);

        &.room-info {
          font-weight: 500;
        }
      }
    }
  }

  .edit-rental-form {
    margin-top: 16px;

    .input-suffix {
      margin-left: 8px;
      font-size: 12px;
      color: var(--td-text-color-secondary);
    }
  }
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add Hans/src/pages/tenant/components/EditRentalDialog.vue
git commit -m "feat: 新增 EditRentalDialog 修改租约弹窗组件"
```

---

### Task 6: 前端 - 在租客列表页集成编辑租约入口

**Files:**
- Modify: `Hans/src/pages/tenant/index.vue`

- [ ] **Step 1: 导入 EditRentalDialog 组件**

在 `Hans/src/pages/tenant/index.vue` 的 script 部分，在 `import CheckOutDialog` 行之后添加：

```typescript
import EditRentalDialog from './components/EditRentalDialog.vue';
```

- [ ] **Step 2: 添加编辑租约状态变量**

在退租弹窗状态变量之后（约第286行）添加：

```typescript
// 编辑租约弹窗状态
const editRentalDialogVisible = ref(false);
const editingRentalTenant = ref<TenantItem | null>(null);
```

- [ ] **Step 3: 添加编辑租约处理函数**

在 `handleCheckOutSuccess` 函数之后（约第457行）添加：

```typescript
// 打开编辑租约弹窗
function handleEditRental(row: TenantItem) {
  editingRentalTenant.value = row;
  editRentalDialogVisible.value = true;
}

// 编辑租约成功回调
function handleEditRentalSuccess() {
  fetchData();
}
```

- [ ] **Step 4: 在操作列中添加"修改租约"按钮**

在 template 部分的 `#op` 插槽中，在退租按钮（`<t-link v-if="row.status === RentalStatus.Active..."`) 之前添加：

```html
            <t-link
              v-if="row.status === RentalStatus.Active && row.rentalRecordId"
              theme="primary"
              data-testid="edit-rental-button"
              @click="handleEditRental(row)"
            >
              修改租约
            </t-link>
```

- [ ] **Step 5: 在 template 末尾添加 EditRentalDialog 组件**

在 `<check-out-dialog .../>` 之后添加：

```html
    <!-- 编辑租约弹窗 -->
    <edit-rental-dialog
      v-model:visible="editRentalDialogVisible"
      :tenant="editingRentalTenant"
      @success="handleEditRentalSuccess"
    />
```

- [ ] **Step 6: 提交**

```bash
git add Hans/src/pages/tenant/index.vue
git commit -m "feat: 租客列表页集成修改租约功能"
```

---

### Task 7: 后端单元测试

**Files:**
- Modify: `Gentle/Gentle.Tests/Services/RentalRecordServiceTests.cs`

- [ ] **Step 1: 添加修改租约验证测试**

在 `Gentle/Gentle.Tests/Services/RentalRecordServiceTests.cs` 末尾添加新的 region：

```csharp
    #region 修改租约验证测试

    [Fact]
    public void UpdateValidation_ContractEndDateBeforeCheckInDate_IsInvalid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2025, 12, 31);

        var isValid = contractEndDate > checkInDate;
        Assert.False(isValid);
    }

    [Fact]
    public void UpdateValidation_ContractEndDateEqualsCheckInDate_IsInvalid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2026, 1, 1);

        var isValid = contractEndDate > checkInDate;
        Assert.False(isValid);
    }

    [Fact]
    public void UpdateValidation_ContractEndDateAfterCheckInDate_IsValid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2026, 6, 30);

        var isValid = contractEndDate > checkInDate;
        Assert.True(isValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(37)]
    public void UpdateValidation_LeaseMonthsOutOfRange_IsInvalid(int leaseMonths)
    {
        var isValid = leaseMonths >= 1 && leaseMonths <= 36;
        Assert.False(isValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(36)]
    public void UpdateValidation_LeaseMonthsInRange_IsValid(int leaseMonths)
    {
        var isValid = leaseMonths >= 1 && leaseMonths <= 36;
        Assert.True(isValid);
    }

    [Fact]
    public void UpdateValidation_RecalculateEndDate_AfterLeaseMonthsChange()
    {
        var checkInDate = new DateTime(2026, 1, 27);
        var newLeaseMonths = 6;
        var expectedEnd = new DateTime(2026, 7, 26);

        var result = checkInDate.AddMonths(newLeaseMonths).AddDays(-1);
        Assert.Equal(expectedEnd, result);
    }

    #endregion
```

- [ ] **Step 2: 运行测试**

Run: `cd Gentle && dotnet test`
Expected: All tests PASS

- [ ] **Step 3: 提交**

```bash
git add Gentle/Gentle.Tests/Services/RentalRecordServiceTests.cs
git commit -m "test: 添加修改租约验证单元测试"
```
