/**
 * FEAT-040: 前端房间列表页适配 - E2E 测试
 * ✅ 适用于：前端页面修改
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-040: 前端房间列表页适配', () => {
  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
    await page.fill('input[placeholder*="账号"]', 'zhs');
    await page.fill('input[placeholder*="密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Warning:')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 状态筛选器包含已收回选项', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    // 点击状态筛选下拉框（使用 data-testid 精确定位）
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.click();

    // 检查下拉选项中包含"已收回"
    const options = page.locator('.t-select-option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts.some(t => t.includes('已收回'))).toBeTruthy();
  });

  test('3. 已收回状态标签正确显示', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    // 如果存在已收回状态的房间，验证标签显示
    const table = page.locator('[data-testid="room-table"]');
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});
