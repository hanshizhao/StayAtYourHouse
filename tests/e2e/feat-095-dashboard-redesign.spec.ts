/**
 * FEAT-095: Dashboard 重构 - 集成 E2E 测试
 * 类型: e2e（综合验证所有 Dashboard 组件和集成）
 *
 * 测试覆盖：
 * 1. 统计卡片可见性
 * 2. 收支摘要和出租率
 * 3. 待办事项面板
 * 4. 小区统计表格
 * 5. 空置房源列表
 * 6. 旧 TDesign 示例内容不存在
 * 7. vue-tsc 编译通过
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const BASE_DIR = join(__dirname, '../../Hans/src/pages/dashboard/base');
const COMPONENTS_DIR = join(BASE_DIR, 'components');
const FRONTEND_PATH = join(__dirname, '../../Hans');

const INDEX_PATH = join(BASE_DIR, 'index.vue');
const HOUSING_STATS_PATH = join(COMPONENTS_DIR, 'HousingStatsCards.vue');
const FINANCE_SUMMARY_PATH = join(COMPONENTS_DIR, 'FinanceSummary.vue');
const COMMUNITY_STATS_PATH = join(COMPONENTS_DIR, 'CommunityStatsTable.vue');
const VACANT_ROOMS_PATH = join(COMPONENTS_DIR, 'VacantRoomsList.vue');
const TODO_PANEL_PATH = join(COMPONENTS_DIR, 'TodoPanel.vue');

let indexContent: string;
let housingStatsContent: string;
let financeSummaryContent: string;
let communityStatsContent: string;
let vacantRoomsContent: string;
let todoPanelContent: string;

test.beforeAll(async () => {
  const { readFile } = await import('node:fs/promises');
  indexContent = await readFile(INDEX_PATH, 'utf-8');
  housingStatsContent = await readFile(HOUSING_STATS_PATH, 'utf-8');
  financeSummaryContent = await readFile(FINANCE_SUMMARY_PATH, 'utf-8');
  communityStatsContent = await readFile(COMMUNITY_STATS_PATH, 'utf-8');
  vacantRoomsContent = await readFile(VACANT_ROOMS_PATH, 'utf-8');
  todoPanelContent = await readFile(TODO_PANEL_PATH, 'utf-8');
});

test.describe('FEAT-095: Dashboard 重构集成测试', () => {
  // ==================== 1. 统计卡片可见性 ====================

  test.describe('统计卡片', () => {
    test('HousingStatsCards 组件文件存在', () => {
      expect(existsSync(HOUSING_STATS_PATH)).toBeTruthy();
    });

    test('包含 housing-stats-cards data-testid', () => {
      expect(housingStatsContent).toContain('data-testid="housing-stats-cards"');
    });

    test('包含 4 个统计值 data-testid', () => {
      expect(housingStatsContent).toContain('data-testid="total-rooms"');
      expect(housingStatsContent).toContain('data-testid="rented-rooms"');
      expect(housingStatsContent).toContain('data-testid="vacant-rooms"');
      expect(housingStatsContent).toContain('data-testid="renovating-rooms"');
    });

    test('index.vue 引入 HousingStatsCards 组件', () => {
      expect(indexContent).toContain("import HousingStatsCards from './components/HousingStatsCards.vue'");
      expect(indexContent).toContain('<housing-stats-cards');
    });

    test('index.vue 分发正确的 props', () => {
      expect(indexContent).toContain(':total-rooms=');
      expect(indexContent).toContain(':rented-count=');
      expect(indexContent).toContain(':vacant-count=');
      expect(indexContent).toContain(':renovating-count=');
    });

    test('index.vue 包含 housing-stats-section data-testid', () => {
      expect(indexContent).toContain('data-testid="housing-stats-section"');
    });
  });

  // ==================== 2. 收支摘要和出租率 ====================

  test.describe('收支摘要和出租率', () => {
    test('FinanceSummary 组件文件存在', () => {
      expect(existsSync(FINANCE_SUMMARY_PATH)).toBeTruthy();
    });

    test('包含 finance-summary data-testid', () => {
      expect(financeSummaryContent).toContain('data-testid="finance-summary"');
    });

    test('包含收支项目 data-testid', () => {
      expect(financeSummaryContent).toContain('data-testid="rent-income"');
      expect(financeSummaryContent).toContain('data-testid="utility-income"');
      expect(financeSummaryContent).toContain('data-testid="expense"');
      expect(financeSummaryContent).toContain('data-testid="net-profit"');
    });

    test('包含出租率 data-testid', () => {
      expect(financeSummaryContent).toContain('data-testid="occupancy-section"');
      expect(financeSummaryContent).toContain('data-testid="occupancy-rate"');
      expect(financeSummaryContent).toContain('data-testid="occupancy-progress"');
    });

    test('index.vue 引入 FinanceSummary 组件', () => {
      expect(indexContent).toContain("import FinanceSummary from './components/FinanceSummary.vue'");
      expect(indexContent).toContain('<finance-summary');
    });

    test('index.vue 分发正确的 props', () => {
      expect(indexContent).toContain(':rent-income=');
      expect(indexContent).toContain(':utility-income=');
      expect(indexContent).toContain(':expense=');
      expect(indexContent).toContain(':net-profit=');
      expect(indexContent).toContain(':occupancy-rate=');
    });

    test('index.vue 包含 finance-summary-section data-testid', () => {
      expect(indexContent).toContain('data-testid="finance-summary-section"');
    });
  });

  // ==================== 3. 待办事项面板 ====================

  test.describe('待办事项面板', () => {
    test('TodoPanel 组件文件存在', () => {
      expect(existsSync(TODO_PANEL_PATH)).toBeTruthy();
    });

    test('TodoPanel 使用 getTodoList API', () => {
      expect(todoPanelContent).toContain("import { getTodoList } from '@/api/todo'");
    });

    test('index.vue 引入 TodoPanel 组件', () => {
      expect(indexContent).toContain("import TodoPanel from './components/TodoPanel.vue'");
      expect(indexContent).toContain('<todo-panel');
    });

    test('index.vue 包含 todo-section data-testid', () => {
      expect(indexContent).toContain('data-testid="todo-section"');
    });
  });

  // ==================== 4. 小区统计表格 ====================

  test.describe('小区统计表格', () => {
    test('CommunityStatsTable 组件文件存在', () => {
      expect(existsSync(COMMUNITY_STATS_PATH)).toBeTruthy();
    });

    test('包含 community-stats data-testid', () => {
      expect(communityStatsContent).toContain('data-testid="community-stats"');
    });

    test('包含表格 data-testid', () => {
      expect(communityStatsContent).toContain('data-testid="community-table-wrapper"');
      expect(communityStatsContent).toContain('data-testid="community-table"');
    });

    test('使用 t-table 组件', () => {
      expect(communityStatsContent).toContain('<t-table');
    });

    test('定义正确的列配置', () => {
      expect(communityStatsContent).toContain("'communityName'");
      expect(communityStatsContent).toContain("'totalRooms'");
      expect(communityStatsContent).toContain("'rentedCount'");
      expect(communityStatsContent).toContain("'vacantCount'");
      expect(communityStatsContent).toContain("'occupancyRate'");
    });

    test('index.vue 引入 CommunityStatsTable 组件', () => {
      expect(indexContent).toContain("import CommunityStatsTable from './components/CommunityStatsTable.vue'");
      expect(indexContent).toContain('<community-stats-table');
    });

    test('index.vue 分发正确的 props', () => {
      expect(indexContent).toContain(':community-stats=');
    });

    test('index.vue 包含 community-stats-section data-testid', () => {
      expect(indexContent).toContain('data-testid="community-stats-section"');
    });
  });

  // ==================== 5. 空置房源列表 ====================

  test.describe('空置房源列表', () => {
    test('VacantRoomsList 组件文件存在', () => {
      expect(existsSync(VACANT_ROOMS_PATH)).toBeTruthy();
    });

    test('包含 vacant-rooms data-testid', () => {
      expect(vacantRoomsContent).toContain('data-testid="vacant-rooms"');
    });

    test('包含表格 data-testid', () => {
      expect(vacantRoomsContent).toContain('data-testid="vacant-table-wrapper"');
      expect(vacantRoomsContent).toContain('data-testid="vacant-table"');
    });

    test('使用 t-table 组件', () => {
      expect(vacantRoomsContent).toContain('<t-table');
    });

    test('定义正确的列配置', () => {
      expect(vacantRoomsContent).toContain("'roomInfo'");
      expect(vacantRoomsContent).toContain("'vacantDays'");
      expect(vacantRoomsContent).toContain("'rentPrice'");
    });

    test('index.vue 引入 VacantRoomsList 组件', () => {
      expect(indexContent).toContain("import VacantRoomsList from './components/VacantRoomsList.vue'");
      expect(indexContent).toContain('<vacant-rooms-list');
    });

    test('index.vue 分发正确的 props', () => {
      expect(indexContent).toContain(':vacant-rooms=');
    });

    test('index.vue 包含 vacant-rooms-section data-testid', () => {
      expect(indexContent).toContain('data-testid="vacant-rooms-section"');
    });
  });

  // ==================== 6. 旧 TDesign 示例内容不存在 ====================

  test.describe('旧 TDesign 示例内容不存在', () => {
    const OLD_COMPONENTS = ['TopPanel.vue', 'MiddleChart.vue', 'RankList.vue', 'OutputOverview.vue'];
    const OLD_DATA_FILES = ['constants.ts', 'index.ts'];

    for (const component of OLD_COMPONENTS) {
      test(`旧组件 ${component} 不存在`, () => {
        expect(existsSync(join(COMPONENTS_DIR, component))).toBeFalsy();
      });
    }

    for (const file of OLD_DATA_FILES) {
      test(`旧数据文件 ${file} 不存在`, () => {
        expect(existsSync(join(BASE_DIR, file))).toBeFalsy();
      });
    }

    test('index.vue 不引用旧组件', () => {
      expect(indexContent).not.toContain('TopPanel');
      expect(indexContent).not.toContain('MiddleChart');
      expect(indexContent).not.toContain('RankList');
      expect(indexContent).not.toContain('OutputOverview');
    });

    test('房源报表页面已删除', () => {
      expect(existsSync(join(__dirname, '../../Hans/src/pages/report/housing'))).toBeFalsy();
    });
  });

  // ==================== 7. 编译验证 ====================

  test('vue-tsc 类型检查通过', () => {
    expect(() =>
      execSync('npx vue-tsc --noEmit --pretty', {
        cwd: FRONTEND_PATH,
        encoding: 'utf-8',
        timeout: 180_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });
});
