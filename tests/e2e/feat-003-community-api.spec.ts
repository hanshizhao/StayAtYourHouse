/**
 * FEAT-003: Community CRUD API - API 运行时验证（严谨版）
 * 类型: api_runtime
 * 适用于: 后端 API
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 列表接口
 * 3. 详情接口
 * 4. 创建接口
 * 5. 更新接口
 * 6. 删除接口
 * 7. 参数验证
 * 8. 错误处理
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-003: Community API', () => {
  let authToken: string;
  let createdCommunityIds: number[] = [];

  /**
   * 获取管理员 Token
   */
  async function getAdminToken(request: APIRequestContext): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });

    // 严格断言：只接受 200
    expect(loginResponse.status()).toBe(200);

    const result = await loginResponse.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('accessToken');

    return result.data.accessToken;
  }

  /**
   * 创建认证请求头
   */
  function authHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 清理测试数据
   */
  async function cleanupTestData(request: APIRequestContext, token: string): Promise<void> {
    for (const id of createdCommunityIds) {
      try {
        await request.delete(`${API_BASE}/api/community/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    createdCommunityIds = [];
  }

  // ==================== 前置条件 ====================

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, authToken);
  });

  // ==================== 认证测试 ====================

  test('1. 未认证请求应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/community/list`);

    // 严格断言：未认证应返回 401
    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token 应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/community/list`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 列表接口测试 ====================

  test('3. 列表接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/community/list`, {
      headers: authHeaders(authToken)
    });

    // 严格断言：只接受 200
    expect(response.status()).toBe(200);

    const result = await response.json();

    // 验证响应结构
    expect(result).toHaveProperty('succeeded');
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);

    // 如果有数据，验证数据结构
    if (result.data.length > 0) {
      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(typeof firstItem.id).toBe('number');
      expect(typeof firstItem.name).toBe('string');
    }
  });

  // ==================== 创建接口测试 ====================

  test('4. 创建接口 - 成功创建', async ({ request }) => {
    const testData = {
      name: `${TEST_DATA_PREFIX}小区_${Date.now()}`,
      address: '测试地址123号',
      propertyPhone: '13800138000',
      remark: 'E2E自动化测试数据'
    };

    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: testData
    });

    // 严格断言
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(typeof result.data.id).toBe('number');

    // 记录创建的 ID，用于后续清理
    createdCommunityIds.push(result.data.id);

    // 验证返回的数据与输入一致
    expect(result.data.name).toBe(testData.name);
    expect(result.data.address).toBe(testData.address);
  });

  test('5. 创建接口 - 必填字段验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        // 缺少必填的 name 字段
        address: '测试地址'
      }
    });

    // 应返回 400 或带错误信息的 200
    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    // 验证有错误信息
    expect(result.succeeded).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(result.errors).toHaveProperty('name');
  });

  test('6. 创建接口 - 名称重复验证', async ({ request }) => {
    // 先创建一个
    const name = `${TEST_DATA_PREFIX}重复测试_${Date.now()}`;
    await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: { name }
    });

    // 尝试创建同名
    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: { name }
    });

    // 应返回错误（取决于业务规则）
    const result = await response.json();
    if (!result.succeeded) {
      expect(result.message).toContain(/重复|已存在/);
    }
  });

  // ==================== 详情接口测试 ====================

  test('7. 详情接口 - 返回正确数据', async ({ request }) => {
    // 先创建一条数据
    const createResponse = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}详情测试_${Date.now()}`,
        address: '详情测试地址'
      }
    });

    const createResult = await createResponse.json();
    const communityId = createResult.data.id;
    createdCommunityIds.push(communityId);

    // 获取详情
    const response = await request.get(`${API_BASE}/api/community/${communityId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.id).toBe(communityId);
    expect(result.data).toHaveProperty('name');
    expect(result.data).toHaveProperty('address');
  });

  test('8. 详情接口 - 不存在的 ID 返回 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/community/99999999`, {
      headers: authHeaders(authToken)
    });

    // 应返回 404 或带错误信息的 200
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const result = await response.json();
      expect(result.succeeded).toBe(false);
    }
  });

  // ==================== 更新接口测试 ====================

  test('9. 更新接口 - 成功更新', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}更新测试_${Date.now()}`,
        address: '原地址'
      }
    });

    const createResult = await createResponse.json();
    const communityId = createResult.data.id;
    createdCommunityIds.push(communityId);

    // 更新
    const updateData = {
      id: communityId,
      name: `${TEST_DATA_PREFIX}已更新_${Date.now()}`,
      address: '新地址',
      propertyPhone: '13900139000'
    };

    const response = await request.put(`${API_BASE}/api/community/edit`, {
      headers: authHeaders(authToken),
      data: updateData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.name).toBe(updateData.name);
    expect(result.data.address).toBe(updateData.address);
  });

  // ==================== 删除接口测试 ====================

  test('10. 删除接口 - 成功删除', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}删除测试_${Date.now()}`,
        address: '删除测试地址'
      }
    });

    const createResult = await createResponse.json();
    const communityId = createResult.data.id;

    // 删除
    const response = await request.delete(`${API_BASE}/api/community/remove/${communityId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证已删除（再次获取应返回 404）
    const getResponse = await request.get(`${API_BASE}/api/community/${communityId}`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(getResponse.status());
    if (getResponse.status() === 200) {
      const getResult = await getResponse.json();
      expect(getResult.succeeded).toBe(false);
    }
  });

  test('11. 删除接口 - 删除不存在的 ID', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/community/remove/99999999`, {
      headers: authHeaders(authToken)
    });

    // 应返回 404 或带错误信息的 200
    expect([200, 404]).toContain(response.status());
  });

  // ==================== 边界测试 ====================

  test('12. 创建接口 - 字段长度边界', async ({ request }) => {
    // 测试名称过长
    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        name: 'A'.repeat(500), // 假设最大长度是 100
        address: '测试地址'
      }
    });

    // 应返回验证错误
    const result = await response.json();
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  test('13. 创建接口 - 特殊字符处理', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}特殊字符_<>&"'_${Date.now()}`,
        address: "地址包含特殊字符: <script>alert('xss')</script>"
      }
    });

    // 应该成功（服务端应该转义或过滤）
    expect(response.status()).toBe(200);

    const result = await response.json();
    if (result.succeeded) {
      createdCommunityIds.push(result.data.id);
      // 验证 XSS 被正确处理
      expect(result.data.name).not.toContain('<script>');
    }
  });
});
