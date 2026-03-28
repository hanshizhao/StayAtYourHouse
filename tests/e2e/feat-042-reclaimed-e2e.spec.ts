/**
 * FEAT-042: E2E 完整已收回状态验证 - 集成测试
 * 验证跨模块流程：枚举一致性、状态转换、创建校验、报表排除、前端展示
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-042: E2E 完整已收回状态验证', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    expect(result.succeeded).toBe(true);
    return result.data.token;
  }

  function authHeaders(token: string, json = true): Record<string, string> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
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

  test('1. 前后端枚举一致性 - 源码验证', () => {
    // 验证后端枚举
    const backendEnum = readFileSync(
      resolve(__dirname, '../../Gentle/Gentle.Core/Enums/RoomStatus.cs'),
      'utf-8',
    );
    expect(backendEnum).toContain('Reclaimed = 3');

    // 验证前端枚举
    const frontendEnum = readFileSync(
      resolve(__dirname, '../../Hans/src/api/model/roomModel.ts'),
      'utf-8',
    );
    expect(frontendEnum).toContain('Reclaimed = 3');
    expect(frontendEnum).toContain('[RoomStatus.Reclaimed]: \'已收回\'');
  });

  test('2. 状态转换 - 空置 → 已收回 → 空置', async ({ request }) => {
    const token = await getAdminToken(request);

    // 获取空置房间
    const listResponse = await request.get(`${API_BASE}/api/room/list?status=0`, {
      headers: authHeaders(token),
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    expect(rooms.succeeded).toBe(true);
    const vacantRoom = rooms.data?.find((r: any) => r.status === 0);
    if (!vacantRoom) {
      console.warn('FEAT-042 Test 2: 无空置房间可用，跳过');
      return;
    }

    // 空置 → 已收回
    const reclaimResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...vacantRoom, status: 3 },
    });
    const reclaimResult = await reclaimResponse.json();
    expect(reclaimResult.succeeded).toBe(true);

    // 验证状态已更新
    const verifyResponse = await request.get(`${API_BASE}/api/room/${vacantRoom.id}`, {
      headers: authHeaders(token),
    });
    const verifyResult = await verifyResponse.json();
    expect(verifyResult.data.status).toBe(3);

    // 已收回 → 空置（恢复）
    const restoreResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...vacantRoom, status: 0 },
    });
    const restoreResult = await restoreResponse.json();
    expect(restoreResult.succeeded).toBe(true);
  });

  test('3. 状态转换 - 已出租 → 已收回应失败', async ({ request }) => {
    const token = await getAdminToken(request);

    const listResponse = await request.get(`${API_BASE}/api/room/list?status=1`, {
      headers: authHeaders(token),
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const rentedRoom = rooms.data?.find((r: any) => r.status === 1);
    if (!rentedRoom) {
      console.warn('FEAT-042 Test 3: 无已出租房间可用，跳过');
      return;
    }

    const response = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...rentedRoom, status: 3 },
    });
    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('3b. 状态转换 - 装修中 → 已收回应失败', async ({ request }) => {
    const token = await getAdminToken(request);

    const listResponse = await request.get(`${API_BASE}/api/room/list?status=2`, {
      headers: authHeaders(token),
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const renovatingRoom = rooms.data?.find((r: any) => r.status === 2);
    if (!renovatingRoom) {
      console.warn('FEAT-042 Test 3b: 无装修中房间可用，跳过');
      return;
    }

    const response = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...renovatingRoom, status: 3 },
    });
    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('3c. 状态转换 - 已收回 → 已出租应失败', async ({ request }) => {
    const token = await getAdminToken(request);

    // 先找一个空置房间，转为已收回
    const listResponse = await request.get(`${API_BASE}/api/room/list?status=0`, {
      headers: authHeaders(token),
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const vacantRoom = rooms.data?.find((r: any) => r.status === 0);
    if (!vacantRoom) {
      console.warn('FEAT-042 Test 3c: 无空置房间可用，跳过');
      return;
    }

    // 先转为已收回
    const reclaimResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...vacantRoom, status: 3 },
    });
    const reclaimResult = await reclaimResponse.json();
    expect(reclaimResult.succeeded).toBe(true);

    // 尝试从已收回直接转为已出租（应失败）
    const toRentedResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...vacantRoom, status: 1 },
    });
    const toRentedResult = await toRentedResponse.json();
    expect(toRentedResult.succeeded).toBe(false);

    // 恢复为空置
    await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(token),
      data: { ...vacantRoom, status: 0 },
    });
  });

  test('4. 创建房间不允许直接设为已收回', async ({ request }) => {
    const token = await getAdminToken(request);

    // 获取已有房间用于构造请求数据
    const listResponse = await request.get(`${API_BASE}/api/room/list`, {
      headers: authHeaders(token),
    });
    const rooms = await listResponse.json();
    const existingRoom = rooms.data?.[0];
    if (!existingRoom) {
      console.warn('FEAT-042 Test 4: 无房间数据可用，跳过');
      return;
    }

    const createResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(token),
      data: {
        communityId: existingRoom.communityId,
        building: 'T-042',
        roomNumber: 'TEST-042',
        costPrice: 1000,
        rentPrice: 1500,
        status: 3,
      },
    });
    const result = await createResponse.json();
    expect(result.succeeded).toBe(false);
  });

  test('5. 报表排除已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);

    // 房源概览 - 总数应等于各项之和（不含已收回）
    const overviewResponse = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: authHeaders(token, false),
    });
    expect(overviewResponse.status()).toBe(200);
    const overviewResult = await overviewResponse.json();
    expect(overviewResult.succeeded).toBe(true);

    const overview = overviewResult.data;
    if (overview) {
      const totalRooms = overview.totalRooms || 0;
      const rentedCount = overview.rentedCount || 0;
      const vacantCount = overview.vacantCount || 0;
      const renovatingCount = overview.renovatingCount || 0;
      // 总数应等于各项之和（排除已收回）
      expect(totalRooms).toBe(rentedCount + vacantCount + renovatingCount);
    }

    // 利润排行 - 不应包含已收回房间
    const rankingResponse = await request.get(
      `${API_BASE}/api/report-app/profit-ranking/monthly/50`,
      { headers: authHeaders(token, false) },
    );
    expect(rankingResponse.status()).toBe(200);
    const rankingResult = await rankingResponse.json();
    expect(rankingResult.succeeded).toBe(true);
    const rankings = rankingResult.data || [];
    for (const room of rankings) {
      expect(room.status).not.toBe('已收回');
    }
  });

  test('6. 前端页面展示已收回状态', async ({ page }) => {
    await loginAndNavigate(page, '/housing/room');

    // 验证状态筛选器包含已收回选项
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.click();
    const options = page.locator('.t-select-option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts.some(t => t.includes('已收回'))).toBeTruthy();

    // 关闭下拉框
    await page.keyboard.press('Escape');

    // 验证表格正常渲染
    const table = page.locator('[data-testid="room-table"]');
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});
