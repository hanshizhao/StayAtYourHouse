/**
 * FEAT-003: Community CRUD API - API 运行时验证
 * 类型: api_runtime
 * 适用于: 后端 API
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-003: Community API', () => {

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

    const response = await request.get(`${API_BASE}/api/community/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  test('2. API 冒烟测试 - 创建接口', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: '测试小区',
        address: '测试地址',
        propertyPhone: '13800138000'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
});
