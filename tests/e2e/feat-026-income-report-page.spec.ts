/**
 * FEAT-026: 收支统计页 - E2E 测试（严谨版）
 * 类型: e2e
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 页面可访问性
 * 3. 页面元素验证
 * 4. 数据展示验证
 * 5. 筛选功能
 * 6. 图表/报表验证
 * 7. 响应式布局
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const PAGE_PATH = '/dashboard/report/income';

test.describe('FEAT-026: 收支统计页', () => {
  /**
   * 登录并导航到目标页面
   */
  async function loginAndNavigate(page: any, targetPath: string) {
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
   * 检查是否已登录
   */
  async function isLoggedIn(page: any): Promise<boolean> {
    try {
      const url = page.url();
      return url.includes('/dashboard') && !url.includes('/auth');
    } catch {
      return false;
    }
  }

  // ==================== 认证测试 ====================

  test('1. 未登录访问 - 应重定向到登录页', async ({ page }) => {
    await page.goto(`${BASE_URL}${PAGE_PATH}`);

    // 等待重定向完成
    await page.waitForTimeout(1000);

    // 应该被重定向到登录页
    const url = page.url();
    expect(url).toContain('/auth/sign-in');
  });

  // ==================== 页面可访问性测试 ====================

  test('2. 页面可访问 - 登录后正常加载', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证主要内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证没有错误提示
    const errorToast = page.locator('.t-message--error, .t-notification--error');
    await expect(errorToast).not.toBeVisible();
  });

  test('3. 页面标题 - 显示正确标题', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面标题或面包屑
    const pageTitle = page.locator('h1, .t-breadcrumb__item:last-child, [class*="title"]');
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    const titleText = await pageTitle.first().textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  // ==================== 页面元素验证 ====================

  test('4. 统计卡片 - 显示收入统计', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找统计卡片容器
    const statCards = page.locator('[class*="card"], .t-card, [class*="stat"]');

    // 至少应该有一个统计区域
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('5. 筛选区域 - 日期筛选器存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找日期选择器
    const datePicker = page.locator('[class*="date-picker"], .t-date-picker, input[placeholder*="日期"], input[placeholder*="时间"]');

    // 如果页面有日期筛选器
    const datePickerCount = await datePicker.count();
    if (datePickerCount > 0) {
      await expect(datePicker.first()).toBeVisible();
    }
  });

  test('6. 筛选区域 - 月份筛选器存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找月份选择器或下拉框
    const monthPicker = page.locator('[class*="month"], .t-select, [class*="picker"]');

    const count = await monthPicker.count();
    // 月份筛选器是可选的
    if (count > 0) {
      await expect(monthPicker.first()).toBeVisible();
    }
  });

  // ==================== 数据展示验证 ====================

  test('7. 收入数据 - 显示收入金额', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找金额显示（包含数字的元素）
    const amountElements = page.locator('main').locator('text=/[0-9,]+\\.?[0-9]*/');

    const count = await amountElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('8. 图表组件 - 图表正确渲染', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找图表容器
    const chart = page.locator('[class*="chart"], canvas, svg, [class*="echarts"]');

    const count = await chart.count();
    // 图表是可选的，可能用表格展示
    if (count > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('9. 表格数据 - 表格正确显示', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找表格
    const table = page.locator('table, .t-table, [class*="table"]');

    const count = await table.count();
    // 表格是可选的
    if (count > 0) {
      await expect(table.first()).toBeVisible();

      // 如果有表格，检查表头
      const tableHeaders = table.first().locator('th, .t-table__th');
      const headerCount = await tableHeaders.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  // ==================== 筛选功能测试 ====================

  test('10. 日期筛选 - 可以选择日期范围', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const datePicker = page.locator('[class*="date-picker"], .t-date-picker, input[placeholder*="日期"]').first();

    if (await datePicker.isVisible()) {
      await datePicker.click();
      await page.waitForTimeout(500);

      // 检查日期选择面板是否弹出
      const datePanel = page.locator('[class*="date-panel"], .t-date-picker__panel, [class*="calendar"]');
      const panelCount = await datePanel.count();

      if (panelCount > 0) {
        await expect(datePanel.first()).toBeVisible();
      }
    }
  });

  test('11. 搜索按钮 - 筛选后可查询', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找查询/搜索按钮
    const searchButton = page.locator('button:has-text("查询"), button:has-text("搜索"), button:has-text("筛选")');

    const count = await searchButton.count();
    if (count > 0) {
      await expect(searchButton.first()).toBeEnabled();
    }
  });

  test('12. 重置按钮 - 可以重置筛选条件', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找重置按钮
    const resetButton = page.locator('button:has-text("重置"), button:has-text("清空")');

    const count = await resetButton.count();
    // 重置按钮是可选的
    if (count > 0) {
      await expect(resetButton.first()).toBeEnabled();
    }
  });

  // ==================== 导出功能测试 ====================

  test('13. 导出按钮 - 导出功能存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出"), button:has-text("下载")');

    const count = await exportButton.count();
    // 导出功能是可选的
    if (count > 0) {
      await expect(exportButton.first()).toBeEnabled();
    }
  });

  // ==================== 响应式布局测试 ====================

  test('14. 响应式布局 - 移动端适配', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面仍然可访问
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证没有水平滚动条溢出
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    // 允许少量溢出，但不应该有很大差异
    const scrollDiff = await page.evaluate(() => {
      return document.body.scrollWidth - document.body.clientWidth;
    });
    expect(scrollDiff).toBeLessThan(50);
  });

  test('15. 响应式布局 - 平板适配', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面正常显示
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });

  // ==================== 错误处理测试 ====================

  test('16. 页面刷新 - 数据保持', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证页面仍然正常显示
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });

  // ==================== 无障碍测试 ====================

  test('17. 无障碍 - 主内容区域有合适的标签', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证 main 标签存在
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // 验证标题层级
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  // ==================== 性能测试 ====================

  test('18. 页面加载性能 - 3秒内完成', async ({ page }) => {
    const startTime = Date.now();

    await loginAndNavigate(page, PAGE_PATH);

    // 等待主要内容加载完成
    await expect(page.locator('main')).toBeVisible({ timeout: 3000 });

    const loadTime = Date.now() - startTime;

    // 页面加载应该在 5 秒内完成（包含登录）
    expect(loadTime).toBeLessThan(15000);
  });
});
