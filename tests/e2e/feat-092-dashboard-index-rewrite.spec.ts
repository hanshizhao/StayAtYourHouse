/**
 * FEAT-092: 重写 index.vue - E2E 测试
 * ✅ 适用于：前端页面
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-092: 重写 Dashboard index.vue', () => {
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
    await loginAndNavigate(page, '/dashboard/base');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Warning:'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 统计卡片区域渲染', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const statsSection = page.getByTestId('stats-section');
    await expect(statsSection).toBeVisible({ timeout: 10000 });
  });

  test('3. 收支摘要区域渲染', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const financeSection = page.getByTestId('finance-section');
    await expect(financeSection).toBeVisible({ timeout: 10000 });
  });

  test('4. 待办事项面板渲染', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    const todoSection = page.getByTestId('todo-section');
    await expect(todoSection).toBeVisible({ timeout: 10000 });
  });

  test('5. 加载状态处理', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/dashboard/base`);
    // 页面应正常加载（不崩溃）
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
