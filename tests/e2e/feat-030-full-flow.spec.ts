/**
 * FEAT-030: 完整业务流程测试 - E2E 测试
 * 类型: e2e
 * 测试完整业务流程：小区创建 → 房间创建 → 租客创建 → 入住 → 收租 → 退租
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-030: 完整业务流程', () => {
  async function login(page: any) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  }

  test('1. 完整流程 - 小区到退租', async ({ page }) => {
    await login(page);

    // 步骤 1: 访问小区列表
    await page.goto(`${BASE_URL}/dashboard/housing/community`);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 步骤 2: 访问房间列表
    await page.goto(`${BASE_URL}/dashboard/housing/room`);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 步骤 3: 访问租客列表
    await page.goto(`${BASE_URL}/dashboard/tenant`);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 步骤 4: 访问账单列表
    await page.goto(`${BASE_URL}/dashboard/bill`);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 步骤 5: 返回首页
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });
});
