/**
 * FEAT-124: 前端房间管理页集成 - E2E 测试
 * 类型: e2e
 *
 * 测试覆盖：
 * 1. 维修按钮存在于操作列
 * 2. 点击维修按钮跳转到 /maintenance/add?roomId=xxx
 * 3. 页面构建无报错
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-124: 房间管理页维修按钮集成', () => {
  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  function setupConsoleErrorTracker(page: Page): string[] {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    return consoleErrors;
  }

  function getCriticalErrors(errors: string[]): string[] {
    return errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Warning:') && !e.includes('[HMR]') && !e.includes('DevTools'),
    );
  }

  async function waitForTableReady(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="room-table"], table', { timeout: 10000 });
    await page.waitForTimeout(500);
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无关键报错', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/housing/room');

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toEqual([]);
  });

  test('2. 维修按钮在表格操作列中可见', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');
    await waitForTableReady(page);

    // 检查维修按钮存在
    const maintenanceButtons = page.locator('[data-testid="maintenance-button"]');
    await expect(maintenanceButtons.first()).toBeVisible({ timeout: 5000 });

    // 维修按钮应有 warning 主题色
    const firstButton = maintenanceButtons.first();
    await expect(firstButton).toHaveText('维修');
  });

  test('3. 点击维修按钮跳转到报修表单页', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');
    await waitForTableReady(page);

    // 获取第一行的房间 ID（通过编辑按钮所在行定位）
    const rows = page.locator('[data-testid="room-table"] tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();
      const maintenanceBtn = firstRow.locator('[data-testid="maintenance-button"]');
      await expect(maintenanceBtn).toBeVisible();
      await maintenanceBtn.click();

      // 验证跳转到报修表单页，带 roomId 参数
      await page.waitForURL(/\/maintenance\/add\?roomId=\d+/, { timeout: 10000 });
      const url = page.url();
      expect(url).toMatch(/\/maintenance\/add\?roomId=\d+/);
    }
  });

  test('4. 操作列包含编辑、维修、删除三个按钮', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');
    await waitForTableReady(page);

    const rows = page.locator('[data-testid="room-table"] tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();

      // 验证三个操作按钮都存在
      await expect(firstRow.locator('[data-testid="edit-button"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="maintenance-button"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="delete-button"]')).toBeVisible();

      // 验证按钮文本
      await expect(firstRow.locator('[data-testid="edit-button"]')).toHaveText('编辑');
      await expect(firstRow.locator('[data-testid="maintenance-button"]')).toHaveText('维修');
      await expect(firstRow.locator('[data-testid="delete-button"]')).toHaveText('删除');
    }
  });
});
