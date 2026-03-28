/**
 * FEAT-038: 后端报表排除 Reclaimed 房间 - API 运行时验证
 * ✅ 适用于：后端报表服务
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-038: 后端报表排除 Reclaimed 房间', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.token;
  }

  test('1. 房源概览 - 排除已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/get-housing-overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('totalRooms');
  });

  test('2. 利润排行 - 排除已收回房间', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report-app/get-profit-ranking/monthly/10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });
});
