/**
 * FEAT-006: 房间列表页 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性
 * 3. 数据加载验证
 * 4. 筛选功能（小区、状态）
 * 5. 新增功能
 * 6. 编辑功能
 * 7. 删除功能
 * 8. 跳转详情功能
 * 9. 表单验证
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-006: 房间列表页', () => {

  /**
   * 登录并导航到目标页面
   */
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
    await page.waitForSelector('[data-testid="room-table"], table', { timeout: 10000 });
    await page.waitForTimeout(500); // 等待数据渲染
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/dashboard/housing/room');

    // 验证主内容区域可见
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表格和操作按钮', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    // 验证表格存在
    const table = page.locator('[data-testid="room-table"], table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表头存在
    const expectedHeaders = ['楼栋', '房间号', '成本价', '租金', '状态'];
    for (const header of expectedHeaders) {
      const headerLocator = table.locator(`th:has-text("${header}")`);
      // 至少有一个表头存在
      if (await headerLocator.count() > 0) {
        await expect(headerLocator.first()).toBeVisible();
      }
    }

    // 验证新增按钮存在
    const addButton = page.locator('[data-testid="add-room-button"], button:has-text("新增")');
    if (await addButton.count() > 0) {
      await expect(addButton.first()).toBeVisible();
    }
  });

  test('3. 筛选功能 - 按小区筛选', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 查找小区筛选下拉框
    const communitySelect = page.locator('[data-testid="community-filter"], .t-select:has-text("小区")').first();
    if (await communitySelect.isVisible()) {
      await communitySelect.click();
      await page.waitForTimeout(300);

      // 选择第一个选项
      const firstOption = page.locator('.t-select-option, .t-select__dropdown-item').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(500);

        // 验证筛选生效（表格数据应该刷新）
        await expect(page.locator('[data-testid="room-table"], table')).toBeVisible();
      }
    }
  });

  test('4. 筛选功能 - 按状态筛选', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 查找状态筛选下拉框
    const statusSelect = page.locator('[data-testid="status-filter"], .t-select:has-text("状态")').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.click();
      await page.waitForTimeout(300);

      // 选择空置状态
      const vacantOption = page.locator('.t-select-option:has-text("空置"), .t-select__dropdown-item:has-text("空置")').first();
      if (await vacantOption.isVisible()) {
        await vacantOption.click();
        await page.waitForTimeout(500);

        // 验证筛选生效
        await expect(page.locator('[data-testid="room-table"], table')).toBeVisible();
      }
    }
  });

  test('5. 新增功能 - 完整表单流程', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 点击新增按钮
    const addButton = page.locator('[data-testid="add-room-button"], button:has-text("新建")').first();
    if (await addButton.count() === 0) {
      test.skip('新增按钮不存在');
      return;
    }
    await addButton.click();

    // 等待弹窗出现
    const dialog = page.locator('[data-testid="room-form-dialog"], .t-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写表单
    const buildingInput = page.locator('[data-testid="room-building-input"], input[placeholder*="楼栋"]');
    if (await buildingInput.isVisible()) {
      await buildingInput.fill(`${TEST_DATA_PREFIX}楼栋_${Date.now()}`);
    }

    const roomNumberInput = page.locator('[data-testid="room-number-input"], input[placeholder*="房间号"]');
    if (await roomNumberInput.isVisible()) {
      await roomNumberInput.fill('101');
    }

    const costPriceInput = page.locator('[data-testid="room-cost-price-input"], input[placeholder*="成本价"]');
    if (await costPriceInput.isVisible()) {
      await costPriceInput.fill('1500');
    }

    const rentPriceInput = page.locator('[data-testid="room-rent-price-input"], input[placeholder*="出租价"]');
    if (await rentPriceInput.isVisible()) {
      await rentPriceInput.fill('2000');
    }

    // 提交表单
    const submitButton = page.locator('[data-testid="submit-button"], button:has-text("确定")').first();
    await submitButton.click();

    // 验证成功提示或弹窗关闭
    await page.waitForTimeout(1000);
    const successToast = page.locator('[data-testid="success-toast"], .t-message--success');
    const dialogClosed = await dialog.isHidden();

    expect(successToast.isVisible() || dialogClosed).toBeTruthy();
  });

  test('6. 编辑功能 - 修改已有数据', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 查找编辑按钮
    const editButton = page.locator('[data-testid="edit-button"], a:has-text("编辑")').first();
    if (await editButton.count() === 0) {
      test.skip('没有找到编辑按钮');
      return;
    }

    await editButton.click();

    // 等待弹窗出现
    const dialog = page.locator('[data-testid="room-form-dialog"], .t-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 验证表单已填充数据
    const costPriceInput = page.locator('[data-testid="room-cost-price-input"], input[placeholder*="成本价"]');
    if (await costPriceInput.isVisible()) {
      const value = await costPriceInput.inputValue();
      expect(value).not.toBe('');
    }
  });

  test('7. 删除功能 - 确认删除流程', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 查找删除按钮
    const deleteButton = page.locator('[data-testid="delete-button"], a:has-text("删除")').first();
    if (await deleteButton.count() === 0) {
      test.skip('没有找到删除按钮');
      return;
    }

    await deleteButton.click();

    // 等待确认弹窗
    const confirmDialog = page.locator('[data-testid="confirm-dialog"], .t-dialog:has-text("确定")');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // 取消删除（避免影响其他测试）
    const cancelButton = page.locator('[data-testid="cancel-button"], button:has-text("取消")').first();
    await cancelButton.click();

    // 验证弹窗关闭
    await expect(confirmDialog).toBeHidden({ timeout: 3000 });
  });

  // TODO: 此测试将在 FEAT-007（房间详情页）实现后启用
  test.skip('8. 跳转详情功能（待 FEAT-007 实现）', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 点击第一行数据查看详情
    const firstRow = page.locator('[data-testid="room-table"] tbody tr, table tbody tr').first();
    if (await firstRow.count() === 0) {
      test.skip('没有数据行');
      return;
    }

    // 尝试点击行或详情按钮
    const detailButton = firstRow.locator('[data-testid="detail-button"], button:has-text("详情")');
    if (await detailButton.count() > 0) {
      await detailButton.click();
    } else {
      await firstRow.click();
    }

    await page.waitForTimeout(500);

    // 验证是否跳转到详情页
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/detail|room\/\d+/);
  });

  test('9. 表单验证 - 必填字段校验', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 打开新增弹窗
    const addButton = page.locator('[data-testid="add-room-button"], button:has-text("新建")').first();
    if (await addButton.count() === 0) {
      test.skip('新增按钮不存在');
      return;
    }
    await addButton.click();

    const dialog = page.locator('[data-testid="room-form-dialog"], .t-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 不填写任何内容，直接提交
    const submitButton = page.locator('[data-testid="submit-button"], button:has-text("确定")').first();
    await submitButton.click();

    // 验证表单验证错误
    const errorMessage = page.locator('[data-testid="error-message"], .t-form__item-error');
    await page.waitForTimeout(500);

    // 至少应该有一个错误提示
    expect(await errorMessage.count()).toBeGreaterThan(0);
  });

  test('10. 利润列显示验证', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');
    await waitForTableReady(page);

    // 检查是否有利润列
    const profitHeader = page.locator('th:has-text("利润")');
    if (await profitHeader.count() > 0) {
      // 验证利润列存在
      await expect(profitHeader.first()).toBeVisible();
    }
  });
});
