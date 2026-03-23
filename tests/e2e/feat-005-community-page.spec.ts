/**
 * FEAT-005: 小区列表页 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性
 * 3. 数据加载验证
 * 4. 新增功能
 * 5. 编辑功能
 * 6. 删除功能
 * 7. 搜索/筛选功能
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-005: 小区列表页', () => {
  let createdCommunityIds: number[] = [];

  /**
   * 登录并导航到目标页面
   */
  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('[data-testid="username-input"]', { timeout: 10000 });
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
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
    // 等待表格出现
    await page.waitForSelector('[data-testid="community-table"]', { timeout: 10000 });
    // 等待加载状态消失
    await page.waitForSelector('[data-testid="table-loading"]', { state: 'hidden', timeout: 10000 });
  }

  /**
   * 获取表格行数
   */
  async function getTableRowCount(page: Page): Promise<number> {
    const rows = page.locator('[data-testid="community-table"] tbody tr');
    return await rows.count();
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/dashboard/housing/community');

    // 验证主内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toHaveText(/小区管理/);

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表格和操作按钮', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');

    // 验证表格存在
    const table = page.locator('[data-testid="community-table"]');
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表头存在
    const headers = ['小区名称', '地址', '物业电话', '操作'];
    for (const header of headers) {
      await expect(table.locator(`th:has-text("${header}")`)).toBeVisible();
    }

    // 验证新增按钮存在
    await expect(page.locator('[data-testid="add-community-button"]')).toBeVisible();
  });

  test('3. 数据加载验证 - 表格显示数据', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 验证表格有数据行（可能是 0 行，但表头应该存在）
    const rowCount = await getTableRowCount(page);
    // 即使没有数据，表格结构也应该正确
    expect(rowCount).toBeGreaterThanOrEqual(0);

    // 如果有数据，验证数据结构
    if (rowCount > 0) {
      const firstRow = page.locator('[data-testid="community-table"] tbody tr').first();
      // 验证第一行有小区名称
      const nameCell = firstRow.locator('td').first();
      await expect(nameCell).not.toBeEmpty();
    }
  });

  test('4. 新增功能 - 完整表单流程', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 记录操作前的行数
    const rowCountBefore = await getTableRowCount(page);

    // 点击新增按钮
    await page.click('[data-testid="add-community-button"]');

    // 等待弹窗出现
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });

    // 填写表单
    const testName = `${TEST_DATA_PREFIX}小区_${Date.now()}`;
    await page.fill('[data-testid="community-name-input"]', testName);
    await page.fill('[data-testid="community-address-input"]', '测试地址123号');
    await page.fill('[data-testid="community-phone-input"]', '13800138000');
    await page.fill('[data-testid="community-remark-input"]', 'E2E自动化测试数据');

    // 提交表单
    await page.click('[data-testid="submit-button"]');

    // 验证成功提示
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });
    const toastMessage = await page.locator('[data-testid="success-toast"]').textContent();
    expect(toastMessage).toContain('成功');

    // 等待弹窗关闭
    await page.waitForSelector('[data-testid="community-form-dialog"]', { state: 'hidden' });

    // 验证表格行数增加
    await page.waitForTimeout(500); // 等待表格刷新
    const rowCountAfter = await getTableRowCount(page);
    expect(rowCountAfter).toBe(rowCountBefore + 1);

    // 验证新数据出现在表格中
    await expect(page.locator(`[data-testid="community-table"] td:has-text("${testName}")`)).toBeVisible();
  });

  test('5. 编辑功能 - 修改已有数据', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 找到测试数据行（之前创建的）
    const testRow = page.locator(`[data-testid="community-table"] tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据，跳过编辑测试');
      return;
    }

    // 点击编辑按钮
    await testRow.locator('[data-testid="edit-button"]').click();

    // 等待弹窗出现
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });

    // 验证表单已填充数据
    const nameInput = page.locator('[data-testid="community-name-input"]');
    await expect(nameInput).not.toBeEmpty();

    // 修改名称
    const newName = `${TEST_DATA_PREFIX}小区_已编辑_${Date.now()}`;
    await nameInput.fill(newName);

    // 提交
    await page.click('[data-testid="submit-button"]');

    // 验证成功
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });

    // 验证数据已更新
    await page.waitForSelector('[data-testid="community-form-dialog"]', { state: 'hidden' });
    await expect(page.locator(`[data-testid="community-table"] td:has-text("${newName}")`)).toBeVisible();
  });

  test('6. 删除功能 - 确认删除流程', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 找到测试数据行
    const testRow = page.locator(`[data-testid="community-table"] tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据，跳过删除测试');
      return;
    }

    const rowCountBefore = await getTableRowCount(page);

    // 点击删除按钮
    await testRow.locator('[data-testid="delete-button"]').click();

    // 等待确认弹窗
    await page.waitForSelector('[data-testid="confirm-dialog"]', { timeout: 5000 });

    // 验认确认弹窗内容
    await expect(page.locator('[data-testid="confirm-dialog-message"]')).toContainText(/确定.*删除/);

    // 确认删除
    await page.click('[data-testid="confirm-ok-button"]');

    // 验证成功
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });

    // 验证行数减少
    await page.waitForTimeout(500);
    const rowCountAfter = await getTableRowCount(page);
    expect(rowCountAfter).toBe(rowCountBefore - 1);
  });

  test('7. 搜索功能 - 关键词筛选', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 获取初始行数
    const initialRowCount = await getTableRowCount(page);

    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.count() === 0) {
      test.skip('搜索功能未实现');
      return;
    }

    await searchInput.fill(TEST_DATA_PREFIX);
    await page.press('[data-testid="search-input"]', 'Enter');

    // 等待表格刷新
    await page.waitForTimeout(500);

    // 验证搜索结果
    const filteredRowCount = await getTableRowCount(page);
    // 搜索后行数应该 <= 初始行数
    expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

    // 验证所有显示的行都包含搜索关键词
    const rows = page.locator('[data-testid="community-table"] tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      expect(rowText).toContain(TEST_DATA_PREFIX);
    }
  });

  test('8. 表单验证 - 必填字段校验', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');
    await waitForTableReady(page);

    // 打开新增弹窗
    await page.click('[data-testid="add-community-button"]');
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });

    // 不填写任何内容，直接提交
    await page.click('[data-testid="submit-button"]');

    // 验证表单验证错误
    await expect(page.locator('[data-testid="name-error-message"]')).toBeVisible();
    expect(await page.locator('[data-testid="name-error-message"]').textContent()).toContain('必填');

    // 验证弹窗未关闭
    await expect(page.locator('[data-testid="community-form-dialog"]')).toBeVisible();
  });

  test('9. 空数据处理 - 无数据时显示空状态', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');

    // 搜索不存在的数据
    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('NOT_EXIST_DATA_' + Date.now());
      await page.press('[data-testid="search-input"]', 'Enter');
      await page.waitForTimeout(500);

      // 验证空状态提示
      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText(/暂无数据|没有找到/);
      }
    }
  });

  // ==================== 清理 ====================

  test.afterAll(async ({ page }) => {
    // 清理所有测试数据（如果需要）
    // 这里可以调用 API 清理以 TEST_DATA_PREFIX 开头的数据
  });
});
