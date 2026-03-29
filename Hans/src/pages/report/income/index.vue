<template>
  <div class="income-report">
    <t-card class="report-card" :bordered="false">
      <!-- 年份选择器 -->
      <div class="report-header">
        <div class="year-selector">
          <t-button variant="outline" :disabled="currentYear <= minYear" @click="changeYear(-1)">
            <template #icon><t-icon name="chevron-left" /></template>
          </t-button>
          <span class="year-text">{{ currentYear }} 年</span>
          <t-button variant="outline" :disabled="currentYear >= maxYear" @click="changeYear(1)">
            <template #icon><t-icon name="chevron-right" /></template>
          </t-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <t-loading text="加载中..." size="large" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!reportData" class="empty-container">
        <t-icon name="chart-pie" size="64px" style="color: var(--td-text-color-placeholder)" />
        <p>暂无数据</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <!-- 年度汇总卡片 -->
        <div class="summary-cards" data-testid="summary-cards">
          <div class="summary-card income" data-testid="income-card">
            <div class="card-icon">
              <t-icon name="chart-line" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">年度总收入</span>
              <span class="card-value" data-testid="total-income"> ¥{{ formatMoney(reportData.totalIncome) }} </span>
            </div>
          </div>
          <div class="summary-card expense" data-testid="expense-card">
            <div class="card-icon">
              <t-icon name="minus-circle" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">年度总支出</span>
              <span class="card-value" data-testid="total-expense"> ¥{{ formatMoney(reportData.totalExpense) }} </span>
            </div>
          </div>
          <div class="summary-card profit" :class="{ negative: reportData.netProfit < 0 }" data-testid="profit-card">
            <div class="card-icon">
              <t-icon name="money-circle" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">年度净利润</span>
              <span class="card-value" data-testid="net-profit">
                {{ reportData.netProfit < 0 ? '-' : '' }}¥{{ formatMoney(Math.abs(reportData.netProfit)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 收入构成 -->
        <div class="income-breakdown" data-testid="income-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">租金收入</span>
            <span class="breakdown-value">¥{{ formatMoney(reportData.totalRentIncome) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">水电费收入</span>
            <span class="breakdown-value">¥{{ formatMoney(reportData.totalUtilityIncome) }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">押金收入</span>
            <span class="breakdown-value">¥{{ formatMoney(reportData.totalDepositIncome) }}</span>
          </div>
        </div>

        <!-- 月度明细表格 -->
        <div class="monthly-details">
          <h3 class="section-title">月度明细</h3>
          <div class="table-wrapper">
            <t-table
              :data="reportData.monthlyDetails"
              :columns="columns"
              row-key="month"
              :hover="true"
              data-testid="monthly-table"
            >
              <template #monthText="{ row }">
                <span class="month-text">{{ row.monthText }}</span>
              </template>
              <template #rentIncome="{ row }">
                <span class="amount">¥{{ formatMoney(row.rentIncome) }}</span>
              </template>
              <template #utilityIncome="{ row }">
                <span class="amount">¥{{ formatMoney(row.utilityIncome) }}</span>
              </template>
              <template #depositIncome="{ row }">
                <span class="amount deposit">¥{{ formatMoney(row.depositIncome) }}</span>
              </template>
              <template #totalIncome="{ row }">
                <span class="amount income">¥{{ formatMoney(row.totalIncome) }}</span>
              </template>
              <template #expense="{ row }">
                <span class="amount expense">¥{{ formatMoney(row.expense) }}</span>
              </template>
              <template #netProfit="{ row }">
                <span class="amount" :class="{ profit: row.netProfit >= 0, loss: row.netProfit < 0 }">
                  {{ row.netProfit < 0 ? '-' : '' }}¥{{ formatMoney(Math.abs(row.netProfit)) }}
                </span>
              </template>
            </t-table>
          </div>
        </div>
      </template>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { IncomeReport } from '@/api/model/reportModel';
import { getIncomeReport } from '@/api/report';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'IncomeReport',
});

// ==================== 状态 ====================

const loading = ref(false);
const reportData = ref<IncomeReport | null>(null);

// 年份范围限制：最早 2020 年，最晚当前年份
const thisYear = new Date().getFullYear();
const minYear = 2020;
const maxYear = thisYear;
const currentYear = ref(thisYear);

// 表格列配置 - 响应式处理
const columns = computed<PrimaryTableCol[]>(() => {
  const baseColumns: PrimaryTableCol[] = [
    { colKey: 'monthText', title: '月份', width: 80, ellipsis: true },
    { colKey: 'rentIncome', title: '租金收入', width: 110, ellipsis: true },
    { colKey: 'utilityIncome', title: '水电费收入', width: 111, ellipsis: true },
    { colKey: 'depositIncome', title: '押金收入', width: 111, ellipsis: true },
    { colKey: 'totalIncome', title: '总收入', width: 111, ellipsis: true },
    { colKey: 'expense', title: '支出', width: 111, ellipsis: true },
    { colKey: 'netProfit', title: '净利润', width: 111, ellipsis: true },
  ];
  return baseColumns;
});

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  try {
    const result = await getIncomeReport(currentYear.value);
    reportData.value = result;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取收支统计数据失败');
  } finally {
    loading.value = false;
  }
}

// 切换年份（带边界验证）
function changeYear(delta: number) {
  const newYear = currentYear.value + delta;
  if (newYear < minYear || newYear > maxYear) {
    return;
  }
  currentYear.value = newYear;
  fetchData();
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.income-report {
  .report-card {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
  }

  .report-header {
    display: flex;
    justify-content: center;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .year-selector {
    display: flex;
    align-items: center;
    gap: 16px;

    .year-text {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      min-width: 100px;
      text-align: center;
    }
  }

  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: var(--td-text-color-placeholder);

    p {
      margin-top: 16px;
      font-size: 14px;
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-large);

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--td-radius-default);
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .card-label {
      font-size: 13px;
      color: var(--td-text-color-secondary);
    }

    .card-value {
      font-size: 20px;
      font-weight: 600;
    }

    &.income {
      .card-icon {
        background: rgba(0, 168, 112, 0.1);
        color: var(--td-success-color);
      }
      .card-value {
        color: var(--td-success-color);
      }
    }

    &.expense {
      .card-icon {
        background: rgba(237, 123, 47, 0.1);
        color: var(--td-warning-color);
      }
      .card-value {
        color: var(--td-warning-color);
      }
    }

    &.profit {
      .card-icon {
        background: rgba(0, 82, 217, 0.1);
        color: var(--td-brand-color);
      }
      .card-value {
        color: var(--td-brand-color);
      }

      &.negative {
        .card-icon {
          background: rgba(227, 77, 77, 0.1);
          color: var(--td-error-color);
        }
        .card-value {
          color: var(--td-error-color);
        }
      }
    }
  }

  .income-breakdown {
    display: flex;
    gap: 24px;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breakdown-label {
      font-size: 13px;
      color: var(--td-text-color-secondary);
    }

    .breakdown-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }
  }

  .monthly-details {
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin-bottom: 16px;
    }

    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .month-text {
      font-weight: 500;
    }

    .amount {
      font-weight: 500;

      &.income {
        color: var(--td-success-color);
      }

      &.expense {
        color: var(--td-warning-color);
      }

      &.deposit {
        color: var(--td-brand-color);
        opacity: 0.7;
      }

      &.profit {
        color: var(--td-brand-color);
      }

      &.loss {
        color: var(--td-error-color);
      }
    }
  }
}

@media (max-width: 768px) {
  .income-report {
    .summary-cards {
      grid-template-columns: 1fr;
    }

    .income-breakdown {
      flex-direction: column;
      gap: 12px;
    }

    .monthly-details {
      .table-wrapper {
        margin: 0 -16px;
        padding: 0 16px;
      }
    }
  }
}
</style>
