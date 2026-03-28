/**
 * FEAT-032: 租赁记录分页查询 API - API 运行时验证
 * ✅ 适用于：后端 API、服务
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-032: 租赁记录分页查询 API', () => {

  async function getAdminToken(request: any): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResponse.status()).toBe(200);
    const result = await loginResponse.json();
    return result.data.token;
  }

  test('1. 分页端点 GET /api/rental/page 返回 200', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('2. 分页返回正确数据结构 (Items, Total, Page, PageSize)', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    const data = result.data;

    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('pageSize');
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.total).toBe('number');
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(20);
  });

  test('3. 分页数据每条记录包含 bills 数组', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    const items = result.data.items || [];

    if (items.length > 0) {
      const firstItem = items[0];
      // bills 属性应存在（可以为 null 或数组）
      expect(firstItem).toHaveProperty('bills');
      if (firstItem.bills) {
        expect(Array.isArray(firstItem.bills)).toBe(true);
      }
    }
  });

  test('4. 状态筛选参数 status=active 有效', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?status=active&page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  test('5. 状态筛选参数 status=terminated 有效', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?status=terminated&page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  test('6. 房间筛选参数 roomId 有效', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?roomId=1&page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  test('7. 分页参数边界验证 - page=0 自动修正', async ({ request }) => {
    const token = await getAdminToken(request);

    const response = await request.get(`${API_BASE}/api/rental/page?page=0&pageSize=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    // page=0 应该被修正为 1
    expect(result.data.page).toBeGreaterThanOrEqual(1);
  });

  test('8. 未认证请求返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rental/page?page=1&pageSize=10`);

    expect(response.status()).toBe(401);
  });

  test('9. GetPagedListAsync 包含 Include Bills 查询', async () => {
    const fs = require('fs');
    const path = require('path');
    const servicePath = path.join(__dirname, '../../Gentle/Gentle.Application/Services/RentalRecordService.cs');
    const content = fs.readFileSync(servicePath, 'utf-8');

    // 验证分页查询中包含 Bills 的 Include
    expect(content).toMatch(/Include\s*\(\s*r\s*=>\s*r\.Bills\s*\)/);
  });

  test('10. GetByIdAsync 也包含 Include Bills', async () => {
    const fs = require('fs');
    const path = require('path');
    const servicePath = path.join(__dirname, '../../Gentle/Gentle.Application/Services/RentalRecordService.cs');
    const content = fs.readFileSync(servicePath, 'utf-8');

    // 验证 GetByIdAsync 方法体中包含 Bills 的 Include
    const getByIdMatch = content.match(/GetByIdAsync[\s\S]*?FirstOrDefaultAsync/);
    expect(getByIdMatch).toBeTruthy();
    expect(getByIdMatch![0]).toMatch(/Include\s*\(\s*r\s*=>\s*r\.Bills\s*\)/);
  });
});
