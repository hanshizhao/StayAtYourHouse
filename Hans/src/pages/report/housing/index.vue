<template>
  <div class="housing-report">
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
        <t-icon name="home" size="64px" style="color: var(--td-text-color-placeholder)" />
        <p>暂无数据</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <!-- 统计卡片 -->
        <div class="stats-cards" data-testid="stats-cards">
          <div class="stat-card total" data-testid="total-card">
            <div class="card-icon">
              <t-icon name="home" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">总房源</span>
              <span class="card-value" data-testid="total-rooms">{{ reportData.totalRooms }}</span>
              <span class="card-unit">间</span>
            </div>
          </div>
          <div class="stat-card rented" data-testid="rented-card">
            <div class="card-icon">
              <t-icon name="user-checked" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">已出租</span>
              <span class="card-value" data-testid="rented-rooms">{{ reportData.rentedRooms }}</span>
              <span class="card-unit">间</span>
            </div>
          </div>
          <div class="stat-card vacant" data-testid="vacant-card">
            <div class="card-icon">
              <t-icon name="user-clear" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">空置</span>
              <span class="card-value" data-testid="vacant-rooms">{{ reportData.vacantRooms }}</span>
              <span class="card-unit">间</span>
            </div>
          </div>
          <div class="stat-card renovating" data-testid="renovating-card">
            <div class="card-icon">
              <t-icon name="tools" size="24px" />
            </div>
            <div class="card-content">
              <span class="card-label">装修中</span>
              <span class="card-value" data-testid="renovating-rooms">{{ reportData.renovatingRooms }}</span>
              <span class="card-unit">间</span>
            </div>
          </div>
        </div>

        <!-- 出租率 -->
        <div class="occupancy-section" data-testid="occupancy-section">
          <div class="occupancy-header">
            <span class="occupancy-label">整体出租率</span>
            <span class="occupancy-value" data-testid="occupancy-rate">{{ formatPercent(reportData.occupancyRate, 1) }}</span>
          </div>
          <t-progress
            :percentage="reportData.occupancyRate * 100"
            :status="getProgressStatus(reportData.occupancyRate)"
            size="large"
            data-testid="occupancy-progress"
          />
        </div>

        <!-- 小区统计 -->
        <div class="community-stats">
          <h3 class="section-title">小区统计</h3>
          <div class="table-wrapper" data-testid="community-table-wrapper" v-if="reportData.communityStats.length > 0">
            <t-table
              :data="reportData.communityStats"
              :columns="communityColumns"
              row-key="communityId"
              :hover="true"
              data-testid="community-table"
            >
              <template #communityName="{ row }">
                <span class="community-name">{{ row.communityName }}</span>
              </template>
              <template #totalRooms="{ row }">
                <span class="room-count">{{ row.totalRooms }}</span>
              </template>
              <template #rentedRooms="{ row }">
                <span class="room-count rented">{{ row.rentedRooms }}</span>
              </template>
              <template #vacantRooms="{ row }">
                <span class="room-count vacant">{{ row.vacantRooms }}</span>
              </template>
              <template #occupancyRate="{ row }">
                <div class="rate-cell">
                  <t-progress
                    :percentage="row.occupancyRate * 100"
                    :status="getProgressStatus(row.occupancyRate)"
                    size="small"
                  />
                  <span class="rate-text">{{ formatPercent(row.occupancyRate, 0) }}</span>
                </div>
              </template>
            </t-table>
          </div>
          <div v-else class="no-data-tip">
            <t-icon name="info-circle" size="24px" style="color: var(--td-text-color-placeholder)" />
            <span>暂无小区统计数据</span>
          </div>
        </div>

        <!-- 空置房源列表 -->
        <div class="vacant-rooms" v-if="reportData.vacantRoomList.length > 0">
          <h3 class="section-title">
            空置房源
            <span class="vacant-count">（{{ reportData.vacantRoomList.length }} 间）</span>
          </h3>
          <div class="table-wrapper" data-testid="vacant-table-wrapper">
            <t-table
              :data="reportData.vacantRoomList"
              :columns="vacantColumns"
              row-key="roomId"
              :hover="true"
              data-testid="vacant-table"
            >
              <template #roomInfo="{ row }">
                <span class="room-info">{{ row.roomInfo }}</span>
              </template>
              <template #vacantDays="{ row }">
                <t-tag :theme="getVacantDaysTheme(row.vacantDays)" variant="light">
                  {{ row.vacantDays }} 天
                </t-tag>
              </template>
              <template #monthlyRent="{ row }">
                <span class="rent-amount">¥{{ formatMoney(row.monthlyRent) }}</span>
              </template>
            </t-table>
          </div>
        </div>

        <!-- 空置房源为空 -->
        <div v-else class="no-vacant">
          <t-icon name="check-circle" size="32px" style="color: var(--td-success-color)" />
          <span>暂无空置房源，所有房源均已出租</span>
        </div>
      </template>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getHousingOverview } from '@/api/report';
