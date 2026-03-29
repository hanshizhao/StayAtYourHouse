<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="水电费收款"
    width="500px"
    :confirm-btn="{ content: '确认收款', loading: loading }"
    :on-confirm="handleConfirm"
    :on-close="handleClose"
  >
    <div v-if="bill" class="pay-utility-form">
      <div class="info-row">
        <span class="info-label">房间</span>
        <span class="info-value">{{ bill.roomInfo }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">账单周期</span>
        <span class="info-value">{{ bill.periodStart }} ~ {{ bill.periodEnd }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">水费</span>
        <span class="info-value">¥{{ formatMoney(bill.waterFee) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">电费</span>
        <span class="info-value">¥{{ formatMoney(bill.electricFee) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">应收金额</span>
        <span class="info-value amount">¥{{ formatMoney(bill.totalAmount) }}</span>
      </div>

      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
        <t-form-item label="实收金额" name="paidAmount">
          <t-input-number
            v-model="formData.paidAmount"
            placeholder="请输入实收金额"
            :min="0"
            :decimal-places="2"
            style="width: 100%"
          />
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息(可选)"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </t-form-item>
      </t-form>
    </div>

    <div v-else class="empty-state">
      <t-icon name="error-circle" size="48px" style="color: var(--td-text-color-placeholder)" />
      <p>暂无账单信息</p>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import { payUtilityBill } from '@/api/meter';
import type { UtilityBillItem } from '@/api/model/meterModel';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'PayUtilityDialog',
});

// ==================== Props & Emits ====================

const props = defineProps<{
  visible: boolean;
  bill: UtilityBillItem | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// ==================== 状态 ====================

const loading = ref(false);
const formRef = ref<FormInstanceFunctions>();

const formData = ref({
  paidAmount: undefined as number | undefined,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  paidAmount: [{ required: true, message: '请输入实收金额', trigger: 'blur' }],
};

// 计算属性：双向绑定 visible
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// ==================== 监听 ====================

// 弹窗打开时初始化默认值
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.bill) {
      formData.value = {
        paidAmount: props.bill.totalAmount,
        remark: '',
      };
    }
  },
);

// ==================== 事件处理 ====================

// 确认收款
async function handleConfirm() {
  const valid = await formRef.value?.validate();
  if (valid !== true || !props.bill) return;

  loading.value = true;
  try {
    await payUtilityBill({
      billId: props.bill.id,
      paidAmount: formData.value.paidAmount!,
      remark: formData.value.remark || undefined,
    });
    MessagePlugin.success('收款成功');
    emit('success');
    dialogVisible.value = false;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '收款失败');
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}
</script>

<style lang="less" scoped>
.pay-utility-form {
  .info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;

    .info-label {
      width: 80px;
      color: var(--td-text-color-secondary);
      flex-shrink: 0;
    }

    .info-value {
      color: var(--td-text-color-primary);

      &.amount {
        font-weight: 600;
        color: var(--td-brand-color);
        font-size: 16px;
      }
    }
  }

  :deep(.t-form) {
    margin-top: 16px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--td-text-color-placeholder);

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}
</style>
