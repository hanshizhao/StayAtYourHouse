# Dashboard 页面重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Dashboard 页面的 TDesign 示例组件替换为房源报表业务数据和本月收支摘要，删除 /report/housing 页面。

**Architecture:** 前端新增 4 个展示型子组件（纯 props 驱动），index.vue 中用 Promise.all 并行调用 getHousingOverview() 和 getIncomeReport() 获取数据，分发到各子组件。无后端改动。

**Tech Stack:** Vue 3, TypeScript, TDesign Vue Next, Less

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 创建 | `Hans/src/pages/dashboard/base/components/HousingStatsCards.vue` | 第一行：4 个统计卡片 |
| 创建 | `Hans/src/pages/dashboard/base/components/FinanceSummary.vue` | 第二行左：本月收支 + 出租率 |
| 创建 | `Hans/src/pages/dashboard/base/components/CommunityStatsTable.vue` | 第三行左：小区统计表格 |
| 创建 | `Hans/src/pages/dashboard/base/components/VacantRoomsList.vue` | 第三行右：空置房源列表 |
| 重写 | `Hans/src/pages/dashboard/base/index.vue` | 页面入口，数据获取与分发 |
| 修改 | `Hans/src/locales/lang/zh_CN/pages/dashboard-base.ts` | 中文 i18n |
| 修改 | `Hans/src/locales/lang/en_US/pages/dashboard-base.ts` | 英文 i18n |
| 修改 | `Hans/src/router/modules/report.ts` | 移除 housing 路由 |
| 删除 | `Hans/src/pages/dashboard/base/components/TopPanel.vue` | TDesign 示例 |
| 删除 | `Hans/src/pages/dashboard/base/components/MiddleChart.vue` | TDesign 示例 |
| 删除 | `Hans/src/pages/dashboard/base/components/RankList.vue` | TDesign 示例 |
| 删除 | `Hans/src/pages/dashboard/base/components/OutputOverview.vue` | TDesign 示例 |
| 删除 | `Hans/src/pages/dashboard/base/constants.ts` | 示例数据 |
| 删除 | `Hans/src/pages/dashboard/base/index.ts` | echarts 配置 |
| 删除 | `Hans/src/pages/report/housing/index.vue` | 已迁移到 Dashboard |
| 创建 | `tests/e2e/feat-088-dashboard-redesign.spec.ts` | E2E 测试 |

---

## 前置准备

- [ ] **Step 0: 创建功能分支**
  - `git checkout -b feat/dashboard-redesign`

---

## Task 1: HousingStatsCards 组件

**Files:**
- 创建: `Hans/src/pages/dashboard/base/components/HousingStatsCards.vue`

- [ ] **Step 1: 创建 HousingStatsCards.vue**

```vue
<template>
  <div class="housing-stats-cards" data-testid="housing-stats-cards">
    <div class="stat-card total">
      <div class="card-icon">
        <t-icon name="home" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">总房源</span>
        <span class="card-value" data-testid="total-rooms">{{ totalRooms }}</span>
        <span class="card-unit">间</span>
      </div>
    </div>
    <div class="stat-card rented">
      <div class="card-icon">
        <t-icon name="user-checked" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">已出租</span>
        <span class="card-value" data-testid="rented-rooms">{{ rentedCount }}</span>
        <span class="card-unit">间</span>
      </div>
    </div>
    <div class="stat-card vacant">
      <div class="card-icon">
        <t-icon name="user-clear" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">空置</span>
        <span class="card-value" data-testid="vacant-rooms">{{ vacantCount }}</span>
        <span class="card-unit">间</span>
      </div>
    </div>
    <div class="stat-card renovating">
      <div class="card-icon">
        <t-icon name="tools" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">装修中</span>
        <span class="card-value" data-testid="renovating-rooms">{{ renovatingCount }}</span>
        <span class="card-unit">间</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'HousingStatsCards',
});

defineProps<{
  totalRooms: number;
  rentedCount: number;
  vacantCount: number;
  renovatingCount: number;
}>();
</script>

<style lang="less" scoped>
.housing-stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--td-bg-color-container);
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

@media (max-width: 992px) {
  .housing-stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .housing-stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 2: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`
  - 确认无类型错误

- [ ] **Step 3: 提交**
  - `git add Hans/src/pages/dashboard/base/components/HousingStatsCards.vue`
  - `git commit -m "feat: 添加 HousingStatsCards 组件"`

