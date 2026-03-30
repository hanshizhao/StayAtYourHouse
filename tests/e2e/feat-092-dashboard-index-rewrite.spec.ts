/**
 * FEAT-092: 重写 index.vue - 静态验证
 * 类型: static（集成页面入口，完整 e2e 在 FEAT-095）
 *
 * 测试覆盖：
 * 1. 页面文件存在性
 * 2. 导入所有子组件
 * 3. 导入 API 函数和类型
 * 4. 使用 Promise.all 并行调用 getHousingOverview + getIncomeReport
 * 5. 分发数据到各子组件（props 绑定）
 * 6. loading/error/retry 状态处理
 * 7. data-testid 标记
 * 8. vue-tsc 编译通过
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const PAGE_PATH = join(__dirname, '../../Hans/src/pages/dashboard/base/index.vue');
const FRONTEND_PATH = join(__dirname, '../../Hans');

let content: string;

test.beforeAll(async () => {
  const { readFile } = await import('node:fs/promises');
  content = await readFile(PAGE_PATH, 'utf-8');
});

test.describe('FEAT-092: 重写 index.vue', () => {
  // ==================== 文件存在性 ====================

  test('1. 页面文件存在', () => {
    expect(existsSync(PAGE_PATH)).toBeTruthy();
  });

  // ==================== 子组件导入 ====================

  test('2. 导入所有子组件', () => {
    expect(content).toContain("import CommunityStatsTable from './components/CommunityStatsTable.vue'");
    expect(content).toContain("import FinanceSummary from './components/FinanceSummary.vue'");
    expect(content).toContain("import HousingStatsCards from './components/HousingStatsCards.vue'");
    expect(content).toContain("import TodoPanel from './components/TodoPanel.vue'");
    expect(content).toContain("import VacantRoomsList from './components/VacantRoomsList.vue'");
  });

  // ==================== API 导入 ====================

  test('3. 导入 API 函数和类型', () => {
    expect(content).toContain("import type { HousingOverview, IncomeReport } from '@/api/model/reportModel'");
    expect(content).toContain("import { getHousingOverview, getIncomeReport } from '@/api/report'");
  });

  // ==================== Promise.all 并行调用 ====================

  test('4. 使用 Promise.all 并行调用 API', () => {
    expect(content).toContain('Promise.all');
    expect(content).toContain('getHousingOverview()');
    expect(content).toContain('getIncomeReport()');
  });

  // ==================== Props 分发 ====================

  test('5. 分发数据到各子组件', () => {
    // HousingStatsCards props
    expect(content).toContain(':total-rooms=');
    expect(content).toContain(':rented-count=');
    expect(content).toContain(':vacant-count=');
    expect(content).toContain(':renovating-count=');

    // FinanceSummary props
    expect(content).toContain(':rent-income=');
    expect(content).toContain(':utility-income=');
    expect(content).toContain(':expense=');
    expect(content).toContain(':net-profit=');
    expect(content).toContain(':occupancy-rate=');

    // CommunityStatsTable props
    expect(content).toContain(':community-stats=');

    // VacantRoomsList props
    expect(content).toContain(':vacant-rooms=');
  });

  // ==================== 状态处理 ====================

  test('6. loading/error/retry 状态处理', () => {
    // loading state
    expect(content).toContain('v-if="loading"');
    expect(content).toContain('<t-loading');

    // error state
    expect(content).toContain('v-else-if="errorMessage"');

    // retry button
    expect(content).toContain('data-testid="dashboard-retry-btn"');
    expect(content).toContain('@click="fetchData"');
  });

  // ==================== data-testid 标记 ====================

  test('7. 包含正确的 data-testid 标记', () => {
    expect(content).toContain('data-testid="dashboard-page"');
    expect(content).toContain('data-testid="dashboard-loading"');
    expect(content).toContain('data-testid="todo-section"');
    expect(content).toContain('data-testid="housing-stats-section"');
    expect(content).toContain('data-testid="finance-summary-section"');
    expect(content).toContain('data-testid="community-stats-section"');
    expect(content).toContain('data-testid="vacant-rooms-section"');
  });

  // ==================== 构建验证 ====================

  test('8. vue-tsc 类型检查通过', () => {
    expect(() =>
      execSync('npx vue-tsc --noEmit --pretty', {
        cwd: FRONTEND_PATH,
        encoding: 'utf-8',
        timeout: 180000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });
});
