<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="还款"
    width="480px"
    :confirm-btn="{ content: '确认还款', loading, theme: 'primary' }"
    cancel-btn="取消"
    data-testid="repay-dialog"
    :on-confirm="handleSubmit"
    :on-close="handleClose"
  >
    <div class="repay-tenant-info">
      <div class="repay-label">租客</div>
      <div class="repay-tenant-text">
        {{ debt?.tenantName }}（欠款 ¥{{ formatAmount(debt?.totalAmount) }}，剩余 ¥{{ formatAmount(debt?.remainingAmount) }}）
      </div>
    </div>

    <t-form
      ref="formRef"
      :data="formData"
      :rules="formRules"
      label-align="top"
      class="repay-form"
    >
      <t-form-item label="还款金额" name="amount">
        <t-input-number
          v-model="formData.amount"
          placeholder="请输入还款金额"
          :min="0.01"
          :max="maxAmount"
          :decimal-places="2"
          :step="100"
          theme="column"
          data-testid="repay-amount-input"
        >
          <template #prefixIcon>
            <span class="amount-prefix">¥</span>
          </template>
        </t-input-number>
      </t-form-item>

      <t-form-item label="还款日期" name="paymentDate">
        <t-date-picker
          v-model="formData.paymentDate"
          placeholder="请选择还款日期"
          :disable-date="{ after: new Date() }"
          clearable
          style="width: 100%"
          data-testid="repay-date-picker"
        />
      </t-form-item>

      <t-form-item label="还款方式" name="paymentChannel">
        <t-select
          v-model="formData.paymentChannel"
          placeholder="请选择还款方式"
          data-testid="repay-channel-select"
        >
          <t-option
            v-for="(label, value) in PAYMENT_CHANNEL_MAP"
            :key="value"
            :value="Number(value)"
            :label="label"
          />
        </t-select>
      </t-form-item>

      <t-form-item label="备注" name="remark">
        <t-textarea
          v-model="formData.remark"
          placeholder="选填，如：第三期还款"
          :maxlength="500"
          :autosize="{ minRows: 3, maxRows: 4 }"
          data-testid="repay-remark-input"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { AddRepaymentParams, DebtListItem } from '@/api/model/debtModel';
import { PAYMENT_CHANNEL_MAP, PaymentChannel } from '@/api/model/debtModel';
import { addRepayment } from '@/api/debt';

interface Props {
  visible: boolean;
  debt: DebtListItem | null;
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

const maxAmount = computed(() => props.debt?.remainingAmount ?? 0);

interface RepayFormData {
  amount: number | undefined;
  paymentDate: string;
  paymentChannel: PaymentChannel | undefined;
  remark: string;
}

const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);

const formData = ref<RepayFormData>({
  amount: undefined,
  paymentDate: '',
  paymentChannel: undefined,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  amount: [
    { required: true, message: '请输入还款金额', trigger: 'blur' },
    {
      validator: (val: number) => val > 0,
      message: '还款金额必须大于 0',
      trigger: 'blur',
    },
    {
      validator: (val: number) => !props.debt || val <= props.debt.remainingAmount,
      message: '还款金额不能超过剩余欠款',
      trigger: 'blur',
    },
  ],
  paymentDate: [{ required: true, message: '请选择还款日期', trigger: 'change' }],
  paymentChannel: [{ required: true, message: '请选择还款方式', trigger: 'change' }],
};

function formatAmount(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    formData.value = {
      amount: undefined,
      paymentDate: `${yyyy}-${mm}-${dd}`,
      paymentChannel: PaymentChannel.WeChat,
      remark: '',
    };
  },
);

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  if (!props.debt) return;

  if (formData.value.amount === undefined || formData.value.paymentChannel === undefined) {
    return;
  }

  loading.value = true;
  try {
    const params: AddRepaymentParams = {
      amount: formData.value.amount,
      paymentDate: formData.value.paymentDate,
      paymentChannel: formData.value.paymentChannel,
      remark: formData.value.remark || undefined,
    };
    await addRepayment(props.debt.id, params);
    MessagePlugin.success('还款成功');
    formRef.value?.reset();
    emit('update:visible', false);
    emit('success');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '还款操作失败';
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
.repay-tenant-info {
  margin-bottom: 20px;

  .repay-label {
    font-size: 13px;
    color: var(--td-text-color-placeholder);
    margin-bottom: 6px;
  }

  .repay-tenant-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }
}

.repay-form {
  :deep(.t-form__item) {
    margin-bottom: 20px;
  }

  .amount-prefix {
    color: var(--td-text-color-placeholder);
  }
}
</style>