---

## Task 2: FinanceSummary 组件

**Files:**
- 创建: `Hans/src/pages/dashboard/base/components/FinanceSummary.vue`

- [ ] **Step 1: 创建 FinanceSummary.vue**

```vue
<template>
  <div class="finance-summary" data-testid="finance-summary">
    <div class="finance-title">本月收支摘要</div>

    <!-- 收支网格 -->
    <div class="finance-grid">
      <div class="finance-item rent-income">
        <span class="finance-label">租金收入</span>
        <span class="finance-value">¥{{ formatMoney(rentIncome) }}</span>
      </div>
      <div class="finance-item utility-income">
        <span class="finance-label">水电收入</span>
        <span class="finance-value">¥{{ formatMoney(utilityIncome) }}</span>
      </div>
      <div class="finance-item expense">
        <span class="finance-label">支出</span>
        <span class="finance-value">¥{{ formatMoney(expense) }}</span>
      </div>
      <div class="finance-item net-profit">
        <span class="finance-label">净利润</span>
        <span class="finance-value">¥{{ formatMoney(netProfit) }}</span>
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

function getProgressStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'warning';
  return 'error';
}
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
</style>
```

- [ ] **Step 2: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: 提交**
  - `git add Hans/src/pages/dashboard/base/components/FinanceSummary.vue`
  - `git commit -m "feat: 添加 FinanceSummary 组件"`

---

## Task 3: CommunityStatsTable 组件

**Files:**
- 创建: `Hans/src/pages/dashboard/base/components/CommunityStatsTable.vue`

- [ ] **Step 1: 创建 CommunityStatsTable.vue**

```vue
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
            />
            <span class="rate-text">{{ row.occupancyRate.toFixed(0) }}%</span>
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

defineOptions({
  name: 'CommunityStatsTable',
});

defineProps<{
  communityStats: CommunityStat[];
}>();

const communityColumns: PrimaryTableCol[] = [
  { colKey: 'communityName', title: '小区名称', ellipsis: true },
  { colKey: 'totalRooms', title: '总房源', width: 72, align: 'center' },
  { colKey: 'rentedCount', title: '已出租', width: 72, align: 'center' },
  { colKey: 'vacantCount', title: '空置', width: 72, align: 'center' },
  { colKey: 'occupancyRate', title: '出租率', width: 140 },
];

function getProgressStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'warning';
  return 'error';
}
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
```

- [ ] **Step 2: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: 提交**
  - `git add Hans/src/pages/dashboard/base/components/CommunityStatsTable.vue`
  - `git commit -m "feat: 添加 CommunityStatsTable 组件"`

---

## Task 4: VacantRoomsList 组件

**Files:**
- 创建: `Hans/src/pages/dashboard/base/components/VacantRoomsList.vue`

- [ ] **Step 1: 创建 VacantRoomsList.vue**

```vue
<template>
  <div class="vacant-rooms" data-testid="vacant-rooms">
    <div class="section-title">
      空置房源
      <span class="vacant-count">（{{ vacantRooms.length }} 间）</span>
    </div>
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
          <t-tag :theme="getVacantDaysTheme(row.vacantDays)" variant="light">{{ row.vacantDays }} 天</t-tag>
        </template>
        <template #monthlyRent="{ row }">
          <span class="rent-amount">¥{{ formatMoney(row.rentPrice) }}</span>
        </template>
      </t-table>
    </div>
    <div v-else class="no-vacant">
      <t-icon name="check-circle" size="24px" style="color: var(--td-success-color)" />
      <span>暂无空置房源</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';

import type { VacantRoomInfo } from '@/api/model/reportModel';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'VacantRoomsList',
});

defineProps<{
  vacantRooms: VacantRoomInfo[];
}>();

const vacantColumns: PrimaryTableCol[] = [
  { colKey: 'roomInfo', title: '房间信息', ellipsis: true },
  { colKey: 'vacantDays', title: '空置天数', width: 100, align: 'center' },
  { colKey: 'monthlyRent', title: '月租金', width: 110, align: 'right' },
];

function getVacantDaysTheme(days: number): 'success' | 'warning' | 'danger' {
  if (days <= 7) return 'success';
  if (days <= 30) return 'warning';
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

  .vacant-count {
    font-size: 14px;
    font-weight: 400;
    color: var(--td-text-color-placeholder);
  }
}

.table-wrapper {
  overflow-x: auto;
}

.room-info {
  font-weight: 500;
}

.rent-amount {
  font-weight: 500;
  color: var(--td-brand-color);
}

.no-vacant {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  color: var(--td-text-color-secondary);
  font-size: 14px;
}
</style>
```

