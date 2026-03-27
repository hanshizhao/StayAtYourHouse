<template>
  <div class="collection-report">
    <t-card class="report-card" :bordered="false">
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
      <div v-else-if="!reportData" class="empty-container">
        <t-icon name="chart-line" size="64px" style="color: var(--td-text-color-placeholder)" />
        <p>暂无数据</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <!-- 筛选区域 -->
        <div class="filter-section" data-testid="filter-section">
          <div class="filter-item">
            <span class="filter-label">年份</span>
            <t-select
              v-model="selectedYear"
              :options="yearOptions"
              placeholder="请选择年份"
              @change="handleFilterChange"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">月份</span>
            <t-select
              v-model="selectedMonth"
              :options="monthOptions"
              placeholder="请选择月份"
              clearable
              @change="handleFilterChange"
            />
          </div>
          <div class="filter-actions">
            <t-button theme="primary" @click="handleQuery"> 查询 </t-button>
            <t-button theme="default" @click="handleReset"> 重置 </t-button>
          </div>
        </div>

        <!-- 汇总信息 -->
        <div class="summary-section" data-testid="summary-section">
          <div class="summary-header">
            <span class="summary-title">{{ reportData.monthText }} 催收统计</span>
            <div class="collection-rate">
              <span class="rate-label">收款率</span>
              <span class="rate-value" data-testid="collection-rate">{{
                formatPercent(collectionRateDecimal, 1)
              }}</span>
            </div>
          </div>
          <t-progress
            :percentage="reportData.collectionRate"
            :status="getProgressStatus(collectionRateDecimal)"
            size="large"
            data-testid="collection-progress"
          />
        </div>

        <!-- 统计卡片 -->
        <div class="stats-cards" data-testid="stats-cards">
          <div class="stat-card total" data-testid="total-card">
            <div class="card-icon">
              <t-icon name="file-money" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">应收账单</span>
              <span class="card-value" data-testid="total-bills">{{ reportData.totalBills }}</span>
              <span class="card-unit">笔</span>
            </div>
            <div class="card-amount" data-testid="total-amount">¥{{ formatMoney(reportData.totalAmount) }}</div>
          </div>
          <div class="stat-card paid" data-testid="paid-card">
            <div class="card-icon">
              <t-icon name="check-circle" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">已收款</span>
              <span class="card-value" data-testid="paid-bills">{{ reportData.paidBills }}</span>
              <span class="card-unit">笔</span>
            </div>
            <div class="card-amount success" data-testid="paid-amount">¥{{ formatMoney(reportData.paidAmount) }}</div>
          </div>
          <div class="stat-card pending" data-testid="pending-card">
            <div class="card-icon">
              <t-icon name="time" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">待收款</span>
              <span class="card-value" data-testid="pending-bills">{{ reportData.pendingBills }}</span>
              <span class="card-unit">笔</span>
            </div>
            <div class="card-amount warning" data-testid="pending-amount">
              ¥{{ formatMoney(reportData.pendingAmount) }}
            </div>
          </div>
          <div class="stat-card overdue" data-testid="overdue-card">
            <div class="card-icon">
              <t-icon name="close-circle" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">逾期账单</span>
              <span class="card-value" data-testid="overdue-bills">{{ reportData.overdueBills }}</span>
              <span class="card-unit">笔</span>
            </div>
            <div class="card-amount danger" data-testid="overdue-amount">
              ¥{{ formatMoney(reportData.overdueAmount) }}
            </div>
          </div>
        </div>

        <!-- 逾期名单 -->
        <div class="overdue-section">
          <h3 class="section-title">
            逾期名单
            <span v-if="reportData.overdueList.length > 0" class="overdue-count">
              （{{ reportData.overdueList.length }} 笔）
            </span>
          </h3>

          <div v-if="reportData.overdueList.length > 0" class="table-wrapper" data-testid="overdue-table-wrapper">
            <t-table
              :data="reportData.overdueList"
              :columns="overdueColumns"
              row-key="billId"
              :hover="true"
              data-testid="overdue-table"
            >
              <template #tenantName="{ row }">
                <span class="tenant-name">{{ row.tenantName }}</span>
              </template>
              <template #roomInfo="{ row }">
                <span class="room-info">{{ row.roomInfo }}</span>
              </template>
              <template #totalAmount="{ row }">
                <span class="amount overdue">¥{{ formatMoney(row.totalAmount) }}</span>
              </template>
              <template #overdueDays="{ row }">
                <t-tag :theme="getOverdueDaysTheme(row.overdueDays)" variant="light"> {{ row.overdueDays }} 天 </t-tag>
              </template>
            </t-table>
          </div>

          <div v-else class="no-overdue">
            <t-icon name="check-circle" size="32px" style="color: var(--td-success-color)" />
            <span>暂无逾期账单</span>
          </div>
        </div>

        <!-- 宽限名单 -->
        <div class="grace-section">
          <h3 class="section-title">
            宽限中账单
            <span v-if="reportData.graceList.length > 0" class="grace-count">
              （{{ reportData.graceList.length }} 笔）
            </span>
          </h3>

          <div v-if="reportData.graceList.length > 0" class="table-wrapper" data-testid="grace-table-wrapper">
            <t-table
              :data="reportData.graceList"
              :columns="graceColumns"
              row-key="billId"
              :hover="true"
              data-testid="grace-table"
            >
              <template #tenantName="{ row }">
                <span class="tenant-name">{{ row.tenantName }}</span>
              </template>
              <template #roomInfo="{ row }">
                <span class="room-info">{{ row.roomInfo }}</span>
              </template>
              <template #totalAmount="{ row }">
                <span class="amount grace">¥{{ formatMoney(row.totalAmount) }}</span>
              </template>
              <template #remainingDays="{ row }">
                <t-tag theme="warning" variant="light"> 剩余 {{ row.remainingDays }} 天 </t-tag>
              </template>
            </t-table>
          </div>

          <div v-else class="no-grace">
            <t-icon name="info-circle" size="32px" style="color: var(--td-text-color-placeholder)" />
            <span>暂无宽限中账单</span>
          </div>
        </div>

        <!-- 导出按钮 -->
        <div class="export-section">
          <t-button theme="default" @click="handleExport">
            <template #icon><t-icon name="download" /></template>
            导出报表
          </t-button>
        </div>
      </template>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { CollectionReport } from '@/api/model/reportModel';
