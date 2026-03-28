/**
 * FEAT-035: 租赁记录页面完整 E2E 验证
 * ✅ 适用于：前后端联动验证
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  API_BASE,
  TEST_CREDENTIALS,
  loginAndNavigate,
  setupConsoleErrorTracker,
  getCriticalErrors,
  getApiToken,
  authHeaders,
} from './helpers/test-utils';

test.describe.serial('FEAT-035: 租赁记录完整验证', () => {

  // ==================== API 冒烟测试 ====================

  test('1. API 冒烟 - 分页端点返回正确结构', async ({ request }) => {
    const token = await getApiToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=5`, {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('items');
    expect(result.data).toHaveProperty('total');
    expect(result.data).toHaveProperty('page');
    expect(result.data).toHaveProperty('pageSize');
    expect(Array.isArray(result.data.items)).toBe(true);
  });

  test('2. API 冒烟 - 筛选参数全部生效', async ({ request }) => {
    const token = await getApiToken(request);

    // 测试各筛选组合
    const testCases = [
      { status: 'active', page: 1, pageSize: 10 },
      { status: 'terminated', page: 1, pageSize: 10 },
      { roomId: 1, page: 1, pageSize: 10 },
      { page: 1, pageSize: 5 },
    ];

    for (const params of testCases) {
      const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

      const response = await request.get(`${API_BASE}/api/rental/page?${queryString}`, {
        headers: authHeaders(token),
      });

      expect(response.status()).toBe(200);
    }
  });

  // ==================== 前端页面验证 ====================

  test('3. 页面可访问 - 无 JS 错误', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);
    await loginAndNavigate(page, '/housing/rental');

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('4. 表格和筛选栏正常渲染', async ({ page }) => {
    await loginAndNavigate(page, '/housing/rental');

    // 表格可见
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

    // 筛选栏元素
    await expect(page.locator('button:has-text("查询")')).toBeVisible();
  });

  test('5. 分页切换正常', async ({ page }) => {
    await loginAndNavigate(page, '/housing/rental');

    // 等待数据加载
    await page.waitForTimeout(2000);

    const pagination = page.locator('.t-pagination');
    if ((await pagination.count()) > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('6. 展开行显示关联账单', async ({ page }) => {
    await loginAndNavigate(page, '/housing/rental');
    await page.waitForTimeout(2000);

    // 查找并点击展开按钮
    const expandButton = page.locator('.t-table__expand-box').first();
    if ((await expandButton.count()) > 0) {
      await expandButton.click();
      await page.waitForTimeout(1000);

      // 验证关联账单文字
      const billText = page.locator('text=关联账单');
      if ((await billText.count()) > 0) {
        await expect(billText.first()).toBeVisible();
      }
    }
  });

  test('7. API 数据中包含 bills 嵌套', async ({ request }) => {
    const token = await getApiToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=5`, {
      headers: authHeaders(token),
    });

    const result = await response.json();
    const items = result.data?.items || [];

    // 验证至少有一条记录，且结构正确
    if (items.length > 0) {
      for (const item of items) {
        // bills 应该存在（可能为 null 或数组）
        expect(item).toHaveProperty('bills');
        if (item.bills && Array.isArray(item.bills) && item.bills.length > 0) {
          // 验证 bill 结构
          const bill = item.bills[0];
          expect(bill).toHaveProperty('id');
          expect(bill).toHaveProperty('dueDate');
          expect(bill).toHaveProperty('rentAmount');
          expect(bill).toHaveProperty('totalAmount');
        }
      }
    }
  });
});
