/**
 * FEAT-011: 入住/退租 API - API 运行时验证
 * 类型: api_runtime
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-011: 入住/退租 API', () => {
  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.accessToken;
  }

  test('1. API 冒烟测试 - 入住接口', async ({ request }) => {
    const token = await getAdminToken(request);
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        tenantId: 1,
        roomId: 1,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });
    expect([200, 400]).toContain(response.status());
  });
});
