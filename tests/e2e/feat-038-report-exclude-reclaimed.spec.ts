/**
 * FEAT-038: 后端报表排除已收回房间 - API 运行时验证
 * ✅ 适用于：后端 API、服务
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-038: 后端报表排除已收回房间', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.token;
  }

  test('1. 房源概览 - 不包含已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 空置房源列表不应包含已收回房间
    const vacantRooms = result.data?.vacantRooms || [];
    for (const room of vacantRooms) {
      expect(room.status).not.toBe('已收回');
    }
  });

  test('2. 利润排行 - 不包含已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();

    // 排行榜不应包含已收回房间
    const rankings = result.data || [];
    for (const room of rankings) {
      expect(room.status).not.toBe('已收回');
    }
  });

  test('3. 验证统计总数一致性', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();

    const overview = result.data;
    if (overview) {
      const totalRooms = overview.totalRooms || 0;
      const rentedCount = overview.rentedCount || 0;
      const vacantCount = overview.vacantCount || 0;
      const renovatingCount = overview.renovatingCount || 0;

      // 总数应等于各项之和（不含已收回）
      expect(totalRooms).toBe(rentedCount + vacantCount + renovatingCount);
    }
  });
});
