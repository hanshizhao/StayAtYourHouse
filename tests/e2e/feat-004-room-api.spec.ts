/**
 * FEAT-004: Room CRUD API - API 运行时验证
 * 类型: api_runtime
 * 适用于: 后端 API
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-004: Room API', () => {

  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.accessToken;
  }

  test('1. API 冒烟测试 - 列表接口', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/room/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('2. API 冒烟测试 - 创建接口', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        communityId: 1,
        building: '1栋',
        roomNumber: '101',
        costPrice: 1500,
        rentPrice: 2000,
        status: 0
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
});
