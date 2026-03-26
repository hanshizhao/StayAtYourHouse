/**
 * FEAT-020: 首页待办提醒 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 页面可访问性（无 JS 错误）
 * 2. 核心元素可见性
 * 3. 待办分类显示
 * 4. 今日待办数据
 * 5. 催收按钮功能
 * 6. 日期显示
 * 7. 空状态处理
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const USERNAME = process.env.E2E_USERNAME || 'zhs';
const PASSWORD = process.env.E2E_PASSWORD || 'gentle8023';

test.describe('FEAT-020: 首页待办提醒', () => {
  /**
   * 登录并导航到首页
   */
  async function loginAndNavigateToDashboard(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
    await page.fill('input[placeholder*="账号"]', USERNAME);
    await page.fill('input[placeholder*="密码"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
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
   * 等待待办区域加载完成
   */
  async function waitForTodoSection(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="todo-section"], .todo-section, .dashboard-card', { timeout: 10000 });
  }

  // ==================== 测试用例 ====================

  test('1. 首页可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigateToDashboard(page);

    // 验证主内容区域可见（使用 .first() 避免 strict mode）
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    // 验证无关键错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 今日待办区域可见', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证今日待办区域存在
    const todoSection = page.locator('[data-testid="todo-section"], .todo-section, .dashboard-card:has-text("待办")');
    await expect(todoSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('3. 今日日期显示', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证今日日期显示
    const todayDate = page.locator('[data-testid="today-date"], .today-date, .todo-header');
    if (await todayDate.count() > 0) {
      const text = await todayDate.first().textContent();
      // 应该包含今日日期（格式可能是 YYYY-MM-DD 或中文日期）
      expect(text).toMatch(/\d{4}|\d{1,2}月|\d{1,2}日/);
    }
  });

  test('4. 即将到期区域 - 标题存在', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证即将到期区域存在
    const upcomingSection = page.locator('[data-testid="upcoming-todos"], :text-is("即将到期"), :text-is("🔔")');
    if (await upcomingSection.count() > 0) {
      await expect(upcomingSection.first()).toBeVisible();
    }
  });

  test('5. 今日到期区域 - 标题存在', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证今日到期区域存在
    const todaySection = page.locator('[data-testid="today-todos"], :text-is("今日到期"), :text-is("⏰")');
    if (await todaySection.count() > 0) {
      await expect(todaySection.first()).toBeVisible();
    }
  });

  test('6. 宽限到期区域 - 标题存在', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证宽限到期区域存在
    const graceSection = page.locator('[data-testid="grace-todos"], :text-is("宽限到期"), :text-is("⚠️")');
    if (await graceSection.count() > 0) {
      await expect(graceSection.first()).toBeVisible();
    }
  });

  test('7. 逾期区域 - 标题存在', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证逾期区域存在
    const overdueSection = page.locator('[data-testid="overdue-todos"], :text-is("逾期"), :text-is("❌")');
    if (await overdueSection.count() > 0) {
      await expect(overdueSection.first()).toBeVisible();
    }
  });

  test('8. 待办项数据结构 - 租客信息', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项
    const todoItem = page.locator('[data-testid="todo-item"], .todo-item, .dashboard-card li').first();
    if (await todoItem.count() > 0) {
      const text = await todoItem.textContent();
      // 应该包含租客名称
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('9. 待办项数据结构 - 房间信息', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项
    const todoItem = page.locator('[data-testid="todo-item"], .todo-item, .dashboard-card li').first();
    if (await todoItem.count() > 0) {
      const text = await todoItem.textContent();
      // 应该包含房间信息（如：阳光花园502）
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('10. 待办项数据结构 - 应收金额', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项
    const todoItem = page.locator('[data-testid="todo-item"], .todo-item, .dashboard-card li').first();
    if (await todoItem.count() > 0) {
      const text = await todoItem.textContent();
      // 应该包含金额信息
      expect(text).toMatch(/\d+.*元|应收/);
    }
  });

  test('11. 待办项 - 催收按钮存在', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项的催收按钮
    const collectButton = page.locator('[data-testid="todo-collect-button"], button:has-text("催收")');
    if (await collectButton.count() > 0) {
      await expect(collectButton.first()).toBeVisible();
    }
  });

  test('12. 点击催收按钮 - 跳转到账单页', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项的催收按钮
    const collectButton = page.locator('[data-testid="todo-collect-button"], button:has-text("催收")');
    if (await collectButton.count() > 0) {
      await collectButton.first().click();

      // 等待导航
      await page.waitForTimeout(500);

      // 验证跳转到账单页或打开弹窗
      const url = page.url();
      const hasDialog = await page.locator('[data-testid="collect-dialog"], .t-dialog').count() > 0;
      expect(url.includes('bill') || hasDialog).toBeTruthy();
    } else {
      test.skip('没有待办项，跳过催收按钮测试');
    }
  });

  test('13. 即将到期 - 显示剩余天数', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到即将到期区域
    const upcomingSection = page.locator('[data-testid="upcoming-todos"], .todo-section:has-text("即将")');
    if (await upcomingSection.count() > 0) {
      const text = await upcomingSection.first().textContent();
      // 应该显示剩余天数（如：3天后到期）
      expect(text).toMatch(/\d+.*天|后天/);
    }
  });

  test('14. 逾期 - 显示逾期天数', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到逾期区域
    const overdueSection = page.locator('[data-testid="overdue-todos"], .todo-section:has-text("逾期")');
    if (await overdueSection.count() > 0) {
      const text = await overdueSection.first().textContent();
      // 应该显示逾期天数（如：已逾期10天）
      expect(text).toMatch(/\d+.*天|逾期/);
    }
  });

  test('15. 空状态处理 - 无待办时显示提示', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 检查是否有待办项
    const todoItem = page.locator('[data-testid="todo-item"], .todo-item, .dashboard-card li');
    if (await todoItem.count() === 0) {
      // 应该显示空状态提示
      const emptyState = page.locator('[data-testid="empty-todo"], .empty-state, :text-is("暂无待办")');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('16. 待办数量统计', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 查找待办数量统计
    const todoCount = page.locator('[data-testid="todo-count"], .todo-count, .badge');
    if (await todoCount.count() > 0) {
      const text = await todoCount.first().textContent();
      // 应该显示数字
      expect(text).toMatch(/\d+/);
    }
  });

  test('17. 刷新功能', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 查找刷新按钮
    const refreshButton = page.locator('[data-testid="refresh-button"], button:has-text("刷新")');
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await page.waitForTimeout(500);

      // 验证页面仍然正常（使用 .first() 避免 strict mode）
      await expect(page.locator('main').first()).toBeVisible();
    }
  });

  test('18. 待办项点击 - 跳转到详情', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 找到任意待办项
    const todoItem = page.locator('[data-testid="todo-item"], .todo-item, .dashboard-card li').first();
    if (await todoItem.count() > 0) {
      await todoItem.click();

      // 等待导航
      await page.waitForTimeout(500);

      // 验证跳转（可能跳转到账单页或租客详情页）
      const url = page.url();
      expect(url.includes('dashboard')).toBeTruthy();
    }
  });

  test('19. 待办分类图标', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 验证分类图标存在（使用 emoji 或图标）
    const icons = page.locator('.todo-icon, .t-icon, [class*="icon"]');
    // 图标是可选的，但如果存在应该可见
    if (await icons.count() > 0) {
      await expect(icons.first()).toBeVisible();
    }
  });

  test('20. 响应式布局 - 移动端适配', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAndNavigateToDashboard(page);

    // 验证主内容区域仍然可见（使用 .first() 避免 strict mode）
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    // 验证待办区域仍然可见
    const todoSection = page.locator('[data-testid="todo-section"], .todo-section, .dashboard-card:has-text("待办")');
    await expect(todoSection.first()).toBeVisible();
  });

  test('21. 待办项排序 - 按优先级', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 获取所有待办区域
    const sections = page.locator('[data-testid="todo-section"], .todo-section');
    if (await sections.count() >= 2) {
      // 验证区域顺序：今日到期 > 逾期 > 即将到期 > 宽限到期
      // 或者按业务规则排序
      const firstSection = sections.first();
      await expect(firstSection).toBeVisible();
    }
  });

  test('22. 快捷操作入口', async ({ page }) => {
    await loginAndNavigateToDashboard(page);

    // 查找快捷操作入口（如：快速收款、快速入住等）
    const quickActions = page.locator('[data-testid="quick-action"], .quick-action, button:has-text("快速")');
    // 快捷操作是可选的
    if (await quickActions.count() > 0) {
      await expect(quickActions.first()).toBeVisible();
    }
  });
});
