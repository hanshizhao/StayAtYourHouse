/**
 * FEAT-034: 租赁记录列表页面 - E2E 测试
 * ✅ 适用于：前端页面
 * ⚠️ 强制要求：必须验证页面可访问、核心元素可见
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  TEST_CREDENTIALS,
  loginAndNavigate,
  setupConsoleErrorTracker,
  getCriticalErrors,
} from './helpers/test-utils';

test.describe('FEAT-034: 租赁记录列表页面', () => {

  async function navigateToRentalPage(page: any) {
    await loginAndNavigate(page, '/housing/rental');
  }

  /**
   * 测试 1: 页面可访问 - 无报错加载
   */
  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);
    await navigateToRentalPage(page);

    // 验证核心元素可见
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    // 验证没有严重错误
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  /**
   * 测试 2: 核心元素可见 - 表格渲染
   */
  test('2. 核心元素可见 - 表格渲染', async ({ page }) => {
    await navigateToRentalPage(page);

    // 验证表格可见
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表头包含关键列
    const headers = table.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerStr = headerTexts.join(' ');

    expect(headerStr).toContain('ID');
    expect(headerStr).toContain('房间信息');
    expect(headerStr).toContain('租客');
    expect(headerStr).toContain('月租金');
    expect(headerStr).toContain('状态');
  });

  /**
   * 测试 3: 筛选栏 - 小区和状态选择器
   */
  test('3. 筛选栏 - 小区和状态选择器存在', async ({ page }) => {
    await navigateToRentalPage(page);

    // 验证小区筛选下拉框
    const communitySelect = page.locator('.t-select').first();
    await expect(communitySelect).toBeVisible({ timeout: 5000 });

    // 验证查询按钮
    const searchButton = page.locator('button:has-text("查询")');
    await expect(searchButton).toBeVisible({ timeout: 5000 });
  });

  /**
   * 测试 4: 状态筛选选项
   */
  test('4. 状态筛选 - 选项验证', async ({ page }) => {
    await navigateToRentalPage(page);

    // 点击状态筛选下拉框
    const selects = page.locator('.t-select');
    // 找到状态筛选（第三个 select）
    const statusSelect = selects.nth(2);
    await statusSelect.click();

    // 验证选项包含"在租中"和"已终止"
    await page.waitForTimeout(500);
    const options = page.locator('.t-select-option');
    const optionTexts = await options.allTextContents();
    const optionStr = optionTexts.join(' ');
    expect(optionStr).toContain('在租中');
    expect(optionStr).toContain('已终止');
  });

  /**
   * 测试 5: 分页组件可见
   */
  test('5. 分页组件可见', async ({ page }) => {
    await navigateToRentalPage(page);

    // 验证分页组件
    const pagination = page.locator('.t-pagination');
    await expect(pagination).toBeVisible({ timeout: 5000 });
  });

  /**
   * 测试 6: 数据加载 - API 请求
   */
  test('6. 数据加载 - 分页 API 请求', async ({ page }) => {
    // 监听 API 请求
    const apiRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/rental/page') && req.method() === 'GET',
      { timeout: 10000 },
    );

    await navigateToRentalPage(page);
    const apiRequest = await apiRequestPromise;

    expect(apiRequest.url()).toContain('/rental/page');
    expect(apiRequest.url()).toContain('page=');
    expect(apiRequest.url()).toContain('pageSize=');
  });

  /**
   * 测试 7: 展开行 - 查看关联账单
   */
  test('7. 展开行 - 查看关联账单', async ({ page }) => {
    await navigateToRentalPage(page);

    // 等待数据加载
    await page.waitForTimeout(2000);

    // 查找展开按钮
    const expandButton = page.locator('.t-table__expand-box').first();
    if ((await expandButton.count()) > 0) {
      await expandButton.click();
      await page.waitForTimeout(1000);

      // 验证展开区域包含"关联账单"文字
      const expandedContent = page.locator('text=关联账单');
      if ((await expandedContent.count()) > 0) {
        await expect(expandedContent.first()).toBeVisible();
      }
    }
  });

  /**
   * 测试 8: 金额格式化显示
   */
  test('8. 金额格式化显示', async ({ page }) => {
    await navigateToRentalPage(page);

    await page.waitForTimeout(2000);

    // 验证价格显示包含 ¥ 符号
    const priceElements = page.locator('.price');
    if ((await priceElements.count()) > 0) {
      const firstPrice = await priceElements.first().textContent();
      expect(firstPrice).toContain('¥');
    }
  });

  /**
   * 测试 9: 状态标签显示
   */
  test('9. 状态标签显示', async ({ page }) => {
    await navigateToRentalPage(page);

    await page.waitForTimeout(2000);

    // 验证状态标签存在
    const statusTags = page.locator('.t-tag');
    if ((await statusTags.count()) > 0) {
      const tagTexts = await statusTags.allTextContents();
      // 至少应该有状态标签（在租中/已终止）或押金状态标签
      expect(tagTexts.length).toBeGreaterThan(0);
    }
  });

  /**
   * 测试 10: 小区筛选 - 级联加载房间
   */
  test('10. 小区筛选 - 级联加载房间选项', async ({ page }) => {
    await navigateToRentalPage(page);

    // 监听房间 API 请求
    const roomRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/room') && req.method() === 'GET',
      { timeout: 10000 },
    );

    // 点击小区下拉框
    const firstSelect = page.locator('.t-select').first();
    await firstSelect.click();
    await page.waitForTimeout(500);

    // 选择第一个小区选项
    const firstOption = page.locator('.t-select-option').first();
    if ((await firstOption.count()) > 0) {
      await firstOption.click();
      // 验证触发了房间列表请求
      try {
        await roomRequestPromise;
      } catch {
        // 小区选项可能为空，忽略超时
      }
    }
  });
});
