<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="催收处理"
    width="520px"
    :confirm-btn="{ content: '确定', loading: submitLoading }"
    data-testid="collect-dialog"
    :on-confirm="handleSubmit"
    :on-close="handleDialogClose"
  >
    <div v-if="bill" class="collect-dialog-content">
      <!-- 账单信息 -->
      <div class="bill-info">
        <div class="info-row">
          <span class="label">租客：</span>
          <span class="value">{{ bill.tenantName }}</span>
        </div>
        <div class="info-row">
          <span class="label">房间：</span>
          <span class="value">{{ bill.roomInfo }}</span>
        </div>
        <div class="info-row">
          <span class="label">账单周期：</span>
          <span class="value">{{ bill.periodText }}</span>
        </div>
        <div class="info-row">
          <span class="label">应收金额：</span>
          <span class="value amount">¥{{ formatMoney(bill.totalAmount) }}</span>
        </div>
      </div>

      <!-- 催收表单 -->
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
        <t-form-item label="催收结果" name="result">
          <t-radio-group v-model="formData.result" data-testid="result-input">
            <t-radio :value="CollectResult.Success">催收成功</t-radio>
            <t-radio :value="CollectResult.Grace">宽限处理</t-radio>
            <t-radio :value="CollectResult.Refuse">拒绝支付</t-radio>
          </t-radio-group>
        </t-form-item>

        <t-form-item v-if="formData.result === CollectResult.Success" label="实收金额" name="paidAmount">
          <t-input-number
            v-model="formData.paidAmount"
            :min="0.01"
            :decimal-places="2"
            placeholder="请输入实收金额"
            data-testid="paid-amount-input"
          />
        </t-form-item>

        <t-form-item v-if="formData.result === CollectResult.Grace" label="宽限截止日期" name="graceUntil">
          <t-date-picker
            v-model="formData.graceUntil"
            :disable-date="{ before: tomorrow }"
            placeholder="请选择宽限截止日期"
            data-testid="grace-until-input"
          />
        </t-form-item>

        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
            data-testid="remark-input"
          />
        </t-form-item>
      </t-form>

      <!-- 催收历史 -->
      <div v-if="bill.collectionRecords && bill.collectionRecords.length > 0" class="collection-history">
        <div class="history-title">催收历史</div>
        <div class="history-list">
          <div v-for="record in bill.collectionRecords" :key="record.id" class="history-item">
            <div class="history-date">{{ formatDate(record.collectDate) }}</div>
            <t-tag :theme="getResultTheme(record.result)" variant="light" size="small">
              {{ record.resultText }}
            </t-tag>
            <span v-if="record.remark" class="history-remark">{{ record.remark }}</span>
          </div>
        </div>
      </div>
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import { collectBill } from '@/api/bill';
import type { BillItem, CollectInput } from '@/api/model/billModel';
import { CollectResult } from '@/api/model/billModel';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';

interface Props {
  visible: boolean;
  bill: BillItem | null;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  bill: null,
});
const emit = defineEmits<Emits>();

// ==================== 状态 ====================

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const submitLoading = ref(false);
const formRef = ref<FormInstanceFunctions>();

// 明天日期（用于禁止选择今天及之前的日期）
const tomorrow = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
});

// 表单数据
const formData = ref<{
  result: CollectResult;
  paidAmount?: number;
  graceUntil?: string;
  remark?: string;
}>({
  result: CollectResult.Success,
  paidAmount: undefined,
  graceUntil: undefined,
  remark: undefined,
});

// 表单验证规则
const formRules: Record<string, FormRule[]> = {
  result: [{ required: true, message: '请选择催收结果', trigger: 'change' }],
  paidAmount: [
    {
      required: true,
      validator: (val: number | undefined) => {
        if (formData.value.result === CollectResult.Success) {
          return val !== undefined && val > 0;
        }
        return true;
      },
      message: '催收成功时，必须填写实收金额',
      trigger: 'blur',
    },
  ],
  graceUntil: [
    {
      required: true,
      validator: (val: string | undefined) => {
        if (formData.value.result === CollectResult.Grace) {
          return val !== undefined && val !== '';
        }
        return true;
      },
      message: '宽限处理时，必须填写宽限截止日期',
      trigger: 'change',
    },
  ],
};

// 监听 bill 变化，初始化表单
watch(
  () => props.bill,
  (newBill) => {
    if (newBill) {
      formData.value = {
        result: CollectResult.Success,
        paidAmount: newBill.totalAmount,
        graceUntil: undefined,
        remark: undefined,
      };
    }
  },
  { immediate: true },
);

// ==================== 操作 ====================

// 提交表单
async function handleSubmit() {
  if (!props.bill) return;

  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  submitLoading.value = true;
  try {
    const input: CollectInput = {
      billId: props.bill.id,
      result: formData.value.result,
      paidAmount: formData.value.result === CollectResult.Success ? formData.value.paidAmount : undefined,
      graceUntil: formData.value.result === CollectResult.Grace ? formData.value.graceUntil : undefined,
      remark: formData.value.remark || undefined,
    };

    await collectBill(input);
    MessagePlugin.success('催收处理成功');
    dialogVisible.value = false;
    emit('success');
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '催收处理失败');
  } finally {
    submitLoading.value = false;
  }
}

// 关闭对话框
function handleDialogClose() {
  formRef.value?.reset();
}

// 获取催收结果标签主题
function getResultTheme(result: CollectResult): 'default' | 'warning' | 'success' | 'primary' | 'danger' {
  switch (result) {
    case CollectResult.Success:
      return 'success';
    case CollectResult.Grace:
      return 'warning';
    case CollectResult.Refuse:
      return 'danger';
    default:
      return 'default';
  }
}
</script>
<style lang="less" scoped>
.collect-dialog-content {
  .bill-info {
    padding: 16px;
    margin-bottom: 16px;
    background-color: var(--td-bg-color-container);
    border-radius: 6px;

    .info-row {
      display: flex;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        width: 80px;
        color: var(--td-text-color-secondary);
      }

      .value {
        flex: 1;
        color: var(--td-text-color-primary);

        &.amount {
          font-weight: 500;
          color: var(--td-brand-color);
        }
      }
    }
  }

  .collection-history {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-border);

    .history-title {
      margin-bottom: 12px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }

    .history-list {
      max-height: 200px;
      overflow-y: auto;

      .history-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;

        .history-date {
          width: 100px;
          color: var(--td-text-color-secondary);
          font-size: 12px;
        }

        .history-remark {
          flex: 1;
          color: var(--td-text-color-secondary);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
