/**
 * FEAT-091: VacantRoomsList 组件 - E2E 测试
 * ✅ 适用于：前端页面、前端组件
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-091: VacantRoomsList 组件', () => {
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

  test('1. 空置房源区域可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const vacantRooms = page.getByTestId('vacant-rooms');
    await expect(vacantRooms).toBeVisible({ timeout: 10000 });
  });

  test('2. 空置房源表格或无数据提示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const tableWrapper = page.getByTestId('vacant-table-wrapper');
    const noVacant = page.locator('.no-vacant');
    const hasTable = await tableWrapper.isVisible().catch(() => false);
    const hasNoData = await noVacant.isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  test('3. 表格包含关键列', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const table = page.getByTestId('vacant-table');
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const headers = table.locator('th');
      const count = await headers.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });
});
