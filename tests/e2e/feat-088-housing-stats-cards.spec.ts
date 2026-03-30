/**
 * FEAT-088: HousingStatsCards 组件 - E2E 测试
 * ✅ 适用于：前端页面、前端组件
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-088: HousingStatsCards 组件', () => {
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

  test('1. 统计卡片容器可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const statsCards = page.getByTestId('housing-stats-cards');
    await expect(statsCards).toBeVisible({ timeout: 10000 });
  });

  test('2. 四个统计卡片均可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await expect(page.getByTestId('total-rooms')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('rented-rooms')).toBeVisible();
    await expect(page.getByTestId('vacant-rooms')).toBeVisible();
    await expect(page.getByTestId('renovating-rooms')).toBeVisible();
  });

  test('3. 卡片显示数值', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const totalValue = page.getByTestId('total-rooms');
    await expect(totalValue).toBeVisible({ timeout: 10000 });
    const text = await totalValue.textContent();
    expect(text).not.toBe('');
  });
});
