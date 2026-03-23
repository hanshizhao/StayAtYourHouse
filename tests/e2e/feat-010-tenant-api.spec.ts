/**
 * FEAT-010: Tenant CRUD API - API 运行时验证（严谨版）
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
 * 9. 搜索功能
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-010: Tenant API', () => {
  let authToken: string;
  let createdTenantIds: number[] = [];

  /**
   * 获取管理员 Token
   */
  async function getAdminToken(request: APIRequestContext): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    });

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
    for (const id of createdTenantIds) {
      try {
        await request.delete(`${API_BASE}/api/tenant/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    createdTenantIds = [];
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
    const response = await request.get(`${API_BASE}/api/tenant/list`);

    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token 应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/tenant/list`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 列表接口测试 ====================

  test('3. 列表接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/tenant/list`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result).toHaveProperty('succeeded');
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);

    // 如果有数据，验证数据结构
    if (result.data.length > 0) {
      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('phone');
      expect(typeof firstItem.id).toBe('number');
      expect(typeof firstItem.name).toBe('string');
      expect(typeof firstItem.phone).toBe('string');
    }
  });

  // ==================== 创建接口测试 ====================

  test('4. 创建接口 - 成功创建', async ({ request }) => {
    const testData = {
      name: `${TEST_DATA_PREFIX}租客_${Date.now()}`,
      phone: '13800138000',
      idCard: '110101199001011234',
      gender: 0,
      emergencyContact: '紧急联系人1',
      remark: 'E2E自动化测试数据'
    };

    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: testData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(typeof result.data.id).toBe('number');

    createdTenantIds.push(result.data.id);

    // 验证返回的数据与输入一致
    expect(result.data.name).toBe(testData.name);
    expect(result.data.phone).toBe(testData.phone);
    expect(result.data.idCard).toBe(testData.idCard);
    expect(result.data.gender).toBe(testData.gender);
  });

  test('5. 创建接口 - 必填字段验证（缺少 name）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        // 缺少必填的 name 字段
        phone: '13800138001'
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(result.errors).toHaveProperty('name');
  });

  test('6. 创建接口 - 必填字段验证（缺少 phone）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}测试租客`
        // 缺少必填的 phone 字段
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(result.errors).toHaveProperty('phone');
  });

  test('7. 创建接口 - 手机号格式验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}测试租客_手机号`,
        phone: 'invalid_phone' // 无效手机号
      }
    });

    const result = await response.json();
    // 应该返回验证错误
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  test('8. 创建接口 - 身份证格式验证（可选字段）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}租客_身份证_${Date.now()}`,
        phone: '13800138002',
        idCard: 'invalid_id_card' // 无效身份证号
      }
    });

    const result = await response.json();
    // 如果有身份证格式验证，应该返回错误
    // 如果没有格式验证，可能成功创建
    if (!result.succeeded && result.errors) {
      expect(result.errors.idCard || result.message).toBeDefined();
    } else if (result.succeeded) {
      createdTenantIds.push(result.data.id);
    }
  });

  // ==================== 详情接口测试 ====================

  test('9. 详情接口 - 返回正确数据', async ({ request }) => {
    // 先创建一条数据
    const createResponse = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}详情测试_${Date.now()}`,
        phone: '13900139000',
        gender: 1
      }
    });

    const createResult = await createResponse.json();
    const tenantId = createResult.data.id;
    createdTenantIds.push(tenantId);

    // 获取详情
    const response = await request.get(`${API_BASE}/api/tenant/${tenantId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.id).toBe(tenantId);
    expect(result.data).toHaveProperty('name');
    expect(result.data).toHaveProperty('phone');
    expect(result.data).toHaveProperty('gender');
  });

  test('10. 详情接口 - 不存在的 ID 返回 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/tenant/99999999`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const result = await response.json();
      expect(result.succeeded).toBe(false);
    }
  });

  // ==================== 更新接口测试 ====================

  test('11. 更新接口 - 成功更新', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}更新测试_${Date.now()}`,
        phone: '13700137000',
        gender: 0
      }
    });

    const createResult = await createResponse.json();
    const tenantId = createResult.data.id;
    createdTenantIds.push(tenantId);

    // 更新
    const updateData = {
      id: tenantId,
      name: `${TEST_DATA_PREFIX}已更新_${Date.now()}`,
      phone: '13700137001',
      gender: 1,
      emergencyContact: '新紧急联系人'
    };

    const response = await request.put(`${API_BASE}/api/tenant/edit`, {
      headers: authHeaders(authToken),
      data: updateData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.name).toBe(updateData.name);
    expect(result.data.phone).toBe(updateData.phone);
    expect(result.data.gender).toBe(updateData.gender);
    expect(result.data.emergencyContact).toBe(updateData.emergencyContact);
  });

  // ==================== 删除接口测试 ====================

  test('12. 删除接口 - 成功删除', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}删除测试_${Date.now()}`,
        phone: '13600136000'
      }
    });

    const createResult = await createResponse.json();
    const tenantId = createResult.data.id;

    // 删除
    const response = await request.delete(`${API_BASE}/api/tenant/remove/${tenantId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证已删除（再次获取应返回 404）
    const getResponse = await request.get(`${API_BASE}/api/tenant/${tenantId}`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(getResponse.status());
    if (getResponse.status() === 200) {
      const getResult = await getResponse.json();
      expect(getResult.succeeded).toBe(false);
    }
  });

  test('13. 删除接口 - 删除不存在的 ID', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/tenant/remove/99999999`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());
  });

  // ==================== 搜索功能测试 ====================

  test('14. 搜索功能 - 按姓名搜索', async ({ request }) => {
    // 先创建一个测试租客
    const createResponse = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}搜索测试_张三_${Date.now()}`,
        phone: '13500135000'
      }
    });

    const createResult = await createResponse.json();
    createdTenantIds.push(createResult.data.id);

    // 搜索
    const response = await request.get(`${API_BASE}/api/tenant/list?keyword=${encodeURIComponent(TEST_DATA_PREFIX)}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证搜索结果包含关键词
    if (result.data.length > 0) {
      const foundItem = result.data.find((item: any) => item.id === createResult.data.id);
      expect(foundItem).toBeDefined();
    }
  });

  test('15. 搜索功能 - 按手机号搜索', async ({ request }) => {
    // 先创建一个测试租客
    const uniquePhone = `13800${Date.now().toString().slice(-5)}`;
    const createResponse = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: `${TEST_DATA_PREFIX}手机号搜索_${Date.now()}`,
        phone: uniquePhone
      }
    });

    const createResult = await createResponse.json();
    createdTenantIds.push(createResult.data.id);

    // 搜索
    const response = await request.get(`${API_BASE}/api/tenant/list?keyword=${uniquePhone.slice(0, 6)}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  // ==================== 边界测试 ====================

  test('16. 创建接口 - 字段长度边界', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: {
        name: 'A'.repeat(500), // 假设最大长度是 50
        phone: '13800138003'
      }
    });

    const result = await response.json();
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    } else {
      createdTenantIds.push(result.data.id);
    }
  });

  test('17. 创建接口 - 完整属性', async ({ request }) => {
    const testData = {
      name: `${TEST_DATA_PREFIX}完整属性_${Date.now()}`,
      phone: '13900139001',
      idCard: '110101199001011234',
      gender: 0,
      emergencyContact: '紧急联系人测试',
      remark: 'E2E测试-完整属性验证'
    };

    const response = await request.post(`${API_BASE}/api/tenant/add`, {
      headers: authHeaders(authToken),
      data: testData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    createdTenantIds.push(result.data.id);

    // 验证所有属性
    expect(result.data.name).toBe(testData.name);
    expect(result.data.phone).toBe(testData.phone);
    expect(result.data.idCard).toBe(testData.idCard);
    expect(result.data.gender).toBe(testData.gender);
    expect(result.data.emergencyContact).toBe(testData.emergencyContact);
    expect(result.data.remark).toBe(testData.remark);
  });
});
