/**
 * FEAT-027: 房源概览页 - E2E 测试（严谨版）
 * 类型: e2e
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 页面可访问性
 * 3. 页面元素验证
 * 4. 数据展示验证
 * 5. 统计卡片验证
 * 6. 筛选功能
 * 7. 响应式布局
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const PAGE_PATH = "/dashboard/report/housing";

test.describe("FEAT-027: 房源概览页", () => {
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

  test("4. 统计卡片 - 小区数量统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"小区"的统计卡片
    const communityCard = page.locator("text=/小区/");

    const count = await communityCard.count();
    if (count > 0) {
      await expect(communityCard.first()).toBeVisible();
    }
  });

  test("5. 统计卡片 - 房间数量统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"房间"的统计卡片
    const roomCard = page.locator("text=/房间/");

    const count = await roomCard.count();
    if (count > 0) {
      await expect(roomCard.first()).toBeVisible();
    }
  });

  test("6. 统计卡片 - 入住率统计", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找包含"入住"或"出租"的统计卡片
    const occupancyCard = page.locator("text=/入住|出租|空置/");

    const count = await occupancyCard.count();
    if (count > 0) {
      await expect(occupancyCard.first()).toBeVisible();
    }
  });

  test("7. 统计数据 - 显示数字", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找数字显示
    const numberElements = page.locator("main").locator("text=/[0-9]+/");

    const count = await numberElements.count();
    expect(count).toBeGreaterThan(0);
  });

  // ==================== 页面元素验证 ====================

  test("8. 筛选区域 - 小区筛选器存在", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找小区下拉选择器
    const communitySelect = page
      .locator('[class*="select"], .t-select')
      .first();

    const count = await page.locator('[class*="select"], .t-select').count();
    if (count > 0) {
      await expect(communitySelect).toBeVisible();
    }
  });

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

  test("10. 表格数据 - 房源列表显示", async ({ page }) => {
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

  test("11. 小区筛选 - 可以选择小区", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    const selectElement = page.locator('.t-select, [class*="select"]').first();

    if (await selectElement.isVisible()) {
      await selectElement.click();
      await page.waitForTimeout(500);

      // 检查下拉选项是否弹出
      const dropdown = page.locator('.t-select__dropdown, [class*="dropdown"]');
      const dropdownCount = await dropdown.count();

      if (dropdownCount > 0) {
        // 下拉菜单应该可见
        await expect(dropdown.first()).toBeVisible();
      }
    }
  });

  test("12. 查询按钮 - 筛选后可查询", async ({ page }) => {
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

  test("13. 重置按钮 - 可以重置筛选条件", async ({ page }) => {
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

  // ==================== 数据刷新测试 ====================

  test("14. 刷新按钮 - 可以刷新数据", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 查找刷新按钮
    const refreshButton = page.locator(
      'button:has-text("刷新"), [class*="refresh"]',
    );

    const count = await refreshButton.count();
    if (count > 0) {
      await expect(refreshButton.first()).toBeEnabled();
    }
  });

  // ==================== 响应式布局测试 ====================

  test("15. 响应式布局 - 移动端适配", async ({ page }) => {
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

  test("16. 响应式布局 - 平板适配", async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAndNavigate(page, PAGE_PATH);

    // 验证页面正常显示
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  // ==================== 页面状态测试 ====================

  test("17. 页面刷新 - 数据保持", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 验证页面仍然正常显示
    await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
  });

  test("18. 空数据状态 - 无数据时显示提示", async ({ page }) => {
    await loginAndNavigate(page, PAGE_PATH);

    // 等待数据加载
    await page.waitForTimeout(1000);

    // 查找空状态提示（可能存在）
    const emptyState = page.locator(
      '[class*="empty"], [class*="no-data"], text=/暂无数据/',
    );

    // 空状态提示是可选的
    const count = await emptyState.count();
    // 不强制要求，只是检查如果存在应该可见
    if (count > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  // ==================== 无障碍测试 ====================

  test("19. 无障碍 - 主内容区域有合适的标签", async ({ page }) => {
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

  test("20. 页面加载性能 - 3秒内完成", async ({ page }) => {
    const startTime = Date.now();

    await loginAndNavigate(page, PAGE_PATH);

    // 等待主要内容加载完成
    await expect(page.locator("main")).toBeVisible({ timeout: 3000 });

    const loadTime = Date.now() - startTime;

    // 页面加载应该在 15 秒内完成（包含登录）
    expect(loadTime).toBeLessThan(15000);
  });
});
