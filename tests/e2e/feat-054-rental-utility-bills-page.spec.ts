/**
 * FEAT-054: 前端租赁记录页展示 UtilityBills - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-054: 前端租赁记录页展示 UtilityBills', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');

  test('1. 验证租赁记录页面文件存在', async () => {
    const pagePath = path.join(projectRoot, 'Hans/src/pages/housing/rental/index.vue');
    expect(fs.existsSync(pagePath)).toBeTruthy();
  });

  test('2. 验证页面使用 UtilityBill 相关导入', async () => {
    const pagePath = path.join(projectRoot, 'Hans/src/pages/housing/rental/index.vue');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // 应使用 UtilityBillStatus 而非独立的 BillStatus
    expect(content).toContain('UtilityBillStatus');
    // 检查是否包含独立的 BillStatus 导入（非 UtilityBillStatus 的一部分）
    // 使用正则表达式检查是否有独立的 BillStatus（不在 UtilityBillStatus 中）
    const standaloneBillStatusPattern = /(?<!Utility)BillStatus(?!.*Utility)/;
    expect(standaloneBillStatusPattern.test(content)).toBe(false);
  });

  test('3. 验证展开行使用 utilityBills', async () => {
    const pagePath = path.join(projectRoot, 'Hans/src/pages/housing/rental/index.vue');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // 应使用 utilityBills 而非 bills
    expect(content).toContain('utilityBills');
  });

  test('4. 验证前端构建通过', async () => {
    const result = execSync('npm run build:type', { cwd: hansPath, stdio: 'pipe', timeout: 120000 });
    expect(result.toString()).not.toContain('error');
  });

  // E2E 运行时测试需要前端启动
  test.skip('5. 页面可访问 - 无报错加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/housing/rental`);
    await page.waitForLoadState('networkidle');

    // 验证核心元素可见
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test.skip('6. 展开行显示水电费账单', async ({ page }) => {
    await page.goto(`${BASE_URL}/housing/rental`);
    await page.waitForLoadState('networkidle');

    // 点击展开行
    const expandButtons = page.locator('.t-table__expand-box');
    if (await expandButtons.count() > 0) {
      await expandButtons.first().click();

      // 验证展开内容包含水电费账单
      const expandedContent = page.locator('.t-table__expanded-row');
      await expect(expandedContent).toBeVisible();
    }
  });
});
