<template>
  <div class="community-stats" data-testid="community-stats">
    <div class="section-title">小区统计</div>
    <div v-if="communityStats.length > 0" class="table-wrapper" data-testid="community-table-wrapper">
      <t-table
        :data="communityStats"
        :columns="communityColumns"
        row-key="communityId"
        :hover="true"
        size="small"
        data-testid="community-table"
      >
        <template #communityName="{ row }">
          <span class="community-name">{{ row.communityName }}</span>
        </template>
        <template #totalRooms="{ row }">
          <span class="room-count">{{ row.totalRooms }}</span>
        </template>
        <template #rentedCount="{ row }">
          <span class="room-count rented">{{ row.rentedCount }}</span>
        </template>
        <template #vacantCount="{ row }">
          <span class="room-count vacant">{{ row.vacantCount }}</span>
        </template>
        <template #occupancyRate="{ row }">
          <div class="rate-cell">
            <t-progress
              :percentage="row.occupancyRate"
              :status="getProgressStatus(row.occupancyRate)"
              size="small"
              data-testid="community-occupancy-progress"
            />
            <span class="rate-text">{{ (row.occupancyRate ?? 0).toFixed(0) }}%</span>
          </div>
        </template>
      </t-table>
    </div>
    <div v-else class="no-data-tip">
      <t-icon name="info-circle" size="20px" style="color: var(--td-text-color-placeholder)" />
      <span>暂无小区统计数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';

import type { CommunityStat } from '@/api/model/reportModel';

import { getProgressStatus } from '../utils/progressUtils';

defineOptions({
  name: 'CommunityStatsTable',
});

withDefaults(defineProps<{
  communityStats: CommunityStat[];
}>(), {
  communityStats: () => [],
});

const communityColumns: PrimaryTableCol[] = [
  { colKey: 'communityName', title: '小区名称', ellipsis: true },
  { colKey: 'totalRooms', title: '总房源', width: 72, align: 'center' },
  { colKey: 'rentedCount', title: '已出租', width: 72, align: 'center' },
  { colKey: 'vacantCount', title: '空置', width: 72, align: 'center' },
  { colKey: 'occupancyRate', title: '出租率', width: 140 },
];
</script>

<style lang="less" scoped>
.community-stats {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.community-name {
  font-weight: 500;
}

.room-count {
  font-weight: 500;

  &.rented { color: var(--td-success-color); }
  &.vacant { color: var(--td-warning-color); }
}

.rate-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .t-progress { flex: 1; min-width: 60px; }

  .rate-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    min-width: 36px;
    text-align: right;
  }
}

.no-data-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  color: var(--td-text-color-placeholder);
  font-size: 14px;
}
</style>
