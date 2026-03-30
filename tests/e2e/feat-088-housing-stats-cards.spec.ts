/**
 * FEAT-088: HousingStatsCards 组件 - 静态验证
 * 类型: static
 * 适用于: 未集成到页面的独立前端子组件
 *
 * 测试覆盖：
 * 1. 组件文件存在性
 * 2. 组件包含正确的 defineOptions 名称
 * 3. 组件包含所需的 props 定义
 * 4. 组件包含 data-testid 属性
 * 5. 前端项目类型检查通过
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-088: HousingStatsCards 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');
  const componentPath = path.join(
    frontendPath,
    'src/pages/dashboard/base/components/HousingStatsCards.vue',
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
    expect(content).toContain("name: 'HousingStatsCards'");
  });

  test('3. 组件定义了所需的 props', async () => {
    expect(content).toContain('totalRooms: number');
    expect(content).toContain('rentedCount: number');
    expect(content).toContain('vacantCount: number');
    expect(content).toContain('renovatingCount: number');
  });

  test('4. 组件包含 data-testid 属性', async () => {
    expect(content).toContain('data-testid="housing-stats-cards"');
    expect(content).toContain('data-testid="total-rooms"');
    expect(content).toContain('data-testid="rented-rooms"');
    expect(content).toContain('data-testid="vacant-rooms"');
    expect(content).toContain('data-testid="renovating-rooms"');
  });

  test('5. 组件使用 TDesign 图标', async () => {
    expect(content).toContain('t-icon name="home"');
    expect(content).toContain('t-icon name="user-checked"');
    expect(content).toContain('t-icon name="user-clear"');
    expect(content).toContain('t-icon name="tools"');
  });

  test('6. 组件包含响应式样式', async () => {
    expect(content).toContain('grid-template-columns: repeat(4, 1fr)');
    expect(content).toContain('max-width: 992px');
    expect(content).toContain('max-width: 576px');
  });

  test('7. card-value 和 card-unit 语义化包裹在 card-number 容器中', async () => {
    expect(content).toContain('class="card-number"');
  });

  // ==================== 构建验证 ====================

  test('8. vue-tsc 类型检查通过', async () => {
    // vue-tsc --noEmit 成功时退出码为 0（execSync 不抛异常），
    // 失败时退出码非 0（execSync 抛出 Error）。此测试依赖 execSync 的异常机制。
    expect(() =>
      execSync('npx vue-tsc --noEmit --pretty', {
        cwd: frontendPath,
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });
});
