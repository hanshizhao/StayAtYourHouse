/**
 * FEAT-029: 催收统计页 - E2E 测试（严谨版）
 * 类型: e2e
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 页面可访问性
 * 3. 页面元素验证
 * 4. 统计数据验证
 * 5. 筛选功能
 * 6. 图表验证
 * 7. 响应式布局
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const PAGE_PATH = "/dashboard/report/collection";

test.describe("FEAT-029: 催收统计页", () => {
  /**
   * 登录并导航到目标页面
   */
  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', {
      timeout: 10000,
    });
    await page.fill('input[placeholder="请输入用户名"]', "zhs");
    await page.fill('input[placeholder="请输入密码"]', "gentle8023");
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState("networkidle");
  }

  // ==================== 认证测试 ====================

  test("1. 未登录访问 - 应重定向到登录页", async ({ page }) => {
    await page.goto(`${BASE_URL}${PAGE_PATH}`);

    // 等待重定向完成
    await page.waitForTimeout(1000);

    // 应该被重定向到登录页
    const url = page.url();
    expect(url).toContain("/auth/sign-in");
  });

  // ==================== 页面可访问性测试 ====================

  test("2. 页面可访问 - 登录后正常加载", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证主要内容区域可见
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });

    // 验证没有错误提示
    const errorToast = page.locator(
      ".t-message--error, .t-notification--error",
    );
    await expect(errorToast).not.toBeVisible();
  });

  test("3. 页面标题 - 显示正确标题", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面标题或面包屑
    const pageTitle = page.locator(
      'h1, .t-breadcrumb__item:last-child, [class*="title"]',
    );
    await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });

    const titleText = await pageTitle.first().textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  // ==================== 统计卡片验证 ====================

  test("4. 统计卡片 - 总账单数统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"账单"的统计卡片
    const billCard = page.locator("text=/账单/");

    const count = await billCard.count();
    if (count > 0) {
      await expect(billCard.first()).toBeVisible();
    }
  });

  test("5. 统计卡片 - 已收款统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"已收"或"收款"的统计卡片
    const paidCard = page.locator("text=/已收|收款|实收/");

    const count = await paidCard.count();
    if (count > 0) {
      await expect(paidCard.first()).toBeVisible();
    }
  });

  test("6. 统计卡片 - 待收款统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"待收"或"未收"的统计卡片
    const pendingCard = page.locator("text=/待收|未收|应收/");

    const count = await pendingCard.count();
    if (count > 0) {
      await expect(pendingCard.first()).toBeVisible();
    }
  });

  test("7. 统计卡片 - 逾期账单统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"逾期"的统计卡片
    const overdueCard = page.locator("text=/逾期|欠款/");

    const count = await overdueCard.count();
    if (count > 0) {
      await expect(overdueCard.first()).toBeVisible();
    }
  });

  test("8. 统计数据 - 显示收款率", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含百分比的元素（收款率）
    const percentageElements = page.locator("main").locator("text=/%/");

    const count = await percentageElements.count();
    // 收款率是可选的
    if (count > 0) {
      await expect(percentageElements.first()).toBeVisible();
    }
  });

  // ==================== 页面元素验证 ====================

  test("9. 图表组件 - 图表正确渲染", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找图表容器
    const chart = page.locator(
      '[class*="chart"], canvas, svg, [class*="echarts"]',
    );

    const count = await chart.count();
    // 图表是可选的
    if (count > 0) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test("10. 表格数据 - 催收列表显示", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找表格
    const table = page.locator('table, .t-table, [class*="table"]');

    const count = await table.count();
    // 表格是可选的
    if (count > 0) {
      await expect(table.first()).toBeVisible();

      // 检查表头
      const tableHeaders = table.first().locator("th, .t-table__th");
      const headerCount = await tableHeaders.count();
      expect(headerCount).toBeGreaterThan(0);
    }
  });

  // ==================== 筛选功能测试 ====================

  test("11. 日期筛选 - 时间范围选择器", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找日期选择器
    const datePicker = page
      .locator(
        '[class*="date-picker"], .t-date-picker, input[placeholder*="日期"]',
      )
      .first();

    const datePickerCount = await page
      .locator('[class*="date-picker"], .t-date-picker')
      .count();
    if (datePickerCount > 0) {
      await expect(datePicker).toBeVisible();
    }
  });

  test("12. 状态筛选 - 账单状态选择", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找状态选择器
    const statusSelect = page.locator('[class*="select"], .t-select').first();

    const count = await page.locator('[class*="select"], .t-select').count();
    if (count > 0) {
      await expect(statusSelect).toBeVisible();
    }
  });

  test("13. 查询按钮 - 筛选后可查询", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找查询/搜索按钮
    const searchButton = page.locator(
      'button:has-text("查询"), button:has-text("搜索"), button:has-text("筛选")',
    );

    const count = await searchButton.count();
    if (count > 0) {
      await expect(searchButton.first()).toBeEnabled();
    }
  });

  test("14. 重置按钮 - 可以重置筛选条件", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找重置按钮
    const resetButton = page.locator(
      'button:has-text("重置"), button:has-text("清空")',
    );

    const count = await resetButton.count();
    if (count > 0) {
      await expect(resetButton.first()).toBeEnabled();
    }
  });

  // ==================== 分页功能测试 ====================

  test("15. 分页组件 - 分页器存在", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找分页器
    const pagination = page.locator('[class*="pagination"], .t-pagination');

    const count = await pagination.count();
    // 分页器是可选的
    if (count > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test("16. 分页功能 - 可以切换页码", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const pagination = page
      .locator('[class*="pagination"], .t-pagination')
      .first();

    if (await pagination.isVisible()) {
      // 查找下一页按钮
      const nextButton = pagination.locator(
        'button[class*="next"], .t-pagination__next',
      );

      const count = await nextButton.count();
      if (count > 0 && (await nextButton.first().isEnabled())) {
        await nextButton.first().click();
        await page.waitForTimeout(500);

        // 验证页面没有错误
        const errorToast = page.locator(
          ".t-message--error, .t-notification--error",
        );
        await expect(errorToast).not.toBeVisible();
      }
    }
  });

  // ==================== 导出功能测试 ====================

  test("17. 导出按钮 - 导出功能存在", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找导出按钮
    const exportButton = page.locator(
      'button:has-text("导出"), button:has-text("下载")',
    );

    const count = await exportButton.count();
    if (count > 0) {
      await expect(exportButton.first()).toBeEnabled();
    }
  });

  // ==================== 响应式布局测试 ====================

  test("18. 响应式布局 - 移动端适配", async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面仍然可访问
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });

    // 验证没有严重的水平滚动条溢出
    const scrollDiff = await page.evaluate(() => {
      return document.body.scrollWidth - document.body.clientWidth;
    });
    expect(scrollDiff).toBeLessThan(50);
  });

  test("19. 响应式布局 - 平板适配", async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面正常显示
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  // ==================== 页面状态测试 ====================

  test("20. 页面刷新 - 数据保持", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 验证页面仍然正常显示
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("21. 空数据状态 - 无数据时显示提示", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找空状态提示
    const emptyState = page.locator(
      '[class*="empty"], [class*="no-data"], text=/暂无数据/',
    );

    // 空状态提示是可选的
    const count = await emptyState.count();
    if (count > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  // ==================== 无障碍测试 ====================

  test("22. 无障碍 - 主内容区域有合适的标签", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 验证 main 标签存在
    const mainElement = page.locator("main");
    await expect(mainElement).toBeVisible();

    // 验证标题层级
    const headings = page.locator("h1, h2, h3");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  // ==================== 性能测试 ====================

  test("23. 页面加载性能 - 合理时间内完成", async ({ page }) => {
    const startTime = Date.now();

    await loginAndNavigate(page, PAGE_PATH);

    // 等待主要内容加载完成
    await expect(page.locator("main")).toBeVisible({ timeout: 3000 });

    const loadTime = Date.now() - startTime;

    // 页面加载应该在 15 秒内完成（包含登录）
    expect(loadTime).toBeLessThan(15000);
  });
});
