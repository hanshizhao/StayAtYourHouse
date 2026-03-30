/**
 * FEAT-091: VacantRoomsList 组件 - 静态验证
 * 类型: static
 * 适用于: 未集成到页面的独立前端子组件
 *
 * 测试覆盖：
 * 1. 组件文件存在性
 * 2. 组件包含正确的 defineOptions 名称
 * 3. 组件定义了所需的 props
 * 4. 组件包含 data-testid 属性
 * 5. 组件使用 TDesign t-table
 * 6. 组件定义了正确的表格列
 * 7. 组件包含空置天数标签逻辑
 * 8. 组件包含租金格式化
 * 9. 组件包含空数据提示
 * 10. 前端项目类型检查通过
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-091: VacantRoomsList 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');
  const componentPath = path.join(
    frontendPath,
    'src/pages/dashboard/base/components/VacantRoomsList.vue',
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
    expect(content).toContain("name: 'VacantRoomsList'");
  });

  test('3. 组件定义了所需的 props', async () => {
    expect(content).toContain('vacantRooms: VacantRoomInfo[]');
    expect(content).toContain('vacantRooms: () => []');
  });

  test('4. 组件导入 VacantRoomInfo 类型', async () => {
    expect(content).toContain("import type { VacantRoomInfo } from '@/api/model/reportModel'");
  });

  test('5. 组件包含 data-testid 属性', async () => {
    expect(content).toContain('data-testid="vacant-rooms"');
    expect(content).toContain('data-testid="vacant-table-wrapper"');
    expect(content).toContain('data-testid="vacant-table"');
  });

  test('6. 组件使用 TDesign t-table', async () => {
    expect(content).toContain('<t-table');
    expect(content).toContain(':data="vacantRooms"');
    expect(content).toContain(':columns="vacantColumns"');
    expect(content).toContain('row-key="roomId"');
  });

  test('7. 组件定义了正确的表格列', async () => {
    expect(content).toContain("colKey: 'roomInfo'");
    expect(content).toContain("colKey: 'vacantDays'");
    expect(content).toContain("colKey: 'rentPrice'");
  });

  test('8. 组件包含空置天数标签逻辑', async () => {
    expect(content).toContain('getVacantDaysTheme');
    expect(content).toContain('<t-tag');
    expect(content).toContain(':theme="getVacantDaysTheme(row.vacantDays)"');
    expect(content).toContain('data-testid="vacant-days-tag"');
  });

  test('9. 组件包含租金格式化', async () => {
    expect(content).toContain('formatPrice');
    expect(content).toContain('¥{{ formatPrice(row.rentPrice) }}');
    expect(content).toContain("import { formatPrice } from '@/utils/format'");
  });

  test('10. 组件包含空数据提示', async () => {
    expect(content).toContain('v-else');
    expect(content).toContain('暂无空置房源数据');
  });

  // ==================== 构建验证 ====================

  test('11. vue-tsc 类型检查通过', async () => {
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
