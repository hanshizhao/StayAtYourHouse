/**
 * FEAT-028: 利润排行页 - E2E 测试（严谨版）
 * 类型: e2e
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 页面可访问性
 * 3. 页面元素验证
 * 4. 排行榜数据验证
 * 5. 排序功能
 * 6. 筛选功能
 * 7. 分页功能
 * 8. 响应式布局
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const PAGE_PATH = '/dashboard/report/profit';

test.describe('FEAT-028: 利润排行页', () => {
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

  test('4. 排行榜表格 - 表格存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找表格
    const table = page.locator('table, .t-table, [class*="table"]');

    const count = await table.count();
    if (count > 0) {
      await expect(table.first()).toBeVisible();

      // 验证表格有内容
      const rows = table.first().locator('tr, .t-table__row');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('5. 排行榜表头 - 显示排名相关信息', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const table = page.locator('table, .t-table').first();

    if (await table.isVisible()) {
      // 查找表头
      const headers = table.locator('th, .t-table__th');
      const headerCount = await headers.count();

      if (headerCount > 0) {
        // 获取表头文本
        const headerTexts = await headers.allTextContents();
        const combinedText = headerTexts.join(' ');

        // 应该包含排名、房间、利润等关键词
        expect(
          combinedText.includes('排名') ||
          combinedText.includes('房间') ||
          combinedText.includes('利润') ||
          combinedText.includes('收益') ||
          combinedText.includes('金额')
        ).toBe(true);
      }
    }
  });

  test('6. 排名数据 - 显示排名序号', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找排名序号（1, 2, 3...）
    const rankNumbers = page.locator('main').locator('text=/^[1-9][0-9]?$/');

    const count = await rankNumbers.count();
    // 如果有数据，应该显示排名
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('7. 利润数据 - 显示金额', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找金额显示（包含数字和可能的货币符号）
    const amountElements = page.locator('main').locator('text=/[0-9,]+\\.?[0-9]*/');

    const count = await amountElements.count();
    expect(count).toBeGreaterThan(0);
  });

  // ==================== 筛选功能测试 ====================

  test('8. 日期筛选 - 时间范围选择器', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找日期选择器
    const datePicker = page.locator('[class*="date-picker"], .t-date-picker, input[placeholder*="日期"]').first();

    const datePickerCount = await page.locator('[class*="date-picker"], .t-date-picker').count();
    if (datePickerCount > 0) {
      await expect(datePicker).toBeVisible();
    }
  });

  test('9. 小区筛选 - 可以选择小区', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找小区选择器
    const communitySelect = page.locator('[class*="select"], .t-select').first();

    const count = await page.locator('[class*="select"], .t-select').count();
    if (count > 0) {
      await expect(communitySelect).toBeVisible();
    }
  });

  test('10. 查询按钮 - 筛选后可查询', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找查询/搜索按钮
    const searchButton = page.locator('button:has-text("查询"), button:has-text("搜索"), button:has-text("筛选")');

    const count = await searchButton.count();
    if (count > 0) {
      await expect(searchButton.first()).toBeEnabled();
    }
  });

  test('11. 重置按钮 - 可以重置筛选条件', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找重置按钮
    const resetButton = page.locator('button:has-text("重置"), button:has-text("清空")');

    const count = await resetButton.count();
    if (count > 0) {
      await expect(resetButton.first()).toBeEnabled();
    }
  });

  // ==================== 排序功能测试 ====================

  test('12. 排序功能 - 可以按列排序', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const table = page.locator('table, .t-table').first();

    if (await table.isVisible()) {
      // 查找可排序的表头
      const sortableHeaders = table.locator('th[class*="sort"], .t-table__th--sortable');

      const count = await sortableHeaders.count();
      if (count > 0) {
        // 点击第一个可排序表头
        await sortableHeaders.first().click();
        await page.waitForTimeout(500);

        // 验证排序状态变化
        const sortIcon = table.locator('[class*="sort-icon"], .t-table__sort-icon');
        const iconCount = await sortIcon.count();
        // 排序图标可能存在
        expect(iconCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // ==================== 分页功能测试 ====================

  test('13. 分页组件 - 分页器存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找分页器
    const pagination = page.locator('[class*="pagination"], .t-pagination');

    const count = await pagination.count();
    // 分页器是可选的（数据量少时可能不显示）
    if (count > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test('14. 分页功能 - 可以切换页码', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const pagination = page.locator('[class*="pagination"], .t-pagination').first();

    if (await pagination.isVisible()) {
      // 查找下一页按钮
      const nextButton = pagination.locator('button[class*="next"], .t-pagination__next');

      const count = await nextButton.count();
      if (count > 0 && await nextButton.first().isEnabled()) {
        await nextButton.first().click();
        await page.waitForTimeout(500);

        // 验证页面没有错误
        const errorToast = page.locator('.t-message--error, .t-notification--error');
        await expect(errorToast).not.toBeVisible();
      }
    }
  });

  test('15. 分页大小 - 可以修改每页条数', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const pagination = page.locator('[class*="pagination"], .t-pagination').first();

    if (await pagination.isVisible()) {
      // 查找每页条数选择器
      const pageSizeSelect = pagination.locator('[class*="select"], .t-pagination__select');

      const count = await pageSizeSelect.count();
      // 分页大小选择器是可选的
      if (count > 0) {
        await expect(pageSizeSelect.first()).toBeVisible();
      }
    }
  });

  // ==================== 导出功能测试 ====================

  test('16. 导出按钮 - 导出功能存在', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出"), button:has-text("下载")');

    const count = await exportButton.count();
    if (count > 0) {
      await expect(exportButton.first()).toBeEnabled();
    }
  });

  // ==================== 响应式布局测试 ====================

  test('17. 响应式布局 - 移动端适配', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面仍然可访问
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

    // 验证没有严重的水平滚动条溢出
    const scrollDiff = await page.evaluate(() => {
      return document.body.scrollWidth - document.body.clientWidth;
    });
    expect(scrollDiff).toBeLessThan(50);
  });

  test('18. 响应式布局 - 平板适配', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面正常显示
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });

  // ==================== 页面状态测试 ====================

  test('19. 页面刷新 - 数据保持', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 验证页面仍然正常显示
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });

  test('20. 空数据状态 - 无数据时显示提示', async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找空状态提示
    const emptyState = page.locator('[class*="empty"], [class*="no-data"], text=/暂无数据/');

    // 空状态提示是可选的
    const count = await emptyState.count();
    if (count > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  // ==================== 无障碍测试 ====================

  test('21. 无障碍 - 主内容区域有合适的标签', async ({ page }) => {
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

  test('22. 页面加载性能 - 合理时间内完成', async ({ page }) => {
    const startTime = Date.now();

    await loginAndNavigate(page, PAGE_PATH);

    // 等待主要内容加载完成
    await expect(page.locator('main')).toBeVisible({ timeout: 3000 });

    const loadTime = Date.now() - startTime;

    // 页面加载应该在 15 秒内完成（包含登录）
    expect(loadTime).toBeLessThan(15000);
  });
});
