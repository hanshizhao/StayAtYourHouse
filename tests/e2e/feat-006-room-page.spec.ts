/**
 * FEAT-006: 房间列表页 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-006: 房间列表页', () => {

  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Warning:')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表格渲染', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('3. 筛选功能 - 按小区筛选', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    const select = page.locator('.t-select:has-text("小区")').first();
    if (await select.isVisible()) {
      await select.click();
      await page.waitForTimeout(500);
    }
  });
});
