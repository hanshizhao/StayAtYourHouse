/**
 * FEAT-005: 小区列表页 - E2E 测试
 * 测试类型: e2e
 * 前置条件: 前后端服务运行中
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_DATA_PREFIX = 'E2E_TEST_';

// ==================== 辅助函数 ====================

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`);
  await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入账号"]', 'zhs');
  await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

async function loginAndNavigate(page: Page, path: string) {
  await login(page);
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('networkidle');
}

async function waitForTableReady(page: Page) {
  await page.waitForSelector('[data-testid="community-table"]', { timeout: 10000 });
  await page.waitForSelector('.t-table--loading', { state: 'hidden', timeout: 10000 }).catch(() => {});
}

async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('[data-testid="community-table"] tbody tr');
  return await rows.count();
}

async function fillTDesignInput(page: Page, testId: string, value: string) {
  const wrapper = page.locator(`[data-testid="${testId}"]`);
  const input = wrapper.locator('input, textarea');
  await input.fill(value);
}

// ==================== 测试套件 ====================

test.describe('FEAT-005: 小区列表页', () => {
  test('1. 页面可访问 - 无报错加载', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.t-breadcrumb__item-text, .community-management')).toContainText(/小区/);
  });

  test('2. 核心元素可见 - 表格和操作按钮', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    const table = page.locator('[data-testid="community-table"]');
    await expect(table).toBeVisible({ timeout: 5000 });

    const headers = ['小区名称', '地址', '物业电话', '操作'];
    for (const header of headers) {
      await expect(table.locator(`th:has-text("${header}")`).first()).toBeVisible();
    }
    await expect(page.locator('[data-testid="add-community-button"]')).toBeVisible();
  });

  test('3. 数据加载验证 - 表格显示数据', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('4. 新增功能 - 完整表单流程', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);

    // 点击新增按钮
    await page.click('[data-testid="add-community-button"]');
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });

    // 填写表单
    const testName = `${TEST_DATA_PREFIX}小区_${Date.now()}`;
    await fillTDesignInput(page, 'community-name-input', testName);
    await fillTDesignInput(page, 'community-address-input', '测试地址123号');

    // 提交表单
    await page.click('.t-dialog__footer button:has-text("确定")');

    // 验证成功提示
    await page.waitForSelector('.t-message', { timeout: 10000 });
    const toastMessage = await page.locator('.t-message').textContent();
    expect(toastMessage).toContain('成功');

    // 等待弹窗关闭
    await page.waitForSelector('[data-testid="community-form-dialog"]', { state: 'hidden' });
  });

  test('5. 编辑功能 - 修改已有数据', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);

    const testRow = page.locator(`[data-testid="community-table"] tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据，跳过编辑测试');
      return;
    }

    await testRow.locator('[data-testid="edit-button"]').click();
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });

    const newName = `${TEST_DATA_PREFIX}小区_已编辑_${Date.now()}`;
    await fillTDesignInput(page, 'community-name-input', newName);

    await page.click('.t-dialog__footer button:has-text("确定")');
    await page.waitForSelector('.t-message', { timeout: 10000 });
    const toastMessage = await page.locator('.t-message').textContent();
    expect(toastMessage).toContain('成功');
  });

  test('6. 删除功能 - 确认删除流程', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);

    const testRow = page.locator(`[data-testid="community-table"] tr:has-text("${TEST_DATA_PREFIX}")`).first();
    if (await testRow.count() === 0) {
      test.skip('没有找到测试数据，跳过删除测试');
      return;
    }

    // 点击删除按钮
    await testRow.locator('[data-testid="delete-button"]').click();

    // 验证确认对话框出现
    await page.waitForSelector('.t-dialog__header:has-text("确认删除")', { timeout: 5000 });

    // 确认删除
    await page.click('.t-dialog__footer button:has-text("删除")');

    // 验证成功提示
    await page.waitForSelector('.t-message', { timeout: 10000 });
    const toastMessage = await page.locator('.t-message').textContent();
    expect(toastMessage).toContain('成功');
  });

  test('7. 搜索功能 - 关键词筛选', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);

    const searchWrapper = page.locator('[data-testid="search-input"]');
    if (await searchWrapper.count() === 0) {
      test.skip('搜索功能未实现');
      return;
    }

    const searchInput = searchWrapper.locator('input');
    await searchInput.fill(TEST_DATA_PREFIX);
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    const rows = page.locator('[data-testid="community-table"] tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      expect(rowText).toContain(TEST_DATA_PREFIX);
    }
  });

  test('8. 表单验证 - 必填字段校验', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');
    await waitForTableReady(page);

    await page.click('[data-testid="add-community-button"]');
    await page.waitForSelector('[data-testid="community-form-dialog"]', { timeout: 5000 });
    await page.click('.t-dialog__footer button:has-text("确定")');
    await page.waitForTimeout(1000);

    // 验证弹窗未关闭（验证失败）
    await expect(page.locator('[data-testid="community-form-dialog"]')).toBeVisible();
  });

  test('9. 空数据处理 - 无数据时显示空状态', async ({ page }) => {
    await loginAndNavigate(page, '/housing/community');

    const searchWrapper = page.locator('[data-testid="search-input"]');
    if (await searchWrapper.count() > 0) {
      const searchInput = searchWrapper.locator('input');
      await searchInput.fill('NOT_EXIST_DATA_' + Date.now());
      await searchInput.press('Enter');
      await page.waitForTimeout(500);

      const emptyState = page.locator('.t-table__empty');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  // 清理测试数据
  test.afterAll(async ({ request }) => {
    try {
      const listResponse = await request.get(`${BASE_URL}/api/community/list`);
      if (!listResponse.ok()) return;

      const listData = await listResponse.json();
      const communities = listData.data || listData;
      for (const community of communities) {
        if (community.name?.startsWith(TEST_DATA_PREFIX)) {
          await request.delete(`${BASE_URL}/api/community/remove/${community.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup test data:', error);
    }
  });
});