import { getCollectionReport } from '@/api/report';
import { formatMoney, formatPercent } from '@/utils/format';

defineOptions({
  name: 'CollectionReport',
});

// ==================== 状态 ====================

const loading = ref(false);
const hasError = ref(false);
const reportData = ref<CollectionReport | null>(null);

// 筛选条件
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const selectedMonth = ref<number | undefined>(new Date().getMonth() + 1);

// 年份选项（最近5年）
const yearOptions = computed(() => {
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push({ label: `${currentYear - i} 年`, value: currentYear - i });
  }
  return years;
});

// 月份选项
const monthOptions = computed(() => {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push({ label: `${i} 月`, value: i });
  }
  return months;
});

// 将百分比转换为小数（用于显示和进度条）
const collectionRateDecimal = computed(() => {
  if (!reportData.value) return 0;
  return reportData.value.collectionRate / 100;
});

// 逾期名单表格列配置
const overdueColumns: PrimaryTableCol[] = [
  { colKey: 'tenantName', title: '租客姓名', ellipsis: true },
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'periodText', title: '账单周期', width: 120 },
  { colKey: 'totalAmount', title: '账单金额', width: 120, align: 'right' },
  { colKey: 'overdueDays', title: '逾期天数', width: 100, align: 'center' },
];

// 宽限名单表格列配置
const graceColumns: PrimaryTableCol[] = [
  { colKey: 'tenantName', title: '租客姓名', ellipsis: true },
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'periodText', title: '账单周期', width: 120 },
  { colKey: 'totalAmount', title: '账单金额', width: 120, align: 'right' },
  { colKey: 'remainingDays', title: '宽限剩余', width: 100, align: 'center' },
];

