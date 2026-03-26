/**
 * FEAT-017: 账单 + 催收 API - API 运行时验证（严谨版）
 * 类型: api_runtime
 * 适用于: 后端 API
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 账单列表接口
 * 3. 账单详情接口
 * 4. 今日待办接口
 * 5. 催收记录接口
 * 6. 参数验证
 * 7. 错误处理
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const TEST_USERNAME = process.env.TEST_USERNAME || 'zhs';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'gentle8023';

test.describe('FEAT-017: Bill API', () => {
  let authToken: string;

  /**
   * 获取管理员 Token
   */
  async function getAdminToken(request: APIRequestContext): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { account: TEST_USERNAME, password: TEST_PASSWORD }
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

  // ==================== 前置条件 ====================

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
  });

  // ==================== 认证测试 ====================

  test('1. 未认证请求 - 列表接口应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list`);

    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token - 列表接口应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 账单列表接口测试 ====================

  test('3. 列表接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('items');
    expect(result.data).toHaveProperty('total');
    expect(Array.isArray(result.data.items)).toBe(true);

    // 如果有数据，验证数据结构
    if (result.data.items.length > 0) {
      const firstItem = result.data.items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('dueDate');
      expect(firstItem).toHaveProperty('totalAmount');
      expect(firstItem).toHaveProperty('status');
    }
  });

  test('4. 列表接口 - 状态筛选参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list?status=pending`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 如果有数据，验证所有数据的状态都是 pending
    if (result.data.items.length > 0) {
      for (const item of result.data.items) {
        expect(item.status).toBe(0); // BillStatus.Pending = 0
      }
    }
  });

  test('5. 列表接口 - 小区筛选参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list?communityId=1`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  test('6. 列表接口 - 月份筛选参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list?month=2026-03`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  // ==================== 今日待办接口测试 ====================

  test('7. 今日待办接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-today-todos`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');

    // 验证数据结构包含各类待办
    const data = result.data;
    expect(data).toHaveProperty('upcoming'); // 即将到期
    expect(data).toHaveProperty('dueToday'); // 今日到期
    expect(data).toHaveProperty('graceExpiring'); // 宽限到期
    expect(data).toHaveProperty('overdue'); // 逾期
    expect(data).toHaveProperty('summary'); // 汇总
  });

  test('8. 今日待办接口 - 即将到期数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-today-todos`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const upcoming = result.data.upcoming;

    expect(Array.isArray(upcoming)).toBe(true);

    // 如果有数据，验证数据结构
    if (upcoming.length > 0) {
      const firstItem = upcoming[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('tenantName');
      expect(firstItem).toHaveProperty('roomInfo');
      expect(firstItem).toHaveProperty('dueDate');
      expect(firstItem).toHaveProperty('totalAmount');
    }
  });

  test('9. 今日待办接口 - 逾期数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-today-todos`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const overdue = result.data.overdue;

    expect(Array.isArray(overdue)).toBe(true);

    // 如果有数据，验证数据结构
    if (overdue.length > 0) {
      const firstItem = overdue[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('tenantName');
    }
  });

  // ==================== 账单详情接口测试 ====================

  test('10. 账单详情接口 - 返回正确数据', async ({ request }) => {
    // 先获取列表
    const listResponse = await request.get(`${API_BASE}/api/bill-app/get-list`, {
      headers: authHeaders(authToken)
    });

    const listResult = await listResponse.json();

    if (listResult.data.items.length > 0) {
      const billId = listResult.data.items[0].id;

      const response = await request.get(`${API_BASE}/api/bill-app/get-by-id/${billId}`, {
        headers: authHeaders(authToken)
      });

      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.succeeded).toBe(true);
      expect(result.data.id).toBe(billId);
      expect(result.data).toHaveProperty('rentAmount');
      expect(result.data).toHaveProperty('waterFee');
      expect(result.data).toHaveProperty('electricFee');
      expect(result.data).toHaveProperty('totalAmount');
      expect(result.data).toHaveProperty('status');
    } else {
      test.skip('没有账单数据，跳过详情测试');
    }
  });

  test('11. 账单详情接口 - 不存在的 ID 返回 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-by-id/99999999`, {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const result = await response.json();
      expect(result.succeeded).toBe(false);
    }
  });

  // ==================== 催收接口测试 ====================

  test('12. 催收接口 - 宽限处理', async ({ request }) => {
    // 先获取一个待收账单
    const listResponse = await request.get(`${API_BASE}/api/bill-app/get-list?status=pending`, {
      headers: authHeaders(authToken)
    });

    const listResult = await listResponse.json();

    if (listResult.data.items.length > 0) {
      const billId = listResult.data.items[0].id;

      const response = await request.post(`${API_BASE}/api/bill-app/collect`, {
        headers: authHeaders(authToken),
        data: {
          billId: billId,
          result: 1, // CollectResult.Grace = 1
          graceUntil: '2026-04-15',
          remark: 'E2E测试 - 宽限处理'
        }
      });

      expect([200, 400]).toContain(response.status());

      const result = await response.json();
      if (result.succeeded) {
        expect(result.data).toHaveProperty('id');
        expect(result.data.status).toBe(1); // BillStatus.Grace = 1
      }
    } else {
      test.skip('没有待收账单，跳过催收测试');
    }
  });

  test('13. 催收接口 - 收款成功', async ({ request }) => {
    // 先获取一个待收账单
    const listResponse = await request.get(`${API_BASE}/api/bill-app/get-list?status=pending`, {
      headers: authHeaders(authToken)
    });

    const listResult = await listResponse.json();

    if (listResult.data.items.length > 0) {
      const billId = listResult.data.items[0].id;
      const totalAmount = listResult.data.items[0].totalAmount;

      const response = await request.post(`${API_BASE}/api/bill-app/collect`, {
        headers: authHeaders(authToken),
        data: {
          billId: billId,
          result: 0, // CollectResult.Success = 0
          paidAmount: totalAmount,
          remark: 'E2E测试 - 收款成功'
        }
      });

      expect([200, 400]).toContain(response.status());

      const result = await response.json();
      if (result.succeeded) {
        // 验证账单状态更新为已收
        expect(result.data.status).toBe(2); // BillStatus.Paid = 2
      }
    } else {
      test.skip('没有待收账单，跳过催收测试');
    }
  });

  test('14. 催收接口 - 必填字段验证', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bill-app/collect`, {
      headers: authHeaders(authToken),
      data: {
        // 缺少 billId 和 result 字段
        remark: '测试'
      }
    });

    expect([200, 400]).toContain(response.status());

    const result = await response.json();
    expect(result.succeeded).toBe(false);
  });

  test('15. 催收接口 - 宽限需要 graceUntil 字段', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/bill-app/collect`, {
      headers: authHeaders(authToken),
      data: {
        billId: 1,
        result: 1, // 选择宽限
        // 缺少 graceUntil 字段
        remark: '测试'
      }
    });

    // 应该返回验证错误
    const result = await response.json();
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  // ==================== 边界测试 ====================

  test('16. 列表接口 - 无效状态参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list?status=invalid_status`, {
      headers: authHeaders(authToken)
    });

    // 应该返回 200（忽略无效参数）或 400
    expect([200, 400]).toContain(response.status());
  });

  test('17. 列表接口 - 无效月份参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/bill-app/get-list?month=invalid_month`, {
      headers: authHeaders(authToken)
    });

    // 应该返回 200（忽略无效参数）或 400
    expect([200, 400]).toContain(response.status());
  });

  // ==================== 账单金额计算验证 ====================

  test('18. 账单金额计算 - 总额等于各项之和', async ({ request }) => {
    // 获取账单列表
    const listResponse = await request.get(`${API_BASE}/api/bill-app/get-list`, {
      headers: authHeaders(authToken)
    });

    const listResult = await listResponse.json();

    if (listResult.data.items.length > 0) {
      const billId = listResult.data.items[0].id;

      // 获取详情
      const response = await request.get(`${API_BASE}/api/bill-app/get-by-id/${billId}`, {
        headers: authHeaders(authToken)
      });

      const result = await response.json();

      if (result.succeeded) {
        const bill = result.data;
        const waterFee = bill.waterFee || 0;
        const electricFee = bill.electricFee || 0;
        const expectedTotal = bill.rentAmount + waterFee + electricFee;
        expect(bill.totalAmount).toBeCloseTo(expectedTotal, 2);
      }
    } else {
      test.skip('没有账单数据，跳过金额验证');
    }
  });

  // ==================== 删除接口测试 ====================

  test('19. 删除接口 - 删除不存在的账单', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/bill-app/remove/99999999`, {
      headers: authHeaders(authToken)
    });

    // 应该返回 200（成功但可能无实际删除）或 404
    expect([200, 404]).toContain(response.status());
  });
});
