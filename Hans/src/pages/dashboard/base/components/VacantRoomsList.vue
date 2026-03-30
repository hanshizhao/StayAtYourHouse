<template>
  <div class="vacant-rooms" data-testid="vacant-rooms">
    <div class="section-title">空置房源</div>
    <div v-if="vacantRooms.length > 0" class="table-wrapper" data-testid="vacant-table-wrapper">
      <t-table
        :data="vacantRooms"
        :columns="vacantColumns"
        row-key="roomId"
        :hover="true"
        size="small"
        data-testid="vacant-table"
      >
        <template #roomInfo="{ row }">
          <span class="room-info">{{ row.roomInfo }}</span>
        </template>
        <template #vacantDays="{ row }">
          <t-tag :theme="getVacantDaysTheme(row.vacantDays)" size="small" data-testid="vacant-days-tag">
            {{ row.vacantDays }}天
          </t-tag>
        </template>
        <template #rentPrice="{ row }">
          <span class="rent-price">¥{{ formatPrice(row.rentPrice) }}</span>
        </template>
      </t-table>
    </div>
    <div v-else class="no-data-tip">
      <t-icon name="info-circle" size="20px" style="color: var(--td-text-color-placeholder)" />
      <span>暂无空置房源数据</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';

import type { VacantRoomInfo } from '@/api/model/reportModel';
import { formatPrice } from '@/utils/format';

defineOptions({
  name: 'VacantRoomsList',
});

withDefaults(
  defineProps<{
    vacantRooms: VacantRoomInfo[];
  }>(),
  {
    vacantRooms: () => [],
  },
);

const VACANT_DAYS_THRESHOLD = { SAFE: 7, WARNING: 30 } as const;

const vacantColumns: PrimaryTableCol[] = [
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'vacantDays', title: '空置天数', width: 100, align: 'center' },
  { colKey: 'rentPrice', title: '月租金', width: 100, align: 'right' },
];

function getVacantDaysTheme(days: number): 'success' | 'warning' | 'danger' {
  if (days <= VACANT_DAYS_THRESHOLD.SAFE) return 'success';
  if (days <= VACANT_DAYS_THRESHOLD.WARNING) return 'warning';
  return 'danger';
}
</script>
<style lang="less" scoped>
.vacant-rooms {
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

.room-info {
  font-weight: 500;
}

.rent-price {
  font-weight: 600;
  color: var(--td-brand-color);
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
