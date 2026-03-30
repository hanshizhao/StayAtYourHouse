/**
 * FEAT-090: CommunityStatsTable 组件 - E2E 测试
 * ✅ 适用于：前端页面、前端组件
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-090: CommunityStatsTable 组件', () => {
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

  test('1. 小区统计区域可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const communityStats = page.getByTestId('community-stats');
    await expect(communityStats).toBeVisible({ timeout: 10000 });
  });

  test('2. 小区统计表格渲染', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const tableWrapper = page.getByTestId('community-table-wrapper');
    await expect(tableWrapper).toBeVisible({ timeout: 10000 });
  });

  test('3. 表格包含标题列', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const table = page.getByTestId('community-table');
    await expect(table).toBeVisible({ timeout: 10000 });
    const headers = table.locator('th');
    const count = await headers.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
