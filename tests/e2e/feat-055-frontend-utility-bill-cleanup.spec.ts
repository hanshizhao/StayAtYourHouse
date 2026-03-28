/**
 * FEAT-055: 前端水电费类型清理和页面适配 - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-055: 前端水电费类型清理和页面适配', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');

  test('1. 验证 meterModel.ts 不包含 Merged 枚举', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/api/model/meterModel.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Merged 枚举值
    expect(content).not.toContain('Merged = 2');
    expect(content).not.toContain('"已合并"');
  });

  test('2. 验证 UtilityBillItem 包含 rentalRecordId', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/api/model/meterModel.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 rentalRecordId 字段
    expect(content).toContain('rentalRecordId');
  });

  test('3. 验证水电账单页面不包含 Merged 处理', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/pages/utility/bill/index.vue');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 不应包含 Merged 状态处理
      expect(content).not.toContain('Merged');
    }
  });

  test('4. 验证 Dashboard 待办面板使用 UtilityBill', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/pages/dashboard/base/components/TodoPanel.vue');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应查询 Pending 状态的 UtilityBill
    expect(content).toContain('UtilityBill') ;
  });

  test('5. 验证前端构建通过', async () => {
    const result = execSync('npm run build:type', { cwd: hansPath, stdio: 'pipe', timeout: 120000 });
    expect(result.toString()).not.toContain('error');
  });

  // E2E 运行时测试
  test.skip('6. 水电账单页面可访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/utility/bill`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test.skip('7. Dashboard 待办面板显示水电费待办', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // 验证待办面板存在
    const todoPanel = page.locator('.todo-panel, [class*="todo"]');
    await expect(todoPanel.first()).toBeVisible({ timeout: 5000 });
  });
});
