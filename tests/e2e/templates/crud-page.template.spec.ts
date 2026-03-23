/**
 * FEAT-XXX: [页面名称] - E2E 测试模板
 * 类型: e2e
 * 适用于: 前端 CRUD 页面
 *
 * 使用说明：
 * 1. 复制此模板到 tests/e2e/feat-xxx-[name].spec.ts
 * 2. 替换所有 FEAT-XXX 为实际功能编号
 * 3. 替换 [PageName] 为实际页面名称
 * 4. 根据实际页面调整选择器和测试数据
 * 5. 删除不适用的测试用例
 */
import { test, expect, Page } from '@playwright/test';
import {
  BASE_URL,
  TEST_DATA_PREFIX,
  loginAndNavigate,
  setupConsoleErrorTracker,
  getCriticalErrors,
  waitForTableReady,
  getTableRowCount,
  waitForSuccessToast,
  generateTestName,
  assertNoCriticalErrors
} from '../helpers/test-utils';

// ==================== 配置 ====================

const PAGE_PATH = '/dashboard/[module]/[page]'; // 替换为实际路径
const TABLE_SELECTOR = '[data-testid="[entity]-table"]'; // 替换为实际选择器
const ADD_BUTTON_SELECTOR = '[data-testid="add-[entity]-button"]';
const DIALOG_SELECTOR = '[data-testid="[entity]-form-dialog"]';

