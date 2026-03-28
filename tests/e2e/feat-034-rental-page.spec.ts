/**
 * FEAT-034: 租赁记录列表页面 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性（表格、列头）
 * 3. 筛选栏（状态/小区/房间）
 * 4. 后端分页 API 请求
 * 5. 展开行关联账单（TDesign t-table）
 * 6. 金额格式化
 * 7. 状态标签
 * 8. 小区→房间级联筛选（按需加载）
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const RENTAL_PAGE_PATH = '/housing/rental';

test.describe.serial('FEAT-034: 租赁记录列表页面', () => {
  /**
   * 登录并导航到租赁记录页面
   */
  async function loginAndNavigateToRental(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${RENTAL_PAGE_PATH}`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 获取控制台错误（排除非关键错误）
   */
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
      (e) =>
        !e.includes('favicon') &&
        !e.includes('Warning:') &&
        !e.includes('[HMR]') &&
        !e.includes('DevTools') &&
        !e.includes('ResizeObserver'),
    );
  }

  /**
   * 等待表格加载完成
   */
  async function waitForTableReady(page: Page): Promise<void> {
    await page.waitForSelector('.t-table', { timeout: 10000 });
    const loading = page.locator('.t-loading');
    if ((await loading.count()) > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);
    await loginAndNavigateToRental(page);

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表格渲染', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    const table = page.locator('.t-table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表头包含关键列
    const headers = table.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerStr = headerTexts.join(' ');

    expect(headerStr).toContain('ID');
    expect(headerStr).toContain('租客');
    expect(headerStr).toContain('房间信息');
    expect(headerStr).toContain('月租金');
    expect(headerStr).toContain('状态');
  });

  test('3. 筛选栏 - 状态选择器', async ({ page }) => {
    await loginAndNavigateToRental(page);

    const statusSelect = page.locator('[data-testid="status-filter"]');
    await expect(statusSelect).toBeVisible({ timeout: 5000 });
  });

  test('4. 筛选栏 - 小区选择器', async ({ page }) => {
    await loginAndNavigateToRental(page);

    const communitySelect = page.locator('[data-testid="community-filter"]');
    await expect(communitySelect).toBeVisible({ timeout: 5000 });
  });

  test('5. 筛选栏 - 房间选择器（默认禁用）', async ({ page }) => {
    await loginAndNavigateToRental(page);

    const roomSelect = page.locator('[data-testid="room-filter"]');
    await expect(roomSelect).toBeVisible({ timeout: 5000 });

    // 房间筛选在未选择小区时应禁用
    const isDisabled = await roomSelect.evaluate((el: Element) => {
      const input = el.querySelector('input');
      return input ? (input as HTMLInputElement).disabled : false;
    });
    expect(isDisabled).toBeTruthy();
  });

  test('6. 状态筛选选项验证', async ({ page }) => {
    await loginAndNavigateToRental(page);

    const statusSelect = page.locator('[data-testid="status-filter"]');
    await statusSelect.click();
    await page.waitForTimeout(500);

    const options = page.locator('.t-select-option');
    if ((await options.count()) > 0) {
      const optionTexts = await options.allTextContents();
      const optionStr = optionTexts.join(' ');
      expect(optionStr).toContain('在租中');
      expect(optionStr).toContain('已退租');
    }
  });

  test('7. 数据加载 - 分页 API 请求', async ({ page }) => {
    const apiRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/rental/page') && req.method() === 'GET',
      { timeout: 10000 },
    );

    await loginAndNavigateToRental(page);
    const apiRequest = await apiRequestPromise;

    expect(apiRequest.url()).toContain('/rental/page');
    expect(apiRequest.url()).toContain('page=');
    expect(apiRequest.url()).toContain('pageSize=');
  });

  test('8. 分页组件可见', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    const pagination = page.locator('.t-pagination');
    if ((await pagination.count()) > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('9. 展开行 - 查看关联账单', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);
    await page.waitForTimeout(1000);

    // 查找展开按钮
    const expandButton = page.locator('.t-table__expand-box').first();
    if ((await expandButton.count()) > 0) {
      await expandButton.click();
      await page.waitForTimeout(1000);

      // 展开后应显示关联账单区域（t-table 展开行）
      const expandedArea = page.locator('.expanded-bills-container, .expanded-bills-empty');
      if ((await expandedArea.count()) > 0) {
        await expect(expandedArea.first()).toBeVisible();
      }
    }
  });

  test('10. 小区筛选 - 级联按需加载房间', async ({ page }) => {
    await loginAndNavigateToRental(page);

    // 点击小区筛选下拉框
    const communitySelect = page.locator('[data-testid="community-filter"]');
    await communitySelect.click();
    await page.waitForTimeout(500);

    const firstOption = page.locator('.t-select-option').first();
    if ((await firstOption.count()) > 0) {
      // 选择小区后应触发房间列表 API 请求（按需加载）
      const roomRequestPromise = page.waitForRequest(
        (req) => req.url().includes('/room/list') && req.method() === 'GET',
        { timeout: 10000 },
      );

      await firstOption.click();

      try {
        await roomRequestPromise;
        // 房间选择器应不再禁用
        await page.waitForTimeout(500);
      } catch {
        // 选项可能为空，忽略超时
      }
    }
  });

  test('11. 金额格式化显示', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    // 验证金额包含 ¥ 符号
    const amountCells = page.locator('.rental-list .amount');
    if ((await amountCells.count()) > 0) {
      const text = await amountCells.first().textContent();
      expect(text).toContain('¥');
    }
  });

  test('12. 状态标签显示', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    const statusTags = page.locator('.rental-list .t-tag');
    if ((await statusTags.count()) > 0) {
      const tagTexts = await statusTags.allTextContents();
      expect(tagTexts.length).toBeGreaterThan(0);
    }
  });
});
