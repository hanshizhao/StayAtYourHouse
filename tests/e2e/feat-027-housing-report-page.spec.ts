/**
 * FEAT-027: 房源概览页 - E2E 测试
 * 类型: e2e
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-027: 房源概览页', () => {
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

  test('1. 页面可访问', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/report/housing');
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });
});
