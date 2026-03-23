/**
 * FEAT-020: 首页待办提醒 - E2E 测试
 * 类型: e2e
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-020: 首页待办提醒', () => {
  async function loginAndNavigate(page: any) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  }

  test('1. 首页可访问', async ({ page }) => {
    await loginAndNavigate(page);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });
});
