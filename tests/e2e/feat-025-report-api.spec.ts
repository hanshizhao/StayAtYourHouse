/**
 * FEAT-025: 统计报表 API - API 运行时验证
 * 类型: api_runtime
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-025: Report API', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.accessToken;
  }

  test('1. API 冒烟测试 - 房源概览接口', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report/housing-overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });

  test('2. API 冒烟测试 - 利润排行接口', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/report/profit-ranking`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });
});
