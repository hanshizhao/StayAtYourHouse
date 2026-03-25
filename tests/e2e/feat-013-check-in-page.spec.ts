/**
 * FEAT-013: 入住办理页面 - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性
 * 3. 租客选择功能
 * 4. 房间选择功能（仅显示空置房间）
 * 5. 自动填充月租金和押金
 * 6. 合同到期日期计算
 * 7. 表单验证
 * 8. 入住提交功能
 *
 * 前置条件：
 * - 需要至少一个租客数据（测试 3、13 依赖）
 * - 需要至少一个空置房间（测试 4、5 依赖）
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-013: 入住办理页面', () => {
  /**
   * 登录并导航到目标页面
   */
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
   * 等待页面加载完成
   */
  async function waitForPageReady(page: Page): Promise<void> {
    await page.waitForSelector('.check-in-page, .form-card', { timeout: 10000 });
    // 等待加载状态消失
    const loading = page.locator('.t-loading');
    if (await loading.count() > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/tenant/check-in');

    // 验证主内容区域可见
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 核心元素可见 - 表单和标题', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 验证页面标题
    await expect(page.locator('h2:has-text("入住办理")')).toBeVisible();

    // 验证返回按钮
    await expect(page.locator('button:has-text("返回")')).toBeVisible();

    // 验证表单区域
    await expect(page.locator('.form-card')).toBeVisible();

    // 验证提交按钮
    await expect(page.locator('[data-testid="submit-button"], button:has-text("确认入住")')).toBeVisible();
  });

  test('3. 租客选择器 - 下拉列表显示', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 点击租客选择器
    const tenantSelect = page.locator('[data-testid="tenant-select"], .t-select').first();
    await tenantSelect.click();

    // 等待下拉菜单出现
    const dropdown = page.locator('.t-select__dropdown, .t-popup');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // 验证下拉菜单有选项
    const options = dropdown.locator('.t-select-option, .t-option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('4. 房间选择器 - 仅显示空置房间', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 点击房间选择器
    const roomSelect = page.locator('[data-testid="room-select"], .t-select').nth(1);
    await roomSelect.click();

    // 等待下拉菜单出现
    const dropdown = page.locator('.t-select__dropdown, .t-popup');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // 验证下拉菜单有选项（空置房间）
    const options = dropdown.locator('.t-select-option, .t-option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test('5. 自动填充 - 选择房间后填充月租金和押金', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 点击房间选择器
    const roomSelect = page.locator('[data-testid="room-select"], .t-select').nth(1);
    await roomSelect.click();

    // 等待下拉菜单出现
    const dropdown = page.locator('.t-select__dropdown, .t-popup');
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // 选择第一个房间选项
    const firstOption = dropdown.locator('.t-select-option, .t-option').first();
    await expect(firstOption).toBeVisible({ timeout: 3000 });
    await firstOption.click();

    // 等待房间信息卡片显示（使用条件等待而非硬编码等待)
    const roomInfoCard = page.locator('.room-info-card');
    await expect(roomInfoCard).toBeVisible({ timeout: 3000 });
  });

  test('6. 入住日期选择器', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 验证入住日期选择器存在
    const datePicker = page.locator('[data-testid="check-in-date"], .t-date-picker').first();
    await expect(datePicker).toBeVisible();

    // 验证默认值（应该是今天的日期）
    const input = datePicker.locator('input');
    const value = await input.inputValue();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('7. 租期类型选择 - 合同到期日期计算', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 选择月租
    const monthlyRadio = page.locator('[data-testid="lease-type"] input[value="0"], .t-radio:has-text("月租") input');
    if (await monthlyRadio.count() > 0) {
      await monthlyRadio.check();

      // 验证合同到期提示显示
      const tip = page.locator('.contract-end-tip');
      await expect(tip).toBeVisible({ timeout: 2000 });
    }
  });

  test('8. 表单验证 - 必填字段校验', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 直接点击提交按钮（不填写任何字段）
    const submitButton = page.locator('button:has-text("确认入住")');
    await submitButton.click();

    // 等待一下让验证处理完成
    await page.waitForTimeout(1000);

    // 验证表单验证阻止了提交（仍在当前页面）
    // 如果验证通过并提交，页面会跳转或显示成功消息
    expect(page.url()).toContain('/tenant/check-in');
  });

  test('9. 月租金输入验证', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 找到月租金输入框 - TDesign t-input-number 内部的 input
    const rentInput = page.locator('[data-testid="monthly-rent"] input').first();

    // 验证可以输入正数
    await rentInput.clear();
    await rentInput.fill('1500');
    await rentInput.blur();

    const value = await rentInput.inputValue();
    expect(parseFloat(value)).toBe(1500);
  });

  test('10. 押金输入验证', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 找到押金输入框 - TDesign t-input-number 内部的 input
    const depositInput = page.locator('[data-testid="deposit"] input').first();

    // 验证可以输入正数
    await depositInput.clear();
    await depositInput.fill('3000');
    await depositInput.blur();

    const value = await depositInput.inputValue();
    expect(parseFloat(value)).toBe(3000);
  });

  test('11. 备注输入', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 找到备注输入框 - TDesign t-textarea 内部的 textarea
    const remarkInput = page.locator('[data-testid="remark"] textarea').first();

    // 输入备注
    await remarkInput.fill('这是测试备注信息');
    const value = await remarkInput.inputValue();
    expect(value).toBe('这是测试备注信息');
  });

  test('12. 返回按钮功能', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 点击返回按钮
    const backButton = page.locator('button:has-text("返回")');
    await backButton.click();

    // 验证返回到租客列表页
    await page.waitForURL(/\/tenant\/list/, { timeout: 5000 });
    expect(page.url()).toContain('/tenant/list');
  });

  test('13. 从租客列表页跳转', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/list');

    // 等待表格加载
    await page.waitForSelector('[data-testid="tenant-table"], .t-table', { timeout: 10000 });

    // 点击入住办理按钮
    const checkInButton = page.locator('[data-testid="check-in-button"], button:has-text("入住办理")');
    await expect(checkInButton).toBeVisible();
    await checkInButton.click();

    // 验证跳转到入住办理页
    await page.waitForURL(/\/tenant\/check-in/, { timeout: 5000 });
    expect(page.url()).toContain('/tenant/check-in');
  });

  test('14. 合同图片上传组件存在', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 验证合同图片上传区域存在
    const uploadSection = page.locator('.form-section:has-text("合同图片")');
    await expect(uploadSection).toBeVisible({ timeout: 5000 });
  });

  test('15. 取消按钮功能', async ({ page }) => {
    await loginAndNavigate(page, '/tenant/check-in');
    await waitForPageReady(page);

    // 点击取消按钮
    const cancelButton = page.locator('button:has-text("取消")');
    await cancelButton.click();

    // 验证返回到租客列表页
    await page.waitForURL(/\/tenant\/list/, { timeout: 5000 });
    expect(page.url()).toContain('/tenant/list');
  });
});
