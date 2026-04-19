<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="欠款详情"
    width="640px"
    data-testid="debt-detail-dialog"
    :on-close="handleClose"
  >
    <t-loading :loading="loading" class="detail-content">
      <template v-if="detail">
        <div class="detail-info-grid">
          <div class="detail-info-col">
            <div class="detail-info-item">
              <div class="detail-info-label">租客</div>
              <div class="detail-info-value">{{ detail.tenantName }}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">电话</div>
              <div class="detail-info-value">{{ detail.tenantPhone || '-' }}</div>
            </div>
          </div>
          <div class="detail-info-col">
            <div class="detail-info-item">
              <div class="detail-info-label">状态</div>
              <div class="detail-info-value">
                <t-tag
                  :theme="detail.status === DebtStatus.Settled ? 'success' : 'warning'"
                  variant="light"
                  size="small"
                >
                  {{ detail.statusText }}
                </t-tag>
              </div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">欠款说明</div>
              <div class="detail-info-value">{{ detail.description || '-' }}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">备注</div>
              <div class="detail-info-value">{{ detail.remark || '-' }}</div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-label">创建时间</div>
              <div class="detail-info-value">{{ detail.createdTime }}</div>
            </div>
          </div>
        </div>

        <div class="detail-summary">
          <div class="detail-summary-item">
            <div class="detail-summary-label">总欠款</div>
            <div class="detail-summary-value">¥{{ formatAmount(detail.totalAmount) }}</div>
          </div>
          <div class="detail-summary-item">
            <div class="detail-summary-label">已还</div>
            <div class="detail-summary-value detail-summary-value--primary">¥{{ formatAmount(detail.paidAmount) }}</div>
          </div>
          <div class="detail-summary-item">
            <div class="detail-summary-label">剩余</div>
            <div class="detail-summary-value detail-summary-value--danger">
              ¥{{ formatAmount(detail.remainingAmount) }}
            </div>
          </div>
        </div>

        <div class="detail-table-section">
          <div class="detail-table-title">还款记录</div>
          <t-table
            :data="detail.repayments"
            :columns="tableColumns"
            row-key="id"
            size="small"
            bordered
            data-testid="detail-repay-table"
            :empty="tableEmpty"
          >
            <template #paymentDate="{ row }">
              {{ row.paymentDate?.slice(0, 10) ?? '-' }}
            </template>
            <template #amount="{ row }">
              <span class="detail-amount-cell">¥{{ formatAmount(row.amount) }}</span>
            </template>
            <template #paymentChannel="{ row }">
              {{ getPaymentChannelText(row.paymentChannel) }}
            </template>
            <template #op="{ row }">
              <t-link
                theme="danger"
                hover="color"
                :data-testid="`detail-delete-repay-${row.id}`"
                @click="handleDeleteRepayment(row.id)"
              >
                删除
              </t-link>
            </template>
          </t-table>
        </div>
      </template>
    </t-loading>

    <template #footer>
      <t-button variant="outline" data-testid="detail-close-btn" @click="handleClose"> 关闭 </t-button>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import { deleteRepayment, getDebtDetail } from '@/api/debt';
import type { DebtDetail, PaymentChannel } from '@/api/model/debtModel';
import { DebtStatus, PAYMENT_CHANNEL_MAP } from '@/api/model/debtModel';

interface Props {
  visible: boolean;
  debtId: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'refresh'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const loading = ref(false);
const detail = ref<DebtDetail | null>(null);
const tableEmpty = ref('暂无还款记录');

const tableColumns = computed(() => [
  { colKey: 'paymentDate', title: '日期', width: 110 },
  { colKey: 'amount', title: '金额', width: 110 },
  { colKey: 'paymentChannel', title: '方式', width: 90 },
  { colKey: 'remark', title: '备注', ellipsis: true },
  { colKey: 'op', title: '操作', width: 70 },
]);

function formatAmount(value: number | undefined): string {
  if (!value || !Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

function getPaymentChannelText(channel: number): string {
  return PAYMENT_CHANNEL_MAP[channel as PaymentChannel] ?? '-';
}

async function fetchDetail() {
  if (!props.debtId) return;

  loading.value = true;
  try {
    const res = await getDebtDetail(props.debtId);
    detail.value = res;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '获取欠款详情失败';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      fetchDetail();
    } else {
      detail.value = null;
    }
  },
);

async function handleDeleteRepayment(repayId: number) {
  try {
    await deleteRepayment(repayId);
    MessagePlugin.success('删除还款记录成功');
    await fetchDetail();
    emit('refresh');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '删除还款记录失败';
    MessagePlugin.error(errorMessage);
  }
}

function handleClose() {
  detail.value = null;
  emit('update:visible', false);
}
</script>
<style lang="less" scoped>
.detail-content {
  min-height: 200px;
}

.detail-info-grid {
  display: flex;
  gap: 24px;
}

.detail-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-info-label {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.detail-info-value {
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.detail-summary {
  display: flex;
  gap: 0;
  margin-top: 20px;
  padding: 16px;
  background-color: var(--td-brand-color-light, #ecf2fe);
  border-radius: 8px;
}

.detail-summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-summary-label {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.detail-summary-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--td-text-color-primary);

  &--primary {
    color: var(--td-brand-color);
  }

  &--danger {
    color: var(--td-error-color);
  }
}

.detail-table-section {
  margin-top: 20px;
}

.detail-table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 12px;
}
</style>
