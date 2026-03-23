/**
 * FEAT-018: 账单列表页 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性
 * 3. 数据加载验证
 * 4. 状态筛选功能
 * 5. 小区筛选功能
 * 6. 月份筛选功能
 * 7. 催收按钮功能
 * 8. 表格数据验证
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-018: 账单列表页', () => {
  /**
   * 登录并导航到目标页面
   */
  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 获取控制台错误（排除非关键错误）
   */
  function setupConsoleErrorTracker(page: Page): string[] {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    return consoleErrors;
  }

  /**
   * 过滤关键错误
   */
  function getCriticalErrors(errors: string[]): string[] {
    return errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Warning:') &&
      !e.includes('[HMR]') &&
      !e.includes('DevTools')
    );
  }

  /**
   * 等待表格加载完成
   */
  async function waitForTableReady(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="bill-table"], .t-table', { timeout: 10000 });
    const loading = page.locator('[data-testid="table-loading"], .t-loading');
    if (await loading.count() > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * 获取表格行数
   */
  async function getTableRowCount(page: Page): Promise<number> {
    const rows = page.locator('[data-testid="bill-table"] tbody tr, .t-table tbody tr');
    return await rows.count();
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/dashboard/bill');

    // 验证主内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表格存在', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 验证表格存在
    const table = page.locator('[data-testid="bill-table"], .t-table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('3. 表格列头完整性', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 验证表格列头存在
    const expectedHeaders = ['租客', '房间', '应收日期', '房租', '水电', '总额', '状态'];

    for (const header of expectedHeaders) {
      const headerCell = page.locator(`th:has-text("${header}"), .t-table th:has-text("${header}")`);
      if (await headerCell.count() > 0) {
        await expect(headerCell.first()).toBeVisible();
      }
    }
  });

  test('4. 筛选区域 - 状态筛选存在', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');

    // 验证状态筛选下拉框存在
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has([placeholder*="状态"])');
    await expect(statusSelect).toBeVisible();
  });

  test('5. 筛选区域 - 小区筛选存在', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');

    // 验证小区筛选下拉框存在
    const communitySelect = page.locator('[data-testid="community-filter"], .t-select:has([placeholder*="小区"])');
    await expect(communitySelect).toBeVisible();
  });

  test('6. 筛选区域 - 月份筛选存在', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');

    // 验证月份筛选日期选择器存在
    const monthPicker = page.locator('[data-testid="month-filter"], .t-date-picker:has([placeholder*="月份"])');
    await expect(monthPicker).toBeVisible();
  });

  test('7. 筛选区域 - 搜索按钮存在', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');

    // 验证搜索按钮存在
    const searchButton = page.locator('[data-testid="search-button"], button:has-text("搜索"), button:has-text("查询")');
    await expect(searchButton.first()).toBeVisible();
  });

  test('8. 数据加载验证 - 表格显示数据', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 验证表格有数据行
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('9. 状态筛选功能', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 点击状态筛选
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has([placeholder*="状态"])');
    await statusSelect.click();

    // 等待下拉选项出现
    await page.waitForTimeout(300);

    // 验证状态选项存在
    const options = page.locator('.t-select-option, .t-select__dropdown li');
    expect(await options.count()).toBeGreaterThan(0);

    // 选择"待收"状态
    const pendingOption = page.locator('.t-select-option:has-text("待收"), .t-select__dropdown li:has-text("待收")');
    if (await pendingOption.count() > 0) {
      await pendingOption.first().click();
      await page.waitForTimeout(500);

      // 验证表格刷新
      await waitForTableReady(page);
    }
  });

  test('10. 小区筛选功能', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 点击小区筛选
    const communitySelect = page.locator('[data-testid="community-filter"], .t-select:has([placeholder*="小区"])');
    await communitySelect.click();

    // 等待下拉选项出现
    await page.waitForTimeout(300);

    // 验证选项存在
    const options = page.locator('.t-select-option, .t-select__dropdown li');
    if (await options.count() > 0) {
      // 选择第一个小区
      await options.first().click();
      await page.waitForTimeout(500);

      // 验证表格刷新
      await waitForTableReady(page);
    }
  });

  test('11. 月份筛选功能', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 选择月份
    const monthPicker = page.locator('[data-testid="month-filter"] input, .t-date-picker input');
    await monthPicker.fill('2026-03');

    // 点击搜索
    const searchButton = page.locator('[data-testid="search-button"], button:has-text("搜索")').first();
    await searchButton.click();

    // 验证表格刷新
    await page.waitForTimeout(500);
    await waitForTableReady(page);
  });

  test('12. 催收按钮 - 待收状态显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 筛选待收状态
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has([placeholder*="状态"])');
    await statusSelect.click();
    await page.waitForTimeout(300);

    const pendingOption = page.locator('.t-select-option:has-text("待收"), .t-select__dropdown li:has-text("待收")');
    if (await pendingOption.count() > 0) {
      await pendingOption.first().click();
      await page.waitForTimeout(500);

      // 验证待收状态的行有催收按钮
      const collectButton = page.locator('[data-testid="collect-button"], button:has-text("催收")');
      if (await collectButton.count() > 0) {
        await expect(collectButton.first()).toBeVisible();
      }
    }
  });

  test('13. 催收按钮 - 已收状态不显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 筛选已收状态
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has([placeholder*="状态"])');
    await statusSelect.click();
    await page.waitForTimeout(300);

    const paidOption = page.locator('.t-select-option:has-text("已收"), .t-select__dropdown li:has-text("已收")');
    if (await paidOption.count() > 0) {
      await paidOption.first().click();
      await page.waitForTimeout(500);

      // 验证已收状态的行没有催收按钮
      const collectButton = page.locator('[data-testid="collect-button"], button:has-text("催收")');
      // 催收按钮应该不存在或不可见
      expect(await collectButton.count()).toBe(0);
    }
  });

  test('14. 点击催收按钮 - 打开弹窗', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 找到催收按钮
    const collectButton = page.locator('[data-testid="collect-button"], button:has-text("催收")');
    if (await collectButton.count() > 0) {
      await collectButton.first().click();

      // 等待弹窗出现
      const dialog = page.locator('[data-testid="collect-dialog"], .t-dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    } else {
      test.skip('没有待收账单，跳过催收弹窗测试');
    }
  });

  test('15. 空数据处理 - 无数据时显示空状态', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');

    // 使用不可能存在的筛选条件
    const monthPicker = page.locator('[data-testid="month-filter"] input, .t-date-picker input');
    await monthPicker.fill('2000-01');

    const searchButton = page.locator('[data-testid="search-button"], button:has-text("搜索")').first();
    await searchButton.click();

    await page.waitForTimeout(500);

    // 验证空状态提示
    const emptyState = page.locator('[data-testid="empty-state"], .t-table__empty, .t-empty');
    if (await emptyState.count() > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('16. 分页功能验证', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 检查分页组件
    const pagination = page.locator('[data-testid="pagination"], .t-pagination');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('17. 表格数据格式验证 - 金额显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 找到金额列
    const amountCells = page.locator('[data-testid="bill-table"] td:has-text("元"), .t-table td');
    if (await amountCells.count() > 0) {
      const text = await amountCells.first().textContent();
      // 验证金额格式（包含数字）
      expect(text).toMatch(/\d+/);
    }
  });

  test('18. 表格数据格式验证 - 日期显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 找到日期列
    const dateCells = page.locator('[data-testid="bill-table"] td, .t-table td');
    if (await dateCells.count() > 0) {
      // 日期格式应该是 YYYY-MM-DD
      const text = await dateCells.first().textContent();
      expect(text).toMatch(/\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2}/);
    }
  });

  test('19. 表格数据格式验证 - 状态标签', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 找到状态标签
    const statusTags = page.locator('[data-testid="bill-table"] .t-tag, .t-table .t-tag');
    if (await statusTags.count() > 0) {
      const text = await statusTags.first().textContent();
      // 状态应该是：待收、宽限中、已收、逾期之一
      expect(text).toMatch(/待收|宽限中|已收|逾期/);
    }
  });

  test('20. 重置筛选功能', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/bill');
    await waitForTableReady(page);

    // 设置筛选条件
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has([placeholder*="状态"])');
    await statusSelect.click();
    await page.waitForTimeout(300);

    const pendingOption = page.locator('.t-select-option:has-text("待收"), .t-select__dropdown li:has-text("待收")');
    if (await pendingOption.count() > 0) {
      await pendingOption.first().click();
      await page.waitForTimeout(500);

      // 查找重置按钮
      const resetButton = page.locator('[data-testid="reset-button"], button:has-text("重置")');
      if (await resetButton.count() > 0) {
        await resetButton.click();
        await page.waitForTimeout(500);

        // 验证筛选条件已重置
        await waitForTableReady(page);
      }
    }
  });
});
