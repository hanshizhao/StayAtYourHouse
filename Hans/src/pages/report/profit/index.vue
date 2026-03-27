<template>
  <div class="profit-report">
    <t-card class="report-card" :bordered="false">
      <!-- 排序切换 -->
      <div class="report-header">
        <div class="sort-selector" data-testid="sort-selector">
          <t-radio-group v-model="sortBy" @change="handleSortChange">
            <t-radio-button value="monthly">按月利润排序</t-radio-button>
            <t-radio-button value="yearly">按年利润排序</t-radio-button>
          </t-radio-group>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <t-loading text="加载中..." size="large" />
      </div>

      <!-- 加载失败 -->
      <div v-else-if="hasError" class="error-container">
        <t-icon name="close-circle" size="64px" style="color: var(--td-error-color)" />
        <p>加载失败，请稍后重试</p>
        <t-button theme="primary" @click="fetchData">重新加载</t-button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!rankingData || rankingData.length === 0" class="empty-container">
        <t-icon name="chart-bar" size="64px" style="color: var(--td-text-color-placeholder)" />
        <p>暂无数据</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <!-- 汇总信息 -->
        <div class="summary-section" data-testid="summary-section">
          <div class="summary-item">
            <span class="summary-label">总房源数</span>
            <span class="summary-value" data-testid="total-rooms">{{ rankingData.length }}</span>
            <span class="summary-unit">间</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">盈利房源</span>
            <span class="summary-value profit" data-testid="profit-rooms">{{ profitCount }}</span>
            <span class="summary-unit">间</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">亏损房源</span>
            <span class="summary-value loss" data-testid="loss-rooms">{{ lossCount }}</span>
            <span class="summary-unit">间</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">总{{ sortBy === 'monthly' ? '月' : '年' }}利润</span>
            <span
              class="summary-value"
              :class="{ loss: totalProfit < 0 }"
              data-testid="total-profit"
            >
              {{ totalProfit < 0 ? '-' : '' }}¥{{ formatMoney(Math.abs(totalProfit)) }}
            </span>
          </div>
        </div>

        <!-- 排行表格 -->
        <div class="ranking-table">
          <div class="table-wrapper" data-testid="ranking-table-wrapper">
            <t-table
              :data="rankingData"
              :columns="columns"
              row-key="roomId"
              :hover="true"
              stripe
              data-testid="ranking-table"
            >
              <template #rank="{ rowIndex }">
                <div class="rank-cell" :class="getRankClass(rowIndex)">
                  <span class="rank-number">{{ rowIndex + 1 }}</span>
                </div>
              </template>
              <template #roomInfo="{ row }">
                <div class="room-info-cell">
                  <span class="room-info">{{ row.roomInfo }}</span>
                  <span class="community-name">{{ row.communityName }}</span>
                </div>
              </template>
              <template #monthlyRent="{ row }">
                <span class="amount">¥{{ formatMoney(row.monthlyRent) }}</span>
              </template>
              <template #monthlyCost="{ row }">
                <span class="amount">¥{{ formatMoney(row.monthlyCost) }}</span>
              </template>
              <template #monthlyProfit="{ row }">
                <span
                  class="amount"
                  :class="{ profit: row.monthlyProfit >= 0, loss: row.monthlyProfit < 0 }"
                >
                  {{ row.monthlyProfit < 0 ? '-' : '' }}¥{{ formatMoney(Math.abs(row.monthlyProfit)) }}
                </span>
              </template>
              <template #yearlyProfit="{ row }">
                <span
                  class="amount"
                  :class="{ profit: row.yearlyProfit >= 0, loss: row.yearlyProfit < 0 }"
                >
                  {{ row.yearlyProfit < 0 ? '-' : '' }}¥{{ formatMoney(Math.abs(row.yearlyProfit)) }}
                </span>
              </template>
              <template #profitRate="{ row }">
                <div class="rate-cell">
                  <t-progress
                    :percentage="getProfitRate(row)"
                    :status="getProfitRateStatus(row)"
                    size="small"
                  />
                  <span
                    class="rate-text"
                    :class="{ profit: row.monthlyProfit >= 0, loss: row.monthlyProfit < 0 }"
                  >
                    {{ formatPercent(getProfitRate(row) / 100, 1) }}
                  </span>
                </div>
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

import { getProfitRanking } from '@/api/report';
import type { RoomProfitRanking } from '@/api/model/reportModel';
import { formatMoney, formatPercent } from '@/utils/format';

defineOptions({
  name: 'ProfitReport',
});

// ==================== 状态 ====================

