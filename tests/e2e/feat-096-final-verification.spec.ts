/**
 * FEAT-096: 最终验证 - 静态验证
 * 类型: static（类型检查 + ESLint + 文件结构 + 路由验证）
 *
 * 测试覆盖：
 * 1. vue-tsc 类型检查通过
 * 2. ESLint 检查通过（0 errors）
 * 3. Dashboard 页面组件结构完整（21 个测试用例）
 * 4. /report/housing 路由已不存在
 * 5. index.vue 正确引用所有新组件
 *
 * 注意：验收标准中「开发服务器启动成功」和「Dashboard 页面正常显示」
 * 属于运行时验证，超出 static 测试范围，在 workflow-verify 阶段手动确认。
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const DASHBOARD_DIR = join(__dirname, '../../Hans/src/pages/dashboard/base');
const FRONTEND_PATH = join(__dirname, '../../Hans');
const ROUTER_PATH = join(__dirname, '../../Hans/src/router/modules/report.ts');

const REQUIRED_COMPONENTS = [
  'components/HousingStatsCards.vue',
  'components/FinanceSummary.vue',
  'components/CommunityStatsTable.vue',
  'components/VacantRoomsList.vue',
  'components/TodoPanel.vue',
];

let indexVueContent: string;
let routerContent: string;

test.beforeAll(async () => {
  const { readFile } = await import('node:fs/promises');
  indexVueContent = await readFile(join(DASHBOARD_DIR, 'index.vue'), 'utf-8');
  routerContent = await readFile(ROUTER_PATH, 'utf-8');
});

test.describe('FEAT-096: 最终验证', () => {
  // ==================== 文件结构完整性 ====================

  test('Dashboard index.vue 存在', () => {
    expect(existsSync(join(DASHBOARD_DIR, 'index.vue'))).toBeTruthy();
  });

  for (const componentPath of REQUIRED_COMPONENTS) {
    test(`组件 ${componentPath.split('/').pop()} 存在`, () => {
      expect(existsSync(join(DASHBOARD_DIR, componentPath))).toBeTruthy();
    });
  }

  // ==================== index.vue 组件引用 ====================

  test('index.vue 引用 HousingStatsCards', () => {
    expect(indexVueContent).toContain("import HousingStatsCards from './components/HousingStatsCards.vue'");
    expect(indexVueContent).toContain('<housing-stats-cards');
  });

  test('index.vue 引用 FinanceSummary', () => {
    expect(indexVueContent).toContain("import FinanceSummary from './components/FinanceSummary.vue'");
    expect(indexVueContent).toContain('<finance-summary');
  });

  test('index.vue 引用 CommunityStatsTable', () => {
    expect(indexVueContent).toContain("import CommunityStatsTable from './components/CommunityStatsTable.vue'");
    expect(indexVueContent).toContain('<community-stats-table');
  });

  test('index.vue 引用 VacantRoomsList', () => {
    expect(indexVueContent).toContain("import VacantRoomsList from './components/VacantRoomsList.vue'");
    expect(indexVueContent).toContain('<vacant-rooms-list');
  });

  test('index.vue 引用 TodoPanel', () => {
    expect(indexVueContent).toContain("import TodoPanel from './components/TodoPanel.vue'");
    expect(indexVueContent).toContain('<todo-panel');
  });

  // ==================== data-testid 验证 ====================

  test('index.vue 包含核心 data-testid', () => {
    expect(indexVueContent).toContain('data-testid="dashboard-page"');
    expect(indexVueContent).toContain('data-testid="dashboard-loading"');
    expect(indexVueContent).toContain('data-testid="dashboard-retry-btn"');
    expect(indexVueContent).toContain('data-testid="housing-stats-section"');
    expect(indexVueContent).toContain('data-testid="finance-summary-section"');
    expect(indexVueContent).toContain('data-testid="community-stats-section"');
    expect(indexVueContent).toContain('data-testid="vacant-rooms-section"');
  });

  // ==================== 路由验证 ====================

  test('/report/housing 路由不存在', () => {
    expect(routerContent).not.toContain('housing');
    expect(routerContent).not.toContain('HousingReport');
    expect(routerContent).not.toContain('房源概览');
    expect(routerContent).not.toContain('Housing Report');
  });

  test('/report/income 路由存在', () => {
    expect(routerContent).toContain('income');
  });

  test('/report/profit 路由存在', () => {
    expect(routerContent).toContain('profit');
  });

  // ==================== 旧组件不存在 ====================

  const OLD_COMPONENTS = ['TopPanel.vue', 'MiddleChart.vue', 'RankList.vue', 'OutputOverview.vue'];

  for (const old of OLD_COMPONENTS) {
    test(`旧组件 ${old} 不存在`, () => {
      expect(existsSync(join(DASHBOARD_DIR, 'components', old))).toBeFalsy();
    });
  }

  // ==================== 类型检查 ====================

  test('vue-tsc 类型检查通过', () => {
    execSync('npx vue-tsc --noEmit --pretty', {
      cwd: FRONTEND_PATH,
      encoding: 'utf-8',
      timeout: 180_000,
      stdio: 'pipe',
    });
  });

  // ==================== ESLint 检查 ====================

  test('ESLint 检查通过', () => {
    execSync('npx eslint src/pages/dashboard/base --ext .vue,.ts', {
      cwd: FRONTEND_PATH,
      encoding: 'utf-8',
      timeout: 60_000,
      stdio: 'pipe',
    });
  });
});