- [ ] **Step 2: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: 提交**
  - `git add Hans/src/pages/dashboard/base/components/VacantRoomsList.vue`
  - `git commit -m "feat: 添加 VacantRoomsList 组件"`

---

## Task 5: 重写 index.vue

**Files:**
- 重写: `Hans/src/pages/dashboard/base/index.vue`

- [ ] **Step 1: 重写 index.vue**

```vue
<template>
  <div>
    <!-- 第一行：统计卡片 -->
    <housing-stats-cards
      v-if="housingData"
      :total-rooms="housingData.totalRooms"
      :rented-count="housingData.rentedCount"
      :vacant-count="housingData.vacantCount"
      :renovating-count="housingData.renovatingCount"
      class="row-container"
      data-testid="stats-section"
    />

    <!-- 第二行：收支摘要 + 待办事项 -->
    <div class="row-container row-grid">
      <finance-summary
        v-if="housingData && monthData"
        :rent-income="monthData.rentIncome"
        :utility-income="monthData.utilityIncome"
        :expense="monthData.expense"
        :net-profit="monthData.netProfit"
        :occupancy-rate="housingData.occupancyRate"
        data-testid="finance-section"
      />
      <div v-else-if="financeLoading" class="loading-card">
        <t-loading text="加载中..." />
      </div>
      <div v-else-if="financeError" class="error-card">
        <t-icon name="close-circle" size="32px" style="color: var(--td-error-color)" />
        <p>加载失败</p>
        <t-button size="small" theme="primary" @click="fetchData">重试</t-button>
      </div>
      <todo-panel data-testid="todo-section" />
    </div>

    <!-- 第三行：小区统计 + 空置房源 -->
    <div v-if="housingData" class="row-container row-grid">
      <community-stats-table :community-stats="housingData.communityStats" />
      <vacant-rooms-list :vacant-rooms="housingData.vacantRooms" />
    </div>
    <div v-else-if="housingLoading" class="row-container loading-card">
      <t-loading text="加载中..." size="large" />
    </div>
    <div v-else-if="housingError" class="row-container error-card">
      <t-icon name="close-circle" size="48px" style="color: var(--td-error-color)" />
      <p>加载房源数据失败</p>
      <t-button theme="primary" @click="fetchData">重新加载</t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { HousingOverview, IncomeReport, MonthlyIncome } from '@/api/model/reportModel';
import { getHousingOverview, getIncomeReport } from '@/api/report';

import CommunityStatsTable from './components/CommunityStatsTable.vue';
import FinanceSummary from './components/FinanceSummary.vue';
import HousingStatsCards from './components/HousingStatsCards.vue';
import TodoPanel from './components/TodoPanel.vue';
import VacantRoomsList from './components/VacantRoomsList.vue';

defineOptions({
  name: 'DashboardBase',
});

// ==================== 状态 ====================

const housingLoading = ref(false);
const housingError = ref(false);
const housingData = ref<HousingOverview | null>(null);

const financeLoading = ref(false);
const financeError = ref(false);
const incomeData = ref<IncomeReport | null>(null);

// 当月收支数据
const monthData = computed<MonthlyIncome | null>(() => {
  if (!incomeData.value) return null;
  const currentMonth = new Date().getMonth() + 1;
  return incomeData.value.monthlyDetails.find(m => m.month === currentMonth) ?? null;
});

// ==================== 数据获取 ====================

async function fetchData() {
  // 并行请求，独立处理错误
  const housingPromise = fetchHousing();
  const financePromise = fetchFinance();
  await Promise.all([housingPromise, financePromise]);
}

async function fetchHousing() {
  housingLoading.value = true;
  housingError.value = false;
  try {
    housingData.value = await getHousingOverview();
  } catch {
    housingError.value = true;
    MessagePlugin.error('获取房源概览数据失败');
  } finally {
    housingLoading.value = false;
  }
}

async function fetchFinance() {
  financeLoading.value = true;
  financeError.value = false;
  try {
    incomeData.value = await getIncomeReport();
  } catch {
    financeError.value = true;
    MessagePlugin.error('获取收支数据失败');
  } finally {
    financeLoading.value = false;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.row-container:not(:last-child) {
  margin-bottom: 16px;
}

.row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  color: var(--td-text-color-placeholder);
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  color: var(--td-text-color-placeholder);

  p { margin: 8px 0 12px; font-size: 14px; }
}

@media (max-width: 576px) {
  .row-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 2: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: 提交**
  - `git add Hans/src/pages/dashboard/base/index.vue`
  - `git commit -m "feat: 重写 Dashboard 页面，替换 TDesign 示例为业务数据"`

---

## Task 6: 更新 i18n 文件

**Files:**
- 修改: `Hans/src/locales/lang/zh_CN/pages/dashboard-base.ts`
- 修改: `Hans/src/locales/lang/en_US/pages/dashboard-base.ts`

- [ ] **Step 1: 替换中文 i18n**

将 `zh_CN/pages/dashboard-base.ts` 全部内容替换为：

```typescript
export default {
  title: '概览仪表盘',
  stats: {
    totalRooms: '总房源',
    rented: '已出租',
    vacant: '空置',
    renovating: '装修中',
  },
  finance: {
    title: '本月收支摘要',
    rentIncome: '租金收入',
    utilityIncome: '水电收入',
    expense: '支出',
    netProfit: '净利润',
  },
  occupancy: {
    label: '整体出租率',
  },
  community: {
    title: '小区统计',
    name: '小区名称',
    total: '总房源',
    rented: '已出租',
    vacant: '空置',
    rate: '出租率',
    noData: '暂无小区统计数据',
  },
  vacant: {
    title: '空置房源',
    roomInfo: '房间信息',
    days: '空置天数',
    rent: '月租金',
    noVacant: '暂无空置房源',
  },
  error: {
    housing: '获取房源概览数据失败',
    finance: '获取收支数据失败',
    retry: '重新加载',
  },
};
```

- [ ] **Step 2: 替换英文 i18n**

将 `en_US/pages/dashboard-base.ts` 全部内容替换为：

```typescript
export default {
  title: 'Dashboard',
  stats: {
    totalRooms: 'Total Rooms',
    rented: 'Rented',
    vacant: 'Vacant',
    renovating: 'Renovating',
  },
  finance: {
    title: 'Monthly Summary',
    rentIncome: 'Rent Income',
    utilityIncome: 'Utility Income',
    expense: 'Expense',
    netProfit: 'Net Profit',
  },
  occupancy: {
    label: 'Occupancy Rate',
  },
  community: {
    title: 'Community Stats',
    name: 'Community',
    total: 'Total',
    rented: 'Rented',
    vacant: 'Vacant',
    rate: 'Rate',
    noData: 'No community data',
  },
  vacant: {
    title: 'Vacant Rooms',
    roomInfo: 'Room',
    days: 'Days Vacant',
    rent: 'Monthly Rent',
    noVacant: 'No vacant rooms',
  },
  error: {
    housing: 'Failed to load housing data',
    finance: 'Failed to load finance data',
    retry: 'Retry',
  },
};
```

- [ ] **Step 3: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: 提交**
  - `git add Hans/src/locales/lang/zh_CN/pages/dashboard-base.ts Hans/src/locales/lang/en_US/pages/dashboard-base.ts`
  - `git commit -m "feat: 更新 Dashboard i18n 文件"`

---

## Task 7: 清理旧文件和路由

**Files:**
- 删除: `Hans/src/pages/dashboard/base/components/TopPanel.vue`
- 删除: `Hans/src/pages/dashboard/base/components/MiddleChart.vue`
- 删除: `Hans/src/pages/dashboard/base/components/RankList.vue`
- 删除: `Hans/src/pages/dashboard/base/components/OutputOverview.vue`
- 删除: `Hans/src/pages/dashboard/base/constants.ts`
- 删除: `Hans/src/pages/dashboard/base/index.ts`
- 删除: `Hans/src/pages/report/housing/index.vue`
- 修改: `Hans/src/router/modules/report.ts`

- [ ] **Step 1: 删除 TDesign 示例组件**

```bash
cd Hans/src/pages/dashboard/base
rm components/TopPanel.vue
rm components/MiddleChart.vue
rm components/RankList.vue
rm components/OutputOverview.vue
rm constants.ts
rm index.ts
```

- [ ] **Step 2: 删除房源报表页面**

```bash
rm -rf Hans/src/pages/report/housing
```

- [ ] **Step 3: 移除 housing 路由**

编辑 `Hans/src/router/modules/report.ts`，删除 housing 路由条目（第 17-22 行），结果为：

```typescript
import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/report',
    name: 'report',
    component: Layout,
    redirect: '/report/income',
    meta: { title: { zh_CN: '统计报表', en_US: 'Report' }, icon: 'chart-line', orderNo: 6 },
    children: [
      {
        path: 'income',
        name: 'IncomeReport',
        component: () => import('@/pages/report/income/index.vue'),
        meta: { title: { zh_CN: '收支统计', en_US: 'Income Report' } },
      },
      {
        path: 'profit',
        name: 'ProfitReport',
        component: () => import('@/pages/report/profit/index.vue'),
        meta: { title: { zh_CN: '利润排行', en_US: 'Profit Report' } },
      },
    ],
  },
];
```

- [ ] **Step 4: 验证编译**
  - `cd Hans && npx vue-tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: 提交**
  - `git add -A`
  - `git commit -m "chore: 删除 TDesign 示例组件和房源报表页面"`

