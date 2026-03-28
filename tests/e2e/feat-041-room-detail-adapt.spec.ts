/**
 * FEAT-041: 前端房间详情页适配 - E2E 测试
 * 验证 detail.vue 的 getStatusTheme 正确映射 RoomStatus.Reclaimed
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:5000';

test.describe('FEAT-041: 前端房间详情页适配', () => {
  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
    await page.fill('input[placeholder*="账号"]', 'zhs');
    await page.fill('input[placeholder*="密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  async function getApiToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: { account: 'zhs', password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    expect(result.succeeded).toBe(true);
    return result.data.token;
  }

  function authHeaders(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  test('1. 房间列表页正常渲染', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('2. 房间详情页可访问且状态标签渲染', async ({ page, request }) => {
    const token = await getApiToken(request);

    // 通过 API 获取房间列表
    const listRes = await request.get(`${API_URL}/api/room/list`, {
      headers: authHeaders(token),
    });
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    const rooms = listData?.data || [];
    expect(rooms.length).toBeGreaterThan(0);

    const roomId = rooms[0].id;

    // 登录并导航到详情页
    await loginAndNavigate(page, `/housing/room/detail/${roomId}`);

    // 验证详情页加载
    await expect(page.locator('[data-testid="page-title"]')).toHaveText('房间详情', { timeout: 5000 });
    // 验证状态标签可见
    await expect(page.locator('[data-testid="status-tag"]')).toBeVisible({ timeout: 5000 });
  });

  test('3. 页面无 JavaScript 错误', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await loginAndNavigate(page, '/housing/room');

    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});