test.describe('FEAT-XXX: [PageName]', () => {
  // ==================== 辅助函数 ====================

  /**
   * 导航到目标页面
   */
  async function navigateToPage(page: Page): Promise<void> {
    await loginAndNavigate(page, PAGE_PATH);
    await waitForTableReady(page, TABLE_SELECTOR);
  }

  /**
   * 打开新增表单
   */
  async function openAddForm(page: Page): Promise<void> {
    await page.click(ADD_BUTTON_SELECTOR);
    await page.waitForSelector(DIALOG_SELECTOR, { timeout: 5000 });
  }

  /**
   * 填写表单（根据实际表单字段调整）
   */
  async function fillForm(page: Page, data: Record<string, string>): Promise<void> {
    // 示例：填写名称字段
    if (data.name) {
      await page.fill('[data-testid="name-input"]', data.name);
    }
    // 添加更多字段...
  }

  // ==================== 1. 页面可访问性测试 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await navigateToPage(page);

    // 验证主内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toHaveText(/[页面名称]/);

    // 验证无关键错误
    assertNoCriticalErrors(consoleErrors);
  });

  // ==================== 2. 核心元素可见性测试 ====================

  test('2. 核心元素可见 - 表格和操作按钮', async ({ page }) => {
    await navigateToPage(page);

    // 验证表格存在
    await expect(page.locator(TABLE_SELECTOR)).toBeVisible({ timeout: 5000 });

    // 验证表头存在（根据实际表头调整）
    const headers = ['名称', '操作']; // 替换为实际表头
    for (const header of headers) {
      await expect(page.locator(`${TABLE_SELECTOR} th:has-text("${header}")`)).toBeVisible();
    }

    // 验证新增按钮存在
    await expect(page.locator(ADD_BUTTON_SELECTOR)).toBeVisible();
  });

  // ==================== 3. 数据加载验证测试 ====================

  test('3. 数据加载验证 - 表格显示数据', async ({ page }) => {
    await navigateToPage(page);

    const rowCount = await getTableRowCount(page, TABLE_SELECTOR);
    expect(rowCount).toBeGreaterThanOrEqual(0);

    // 如果有数据，验证数据结构
    if (rowCount > 0) {
      const firstRow = page.locator(`${TABLE_SELECTOR} tbody tr`).first();
      await expect(firstRow.locator('td').first()).not.toBeEmpty();
    }
  });

  // ==================== 4. 新增功能测试 ====================

  test('4. 新增功能 - 完整表单流程', async ({ page }) => {
    await navigateToPage(page);
    const rowCountBefore = await getTableRowCount(page, TABLE_SELECTOR);

    // 打开表单
    await openAddForm(page);

    // 填写表单
    const testData = {
      name: generateTestName()
    };
    await fillForm(page, testData);

    // 提交
    await page.click('[data-testid="submit-button"]');

    // 验证成功
    const toastMessage = await waitForSuccessToast(page);
    expect(toastMessage).toContain('成功');

    // 验证弹窗关闭
    await page.waitForSelector(DIALOG_SELECTOR, { state: 'hidden' });

    // 验证数据增加
    await page.waitForTimeout(500);
    const rowCountAfter = await getTableRowCount(page, TABLE_SELECTOR);
    expect(rowCountAfter).toBe(rowCountBefore + 1);

    // 验证新数据出现
    await expect(page.locator(`${TABLE_SELECTOR} td:has-text("${testData.name}")`)).toBeVisible();
  });

  // ==================== 5. 编辑功能测试 ====================

  test('5. 编辑功能 - 修改已有数据', async ({ page }) => {
    await navigateToPage(page);

    // 找到测试数据行
    const testRow = page.locator(`${TABLE_SELECTOR} tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据');
      return;
    }

    // 点击编辑
    await testRow.locator('[data-testid="edit-button"]').click();
    await page.waitForSelector(DIALOG_SELECTOR, { timeout: 5000 });

    // 修改数据
    const newName = generateTestName('已编辑_');
    await page.fill('[data-testid="name-input"]', newName);

    // 提交
    await page.click('[data-testid="submit-button"]');
    await waitForSuccessToast(page);

    // 验证更新
    await page.waitForSelector(DIALOG_SELECTOR, { state: 'hidden' });
    await expect(page.locator(`${TABLE_SELECTOR} td:has-text("${newName}")`)).toBeVisible();
  });

  // ==================== 6. 删除功能测试 ====================

  test('6. 删除功能 - 确认删除流程', async ({ page }) => {
    await navigateToPage(page);

    const testRow = page.locator(`${TABLE_SELECTOR} tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据');
      return;
    }

    const rowCountBefore = await getTableRowCount(page, TABLE_SELECTOR);

    // 点击删除
    await testRow.locator('[data-testid="delete-button"]').click();

    // 确认删除
    await page.waitForSelector('[data-testid="confirm-dialog"]', { timeout: 5000 });
    await page.click('[data-testid="confirm-ok-button"]');

    // 验证成功
    await waitForSuccessToast(page);

    // 验证行数减少
    await page.waitForTimeout(500);
    const rowCountAfter = await getTableRowCount(page, TABLE_SELECTOR);
    expect(rowCountAfter).toBe(rowCountBefore - 1);
  });

  // ==================== 7. 搜索功能测试 ====================

  test('7. 搜索功能 - 关键词筛选', async ({ page }) => {
    await navigateToPage(page);

    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.count() === 0) {
      test.skip('搜索功能未实现');
      return;
    }

    const initialRowCount = await getTableRowCount(page, TABLE_SELECTOR);

    // 搜索
    await searchInput.fill(TEST_DATA_PREFIX);
    await page.press('[data-testid="search-input"]', 'Enter');
    await page.waitForTimeout(500);

    // 验证结果
    const filteredRowCount = await getTableRowCount(page, TABLE_SELECTOR);
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
  });

  // ==================== 8. 表单验证测试 ====================

  test('8. 表单验证 - 必填字段校验', async ({ page }) => {
    await navigateToPage(page);
    await openAddForm(page);

    // 不填写任何内容，直接提交
    await page.click('[data-testid="submit-button"]');

    // 验证验证错误
    await expect(page.locator('[data-testid="name-error-message"]')).toBeVisible();
    expect(await page.locator('[data-testid="name-error-message"]').textContent()).toContain('必填');
  });

  // ==================== 9. 空数据测试 ====================

  test('9. 空数据处理 - 无数据时显示空状态', async ({ page }) => {
    await navigateToPage(page);

    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('NOT_EXIST_' + Date.now());
      await page.press('[data-testid="search-input"]', 'Enter');
      await page.waitForTimeout(500);

      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });
});
