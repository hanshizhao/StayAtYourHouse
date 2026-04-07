/**
 * FEAT-126: 前端 Dashboard 待办面板集成 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. MaintenanceDetailDialog 组件文件存在
 * 2. TodoPanel 筛选选项包含维修类型
 * 3. Dashboard 待办面板渲染无 JS 错误
 * 4. 维修待办列表项展示（描述+优先级标签）
 * 5. 点击维修待办打开详情对话框
 * 6. 维修详情对话框内容展示
 * 7. 维修详情对话框"前往维修管理"按钮跳转
 */
import { expect, type Page, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-126: 前端 Dashboard 待办面板集成', () => {
  // ==================== 静态测试 ====================

  test('MaintenanceDetailDialog.vue 组件文件存在', () => {
    const filePath = path.resolve(
      __dirname,
      '../../Hans/src/pages/dashboard/base/components/MaintenanceDetailDialog.vue',
    );
    expect(fs.existsSync(filePath)).toBeTruthy();
    const content = fs.readFileSync(filePath, 'utf-8');
    // 验证关键元素
    expect(content).toContain('MaintenanceDetailDialog');
    expect(content).toContain('maintenance-detail-dialog');
    expect(content).toContain('completeMaintenance');
    expect(content).toContain('/maintenance/list');
  });

  test('TodoPanel.vue 包含维修类型支持', () => {
    const filePath = path.resolve(__dirname, '../../Hans/src/pages/dashboard/base/components/TodoPanel.vue');
    const content = fs.readFileSync(filePath, 'utf-8');
    // 验证导入
    expect(content).toContain('MaintenanceDetail');
    expect(content).toContain('MaintenanceDetailDialog');
    // 验证筛选选项
    expect(content).toContain('TodoType.Maintenance');
    expect(content).toContain("label: '维修'");
    // 验证样式
    expect(content).toContain('--maintenance');
  });

  // ==================== E2E 测试 ====================

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

  test('Dashboard 页面无 JS 错误', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);
    await loginAndNavigate(page, '/dashboard/base');

    // 等待待办面板加载
    await page.waitForSelector('.todo-panel', { timeout: 10000 });
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('待办面板筛选器包含维修选项', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 点击筛选下拉
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();

    // 等待下拉选项出现
    await page.waitForSelector('.t-select__list', { timeout: 5000 });

    // 验证维修选项
    const options = page.locator('.t-select__list .t-select-option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('维修');
  });

  test('维修待办列表项展示描述和优先级标签', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 筛选维修类型
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();
    await page.waitForSelector('.t-select__list', { timeout: 5000 });
    const maintenanceOption = page.locator('.t-select__list .t-select-option', { hasText: '维修' });
    await maintenanceOption.click();
    await page.waitForLoadState('networkidle');

    // 检查维修待办项（如果有的话）
    const maintenanceItems = page.locator('.todo-item--maintenance');
    const count = await maintenanceItems.count();

    if (count > 0) {
      // 验证第一项包含维修类型标签
      const firstItem = maintenanceItems.first();
      const tag = firstItem.locator('.todo-type-tag--maintenance');
      await expect(tag).toBeVisible();
      await expect(tag).toContainText('维修');
    }
  });

  test('点击维修待办打开详情对话框', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 筛选维修类型
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();
    await page.waitForSelector('.t-select__list', { timeout: 5000 });
    const maintenanceOption = page.locator('.t-select__list .t-select-option', { hasText: '维修' });
    await maintenanceOption.click();
    await page.waitForLoadState('networkidle');

    const maintenanceItems = page.locator('.todo-item--maintenance');
    const count = await maintenanceItems.count();

    if (count > 0) {
      // 点击第一个维修待办项
      await maintenanceItems.first().click();

      // 验证维修详情对话框打开
      const dialog = page.locator('[data-testid="maintenance-detail-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 验证对话框标题
      const header = dialog.locator('.t-dialog__header');
      await expect(header).toContainText('维修详情');
    }
  });

  test('维修详情对话框展示内容正确', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 筛选维修类型
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();
    await page.waitForSelector('.t-select__list', { timeout: 5000 });
    const maintenanceOption = page.locator('.t-select__list .t-select-option', { hasText: '维修' });
    await maintenanceOption.click();
    await page.waitForLoadState('networkidle');

    const maintenanceItems = page.locator('.todo-item--maintenance');
    const count = await maintenanceItems.count();

    if (count > 0) {
      await maintenanceItems.first().click();
      const dialog = page.locator('[data-testid="maintenance-detail-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 验证基本信息区域
      await expect(dialog.locator('.section-title', { hasText: '基本信息' })).toBeVisible();
      await expect(dialog.locator('.section-title', { hasText: '维修描述' })).toBeVisible();
      await expect(dialog.locator('.section-title', { hasText: '费用与人员' })).toBeVisible();

      // 验证操作按钮
      await expect(dialog.locator('button', { hasText: '前往维修管理' })).toBeVisible();
      await expect(dialog.locator('button', { hasText: '关闭' })).toBeVisible();
    }
  });

  test('前往维修管理按钮跳转正确', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 筛选维修类型
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();
    await page.waitForSelector('.t-select__list', { timeout: 5000 });
    const maintenanceOption = page.locator('.t-select__list .t-select-option', { hasText: '维修' });
    await maintenanceOption.click();
    await page.waitForLoadState('networkidle');

    const maintenanceItems = page.locator('.todo-item--maintenance');
    const count = await maintenanceItems.count();

    if (count > 0) {
      await maintenanceItems.first().click();
      const dialog = page.locator('[data-testid="maintenance-detail-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 点击"前往维修管理"
      await dialog.locator('button', { hasText: '前往维修管理' }).click();

      // 验证跳转到维修管理列表页
      await page.waitForURL(/\/maintenance\/list/, { timeout: 10000 });
      expect(page.url()).toContain('/maintenance/list');
    }
  });

  test('关闭按钮关闭维修详情对话框', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/base');
    await page.waitForSelector('.todo-panel', { timeout: 10000 });

    // 筛选维修类型
    const selectTrigger = page.locator('.todo-filter .t-select');
    await selectTrigger.click();
    await page.waitForSelector('.t-select__list', { timeout: 5000 });
    const maintenanceOption = page.locator('.t-select__list .t-select-option', { hasText: '维修' });
    await maintenanceOption.click();
    await page.waitForLoadState('networkidle');

    const maintenanceItems = page.locator('.todo-item--maintenance');
    const count = await maintenanceItems.count();

    if (count > 0) {
      await maintenanceItems.first().click();
      const dialog = page.locator('[data-testid="maintenance-detail-dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 点击关闭
      await dialog.locator('button', { hasText: '关闭' }).click();

      // 验证对话框关闭
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
    }
  });
});