import type { HousingOverview } from '@/api/model/reportModel';
import { formatMoney, formatPercent } from '@/utils/format';

defineOptions({
  name: 'HousingReport',
});

// ==================== 状态 ====================

const loading = ref(false);
const hasError = ref(false);
const reportData = ref<HousingOverview | null>(null);

// 小区统计表格列配置（静态配置，无需响应式）
const communityColumns: PrimaryTableCol[] = [
  { colKey: 'communityName', title: '小区名称', ellipsis: true },
  { colKey: 'totalRooms', title: '总房源', width: 80, align: 'center' },
  { colKey: 'rentedRooms', title: '已出租', width: 80, align: 'center' },
  { colKey: 'vacantRooms', title: '空置', width: 80, align: 'center' },
  { colKey: 'occupancyRate', title: '出租率', width: 160 },
];

// 空置房源表格列配置（静态配置，无需响应式）
const vacantColumns: PrimaryTableCol[] = [
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'vacantDays', title: '空置天数', width: 100, align: 'center' },
  { colKey: 'monthlyRent', title: '月租金', width: 120, align: 'right' },
];

// ==================== 工具函数 ====================

// 根据出租率获取进度条状态
function getProgressStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 0.8)
    return 'success';
  if (rate >= 0.5)
    return 'warning';
  return 'error';
}

// 根据空置天数获取标签主题
function getVacantDaysTheme(days: number): 'success' | 'warning' | 'danger' | 'default' {
  if (days <= 7)
    return 'success';
  if (days <= 30)
    return 'warning';
  return 'danger';
}

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  hasError.value = false;
  try {
    const result = await getHousingOverview();
    reportData.value = result;
  }
  catch (e: unknown) {
    const error = e as { message?: string };
    hasError.value = true;
    MessagePlugin.error(error.message || '获取房源概览数据失败');
  }
  finally {
    loading.value = false;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.housing-report {
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

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
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
      gap: 2px;
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

    &.total {
      .card-icon {
        background: rgba(0, 82, 217, 0.1);
        color: var(--td-brand-color);
      }
      .card-value {
        color: var(--td-brand-color);
      }
    }

    &.rented {
      .card-icon {
        background: rgba(0, 168, 112, 0.1);
        color: var(--td-success-color);
      }
      .card-value {
        color: var(--td-success-color);
      }
    }

    &.vacant {
      .card-icon {
        background: rgba(237, 123, 47, 0.1);
        color: var(--td-warning-color);
      }
      .card-value {
        color: var(--td-warning-color);
      }
    }

    &.renovating {
      .card-icon {
        background: rgba(227, 77, 77, 0.1);
        color: var(--td-error-color);
      }
      .card-value {
        color: var(--td-error-color);
      }
    }
  }

  .occupancy-section {
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);

    .occupancy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .occupancy-label {
      font-size: 14px;
      color: var(--td-text-color-secondary);
    }

    .occupancy-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--td-brand-color);
    }
  }

  .community-stats,
  .vacant-rooms {
    margin-bottom: 24px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
      margin-bottom: 16px;

      .vacant-count {
        font-size: 14px;
        font-weight: 400;
        color: var(--td-text-color-placeholder);
      }
    }

    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .community-name {
      font-weight: 500;
    }

    .room-count {
      font-weight: 500;

      &.rented {
        color: var(--td-success-color);
      }

      &.vacant {
        color: var(--td-warning-color);
      }
    }

    .rate-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .t-progress {
        flex: 1;
        min-width: 80px;
      }

      .rate-text {
        font-size: 13px;
        font-weight: 500;
        color: var(--td-text-color-primary);
        min-width: 40px;
        text-align: right;
      }
    }

    .room-info {
      font-weight: 500;
    }

    .rent-amount {
      font-weight: 500;
      color: var(--td-brand-color);
    }
  }

  .no-vacant {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 24px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }

  .no-data-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 24px;
    background: var(--td-bg-color-container-hover);
    border-radius: var(--td-radius-default);
    color: var(--td-text-color-placeholder);
    font-size: 14px;
  }
}

@media (max-width: 992px) {
  .housing-report {
    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 576px) {
  .housing-report {
    .stats-cards {
      grid-template-columns: 1fr;
    }

    .community-stats,
    .vacant-rooms {
      .table-wrapper {
        margin: 0 -16px;
        padding: 0 16px;
      }
    }
  }
}
</style>
