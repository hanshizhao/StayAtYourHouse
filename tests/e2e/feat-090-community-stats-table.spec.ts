/**
 * FEAT-090: CommunityStatsTable 组件 - 静态验证
 * 类型: static
 * 适用于: 未集成到页面的独立前端子组件
 *
 * 测试覆盖：
 * 1. 组件文件存在性
 * 2. 组件包含正确的 defineOptions 名称
 * 3. 组件包含所需的 props 定义
 * 4. 组件包含 data-testid 属性
 * 5. 组件使用 TDesign t-table 组件
 * 6. 组件定义了正确的表格列
 * 7. 组件包含出租率进度条
 * 8. 前端项目类型检查通过
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-090: CommunityStatsTable 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');
  const componentPath = path.join(
    frontendPath,
    'src/pages/dashboard/base/components/CommunityStatsTable.vue',
  );

  let content: string;

  test.beforeAll(async () => {
    content = fs.readFileSync(componentPath, 'utf-8');
  });

  // ==================== 文件存在性测试 ====================

  test('1. 检查组件文件存在', async () => {
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  // ==================== 组件内容验证 ====================

  test('2. 组件包含 defineOptions 名称', async () => {
    expect(content).toContain("name: 'CommunityStatsTable'");
  });

  test('3. 组件定义了所需的 props', async () => {
    expect(content).toContain('communityStats: CommunityStat[]');
    expect(content).toContain('communityStats: () => []');
  });

  test('4. 组件导入 CommunityStat 类型和共享工具', async () => {
    expect(content).toContain("import type { CommunityStat } from '@/api/model/reportModel'");
    expect(content).toContain("import { getProgressStatus } from '../utils/progressUtils'");
  });

  test('5. 组件包含 data-testid 属性', async () => {
    expect(content).toContain('data-testid="community-stats"');
    expect(content).toContain('data-testid="community-table-wrapper"');
    expect(content).toContain('data-testid="community-table"');
  });

  test('6. 组件使用 TDesign t-table', async () => {
    expect(content).toContain('<t-table');
    expect(content).toContain(':data="communityStats"');
    expect(content).toContain(':columns="communityColumns"');
    expect(content).toContain('row-key="communityId"');
  });

  test('7. 组件定义了正确的表格列', async () => {
    expect(content).toContain("colKey: 'communityName'");
    expect(content).toContain("colKey: 'totalRooms'");
    expect(content).toContain("colKey: 'rentedCount'");
    expect(content).toContain("colKey: 'vacantCount'");
    expect(content).toContain("colKey: 'occupancyRate'");
  });

  test('8. 组件包含出租率进度条', async () => {
    expect(content).toContain('<t-progress');
    expect(content).toContain(':percentage="row.occupancyRate"');
    expect(content).toContain(':status="getProgressStatus(row.occupancyRate)"');
    expect(content).toContain('(row.occupancyRate ?? 0).toFixed(0)');
    expect(content).toContain('data-testid="community-occupancy-progress"');
  });

  test('9. 组件包含空数据提示', async () => {
    expect(content).toContain('v-else');
    expect(content).toContain('暂无小区统计数据');
  });

  // ==================== 构建验证 ====================

  test('10. vue-tsc 类型检查通过', async () => {
    expect(() =>
      execSync('npx vue-tsc --noEmit --pretty', {
        cwd: frontendPath,
        encoding: 'utf-8',
        timeout: 180000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });
});
