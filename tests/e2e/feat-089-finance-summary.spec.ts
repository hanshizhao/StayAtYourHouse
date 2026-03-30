import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const COMPONENT_PATH = join(
  __dirname,
  '../../Hans/src/pages/dashboard/base/components/FinanceSummary.vue',
);

test.describe('FEAT-089: FinanceSummary 组件', () => {
  test('组件文件存在', () => {
    expect(existsSync(COMPONENT_PATH)).toBeTruthy();
  });

  test('组件包含核心 props 定义', async () => {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(COMPONENT_PATH, 'utf-8');

    // 验证 props 定义
    expect(content).toContain('rentIncome');
    expect(content).toContain('utilityIncome');
    expect(content).toContain('expense');
    expect(content).toContain('netProfit');
    expect(content).toContain('occupancyRate');

    // 验证 data-testid 标记
    expect(content).toContain('data-testid="finance-summary"');
    expect(content).toContain('data-testid="occupancy-progress"');
    expect(content).toContain('data-testid="occupancy-rate"');
  });

  test('vue-tsc 编译通过', () => {
    const result = execSync('npx vue-tsc --noEmit --pretty', {
      cwd: join(__dirname, '../../Hans'),
      encoding: 'utf-8',
      timeout: 120000,
    });
    // vue-tsc 无错误时输出为空
    expect(result).toBeDefined();
  });
});