---

## Task 8: E2E 测试

**Files:**
- 创建: `tests/e2e/feat-088-dashboard-redesign.spec.ts`

- [ ] **Step 1: 编写 E2E 测试**

```typescript
import { expect, test } from '@playwright/test';

test.describe('Dashboard 重构', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/base');
  });

  test('应显示统计卡片', async ({ page }) => {
    const statsCards = page.getByTestId('housing-stats-cards');
    await expect(statsCards).toBeVisible();

    await expect(page.getByTestId('total-rooms')).toBeVisible();
    await expect(page.getByTestId('rented-rooms')).toBeVisible();
    await expect(page.getByTestId('vacant-rooms')).toBeVisible();
    await expect(page.getByTestId('renovating-rooms')).toBeVisible();
  });

  test('应显示收支摘要和出租率', async ({ page }) => {
    const financeSection = page.getByTestId('finance-section');
    await expect(financeSection).toBeVisible();

    const occupancyProgress = page.getByTestId('occupancy-progress');
    await expect(occupancyProgress).toBeVisible();
  });

  test('应显示待办事项面板', async ({ page }) => {
    const todoSection = page.getByTestId('todo-section');
    await expect(todoSection).toBeVisible();
  });

  test('应显示小区统计表格', async ({ page }) => {
    const communityStats = page.getByTestId('community-stats');
    await expect(communityStats).toBeVisible();
  });

  test('应显示空置房源列表', async ({ page }) => {
    const vacantRooms = page.getByTestId('vacant-rooms');
    await expect(vacantRooms).toBeVisible();
  });

  test('不应显示旧的 TDesign 示例内容', async ({ page }) => {
    // 确认页面不包含旧示例文字
    await expect(page.getByText('总收入')).not.toBeVisible();
    await expect(page.getByText('总退款')).not.toBeVisible();
    await expect(page.getByText('出入库概览')).not.toBeVisible();
  });
});
```

- [ ] **Step 2: 运行测试**
  - `cd tests && npx playwright test e2e/feat-088-dashboard-redesign.spec.ts`

- [ ] **Step 3: 提交**
  - `git add tests/e2e/feat-088-dashboard-redesign.spec.ts`
  - `git commit -m "test: 添加 Dashboard 重构 E2E 测试"`

---

## Task 9: 最终验证

- [ ] **Step 1: 运行完整类型检查**
  - `cd Hans && npx vue-tsc --noEmit --pretty`

- [ ] **Step 2: 运行 ESLint**
  - `cd Hans && npx eslint src/pages/dashboard/base --ext .vue,.ts`

- [ ] **Step 3: 启动开发服务器手动验证**
  - `cd Hans && npm run dev`
  - 访问 http://localhost:3002/dashboard/base
  - 验证：统计卡片、收支摘要、待办事项、小区统计、空置房源均正常显示
  - 验证：/report/housing 路由已不存在（404 或重定向）
  - 验证：侧边栏"房源概览"菜单已移除

- [ ] **Step 4: 最终提交（如有 lint 修复）**
  - `git add -A && git commit -m "style: lint 修复"`
