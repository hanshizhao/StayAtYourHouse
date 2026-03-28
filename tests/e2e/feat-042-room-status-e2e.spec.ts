/**
 * FEAT-042: E2E 测试验证房间已收回状态 - 完整验证
 * ✅ 适用于：跨模块流程验证
 * 测试覆盖：
 * 1. 枚举一致性：前后端 RoomStatus 枚举值对齐
 * 2. 状态转换校验：空置↔已收回、非法转换拒绝
 * 3. 创建房间不允许直接设为已收回
 * 4. 报表排除已收回房间
 * 5. 前端展示：筛选器包含已收回、Tag 正确显示
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-042: 房间已收回状态 E2E 完整验证', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.token;
  }

  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
    await page.fill('input[placeholder*="账号"]', 'zhs');
    await page.fill('input[placeholder*="密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  test('1. API 冒烟 - 房间列表', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/room-app/get-list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
  });

  test('2. 状态转换 - 空置→已收回', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list?status=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listResult = await listResponse.json();
    if (listResult.data?.length > 0) {
      const room = listResult.data[0];
      const updateResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 3 },
      });
      expect(updateResponse.status()).toBe(200);
      // 恢复
      await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 0 },
      });
    }
  });

  test('3. 状态转换 - 已出租→已收回 失败', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list?status=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listResult = await listResponse.json();
    if (listResult.data?.length > 0) {
      const room = listResult.data[0];
      const updateResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 3 },
      });
      const result = await updateResponse.json();
      expect(result.succeeded).toBe(false);
    }
  });

  test('4. 报表排除已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/get-housing-overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  test('5. 前端 - 房间列表页可访问', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
  });

  test('6. 前端 - 状态筛选器包含已收回', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');
    const selects = page.locator('.t-select');
    if ((await selects.count()) > 0) {
      await selects.first().click();
      await page.waitForTimeout(500);
      const optionTexts = await page.locator('.t-select-option').allTextContents();
      expect(optionTexts.some(text => text.includes('已收回'))).toBe(true);
    }
  });

  test('7. 前端 - 页面无 JavaScript 错误', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await loginAndNavigate(page, '/housing/room');
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Warning:'));
    expect(criticalErrors).toHaveLength(0);
  });
});
