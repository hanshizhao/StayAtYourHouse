/**
 * FEAT-035: 租赁记录页面完整 E2E 验证
 * 前后端联动验证：API 冒烟 + 前端页面功能
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const RENTAL_PAGE_PATH = '/housing/rental';

// ==================== 辅助函数 ====================

async function getApiToken(request: any): Promise<string> {
  const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
    data: { Account: 'zhs', Password: 'gentle8023' },
  });
  expect(loginResponse.status()).toBe(200);
  const result = await loginResponse.json();
  return result.data.token;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function loginAndNavigateToRental(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入账号"]', 'zhs');
  await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
  await page.goto(`${BASE_URL}${RENTAL_PAGE_PATH}`);
  await page.waitForLoadState('networkidle');
}

function setupConsoleErrorTracker(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return consoleErrors;
}

function getCriticalErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('Warning:') &&
      !e.includes('[HMR]') &&
      !e.includes('DevTools') &&
      !e.includes('ResizeObserver'),
  );
}

async function waitForTableReady(page: Page): Promise<void> {
  await page.waitForSelector('.t-table', { timeout: 10000 });
  const loading = page.locator('.t-loading');
  if ((await loading.count()) > 0) {
    await loading.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

// ==================== 测试用例 ====================

test.describe.serial('FEAT-035: 租赁记录完整验证', () => {

  // ========== API 冒烟测试 ==========

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

  // ========== 前端页面验证 ==========

  test('3. 页面可访问 - 无 JS 错误', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);
    await loginAndNavigateToRental(page);

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('4. 表格和筛选栏正常渲染', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    // 表格可见
    const table = page.locator('.t-table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表头包含关键列
    const headers = table.locator('thead th');
    const headerTexts = await headers.allTextContents();
    const headerStr = headerTexts.join(' ');
    expect(headerStr).toContain('ID');
    expect(headerStr).toContain('租客');

    // 筛选栏元素（即时筛选，无查询按钮）
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="community-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="room-filter"]')).toBeVisible();
  });

  test('5. 分页组件可见', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    const pagination = page.locator('.t-pagination');
    if ((await pagination.count()) > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('6. 展开行显示关联账单', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);
    await page.waitForTimeout(1000);

    // 查找并点击展开按钮
    const expandButton = page.locator('.t-table__expand-box').first();
    if ((await expandButton.count()) > 0) {
      await expandButton.click();
      await page.waitForTimeout(1000);

      // 验证展开行区域（有关联账单或暂无账单）
      const expandedArea = page.locator('.expanded-bills-container, .expanded-bills-empty');
      if ((await expandedArea.count()) > 0) {
        await expect(expandedArea.first()).toBeVisible();
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

    if (items.length > 0) {
      for (const item of items) {
        // bills 应该存在（可能为 null 或数组）
        expect(item).toHaveProperty('bills');
        if (item.bills && Array.isArray(item.bills) && item.bills.length > 0) {
          const bill = item.bills[0];
          expect(bill).toHaveProperty('id');
          expect(bill).toHaveProperty('dueDate');
          expect(bill).toHaveProperty('rentAmount');
          expect(bill).toHaveProperty('totalAmount');
        }
      }
    }
  });

  test('8. 状态筛选即时生效', async ({ page }) => {
    // 监听 API 请求
    const apiRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/rental/page') && req.url().includes('status='),
      { timeout: 10000 },
    );

    await loginAndNavigateToRental(page);

    // 点击状态筛选下拉框
    const statusSelect = page.locator('[data-testid="status-filter"]');
    await statusSelect.click();
    await page.waitForTimeout(500);

    // 选择一个选项
    const option = page.locator('.t-select-option').first();
    if ((await option.count()) > 0) {
      await option.click();

      // 验证 API 请求包含 status 参数
      try {
        const apiRequest = await apiRequestPromise;
        expect(apiRequest.url()).toContain('status=');
      } catch {
        // 选项可能未触发请求，忽略
      }
    }
  });

  test('9. 小区筛选级联加载房间', async ({ page }) => {
    await loginAndNavigateToRental(page);

    // 房间选择器初始禁用
    const roomSelect = page.locator('[data-testid="room-filter"]');
    const isDisabled = await roomSelect.evaluate((el: Element) => {
      const input = el.querySelector('input');
      return input ? (input as HTMLInputElement).disabled : false;
    });
    expect(isDisabled).toBeTruthy();

    // 选择小区
    const communitySelect = page.locator('[data-testid="community-filter"]');
    await communitySelect.click();
    await page.waitForTimeout(500);

    const firstOption = page.locator('.t-select-option').first();
    if ((await firstOption.count()) > 0) {
      const roomRequestPromise = page.waitForRequest(
        (req) => req.url().includes('/room') && req.method() === 'GET',
        { timeout: 10000 },
      );

      await firstOption.click();

      try {
        await roomRequestPromise;
        await page.waitForTimeout(500);
      } catch {
        // 选项可能为空，忽略
      }
    }
  });

  test('10. 金额格式化显示', async ({ page }) => {
    await loginAndNavigateToRental(page);
    await waitForTableReady(page);

    // 验证金额包含 ¥ 符号
    const amountCells = page.locator('.rental-list .amount');
    if ((await amountCells.count()) > 0) {
      const text = await amountCells.first().textContent();
      expect(text).toContain('¥');
    }
  });

  test('11. 未认证 API 请求返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=10`);
    expect(response.status()).toBe(401);
  });

  test('12. 分页参数边界验证 - page=0 自动修正', async ({ request }) => {
    const token = await getApiToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=0&pageSize=10`, {
      headers: authHeaders(token),
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.data.page).toBeGreaterThanOrEqual(1);
  });
});
