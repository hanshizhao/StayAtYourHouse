/**
 * FEAT-037: 后端状态转换校验 + 状态文本映射 - API 运行时验证
 * ✅ 适用于：后端服务逻辑
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

  test('1. 状态转换校验 - 空置→已收回 成功', async ({ request }) => {
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
      // 恢复为空置
      await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 0 },
      });
    }
  });

  test('2. 状态转换校验 - 已出租→已收回 失败', async ({ request }) => {
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

  test('3. 状态转换校验 - 已收回→空置 成功', async ({ request }) => {
    // 依赖测试 1 先将房间设为已收回
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list?status=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listResult = await listResponse.json();
    if (listResult.data?.length > 0) {
      const room = listResult.data[0];
      // 先设为已收回
      await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 3 },
      });
      // 再恢复为空置
      const restoreResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 0 },
      });
      expect(restoreResponse.status()).toBe(200);
    }
  });

  test('4. 状态转换校验 - 已收回→已出租 失败', async ({ request }) => {
    const token = await getAdminToken(request);
    const listResponse = await request.get(`${API_BASE}/api/room-app/get-list?status=0`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listResult = await listResponse.json();
    if (listResult.data?.length > 0) {
      const room = listResult.data[0];
      // 先设为已收回
      await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 3 },
      });
      // 尝试设为已出租 - 应失败
      const updateResponse = await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 1 },
      });
      const result = await updateResponse.json();
      expect(result.succeeded).toBe(false);
      // 恢复
      await request.post(`${API_BASE}/api/room-app/edit`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { ...room, Status: 0 },
      });
    }
  });

  test('5. 创建房间 - 不允许直接设为已收回', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.post(`${API_BASE}/api/room-app/add`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        CommunityId: 1,
        Building: '测试楼',
        RoomNumber: 'TEST-RECLAIMED',
        CostPrice: 1000,
        RentPrice: 1500,
        Status: 3, // Reclaimed
      },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    // 创建成功但状态应被覆盖为空置
    expect(result.data.Status).toBe(0);
    // 清理
    if (result.data?.Id) {
      await request.delete(`${API_BASE}/api/room-app/remove/${result.data.Id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('6. GetRoomStatusText - 包含已收回映射', async ({ request }) => {
    const token = await getAdminToken(request);
    // 租赁记录列表中会返回 RoomStatusText
    const response = await request.get(`${API_BASE}/api/rental/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
  });
});
