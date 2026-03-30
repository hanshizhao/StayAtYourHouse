<template>
  <div class="finance-summary" data-testid="finance-summary">
    <div class="finance-title">本月收支摘要</div>

    <!-- 收支网格 -->
    <div class="finance-grid">
      <div class="finance-item rent-income">
        <span class="finance-label">租金收入</span>
        <span class="finance-value" data-testid="rent-income">¥{{ formatMoney(rentIncome) }}</span>
      </div>
      <div class="finance-item utility-income">
        <span class="finance-label">水电收入</span>
        <span class="finance-value" data-testid="utility-income">¥{{ formatMoney(utilityIncome) }}</span>
      </div>
      <div class="finance-item expense">
        <span class="finance-label">支出</span>
        <span class="finance-value" data-testid="expense">¥{{ formatMoney(expense) }}</span>
      </div>
      <div class="finance-item net-profit">
        <span class="finance-label">净利润</span>
        <span class="finance-value" data-testid="net-profit">¥{{ formatMoney(netProfit) }}</span>
      </div>
    </div>

    <!-- 出租率 -->
    <div class="occupancy-section" data-testid="occupancy-section">
      <div class="occupancy-header">
        <span class="occupancy-label">整体出租率</span>
        <span class="occupancy-value" data-testid="occupancy-rate">{{ occupancyRate.toFixed(1) }}%</span>
      </div>
      <t-progress
        :percentage="occupancyRate"
        :status="getProgressStatus(occupancyRate)"
        size="large"
        data-testid="occupancy-progress"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format';

import { getProgressStatus } from '../utils/progressUtils';

defineOptions({
  name: 'FinanceSummary',
});

defineProps<{
  rentIncome: number;
  utilityIncome: number;
  expense: number;
  netProfit: number;
  occupancyRate: number;
}>();
</script>

<style lang="less" scoped>
.finance-summary {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  padding: 20px;
}

.finance-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 16px;
}

.finance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.finance-item {
  padding: 10px 12px;
  border-radius: var(--td-radius-default);
  display: flex;
  flex-direction: column;
  gap: 4px;

  .finance-label {
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }

  .finance-value {
    font-size: 16px;
    font-weight: 600;
  }

  &.rent-income {
    background: rgba(0, 82, 217, 0.06);
    .finance-value { color: var(--td-brand-color); }
  }

  &.utility-income {
    background: rgba(0, 168, 112, 0.06);
    .finance-value { color: var(--td-success-color); }
  }

  &.expense {
    background: rgba(237, 123, 47, 0.06);
    .finance-value { color: var(--td-warning-color); }
  }

  &.net-profit {
    background: rgba(0, 82, 217, 0.06);
    .finance-value { color: var(--td-brand-color); }
  }
}

.occupancy-section {
  padding-top: 12px;
  border-top: 1px solid var(--td-component-border);

  .occupancy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .occupancy-label {
    font-size: 14px;
    color: var(--td-text-color-secondary);
  }

  .occupancy-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-brand-color);
  }
}

@media (max-width: 576px) {
  .finance-grid {
    grid-template-columns: 1fr;
  }
}
</style>
