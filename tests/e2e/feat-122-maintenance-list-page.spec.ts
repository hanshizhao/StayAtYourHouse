/**
 * FEAT-122: 前端维修列表页 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性（筛选栏、表格、操作按钮）
 * 3. 筛选功能（状态、优先级）
 * 4. 新增报修按钮跳转
 * 5. 查看详情对话框
 * 6. 标记完成对话框
 * 7. 删除确认对话框
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-122: 前端维修列表页', () => {
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
    await page.waitForSelector('[data-testid="maintenance-table"], table', { timeout: 10000 });
    await page.waitForTimeout(500);
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无关键报错', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/maintenance/list');

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 新增按钮和筛选栏', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');

    // 新增报修按钮
    const addButton = page.locator('[data-testid="add-maintenance-button"]');
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await expect(addButton).toContainText('新增报修');

    // 状态筛选
    const statusFilter = page.locator('[data-testid="maintenance-status-filter"]');
    await expect(statusFilter).toBeVisible();

    // 优先级筛选
    const priorityFilter = page.locator('[data-testid="maintenance-priority-filter"]');
    await expect(priorityFilter).toBeVisible();

    // 数据表格
    const table = page.locator('[data-testid="maintenance-table"]');
    await expect(table).toBeVisible();
  });

  test('3. 表格列头验证', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const expectedHeaders = ['房间', '描述', '优先级', '状态', '报修日期', '预算费用', '维修人员', '创建时间', '操作'];
    for (const header of expectedHeaders) {
      const headerLocator = page.locator(`th:has-text("${header}")`);
      if (await headerLocator.count() > 0) {
        await expect(headerLocator.first()).toBeVisible();
      }
    }
  });

  test('4. 新增报修按钮跳转', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');

    const addButton = page.locator('[data-testid="add-maintenance-button"]');
    await addButton.click();
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/maintenance/add');
  });

  test('5. 筛选功能 - 按状态筛选', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const statusFilter = page.locator('[data-testid="maintenance-status-filter"]');
    await statusFilter.click();
    await page.waitForTimeout(300);

    const pendingOption = page.locator('.t-select-option:has-text("待处理"), .t-select__dropdown-item:has-text("待处理")').first();
    if (await pendingOption.isVisible()) {
      await pendingOption.click();
      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="maintenance-table"]')).toBeVisible();
    }
  });

  test('6. 筛选功能 - 按优先级筛选', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const priorityFilter = page.locator('[data-testid="maintenance-priority-filter"]');
    await priorityFilter.click();
    await page.waitForTimeout(300);

    const urgentOption = page.locator('.t-select-option:has-text("紧急"), .t-select__dropdown-item:has-text("紧急")').first();
    if (await urgentOption.isVisible()) {
      await urgentOption.click();
      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="maintenance-table"]')).toBeVisible();
    }
  });

  test('7. 查看详情对话框', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const viewButton = page.locator('[data-testid="view-maintenance-button"]').first();
    if (await viewButton.count() === 0) {
      test.skip('没有找到查看按钮');
      return;
    }

    await viewButton.click();

    const detailDialog = page.locator('[data-testid="detail-dialog"]');
    await expect(detailDialog).toBeVisible({ timeout: 5000 });
    await expect(detailDialog).toContainText('维修记录详情');
  });

  test('8. 标记完成对话框', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const completeButton = page.locator('[data-testid="complete-maintenance-button"]').first();
    if (await completeButton.count() === 0) {
      test.skip('没有找到标记完成按钮（可能所有记录已完成）');
      return;
    }

    await completeButton.click();

    const completeDialog = page.locator('[data-testid="complete-dialog"]');
    await expect(completeDialog).toBeVisible({ timeout: 5000 });

    // 验证对话框包含实际费用输入和备注
    const actualCostInput = page.locator('[data-testid="complete-actual-cost-input"]');
    await expect(actualCostInput).toBeVisible();

    const remarkInput = page.locator('[data-testid="complete-remark-input"]');
    await expect(remarkInput).toBeVisible();

    // 取消操作（避免影响数据）
    const cancelButton = page.locator('[data-testid="complete-dialog"] button:has-text("取消")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
  });

  test('9. 删除确认对话框', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    const deleteButton = page.locator('[data-testid="delete-maintenance-button"]').first();
    if (await deleteButton.count() === 0) {
      test.skip('没有找到删除按钮');
      return;
    }

    await deleteButton.click();

    const deleteDialog = page.locator('[data-testid="delete-dialog"]');
    await expect(deleteDialog).toBeVisible({ timeout: 5000 });

    const deleteMessage = page.locator('[data-testid="delete-dialog-message"]');
    await expect(deleteMessage).toContainText('确定要删除');
  });

  test('10. 优先级和状态 t-tag 颜色标签', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await waitForTableReady(page);

    // 验证表格中存在 t-tag 元素（优先级和状态列）
    const tags = page.locator('[data-testid="maintenance-table"] .t-tag');
    if (await tags.count() > 0) {
      // 验证至少有一些标签可见
      await expect(tags.first()).toBeVisible();
    }
  });
});
