<template>
  <div class="dashboard-container" data-testid="dashboard-page">
    <!-- 加载中 -->
    <div v-if="loading" class="dashboard-loading">
      <t-loading data-testid="dashboard-loading" size="large" text="加载中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="dashboard-error">
      <t-icon name="error-circle" size="48px" style="color: var(--td-error-color)" />
      <p class="error-text">{{ errorMessage }}</p>
      <t-button theme="primary" data-testid="dashboard-retry-btn" @click="fetchData">
        <template #icon><t-icon name="refresh" /></template>
        重新加载
      </t-button>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 待办提醒 -->
      <todo-panel class="row-container" data-testid="todo-section" />

      <!-- 统计卡片 -->
      <housing-stats-cards
        class="row-container"
        data-testid="housing-stats-section"
        :total-rooms="housingData?.totalRooms ?? 0"
        :rented-count="housingData?.rentedCount ?? 0"
        :vacant-count="housingData?.vacantCount ?? 0"
        :renovating-count="housingData?.renovatingCount ?? 0"
      />

      <!-- 收支摘要 -->
      <finance-summary
        class="row-container"
        data-testid="finance-summary-section"
        :rent-income="financeData?.totalRentIncome ?? 0"
        :utility-income="financeData?.totalUtilityIncome ?? 0"
        :expense="financeData?.totalExpense ?? 0"
        :net-profit="financeData?.netProfit ?? 0"
        :occupancy-rate="housingData?.occupancyRate ?? 0"
      />

      <!-- 小区统计 & 空置房源 -->
      <div class="bottom-row">
        <community-stats-table
          class="bottom-item"
          data-testid="community-stats-section"
          :community-stats="housingData?.communityStats ?? []"
        />
        <vacant-rooms-list
          class="bottom-item"
          data-testid="vacant-rooms-section"
          :vacant-rooms="housingData?.vacantRooms ?? []"
        />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import type { HousingOverview, IncomeReport } from '@/api/model/reportModel';
import { getHousingOverview, getIncomeReport } from '@/api/report';

import CommunityStatsTable from './components/CommunityStatsTable.vue';
import FinanceSummary from './components/FinanceSummary.vue';
import HousingStatsCards from './components/HousingStatsCards.vue';
import TodoPanel from './components/TodoPanel.vue';
import VacantRoomsList from './components/VacantRoomsList.vue';

defineOptions({
  name: 'DashboardBase',
});

const loading = ref(true);
const errorMessage = ref('');
const housingData = ref<HousingOverview | null>(null);
const financeData = ref<IncomeReport | null>(null);

async function fetchData() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [housingRes, financeRes] = await Promise.all([getHousingOverview(), getIncomeReport()]);

    housingData.value = housingRes ?? null;
    financeData.value = financeRes ?? null;
  } catch (e: unknown) {
    const error = e as { message?: string };
    errorMessage.value = error.message || '数据加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.dashboard-container {
  min-height: 200px;
}

.row-container:not(:last-child) {
  margin-bottom: 16px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dashboard-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.dashboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;

  .error-text {
    font-size: 14px;
    color: var(--td-text-color-secondary);
  }
}

@media (max-width: 992px) {
  .bottom-row {
    grid-template-columns: 1fr;
  }
}
</style>
