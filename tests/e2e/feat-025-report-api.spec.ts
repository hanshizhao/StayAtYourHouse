/**
 * FEAT-025: 统计报表 API - API 运行时验证
 * 类型: api_runtime
 * 适用于: 后端 API
 *
 * 测试覆盖：
 * 1. 认证验证
 * 2. 房源概览接口
 * 3. 利润排行接口
 * 4. 收支统计接口
 * 5. 催收统计接口
 * 6. 参数验证
 * 7. 数据结构验证
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-025: Report API', () => {
  let authToken: string;

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

  // ==================== 前置条件 ====================

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
  });

  // ==================== 认证测试 ====================

  test('1. 未认证请求 - 房源概览接口应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`);

    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token - 利润排行接口应返回 401', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/10`, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    expect(response.status()).toBe(401);
  });

  // ==================== 房源概览接口测试 ====================

  test('3. 房源概览接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');

    // 验证数据结构
    const data = result.data;
    expect(data).toHaveProperty('totalRooms');
    expect(data).toHaveProperty('rentedCount');
    expect(data).toHaveProperty('vacantCount');
    expect(data).toHaveProperty('renovatingCount');
    expect(data).toHaveProperty('occupancyRate');

    // 验证数据类型
    expect(typeof data.totalRooms).toBe('number');
    expect(typeof data.rentedCount).toBe('number');
    expect(typeof data.vacantCount).toBe('number');
    expect(typeof data.renovatingCount).toBe('number');
    expect(typeof data.occupancyRate).toBe('number');
  });

  test('4. 房源概览接口 - 数据逻辑验证', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证数据逻辑：已出租 + 空置 + 装修中 = 总房间数
    expect(data.rentedCount + data.vacantCount + data.renovatingCount).toBe(data.totalRooms);

    // 验证入住率
    if (data.totalRooms > 0) {
      expect(data.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(data.occupancyRate).toBeLessThanOrEqual(100);
    }
  });

  test('5. 房源概览接口 - 包含小区统计', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/housing-overview`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证包含小区统计
    expect(data).toHaveProperty('communityStats');
    expect(Array.isArray(data.communityStats)).toBe(true);

    // 如果有数据，验证数据结构
    if (data.communityStats.length > 0) {
      const firstCommunity = data.communityStats[0];
      expect(firstCommunity).toHaveProperty('communityId');
      expect(firstCommunity).toHaveProperty('communityName');
      expect(firstCommunity).toHaveProperty('totalRooms');
      expect(firstCommunity).toHaveProperty('rentedCount');
    }
  });

  // ==================== 利润排行接口测试 ====================

  test('6. 利润排行接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/50`, {
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
      expect(firstItem).toHaveProperty('roomId');
      expect(firstItem).toHaveProperty('communityName');
      expect(firstItem).toHaveProperty('building');
      expect(firstItem).toHaveProperty('roomNumber');
      expect(firstItem).toHaveProperty('monthlyProfit');
      expect(firstItem).toHaveProperty('profitRate');
      expect(typeof firstItem.monthlyProfit).toBe('number');
    }
  });

  test('7. 利润排行接口 - 按利润降序排列', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/50`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    if (result.data.length > 1) {
      // 验证数据按利润降序排列
      for (let i = 0; i < result.data.length - 1; i++) {
        expect(result.data[i].monthlyProfit).toBeGreaterThanOrEqual(result.data[i + 1].monthlyProfit);
      }
    }
  });

  test('8. 利润排行接口 - limit 参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/5`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);

    // 验证返回数据量不超过 limit
    expect(result.data.length).toBeLessThanOrEqual(5);
  });

  test('9. 利润排行接口 - sortBy 参数', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/report-app/profit-ranking/yearly/50`,
      { headers: authHeaders(authToken) }
    );

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
  });

  // ==================== 收支统计接口测试 ====================

  test('10. 收支统计接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/income-report/2026`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');

    const data = result.data;
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('totalRentIncome');
    expect(data).toHaveProperty('totalUtilityIncome');
    expect(data).toHaveProperty('totalIncome');
    expect(data).toHaveProperty('totalExpense');
    expect(data).toHaveProperty('netProfit');
  });

  test('11. 收支统计接口 - 年份参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/income-report/2026`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.year).toBe(2026);
  });

  test('12. 收支统计接口 - 数据逻辑验证', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/income-report/2026`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证总收入 = 租金收入 + 水电费收入
    expect(data.totalIncome).toBe(data.totalRentIncome + data.totalUtilityIncome);

    // 验证净利润 = 总收入 - 总支出
    expect(data.netProfit).toBe(data.totalIncome - data.totalExpense);
  });

  test('13. 收支统计接口 - 包含月度明细', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/income-report/2026`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证包含月度明细
    expect(data).toHaveProperty('monthlyDetails');
    expect(Array.isArray(data.monthlyDetails)).toBe(true);

    // 如果有数据，验证月度明细结构
    if (data.monthlyDetails.length > 0) {
      const firstMonth = data.monthlyDetails[0];
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('monthText');
      expect(firstMonth).toHaveProperty('rentIncome');
      expect(firstMonth).toHaveProperty('utilityIncome');
      expect(firstMonth).toHaveProperty('totalIncome');
      expect(firstMonth).toHaveProperty('expense');
      expect(firstMonth).toHaveProperty('netProfit');
    }
  });

  // ==================== 催收统计接口测试 ====================

  test('14. 催收统计接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/collection-report/2026/0`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result).toHaveProperty('data');

    const data = result.data;
    expect(data).toHaveProperty('year');
    expect(data).toHaveProperty('month');
    expect(data).toHaveProperty('totalBills');
    expect(data).toHaveProperty('totalAmount');
    expect(data).toHaveProperty('paidBills');
    expect(data).toHaveProperty('paidAmount');
    expect(data).toHaveProperty('pendingBills');
    expect(data).toHaveProperty('pendingAmount');
    expect(data).toHaveProperty('overdueBills');
    expect(data).toHaveProperty('overdueAmount');
    expect(data).toHaveProperty('graceBills');
    expect(data).toHaveProperty('graceAmount');
    expect(data).toHaveProperty('collectionRate');
  });

  test('15. 催收统计接口 - 年月参数', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/collection-report/2026/3`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.year).toBe(2026);
    expect(result.data.month).toBe(3);
  });

  test('16. 催收统计接口 - 收款率计算', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/collection-report/2026/0`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证收款率范围
    expect(data.collectionRate).toBeGreaterThanOrEqual(0);
    expect(data.collectionRate).toBeLessThanOrEqual(100);
  });

  test('17. 催收统计接口 - 包含逾期和宽限名单', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/collection-report/2026/0`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    const data = result.data;

    // 验证包含逾期名单
    expect(data).toHaveProperty('overdueList');
    expect(Array.isArray(data.overdueList)).toBe(true);

    // 验证包含宽限名单
    expect(data).toHaveProperty('graceList');
    expect(Array.isArray(data.graceList)).toBe(true);

    // 如果有逾期数据，验证结构
    if (data.overdueList.length > 0) {
      const firstOverdue = data.overdueList[0];
      expect(firstOverdue).toHaveProperty('billId');
      expect(firstOverdue).toHaveProperty('tenantName');
      expect(firstOverdue).toHaveProperty('roomInfo');
      expect(firstOverdue).toHaveProperty('overdueDays');
    }
  });

  // ==================== 参数验证测试 ====================

  test('18. 利润排行接口 - 无效 limit 参数', async ({ request }) => {
    // 使用无效的 limit（负数），框架会处理
    const response = await request.get(`${API_BASE}/api/report-app/profit-ranking/monthly/0`, {
      headers: authHeaders(authToken)
    });

    // 应该返回 200（使用默认值或空列表）
    expect(response.status()).toBe(200);
  });

  test('19. 收支统计接口 - 无效年份参数', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/report-app/income-report/invalid`,
      { headers: authHeaders(authToken) }
    );

    // Furion 框架会将无法转换的参数使用默认值，返回 200
    // 或者返回 400/404 取决于框架配置
    expect([200, 400, 404]).toContain(response.status());
  });

  test('20. 催收统计接口 - 仅年份参数（月份为0表示全年）', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/collection-report/2026/0`, {
      headers: authHeaders(authToken)
    });

    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result.succeeded).toBe(true);
    expect(result.data.year).toBe(2026);
    expect(result.data.month).toBe(0); // 未指定月份时为 0
  });
});
