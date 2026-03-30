/**
 * FEAT-094: 清理旧文件和路由 - 静态验证
 * 类型: e2e（文件删除 + 路由清理验证）
 *
 * 测试覆盖：
 * 1. 旧 TDesign 示例组件已删除
 * 2. 旧示例数据文件已删除
 * 3. 房源报表页面已删除
 * 4. housing 路由条目已移除
 * 5. 新组件文件仍存在
 * 6. vue-tsc 编译通过
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const COMPONENTS_DIR = join(__dirname, '../../Hans/src/pages/dashboard/base/components');
const ROUTER_PATH = join(__dirname, '../../Hans/src/router/modules/report.ts');
const FRONTEND_PATH = join(__dirname, '../../Hans');

const DELETED_COMPONENTS = [
  'TopPanel.vue',
  'MiddleChart.vue',
  'RankList.vue',
  'OutputOverview.vue',
];

const DELETED_DATA_FILES = [
  join(__dirname, '../../Hans/src/pages/dashboard/base/constants.ts'),
  join(__dirname, '../../Hans/src/pages/dashboard/base/index.ts'),
];

const KEPT_COMPONENTS = [
  'HousingStatsCards.vue',
  'FinanceSummary.vue',
  'CommunityStatsTable.vue',
  'VacantRoomsList.vue',
  'TodoPanel.vue',
];

let routerContent: string;

test.beforeAll(async () => {
  const { readFile } = await import('node:fs/promises');
  routerContent = await readFile(ROUTER_PATH, 'utf-8');
});

test.describe('FEAT-094: 清理旧文件和路由', () => {
  // ==================== 旧组件删除 ====================

  for (const component of DELETED_COMPONENTS) {
    test(`旧组件 ${component} 已删除`, () => {
      expect(existsSync(join(COMPONENTS_DIR, component))).toBeFalsy();
    });
  }

  // ==================== 旧数据文件删除 ====================

  for (const filePath of DELETED_DATA_FILES) {
    test(`旧数据文件 ${filePath.split('/').pop()} 已删除`, () => {
      expect(existsSync(filePath)).toBeFalsy();
    });
  }

  // ==================== 房源报表页面删除 ====================

  test('房源报表页面目录已删除', () => {
    const housingDir = join(__dirname, '../../Hans/src/pages/report/housing');
    expect(existsSync(housingDir)).toBeFalsy();
  });

  // ==================== 路由清理 ====================

  test('housing 路由条目已移除', () => {
    expect(routerContent).not.toContain('housing');
    expect(routerContent).not.toContain('HousingReport');
    expect(routerContent).not.toContain('房源概览');
    expect(routerContent).not.toContain('Housing Report');
  });

  test('income 路由条目保留', () => {
    expect(routerContent).toContain('income');
    expect(routerContent).toContain('IncomeReport');
  });

  test('profit 路由条目保留', () => {
    expect(routerContent).toContain('profit');
    expect(routerContent).toContain('ProfitReport');
  });

  // ==================== 新组件保留 ====================

  for (const component of KEPT_COMPONENTS) {
    test(`新组件 ${component} 仍存在`, () => {
      expect(existsSync(join(COMPONENTS_DIR, component))).toBeTruthy();
    });
  }

  // ==================== 编译验证 ====================

  test('vue-tsc 编译通过', () => {
    const result = execSync('npx vue-tsc --noEmit --pretty', {
      cwd: FRONTEND_PATH,
      encoding: 'utf-8',
      timeout: 180_000,
      stdio: 'pipe',
    });
    expect(result).toBeDefined();
  });
});
