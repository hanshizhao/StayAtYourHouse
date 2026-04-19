/**
 * FEAT-179: 老赖管理主列表页 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面集成
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性（标题、搜索、状态标签、新增按钮）
 * 3. 状态标签切换
 * 4. 搜索功能
 * 5. 新增欠款弹窗
 * 6. 分页功能
 * 7. 空数据处理
 * 8. 集成弹窗组件验证
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-179: 老赖管理主列表页', () => {
  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/login`);
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
      e =>
        !e.includes('favicon') &&
        !e.includes('Warning:') &&
        !e.includes('[HMR]') &&
        !e.includes('DevTools'),
    );
  }

  async function waitForPageReady(page: Page): Promise<void> {
    await page.waitForSelector('.debt-management', { timeout: 10000 });
    const loading = page.locator('.t-loading');
    if (await loading.count() > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/debt/list');

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 标题、搜索、状态标签、新增按钮', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    await expect(page.locator('.debt-page-title')).toHaveText('老赖管理');

    await expect(page.getByTestId('debt-add-btn')).toBeVisible();

    await expect(page.getByTestId('debt-search-input')).toBeVisible();

    await expect(page.getByTestId('debt-tab-all')).toBeVisible();
    await expect(page.getByTestId('debt-tab-0')).toHaveText('进行中');
    await expect(page.getByTestId('debt-tab-1')).toHaveText('已还清');
  });

  test('3. 状态标签切换 - 全部/进行中/已还清', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    const tabAll = page.getByTestId('debt-tab-all');
    const tabOngoing = page.getByTestId('debt-tab-0');
    const tabSettled = page.getByTestId('debt-tab-1');

    await expect(tabAll).toHaveClass(/debt-status-tab--active/);

    await tabOngoing.click();
    await expect(tabOngoing).toHaveClass(/debt-status-tab--active/);
    await expect(tabAll).not.toHaveClass(/debt-status-tab--active/);

    await tabSettled.click();
    await expect(tabSettled).toHaveClass(/debt-status-tab--active/);

    await tabAll.click();
    await expect(tabAll).toHaveClass(/debt-status-tab--active/);
  });

  test('4. 搜索功能 - 输入关键词触发筛选', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    const searchInput = page.getByTestId('debt-search-input').locator('input');

    await searchInput.fill('不存在的租客');
    await page.waitForTimeout(500);

    const emptyState = page.locator('.t-empty');
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    const clearButton = page.getByTestId('debt-search-input').locator('.t-input__suffix-clear');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('5. 新增欠款弹窗 - 点击新增按钮打开 DebtFormDialog', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    await page.getByTestId('debt-add-btn').click();

    const dialog = page.getByTestId('debt-form-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await expect(dialog.locator('input[placeholder*="租客"]')).toBeVisible();
    await expect(dialog.locator('input[placeholder*="金额"]')).toBeVisible();
  });

  test('6. 分页功能 - 分页组件可见', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    const pagination = page.locator('.debt-pagination .t-pagination');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();

      const totalText = page.locator('.t-pagination__total');
      if (await totalText.count() > 0) {
        const text = await totalText.textContent();
        expect(text).toMatch(/\d+/);
      }
    }
  });

  test('7. 空数据处理 - 搜索不存在数据时显示空状态', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    const searchInput = page.getByTestId('debt-search-input').locator('input');
    await searchInput.fill(`NOT_EXIST_${Date.now()}`);
    await page.waitForTimeout(500);

    const emptyState = page.locator('.t-empty');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('8. 卡片网格布局 - DebtCard 组件渲染', async ({ page }) => {
    await loginAndNavigate(page, '/debt/list');
    await waitForPageReady(page);

    const cardGrid = page.locator('.debt-card-grid');
    const cards = page.locator('.debt-card');

    if (await cardGrid.isVisible()) {
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);

      const firstCard = cards.first();
      await expect(firstCard.locator('.debt-card__name')).toBeVisible();
      await expect(firstCard.locator('.t-tag')).toBeVisible();
    }
  });
});
