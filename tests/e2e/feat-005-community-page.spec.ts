/**
 * FEAT-005: 小区列表页 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-005: 小区列表页', () => {

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
    await loginAndNavigate(page, '/dashboard/housing/community');

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
    await loginAndNavigate(page, '/dashboard/housing/community');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('3. 新增功能 - 表单提交', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');

    await page.click('button:has-text("新增")');
    await page.waitForSelector('form', { timeout: 5000 });

    await page.fill('input[name="name"]', '测试小区');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-sonner-toast][data-type="success"]', {
      timeout: 10000
    });
  });
});
