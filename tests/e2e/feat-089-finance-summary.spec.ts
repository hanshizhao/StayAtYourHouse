/**
 * FEAT-089: FinanceSummary 组件 - E2E 测试
 * ✅ 适用于：前端页面、前端组件
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-089: FinanceSummary 组件', () => {
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

  test('1. 收支摘要区域可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const financeSection = page.getByTestId('finance-section');
    await expect(financeSection).toBeVisible({ timeout: 10000 });
  });

  test('2. 出租率进度条可见', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const occupancyProgress = page.getByTestId('occupancy-progress');
    await expect(occupancyProgress).toBeVisible({ timeout: 10000 });
  });

  test('3. 出租率百分比显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const occupancyRate = page.getByTestId('occupancy-rate');
    await expect(occupancyRate).toBeVisible({ timeout: 10000 });
    const text = await occupancyRate.textContent();
    expect(text).toContain('%');
  });
});
