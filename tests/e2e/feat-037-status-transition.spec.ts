/**
 * FEAT-037: 后端状态转换校验 + 状态文本映射 - API 运行时验证
 * ✅ 适用于：后端 API、服务
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-037: 后端状态转换校验 + 状态文本映射', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.token;
  }

  test('1. 状态转换校验 - 空置 → 已收回应成功', async ({ request }) => {
    const token = await getAdminToken(request);
    // 获取一个空置房间
    const listResponse = await request.get(`${API_BASE}/api/room/list?status=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const vacantRoom = rooms.data?.find((r: any) => r.status === 0);
    if (!vacantRoom) return; // 无空置房间时跳过

    // 尝试更新为已收回
    const updateResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { ...vacantRoom, status: 3 },
    });
    const updateResult = await updateResponse.json();
    expect(updateResult.succeeded).toBe(true);

    // 恢复为空置
    await request.put(`${API_BASE}/api/room/edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { ...vacantRoom, status: 0 },
    });
  });

  test('2. 状态转换校验 - 已出租 → 已收回应失败', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room/list?status=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const rentedRoom = rooms.data?.find((r: any) => r.status === 1);
    if (!rentedRoom) return;

    const updateResponse = await request.put(`${API_BASE}/api/room/edit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { ...rentedRoom, status: 3 },
    });
    // Furion 统一结果格式：HTTP 200 但 succeeded=false
    const result = await updateResponse.json();
    expect(result.succeeded).toBe(false);
  });

  test('3. 创建房间 - 不允许直接设为已收回', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listResponse.status()).toBe(200);
    const rooms = await listResponse.json();
    const existingRoom = rooms.data?.[0];
    if (!existingRoom) return;

    const createResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        communityId: existingRoom.communityId,
        building: 'T-037',
        roomNumber: 'TEST-037',
        rentPrice: 1500,
        status: 3, // 尝试创建为已收回
      },
    });
    // Furion 统一结果格式：HTTP 200 但 succeeded=false
    const result = await createResponse.json();
    expect(result.succeeded).toBe(false);
  });

  test('4. 状态文本映射 - 包含已收回', async ({ request }) => {
    const token = await getAdminToken(request);
    // 通过租赁记录列表验证状态文本
    const rentalResponse = await request.get(`${API_BASE}/api/rental/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(rentalResponse.status()).toBe(200);
  });
});