// ==================== 工具函数 ====================

// 根据收款率获取进度条状态
function getProgressStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 0.9) return 'success';
  if (rate >= 0.7) return 'warning';
  return 'error';
}

// 根据逾期天数获取标签主题
function getOverdueDaysTheme(days: number): 'warning' | 'danger' | 'default' {
  if (days <= 7) return 'warning';
  return 'danger';
}

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  hasError.value = false;
  try {
    const result = await getCollectionReport(selectedYear.value, selectedMonth.value);
    reportData.value = result;
  } catch (e: unknown) {
    const error = e as { message?: string };
    hasError.value = true;
    MessagePlugin.error(error.message || '获取催收统计数据失败');
  } finally {
    loading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleFilterChange() {
  // 筛选条件变化时，可以自动查询或等待用户点击查询按钮
}

function handleQuery() {
  fetchData();
}

function handleReset() {
  selectedYear.value = currentYear;
  selectedMonth.value = new Date().getMonth() + 1;
  fetchData();
}

function handleExport() {
  // TODO: 导出功能待实现
  MessagePlugin.info('导出功能开发中...');
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.collection-report {
  .report-card {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
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

  .filter-section {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .filter-label {
        font-size: 12px;
        color: var(--td-text-color-secondary);
      }

      .t-select {
        width: 140px;
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
  }

  .summary-section {
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .summary-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .collection-rate {
      display: flex;
      align-items: center;
      gap: 8px;

      .rate-label {
        font-size: 14px;
        color: var(--td-text-color-secondary);
      }

      .rate-value {
        font-size: 20px;
        font-weight: 600;
        color: var(--td-brand-color);
      }
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
      align-items: baseline;
      gap: 4px;
    }

    .card-label {
      font-size: 13px;
      color: var(--td-text-color-secondary);
    }

    .card-value {
      font-size: 24px;
      font-weight: 600;
    }

    .card-unit {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
    }

    .card-amount {
      font-size: 14px;
      font-weight: 500;

      &.success {
        color: var(--td-success-color);
      }

      &.warning {
        color: var(--td-warning-color);
      }

      &.danger {
        color: var(--td-error-color);
      }
    }

    &.total {
      .card-icon {
        background: rgba(0, 82, 217, 0.1);
        color: var(--td-brand-color);
      }
      .card-value {
        color: var(--td-brand-color);
      }
      .card-amount {
        color: var(--td-brand-color);
      }
    }

    &.paid {
      .card-icon {
        background: rgba(0, 168, 112, 0.1);
        color: var(--td-success-color);
      }
      .card-value {
        color: var(--td-success-color);
      }
    }

    &.pending {
      .card-icon {
        background: rgba(237, 123, 47, 0.1);
        color: var(--td-warning-color);
      }
      .card-value {
        color: var(--td-warning-color);
      }
    }

    &.overdue {
      .card-icon {
        background: rgba(227, 77, 77, 0.1);
        color: var(--td-error-color);
      }
      .card-value {
        color: var(--td-error-color);
      }
    }
  }

  .overdue-section,
  .grace-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin-bottom: 16px;

      .overdue-count,
      .grace-count {
        font-size: 14px;
        font-weight: 400;
        color: var(--td-text-color-placeholder);
      }
    }

    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tenant-name,
    .room-info {
      font-weight: 500;
    }

    .amount {
      font-weight: 500;

      &.overdue {
        color: var(--td-error-color);
      }

      &.grace {
        color: var(--td-warning-color);
      }
    }
  }

  .no-overdue,
  .no-grace {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 24px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }

  .export-section {
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 992px) {
  .collection-report {
    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 576px) {
  .collection-report {
    .stats-cards {
      grid-template-columns: 1fr;
    }

    .filter-section {
      .filter-item {
        flex: 1;
        min-width: 120px;

        .t-select {
          width: 100%;
        }
      }

      .filter-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .overdue-section,
    .grace-section {
      .table-wrapper {
        margin: 0 -16px;
        padding: 0 16px;
      }
    }
  }
}
</style>