const loading = ref(false);
const hasError = ref(false);
const rankingData = ref<RoomProfitRanking[]>([]);
const sortBy = ref<'monthly' | 'yearly'>('monthly');

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'rank', title: '排名', width: 70, align: 'center' },
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'monthlyRent', title: '月租金', width: 110, align: 'right' },
  { colKey: 'monthlyCost', title: '月成本', width: 110, align: 'right' },
  { colKey: 'monthlyProfit', title: '月利润', width: 120, align: 'right' },
  { colKey: 'yearlyProfit', title: '年利润', width: 120, align: 'right' },
  { colKey: 'profitRate', title: '利润率', width: 150 },
];

// ==================== 计算属性 ====================

// 盈利房源数
const profitCount = computed(() => {
  return rankingData.value.filter(item =>
    sortBy.value === 'monthly' ? item.monthlyProfit >= 0 : item.yearlyProfit >= 0,
  ).length;
});

// 亏损房源数
const lossCount = computed(() => {
  return rankingData.value.filter(item =>
    sortBy.value === 'monthly' ? item.monthlyProfit < 0 : item.yearlyProfit < 0,
  ).length;
});

// 总利润
const totalProfit = computed(() => {
  return rankingData.value.reduce((sum, item) => {
    return sum + (sortBy.value === 'monthly' ? item.monthlyProfit : item.yearlyProfit);
  }, 0);
});

// ==================== 工具函数 ====================

// 获取排名样式类
function getRankClass(index: number): string {
  if (index === 0)
    return 'gold';
  if (index === 1)
    return 'silver';
  if (index === 2)
    return 'bronze';
  return '';
}

// 获取利润率（百分比）
function getProfitRate(row: RoomProfitRanking): number {
  if (row.monthlyCost === 0) {
    return row.monthlyProfit >= 0 ? 100 : 0;
  }
  const rate = (row.monthlyProfit / row.monthlyCost) * 100;
  // 限制在 0-100 范围内用于进度条显示
  return Math.max(0, Math.min(100, rate));
}

// 获取利润率进度条状态
function getProfitRateStatus(row: RoomProfitRanking): 'success' | 'error' | 'warning' {
  if (row.monthlyProfit < 0)
    return 'error';
  const rate = row.monthlyCost > 0 ? row.monthlyProfit / row.monthlyCost : 1;
  if (rate >= 0.5)
    return 'success';
  return 'warning';
}

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  hasError.value = false;
  try {
    const result = await getProfitRanking(sortBy.value);
    rankingData.value = result || [];
  }
  catch (e: unknown) {
    const error = e as { message?: string };
    hasError.value = true;
    MessagePlugin.error(error.message || '获取利润排行数据失败');
  }
  finally {
    loading.value = false;
  }
}

// 排序方式切换
function handleSortChange() {
  fetchData();
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.profit-report {
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

  .sort-selector {
    display: flex;
    justify-content: center;
  }

  .loading-container,
  .empty-container,
  .error-container {
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

  .error-container {
    .t-button {
      margin-top: 16px;
    }
  }

  .summary-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);

    .summary-label {
      font-size: 13px;
      color: var(--td-text-color-secondary);
    }

    .summary-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-brand-color);

      &.profit {
        color: var(--td-success-color);
      }

      &.loss {
        color: var(--td-error-color);
      }
    }

    .summary-unit {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
    }
  }

  .ranking-table {
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .rank-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      margin: 0 auto;

      &.gold {
        background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
        color: #fff;
      }

      &.silver {
        background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
        color: #fff;
      }

      &.bronze {
        background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
        color: #fff;
      }

      .rank-number {
        font-size: 13px;
        font-weight: 600;
      }
    }

    .room-info-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .room-info {
        font-weight: 500;
        color: var(--td-text-color-primary);
      }

      .community-name {
        font-size: 12px;
        color: var(--td-text-color-placeholder);
      }
    }

    .amount {
      font-weight: 500;

      &.profit {
        color: var(--td-success-color);
      }

      &.loss {
        color: var(--td-error-color);
      }
    }

    .rate-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .t-progress {
        flex: 1;
        min-width: 60px;
      }

      .rate-text {
        font-size: 12px;
        font-weight: 500;
        min-width: 45px;
        text-align: right;

        &.profit {
          color: var(--td-success-color);
        }

        &.loss {
          color: var(--td-error-color);
        }
      }
    }
  }
}

@media (max-width: 992px) {
  .profit-report {
    .summary-section {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 576px) {
  .profit-report {
    .summary-section {
      grid-template-columns: 1fr;
    }

    .report-header {
      .t-radio-group {
        flex-direction: column;

        :deep(.t-radio-button) {
          width: 100%;
        }
      }
    }

    .ranking-table {
      .table-wrapper {
        margin: 0 -16px;
        padding: 0 16px;
      }
    }
  }
}
</style>
