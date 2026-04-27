<template>
  <t-card class="debt-card">
    <div class="debt-card__header">
      <div class="debt-card__tenant">
        <span class="debt-card__name">{{ data.tenantName }}</span>
        <span class="debt-card__phone">{{ data.tenantPhone || '&nbsp;' }}</span>
      </div>
      <t-tag :theme="statusTheme" variant="light" size="small">
        {{ data.statusText }}
      </t-tag>
    </div>

    <div class="debt-card__progress">
      <div class="debt-card__amounts">
        <span class="debt-card__amount-label">已还 / 总欠款</span>
        <span class="debt-card__amount-value">
          <span class="debt-card__paid">¥{{ formatAmount(data.paidAmount) }}</span>
          <span class="debt-card__separator">/</span>
          <span class="debt-card__total">¥{{ formatAmount(data.totalAmount) }}</span>
        </span>
      </div>
      <t-progress :percentage="paidPercentage" :status="progressStatus" size="small" :label="false" />
    </div>

    <div v-if="data.description" class="debt-card__description">
      <span class="debt-card__description-label">欠款说明：</span>
      <t-tooltip :content="data.description" placement="top">
        <span class="debt-card__description-text">{{ data.description }}</span>
      </t-tooltip>
    </div>

    <div class="debt-card__footer">
      <t-space size="small">
        <t-button
          size="small"
          theme="primary"
          :disabled="data.status === DebtStatus.Settled"
          @click="emit('repay', data)"
        >
          还款
        </t-button>
        <t-button size="small" variant="outline" theme="default" @click="emit('detail', data)"> 详情 </t-button>
        <t-button size="small" variant="outline" theme="default" @click="emit('edit', data)"> 编辑 </t-button>
        <t-button size="small" variant="outline" theme="danger" @click="emit('delete', data)"> 删除 </t-button>
      </t-space>
    </div>
  </t-card>
</template>
<script setup lang="ts">
import { computed } from 'vue';

import type { DebtListItem } from '@/api/model/debtModel';
import { DebtStatus } from '@/api/model/debtModel';

defineOptions({ name: 'DebtCard' });

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'repay', item: DebtListItem): void;
  (e: 'detail', item: DebtListItem): void;
  (e: 'edit', item: DebtListItem): void;
  (e: 'delete', item: DebtListItem): void;
}>();

interface Props {
  data: DebtListItem;
}

const statusTheme = computed(() => {
  return props.data.status === DebtStatus.Settled ? 'success' : 'warning';
});

const paidPercentage = computed(() => {
  const { totalAmount, paidAmount } = props.data;
  if (!Number.isFinite(totalAmount) || !Number.isFinite(paidAmount) || totalAmount <= 0) return 0;
  return Math.min(Math.round((paidAmount / totalAmount) * 100), 100);
});

const progressStatus = computed(() => {
  if (props.data.status === DebtStatus.Settled) return 'success' as const;
  if (paidPercentage.value >= 80) return 'warning' as const;
  return 'active' as const;
});

function formatAmount(amount: number): string {
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}
</script>
<style lang="less" scoped>
.debt-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.t-card__body) {
    padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
    display: flex;
    flex-direction: column;
    gap: var(--td-comp-margin-l);
    flex: 1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__tenant {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__phone {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__amounts {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__amount-label {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  &__amount-value {
    font-size: 13px;
    font-weight: 500;
  }

  &__paid {
    color: var(--td-success-color);
  }

  &__separator {
    margin: 0 2px;
    color: var(--td-text-color-placeholder);
  }

  &__total {
    color: var(--td-text-color-primary);
  }

  &__description {
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__description-label {
    flex-shrink: 0;
    color: var(--td-text-color-placeholder);
  }

  &__description-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--td-text-color-secondary);
  }

  &__footer {
    margin-top: auto;
    padding-top: calc(var(--td-comp-margin-s) + 10px);
    border-top: 1px solid var(--td-component-border);
  }
}
</style>
