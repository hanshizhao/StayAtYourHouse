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
import type { DateMultipleValue, DateValue, FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import dayjs from 'dayjs';
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
function onContractEndDateChange(val: DateValue | DateMultipleValue) {
  if (!val || Array.isArray(val) || !formData.value.checkInDate) return;
  const checkIn = dayjs(formData.value.checkInDate);
  const end = dayjs(val);
  // 模拟后端逻辑：ContractEndDate = CheckInDate.AddMonths(n).AddDays(-1)
  // 反推：找到 addMonths(n).subtract(1,'day') == end 的 n
  for (let n = 1; n <= 36; n++) {
    if (checkIn.add(n, 'month').subtract(1, 'day').isSame(end, 'day')) {
      formData.value.leaseMonths = n;
      return;
    }
  }
  // 精确匹配不到时（用户手动选了非标准日期），计算近似月数
  const approxMonths = end.diff(checkIn, 'month') + 1;
  if (approxMonths >= 1 && approxMonths <= 36) {
    formData.value.leaseMonths = approxMonths;
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
