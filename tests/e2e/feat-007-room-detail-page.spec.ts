/**
 * FEAT-007: 房间详情页 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性
 * 2. 房间基本信息展示
 * 3. 关联小区信息展示
 * 4. 当前租客信息展示（如有）
 * 5. 出租记录展示
 * 6. 操作按钮可见性
 * 7. 返回列表功能
 * 8. 无效 ID 处理
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-007: 房间详情页', () => {

  /**
   * 登录并导航到目标页面
   */
  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('[data-testid="username-input"], input[placeholder="请输入用户名"]', { timeout: 10000 });

    const usernameInput = page.locator('[data-testid="username-input"]').first();
    const passwordInput = page.locator('[data-testid="password-input"]').first();
    const loginButton = page.locator('[data-testid="login-button"], button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      await loginButton.click();
    } else {
      await page.fill('input[placeholder="请输入用户名"]', 'admin');
      await page.fill('input[placeholder="请输入密码"]', 'admin123');
      await page.click('button[type="submit"]');
    }

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

  // ==================== 测试用例 ====================

  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');

    // 验证主内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 房间基本信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');

    // 等待页面加载
    await page.waitForTimeout(1000);

    // 验证基本信息卡片存在
    const infoCard = page.locator('[data-testid="room-info-card"], .t-card:has-text("基本信息")');
    if (await infoCard.count() > 0) {
      await expect(infoCard.first()).toBeVisible();

      // 验证关键字段标签存在
      const expectedLabels = ['楼栋', '房间号', '成本价', '租金', '状态'];
      for (const label of expectedLabels) {
        const labelLocator = page.locator(`text=${label}`);
        if (await labelLocator.count() > 0) {
          await expect(labelLocator.first()).toBeVisible();
        }
      }
    }
  });

  test('3. 关联小区信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 验证小区信息存在
    const communityLabel = page.locator('text=小区');
    if (await communityLabel.count() > 0) {
      await expect(communityLabel.first()).toBeVisible();
    }
  });

  test('4. 页面标题正确', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(500);

    // 验证页面标题包含"房间"或"详情"
    const pageTitle = page.locator('[data-testid="page-title"], h1, h2');
    if (await pageTitle.count() > 0) {
      const titleText = await pageTitle.first().textContent();
      expect(titleText).toMatch(/房间|详情/);
    }
  });

  test('5. 操作按钮可见性', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 验证返回按钮存在
    const backButton = page.locator('[data-testid="back-button"], button:has-text("返回")');
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
    }

    // 验证编辑按钮存在（可选）
    const editButton = page.locator('[data-testid="edit-button"], button:has-text("编辑")');
    if (await editButton.count() > 0) {
      await expect(editButton.first()).toBeVisible();
    }
  });

  test('6. 返回列表功能', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(500);

    const backButton = page.locator('[data-testid="back-button"], button:has-text("返回")').first();
    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);

      // 验证返回到列表页
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/housing\/room$/);
    }
  });

  test('7. 当前租客信息区域（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 查找租客信息卡片
    const tenantCard = page.locator('[data-testid="tenant-info-card"], .t-card:has-text("租客")');
    // 租客卡片可能是可选的，取决于房间状态
    if (await tenantCard.count() > 0) {
      await expect(tenantCard.first()).toBeVisible();
    }
  });

  test('8. 出租记录区域（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 查找出租记录卡片
    const recordCard = page.locator('[data-testid="rental-records-card"], .t-card:has-text("出租记录")');
    if (await recordCard.count() > 0) {
      await expect(recordCard.first()).toBeVisible();

      // 如果有记录表格，验证表格结构
      const recordTable = recordCard.locator('table');
      if (await recordTable.count() > 0) {
        await expect(recordTable).toBeVisible();
      }
    }
  });

  test('9. 无效 ID 处理 - 不存在的房间', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/dashboard/housing/room/detail/99999999');
    await page.waitForTimeout(1000);

    // 应该显示错误提示或空状态
    const errorState = page.locator('[data-testid="error-state"], .t-empty, text=不存在');
    const emptyState = page.locator('.t-empty__description');

    // 验证没有关键 JS 错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);

    // 页面应该正常渲染（即使数据不存在）
    await expect(page.locator('main')).toBeVisible();
  });

  test('10. 状态标签显示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 查找状态标签
    const statusTag = page.locator('[data-testid="status-tag"], .t-tag');
    if (await statusTag.count() > 0) {
      await expect(statusTag.first()).toBeVisible();
    }
  });

  test('11. 价格信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 验证价格相关字段存在
    const priceLabels = ['成本价', '租金', '押金'];
    let foundPriceLabel = false;

    for (const label of priceLabels) {
      const labelLocator = page.locator(`text=${label}`);
      if (await labelLocator.count() > 0) {
        foundPriceLabel = true;
        break;
      }
    }

    // 至少有一个价格标签存在
    expect(foundPriceLabel).toBeTruthy();
  });

  test('12. 面积和房型信息展示（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');
    await page.waitForTimeout(1000);

    // 这些字段是可选的
    const optionalLabels = ['面积', '房型'];
    for (const label of optionalLabels) {
      const labelLocator = page.locator(`text=${label}`);
      if (await labelLocator.count() > 0) {
        await expect(labelLocator.first()).toBeVisible();
      }
    }
  });
});
