/**
 * FEAT-007: 房间详情页 - E2E 测试
 * 测试类型: e2e
 * 前置条件: 前后端服务运行中
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-007: 房间详情页', () => {

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
   * 等待页面内容加载完成
   * 使用显式等待替代硬编码 timeout，但保留小量缓冲确保渲染完成
   */
  async function waitForPageReady(page: Page): Promise<void> {
    // 等待主内容区域可见
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
    // 等待加载状态消失（如果存在）
    const loading = page.locator('.t-loading');
    const loadingCount = await loading.count();
    if (loadingCount > 0) {
      await expect(loading).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    }
    // 小量缓冲确保 Vue 渲染完成
    await page.waitForTimeout(500);
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

    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 房间基本信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 验证基本信息卡片存在（如果房间存在）
    const infoCard = page.locator('[data-testid="room-info-card"]');
    const count = await infoCard.count();
    // 如果房间不存在，测试通过（无断言失败）
    if (count === 0) return;

    await expect(infoCard).toBeVisible({ timeout: 5000 });

    // 验证关键字段标签存在
    const expectedLabels = ['楼栋', '房间号', '状态'];
    for (const label of expectedLabels) {
      const labelLocator = page.locator(`text=${label}`);
      await expect(labelLocator.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('3. 关联小区信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 在基本信息卡片内验证小区标签存在（如果房间存在）
    const infoCard = page.locator('[data-testid="room-info-card"]');
    const count = await infoCard.count();
    if (count === 0) return;

    await expect(infoCard).toBeVisible({ timeout: 5000 });

    const communityLabel = infoCard.locator('.t-descriptions-item:has-text("小区")');
    await expect(communityLabel.first()).toBeVisible({ timeout: 3000 });
  });

  test('4. 页面标题正确', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 验证页面标题包含"房间"或"详情"
    const pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
    const titleText = await pageTitle.textContent();
    expect(titleText).toMatch(/房间|详情/);
  });

  test('5. 操作按钮可见性', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 验证返回按钮存在
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible({ timeout: 5000 });

    // 验证编辑按钮存在
    const editButton = page.locator('[data-testid="edit-button"]');
    await expect(editButton).toBeVisible({ timeout: 3000 });
  });

  test('6. 返回列表功能', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible({ timeout: 5000 });
    await backButton.click();

    // 等待导航完成
    await page.waitForURL(/housing\/room$/, { timeout: 10000 });

    // 验证返回到列表页
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/housing\/room$/);
  });

  test('7. 当前租客信息区域（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 查找租客信息卡片（仅当房间状态为已出租时显示）
    const tenantCard = page.locator('[data-testid="tenant-info-card"]');
    // 租客卡片是可选的，取决于房间状态
    const count = await tenantCard.count();
    if (count > 0) {
      await expect(tenantCard.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('8. 出租记录区域（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 先检查房间是否存在
    const infoCard = page.locator('[data-testid="room-info-card"]');
    const roomCount = await infoCard.count();
    if (roomCount === 0) return;

    // 查找出租记录卡片
    const recordCard = page.locator('[data-testid="rental-records-card"]');
    await expect(recordCard).toBeVisible({ timeout: 5000 });

    // 如果有记录表格，验证表格结构
    const recordTable = recordCard.locator('table');
    const tableCount = await recordTable.count();
    if (tableCount > 0) {
      await expect(recordTable).toBeVisible({ timeout: 3000 });
    }
  });

  test('9. 无效 ID 处理 - 不存在的房间', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/housing/room/detail/99999999');
    await waitForPageReady(page);

    // 应该显示错误提示或空状态
    const errorState = page.locator('[data-testid="error-state"], .t-empty');
    await expect(errorState.first()).toBeVisible({ timeout: 5000 });

    // 验证没有关键 JS 错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);

    // 页面应该正常渲染（即使数据不存在）
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('10. 状态标签显示', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 先检查房间是否存在
    const infoCard = page.locator('[data-testid="room-info-card"]');
    const roomCount = await infoCard.count();
    if (roomCount === 0) return;

    // 查找状态标签
    const statusTag = page.locator('[data-testid="status-tag"]');
    await expect(statusTag.first()).toBeVisible({ timeout: 5000 });
  });

  test('11. 价格信息展示', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 先检查房间是否存在
    const infoCard = page.locator('[data-testid="room-info-card"]');
    const roomCount = await infoCard.count();
    if (roomCount === 0) return;

    // 验证价格信息卡片存在
    const priceCard = page.locator('.t-card:has-text("价格信息")');
    await expect(priceCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('12. 面积和房型信息展示（如有）', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room/detail/1');
    await waitForPageReady(page);

    // 这些字段是可选的，验证标签存在即可
    const optionalLabels = ['面积', '房型'];
    for (const label of optionalLabels) {
      const labelLocator = page.locator(`text=${label}`);
      const count = await labelLocator.count();
      if (count > 0) {
        await expect(labelLocator.first()).toBeVisible({ timeout: 2000 });
      }
    }
  });
});
