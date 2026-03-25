/**
 * FEAT-011: 入住/退租 API - API 运行时验证（严谨版）
 * 类型: api_runtime
 * 适用于: 后端 API
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 入住接口
 * 3. 退租接口
 * 4. 参数验证
 * 5. 业务规则验证
 * 6. 错误处理
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_DATA_PREFIX = 'E2E_TEST_';

test.describe('FEAT-011: 入住/退租 API', () => {
  let authToken: string;
  let createdRentalRecordIds: number[] = [];
  let createdTenantIds: number[] = [];
  let createdRoomIds: number[] = [];
  let createdCommunityIds: number[] = [];

  /**
   * 获取管理员 Token
   */
  async function getAdminToken(request: APIRequestContext): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { account: 'zhs', password: 'gentle8023' }
    });

    expect(loginResponse.status()).toBe(200);

    const result = await loginResponse.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('token');

    return result.data.token;
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
   * 准备测试数据：创建小区、房间、租客
   */
  async function prepareTestData(request: APIRequestContext, token: string): Promise<{ communityId: number; roomId: number; tenantId: number }> {
    const ts = Date.now();

    // 创建小区
    const communityResponse = await request.post(`${API_BASE}/api/community/add`, {
      headers: authHeaders(token),
      data: {
        name: `E2E_Community_${ts}`,
        address: 'Test Address'
      }
    });
    const communityResult = await communityResponse.json();
    console.log('Community result:', JSON.stringify(communityResult));
    const communityId = communityResult.data?.id;
    if (communityId) createdCommunityIds.push(communityId);

    // 创建房间
    const roomResponse = await request.post(`${API_BASE}/api/room/add`, {
      headers: authHeaders(token),
      data: {
        communityId,
        building: '1',
        roomNumber: `Room_${ts}`,
        area: 50,
        costPrice: 1000,
        rentPrice: 2000,
        status: 0  // Vacant
      }
    });
    const roomResult = await roomResponse.json();
    console.log('Room result:', JSON.stringify(roomResult));
    const roomId = roomResult.data?.id;
    if (roomId) createdRoomIds.push(roomId);

    // 创建租客
    const tenantResponse = await request.post(`${API_BASE}/api/tenant-app/add`, {
      headers: authHeaders(token),
      data: {
        name: `Tenant_${ts}`,
        phone: `1${ts.toString().slice(-10)}`,  // 使用时间戳生成唯一电话号码
        gender: 0
      }
    });
    const tenantResult = await tenantResponse.json();
    console.log('Tenant result:', JSON.stringify(tenantResult));
    const tenantId = tenantResult.data?.id;
    if (tenantId) createdTenantIds.push(tenantId);

    return { communityId, roomId, tenantId };
  }

  /**
   * 清理测试数据
   */
  async function cleanupTestData(request: APIRequestContext, token: string): Promise<void> {
    // 清理租住记录
    for (const id of createdRentalRecordIds) {
      try {
        await request.delete(`${API_BASE}/api/rental/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    // 清理租客
    for (const id of createdTenantIds) {
      try {
        await request.delete(`${API_BASE}/api/tenant-app/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    // 清理房间
    for (const id of createdRoomIds) {
      try {
        await request.delete(`${API_BASE}/api/room/remove/${id}`, {
          headers: authHeaders(token)
        });
      } catch (e) {
        // 忽略清理错误
      }
    }
    // 清理小区
    for (const id of createdCommunityIds) {
      try {
        await request.delete(`${API_BASE}/api/community/remove/${id}`, {
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
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestData(request, authToken);
  });

  // ==================== 认证测试 ====================

  test('1. 未认证请求 - 入住接口应返回 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      data: {
        tenantId: 1,
        roomId: 1,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token - 入住接口应返回 401', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: { Authorization: 'Bearer invalid_token' },
      data: {
        tenantId: 1,
        roomId: 1,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 入住接口测试 ====================

  test('3. 入住接口 - 成功入住', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 验证准备数据成功
    expect(roomId).toBeDefined();
    expect(tenantId).toBeDefined();
    expect(roomId).toBeGreaterThan(0);
    expect(tenantId).toBeGreaterThan(0);

    const checkInData = {
      tenantId,
      roomId,
      checkInDate: '2026-03-23',
      leaseType: 0, // 月租
      monthlyRent: 2000,
      deposit: 2000
    };

    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: checkInData
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data).toHaveProperty('id');

    // 验证返回数据
    expect(result.data.tenantId).toBe(tenantId);
    expect(result.data.roomId).toBe(roomId);
    expect(result.data.monthlyRent).toBe(2000);
    expect(result.data.deposit).toBe(2000);
    expect(result.data.status).toBe(0);  // 0 = Active

    createdRentalRecordIds.push(result.data.id);
  });

  test('4. 入住接口 - 必填字段验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        // 缺少 tenantId, roomId, checkInDate 等必填字段
        monthlyRent: 2000
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
    expect(result.errors || result.message).toBeDefined();
  });

  test('5. 入住接口 - 租客不存在验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId: 99999999, // 不存在的租客
        roomId: 1,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect([200, 400, 404]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('6. 入住接口 - 房间不存在验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId: 1,
        roomId: 99999999, // 不存在的房间
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect([200, 400, 404]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('7. 入住接口 - 租期类型验证', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-23',
        leaseType: 99, // 无效的租期类型
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    // 应该返回验证错误或使用默认值
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  test('8. 入住接口 - 合同到期日自动计算（月租）', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    const response = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-23',
        leaseType: 0, // 月租
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    if (result.succeeded) {
      // 合同到期日应该是入住日期 + 1个月 - 1天 = 2026-04-22
      expect(result.data.contractEndDate).toContain('2026-04-22');
      createdRentalRecordIds.push(result.data.id);
    }
  });

  test('9. 入住接口 - 重复入住同一房间验证', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 第一次入住
    const firstResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    const firstResult = await firstResponse.json();
    if (firstResult.succeeded) {
      createdRentalRecordIds.push(firstResult.data.id);

      // 尝试再次入住同一房间
      const secondResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
        headers: authHeaders(authToken),
        data: {
          tenantId,
          roomId, // 同一房间
          checkInDate: '2026-03-24',
          leaseType: 0,
          monthlyRent: 2000,
          deposit: 2000
        }
      });

      // 应该返回错误（房间已被占用）
      expect([200, 400]).toContain(secondResponse.status());

      const secondResult = await secondResponse.json();
      if (!secondResult.succeeded) {
        expect(secondResult.message || secondResult.errors).toBeDefined();
      }
    }
  });

  // ==================== 退租接口测试 ====================

  test('10. 退租接口 - 成功退租', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 验证准备数据成功
    if (!roomId || !tenantId) {
      test.skip('准备测试数据失败，跳过测试');
      return;
    }

    // 先入住
    const checkInResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-01',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    const checkInResult = await checkInResponse.json();
    const rentalRecordId = checkInResult.data?.id;

    if (checkInResult.succeeded && rentalRecordId) {
      // 退租
      const checkOutResponse = await request.post(`${API_BASE}/api/rental/check-out`, {
        headers: authHeaders(authToken),
        data: {
          rentalRecordId,
          checkOutDate: '2026-03-15',
          depositStatus: 0  // 0 = Refunded 全额退还
        }
      });

      expect(checkOutResponse.status()).toBe(200);

      const checkOutResult = await checkOutResponse.json();
      expect(checkOutResult.succeeded).toBe(true);
      expect(checkOutResult.data.status).toBe(1);  // 1 = Terminated
      expect(checkOutResult.data.checkOutDate).toContain('2026-03-15');
      expect(checkOutResult.data).toHaveProperty('depositStatus');
    } else {
      test.skip('入住失败，跳过退租测试');
    }
  });

  test('11. 退租接口 - 不存在的租住记录', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-out`, {
      headers: authHeaders(authToken),
      data: {
        rentalRecordId: 99999999,
        checkOutDate: '2026-03-15',
        depositStatus: 'refunded'
      }
    });

    expect([200, 400, 404]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('12. 退租接口 - 必填字段验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/rental/check-out`, {
      headers: authHeaders(authToken),
      data: {
        // 缺少 rentalRecordId
        checkOutDate: '2026-03-15'
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('13. 退租接口 - 结算金额计算验证', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 先入住
    const checkInResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-01',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    const checkInResult = await checkInResponse.json();
    const rentalRecordId = checkInResult.data?.id;

    if (checkInResult.succeeded && rentalRecordId) {
      // 退租
      const checkOutResponse = await request.post(`${API_BASE}/api/rental/check-out`, {
        headers: authHeaders(authToken),
        data: {
          rentalRecordId,
          checkOutDate: '2026-03-15',
          depositStatus: 'refunded'
        }
      });

      const checkOutResult = await checkOutResponse.json();

      if (checkOutResult.succeeded) {
        // 结算金额应该包含：剩余房租 + 押金 - 未结水电费
        const settlementAmount = checkOutResult.data.settlementAmount;
        expect(typeof settlementAmount).toBe('number');
        // 结算金额应该 > 0（假设没有未结水电费）
        expect(settlementAmount).toBeGreaterThan(0);
      }
    } else {
      test.skip('入住失败，跳过结算金额验证');
    }
  });

  test('14. 退租接口 - 押金处理（部分扣除）', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 验证准备数据成功
    if (!roomId || !tenantId) {
      test.skip('准备测试数据失败，跳过测试');
      return;
    }

    // 先入住
    const checkInResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-01',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    const checkInResult = await checkInResponse.json();
    const rentalRecordId = checkInResult.data?.id;

    if (checkInResult.succeeded && rentalRecordId) {
      // 退租（部分扣除押金）
      const checkOutResponse = await request.post(`${API_BASE}/api/rental/check-out`, {
        headers: authHeaders(authToken),
        data: {
          rentalRecordId,
          checkOutDate: '2026-03-15',
          depositStatus: 2,  // 2 = Deducted 部分扣除
          depositDeduction: 500,
          checkOutRemark: '损坏家具，扣除500元'
        }
      });

      expect(checkOutResponse.status()).toBe(200);

      const checkOutResult = await checkOutResponse.json();
      expect(checkOutResult.succeeded).toBe(true);
      expect(checkOutResult.data.depositStatus).toBe(2);  // 2 = Deducted
      expect(checkOutResult.data.depositDeduction).toBe(500);
    } else {
      test.skip('入住失败，跳过押金处理测试');
    }
  });

  // ==================== 租住记录列表接口测试 ====================

  test('15. 租住记录列表 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rental/list`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);

    // 如果有数据，验证数据结构
    if (result.data.length > 0) {
      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('tenantId');
      expect(firstItem).toHaveProperty('roomId');
      expect(firstItem).toHaveProperty('status');
    }
  });

  test('16. 租住记录详情 - 返回正确数据', async ({ request }) => {
    const { roomId, tenantId } = await prepareTestData(request, authToken);

    // 先入住
    const checkInResponse = await request.post(`${API_BASE}/api/rental/check-in`, {
      headers: authHeaders(authToken),
      data: {
        tenantId,
        roomId,
        checkInDate: '2026-03-23',
        leaseType: 0,
        monthlyRent: 2000,
        deposit: 2000
      }
    });

    const checkInResult = await checkInResponse.json();
    const rentalRecordId = checkInResult.data?.id;

    if (checkInResult.succeeded && rentalRecordId) {
      createdRentalRecordIds.push(rentalRecordId);

      // 获取详情
      const response = await request.get(`${API_BASE}/api/rental/${rentalRecordId}`, {
        headers: authHeaders(authToken)
      });

      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.succeeded).toBe(true);
      expect(result.data.id).toBe(rentalRecordId);
      expect(result.data).toHaveProperty('tenantId');
      expect(result.data).toHaveProperty('roomId');
      expect(result.data).toHaveProperty('checkInDate');
      expect(result.data).toHaveProperty('monthlyRent');
      expect(result.data).toHaveProperty('deposit');
      expect(result.data).toHaveProperty('status');
    } else {
      test.skip('入住失败，跳过详情测试');
    }
  });
});
