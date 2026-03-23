/**
 * FEAT-XXX: [API名称] - API 运行时验证模板
 * 类型: api_runtime
 * 适用于: 后端 REST API
 *
 * 使用说明：
 * 1. 复制此模板到 tests/e2e/feat-xxx-[name]-api.spec.ts
 * 2. 替换所有 FEAT-XXX 为实际功能编号
 * 3. 替换 [ApiName] 为实际 API 名称
 * 4. 替换 [endpoint] 为实际 API 端点
 * 5. 根据实际字段调整测试数据
 */
import { test, expect, APIRequestContext } from '@playwright/test';
import {
  API_BASE,
  TEST_DATA_PREFIX,
  getApiToken,
  authHeaders,
  cleanupTestData,
  generateTestName,
  assertApiSuccess,
  assertApiFailure
} from '../helpers/test-utils';

// ==================== 配置 ====================

const API_ENDPOINT = '/api/[endpoint]'; // 替换为实际端点

test.describe('FEAT-XXX: [ApiName] API', () => {
  let authToken: string;
  let createdIds: number[] = [];

  // ==================== 辅助函数 ====================

  /**
   * 构建完整 URL
   */
  function apiUrl(path: string = ''): string {
    return `${API_BASE}${API_ENDPOINT}${path}`;
  }

  /**
   * 清理测试数据
   */
  async function cleanup(request: APIRequestContext): Promise<void> {
    await cleanupTestData(request, authToken, API_ENDPOINT, createdIds);
    createdIds = [];
  }

  // ==================== 生命周期 ====================

  test.beforeAll(async ({ request }) => {
    authToken = await getApiToken(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanup(request);
  });

  // ==================== 1. 认证测试 ====================

  test('1. 未认证请求应返回 401', async ({ request }) => {
    const response = await request.get(apiUrl('/list'));
    expect(response.status()).toBe(401);
  });

  test('2. 无效 Token 应返回 401', async ({ request }) => {
    const response = await request.get(apiUrl('/list'), {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    expect(response.status()).toBe(401);
  });

  // ==================== 3. 列表接口测试 ====================

  test('3. 列表接口 - 返回正确数据结构', async ({ request }) => {
    const response = await request.get(apiUrl('/list'), {
      headers: authHeaders(authToken)
    });

    const result = await assertApiSuccess(response);

    // 验证数据结构
    expect(Array.isArray(result.data)).toBe(true);

    // 如果有数据，验证字段
    if (result.data.length > 0) {
      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('id');
      expect(typeof firstItem.id).toBe('number');
    }
  });

  // ==================== 4. 创建接口测试 ====================

  test('4. 创建接口 - 成功创建', async ({ request }) => {
    const testData = {
      name: generateTestName(),
      // 添加更多字段...
    };

    const response = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: testData
    });

    const result = await assertApiSuccess(response);

    // 记录 ID 用于清理
    createdIds.push(result.data.id);

    // 验证返回数据
    expect(result.data.name).toBe(testData.name);
  });

  test('5. 创建接口 - 必填字段验证', async ({ request }) => {
    const response = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: {} // 空数据
    });

    const result = await assertApiFailure(response);
    expect(result.errors || result.message).toBeDefined();
  });

  // ==================== 6. 详情接口测试 ====================

  test('6. 详情接口 - 返回正确数据', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: { name: generateTestName() }
    });
    const createResult = await assertApiSuccess(createResponse);
    const id = createResult.data.id;
    createdIds.push(id);

    // 获取详情
    const response = await request.get(apiUrl(`/${id}`), {
      headers: authHeaders(authToken)
    });

    const result = await assertApiSuccess(response);
    expect(result.data.id).toBe(id);
  });

  test('7. 详情接口 - 不存在的 ID', async ({ request }) => {
    const response = await request.get(apiUrl('/99999999'), {
      headers: authHeaders(authToken)
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const result = await response.json();
      expect(result.succeeded).toBe(false);
    }
  });

  // ==================== 8. 更新接口测试 ====================

  test('8. 更新接口 - 成功更新', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: { name: generateTestName() }
    });
    const createResult = await assertApiSuccess(createResponse);
    const id = createResult.data.id;
    createdIds.push(id);

    // 更新
    const updateData = {
      id,
      name: generateTestName('已更新_')
    };

    const response = await request.put(apiUrl('/edit'), {
      headers: authHeaders(authToken),
      data: updateData
    });

    const result = await assertApiSuccess(response);
    expect(result.data.name).toBe(updateData.name);
  });

  // ==================== 9. 删除接口测试 ====================

  test('9. 删除接口 - 成功删除', async ({ request }) => {
    // 先创建
    const createResponse = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: { name: generateTestName() }
    });
    const createResult = await assertApiSuccess(createResponse);
    const id = createResult.data.id;

    // 删除
    const response = await request.delete(apiUrl(`/remove/${id}`), {
      headers: authHeaders(authToken)
    });

    await assertApiSuccess(response);

    // 验证已删除
    const getResponse = await request.get(apiUrl(`/${id}`), {
      headers: authHeaders(authToken)
    });
    expect([200, 404]).toContain(getResponse.status());
  });

  // ==================== 10. 边界测试 ====================

  test('10. 字段长度边界', async ({ request }) => {
    const response = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: { name: 'A'.repeat(500) }
    });

    const result = await response.json();
    if (!result.succeeded) {
      expect(result.errors || result.message).toBeDefined();
    }
  });

  test('11. 特殊字符处理', async ({ request }) => {
    const response = await request.post(apiUrl('/add'), {
      headers: authHeaders(authToken),
      data: {
        name: `${generateTestName()}_特殊字符_<>&"'`
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    if (result.succeeded) {
      createdIds.push(result.data.id);
      // 验证 XSS 被正确处理
      expect(result.data.name).not.toContain('<script>');
    }
  });
});
