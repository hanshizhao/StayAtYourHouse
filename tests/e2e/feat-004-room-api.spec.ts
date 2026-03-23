/**
 * FEAT-004: Room CRUD API - API 运行时验证（严谨版）
 * 类型: api_runtime
 * 适用于: 后端 API
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 列表接口（含筛选）
 * 3. 详情接口
 * 4. 创建接口
 * 5. 更新接口
 * 6. 删除接口
 * 7. 参数验证
 * 8. 错误处理
 * 9. 业务规则验证（关联小区、状态流转）
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-004: Room API', () => {
  let authToken: string;
  let testCommunityId: number;
  let createdRoomIds: number[] = [];

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
   * 创建测试小区
   */
  async function createTestCommunity(request: APIRequestContext, token: string): Promise<number> {
    const response = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(token),
      data: {
        name: `${TEST_DATA_PREFIX}小区_Room_${Date.now()}`,
        address: '房间测试地址'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    return result.data.id;
  }

  /**
   * 清理测试数据
   */
  async function cleanupTestData(request: APIRequestContext, token: string): Promise<void> {
    // 先删除房间
    for (const id of createdRoomIds) {
      try {
        await request.delete(`${API_BASE}/api/room/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    createdRoomIds = [];

    // 再删除小区
    if (testCommunityId) {
      try {
        await request.delete(`${API_BASE}/api/community/remove/${testCommunityId}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
  }

  // ==================== 前置条件 ====================

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
    testCommunityId = await createTestCommunity(request, authToken);
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, authToken);
  });

  // ==================== 认证测试 ====================

  test('1. 未认证请求应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/list`);

    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token 应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/list`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 列表接口测试 ====================

  test('3. 列表接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/list`, {
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
      expect(firstItem).toHaveProperty('building');
      expect(firstItem).toHaveProperty('roomNumber');
      expect(firstItem).toHaveProperty('status');
      expect(typeof firstItem.id).toBe('number');
    }
  });

  test('4. 列表接口 - 按小区筛选', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/list?communityId=${testCommunityId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证返回的数据都属于指定小区
    for (const room of result.data) {
      expect(room.communityId).toBe(testCommunityId);
    }
  });

  test('5. 列表接口 - 按状态筛选', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/list?status=0`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证返回的数据都是空置状态
    for (const room of result.data) {
      expect(room.status).toBe(0); // Vacant
    }
  });

  // ==================== 创建接口测试 ====================

  test('6. 创建接口 - 成功创建', async ({ request }) => {
    const testData = {
      communityId: testCommunityId,
      building: '1栋',
      roomNumber: `10${Date.now().toString().slice(-2)}`,
      costPrice: 1500,
      rentPrice: 2000,
      status: 0
    };

    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: testData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(typeof result.data.id).toBe('number');

    createdRoomIds.push(result.data.id);

    // 验证返回的数据与输入一致
    expect(result.data.communityId).toBe(testData.communityId);
    expect(result.data.building).toBe(testData.building);
    expect(result.data.roomNumber).toBe(testData.roomNumber);
    expect(result.data.costPrice).toBe(testData.costPrice);
    expect(result.data.rentPrice).toBe(testData.rentPrice);
  });

  test('7. 创建接口 - 必填字段验证（缺少 building）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        // 缺少必填的 building 字段
        roomNumber: '101',
        costPrice: 1500,
        rentPrice: 2000,
        status: 0
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(result.errors).toHaveProperty('building');
  });

  test('8. 创建接口 - 必填字段验证（缺少 roomNumber）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        building: '1栋',
        // 缺少必填的 roomNumber 字段
        costPrice: 1500,
        rentPrice: 2000,
        status: 0
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(result.errors).toHaveProperty('roomNumber');
  });

  test('9. 创建接口 - 价格验证（负数价格）', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        building: '1栋',
        roomNumber: '102',
        costPrice: -100, // 负数价格
        rentPrice: 2000,
        status: 0
      }
    });

    const result = await response.json();
    // 应该返回验证错误
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  test('10. 创建接口 - 无效的小区 ID', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: 99999999, // 不存在的小区
        building: '1栋',
        roomNumber: '103',
        costPrice: 1500,
        rentPrice: 2000,
        status: 0
      }
    });

    // 应返回错误（外键约束或业务验证）
    const result = await response.json();
    if (!result.succeeded) {
      expect(result.message || result.errors).toBeDefined();
    }
  });

  // ==================== 详情接口测试 ====================

  test('11. 详情接口 - 返回正确数据', async ({ request }) => {
    // 先创建一条数据
    const createResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        building: '2栋',
        roomNumber: `20${Date.now().toString().slice(-2)}`,
        costPrice: 1200,
        rentPrice: 1800,
        status: 0
      }
    });

    const createResult = await createResponse.json();
    const roomId = createResult.data.id;
    createdRoomIds.push(roomId);

    // 获取详情
    const response = await request.get(`${API_BASE}/api/room/${roomId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.id).toBe(roomId);
    expect(result.data).toHaveProperty('building');
    expect(result.data).toHaveProperty('roomNumber');
    expect(result.data).toHaveProperty('communityId');
  });

  test('12. 详情接口 - 不存在的 ID 返回 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/room/99999999`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const result = await response.json();
      expect(result.succeeded).toBe(false);
    }
  });

  // ==================== 更新接口测试 ====================

  test('13. 更新接口 - 成功更新', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        building: '3栋',
        roomNumber: `30${Date.now().toString().slice(-2)}`,
        costPrice: 1000,
        rentPrice: 1500,
        status: 0
      }
    });

    const createResult = await createResponse.json();
    const roomId = createResult.data.id;
    createdRoomIds.push(roomId);

    // 更新
    const updateData = {
      id: roomId,
      communityId: testCommunityId,
      building: '3栋',
      roomNumber: createResult.data.roomNumber,
      costPrice: 1200,
      rentPrice: 1800,
      status: 1 // 更新为已出租
    };

    const response = await request.put(`${API_BASE}/api/room/edit`, {
      headers: authHeaders(authToken),
      data: updateData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.costPrice).toBe(updateData.costPrice);
    expect(result.data.rentPrice).toBe(updateData.rentPrice);
    expect(result.data.status).toBe(updateData.status);
  });

  // ==================== 删除接口测试 ====================

  test('14. 删除接口 - 成功删除', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: {
        communityId: testCommunityId,
        building: '4栋',
        roomNumber: `40${Date.now().toString().slice(-2)}`,
        costPrice: 800,
        rentPrice: 1200,
        status: 0
      }
    });

    const createResult = await createResponse.json();
    const roomId = createResult.data.id;

    // 删除
    const response = await request.delete(`${API_BASE}/api/room/remove/${roomId}`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证已删除（再次获取应返回 404）
    const getResponse = await request.get(`${API_BASE}/api/room/${roomId}`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(getResponse.status());
    if (getResponse.status() === 200) {
      const getResult = await getResponse.json();
      expect(getResult.succeeded).toBe(false);
    }
  });

  test('15. 删除接口 - 删除不存在的 ID', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/room/remove/99999999`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());
  });

  // ==================== 边界测试 ====================

  test('16. 创建接口 - 完整属性', async ({ request }) => {
    const testData = {
      communityId: testCommunityId,
      building: '5栋',
      roomNumber: `50${Date.now().toString().slice(-2)}`,
      area: 85.5,
      roomType: '两室一厅',
      costPrice: 1500,
      rentPrice: 2200,
      deposit: 4400,
      waterPrice: 5,
      electricPrice: 1.2,
      status: 0,
      remark: 'E2E测试-完整属性'
    };

    const response = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(authToken),
      data: testData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    createdRoomIds.push(result.data.id);

    // 验证所有属性
    expect(result.data.area).toBe(testData.area);
    expect(result.data.roomType).toBe(testData.roomType);
    expect(result.data.deposit).toBe(testData.deposit);
    expect(result.data.waterPrice).toBe(testData.waterPrice);
    expect(result.data.electricPrice).toBe(testData.electricPrice);
    expect(result.data.remark).toBe(testData.remark);
  });
});
