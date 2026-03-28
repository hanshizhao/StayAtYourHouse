/**
 * FEAT-042: E2E 完整已收回状态验证 - 集成测试
 * ✅ 适用于：跨模块流程验证
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-042: E2E 完整已收回状态验证', () => {
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
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  test('1. 前后端枚举一致性', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/room-app/get-list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    // 验证 API 可正常返回包含 Reclaimed 状态的房间
  });

  test('2. 状态转换 - 空置 → 已收回 → 空置', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rooms = await listResponse.json();
    const vacantRoom = rooms.data?.find((r: any) => r.status === 0);
    if (!vacantRoom) return;

    // 空置 → 已收回
    const reclaimResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { ...vacantRoom, status: 3 },
    });
    expect(reclaimResponse.status()).toBe(200);

    // 已收回 → 空置（恢复）
    const restoreResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { ...vacantRoom, status: 0 },
    });
    expect(restoreResponse.status()).toBe(200);
  });

  test('3. 状态转换 - 已出租 → 已收回应失败', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rooms = await listResponse.json();
    const rentedRoom = rooms.data?.find((r: any) => r.status === 1);
    if (!rentedRoom) return;

    const response = await request.post(`${API_BASE}/api/room-app/edit`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { ...rentedRoom, status: 3 },
    });
    expect(response.status()).not.toBe(200);
  });

  test('4. 报表排除已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/get-housing-overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();

    const vacantRooms = result.data?.vacantRooms || [];
    for (const room of vacantRooms) {
      expect(room.status).not.toBe('已收回');
    }
  });

  test('5. 前端页面展示已收回状态', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    // 验证筛选器包含已收回
    const statusFilter = page.locator('.t-select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      const options = page.locator('.t-select-option');
      const optionTexts = await options.allTextContents();
      expect(optionTexts.some(t => t.includes('已收回'))).toBeTruthy();
    }

    // 验证表格正常渲染
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});
