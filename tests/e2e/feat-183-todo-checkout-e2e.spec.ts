/**
 * FEAT-183: 端到端验证：待办面板退租操作完整流程
 * 类型: e2e
 *
 * 验收标准:
 * 1. 现有退租流程不受影响（租客列表→退租弹窗）
 * 2. 待办面板退租新流程正常工作（催收待办→退租按钮→退租弹窗）
 * 3. npm run build 构建成功
 *
 * 测试分两层:
 * - 静态验证（始终执行）：构建 + 代码结构检查
 * - 浏览器验证（需全栈环境）：前端 + 后端同时运行时执行
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_URL = process.env.API_URL || 'http://localhost:5000';
const USERNAME = process.env.E2E_USERNAME || 'zhs';
const PASSWORD = process.env.E2E_PASSWORD;

if (!PASSWORD) {
  throw new Error('E2E_PASSWORD 环境变量未设置，请通过环境变量提供测试密码');
}

const projectRoot = path.join(__dirname, '../../');

// ==================== 辅助函数 ====================

async function isBackendAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_URL}/`, { timeout: 3000 });
    return response.status() > 0;
  } catch {
    return false;
  }
}

async function isFrontendAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(BASE_URL, { timeout: 3000 });
    return response.ok();
  } catch {
    return false;
  }
}

async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder*="账号"]', { timeout: 10000 });
  await page.fill('input[placeholder*="账号"]', USERNAME);
  await page.fill('input[placeholder*="密码"]', PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function navigateToTenantList(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/tenant/list`);
  await page.waitForLoadState('networkidle');
}

async function navigateToDashboard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/dashboard/base`);
  await page.waitForLoadState('networkidle');
}

async function skipIfServicesUnavailable(request: APIRequestContext): Promise<void> {
  const frontendOk = await isFrontendAvailable(request);
  const backendOk = await isBackendAvailable(request);
  test.skip(!frontendOk || !backendOk, '前端或后端服务不可用，跳过浏览器测试');
}

// ==================== Step 1: 构建验证 + 现有退租流程 ====================

test.describe('Step 1: 构建验证 + 现有退租流程不受影响', () => {
  test('1.1 前端构建成功 (npm run build)', async () => {
    execSync('npm run build', {
      cwd: path.join(projectRoot, 'Hans'),
      stdio: 'pipe',
      timeout: 120000,
    });
  });

  test('1.2 CheckOutDialog 组件文件存在且包含 rentalRecordId 支持', async () => {
    const componentPath = path.join(
      projectRoot,
      'Hans/src/pages/tenant/components/CheckOutDialog.vue',
    );
    expect(fs.existsSync(componentPath)).toBeTruthy();

    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('rentalRecordId');
    expect(content).toContain('effectiveTenant');
    expect(content).toContain('getTenantById');
    expect(content).toContain('resolvedTenant');
  });

  test('1.3 RentalReminderDialog 包含退租按钮和 CheckOutDialog', async () => {
    const componentPath = path.join(
      projectRoot,
      'Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue',
    );
    expect(fs.existsSync(componentPath)).toBeTruthy();

    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('handleCheckOut');
    expect(content).toContain('checkOutDialogVisible');
    expect(content).toContain('CheckOutDialog');
    expect(content).toContain('data-testid="btn-checkout"');
    expect(content).toMatch(/:rental-record-id/);
  });

  test('1.4 CheckOutDialog 正确导入和使用各模块', async () => {
    const componentPath = path.join(
      projectRoot,
      'Hans/src/pages/tenant/components/CheckOutDialog.vue',
    );
    const content = fs.readFileSync(componentPath, 'utf-8');

    // Props 接口包含 rentalRecordId
    expect(content).toMatch(/rentalRecordId\??\s*:\s*number/);

    // watch 处理 rentalRecordId 入口
    expect(content).toMatch(/props\.rentalRecordId/);

    // submit 使用 effectiveTenant 获取 rentalRecordId
    expect(content).toContain('effectiveTenant.value?.rentalRecordId');

    // handleClose 清理 resolvedTenant
    expect(content).toMatch(/resolvedTenant\.value\s*=\s*null/);
  });

  test('1.5 RentalReminderDialog 正确传入 rentalRecordId', async () => {
    const componentPath = path.join(
      projectRoot,
      'Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue',
    );
    const content = fs.readFileSync(componentPath, 'utf-8');

    // CheckOutDialog 传入 :tenant="null" 和 :rental-record-id
    expect(content).toContain(':tenant="null"');
    expect(content).toContain('rentalReminder?.rentalRecordId');
    expect(content).toContain('handleCheckOutSuccess');
  });

  test('1.6 现有退租流程 - 租客列表页可访问', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToTenantList(page);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('1.7 现有退租流程 - 在租租客显示退租按钮', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToTenantList(page);
    await page.waitForSelector('.t-table tbody tr', { timeout: 10000 });

    const activeRow = page.locator('.t-table tbody tr:has-text("在租")');
    const rowCount = await activeRow.count();
    test.skip(rowCount === 0, '没有在租租客数据，跳过此测试');

    const checkOutButton = activeRow.first().locator('[data-testid="checkout-button"]');
    await expect(checkOutButton).toBeVisible();
  });

  test('1.8 现有退租流程 - 点击退租按钮打开弹窗', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToTenantList(page);
    await page.waitForSelector('.t-table tbody tr', { timeout: 10000 });

    const activeRow = page.locator('.t-table tbody tr:has-text("在租")');
    const rowCount = await activeRow.count();
    test.skip(rowCount === 0, '没有在租租客数据，跳过此测试');

    const checkOutButton = activeRow.first().locator('[data-testid="checkout-button"]');
    const btnCount = await checkOutButton.count();
    test.skip(btnCount === 0, '退租按钮不存在，跳过此测试');

    await checkOutButton.click();
    const dialog = page.locator('[data-testid="checkout-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

// ==================== Step 2: 待办面板退租新流程 ====================

test.describe('Step 2: 待办面板退租新流程', () => {
  test('2.1 首页待办区域可访问', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('2.2 催收待办项可见', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);

    const todoSection = page.locator(
      '[data-testid="todo-section"], .todo-section, .dashboard-card:has-text("待办")',
    );
    await expect(todoSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('2.3 点击催收待办打开 RentalReminderDialog', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);

    const rentalTodo = page.locator(
      '[data-testid="todo-item"]:has-text("催收"), .todo-item:has-text("催收"), [data-testid="todo-item"]:has-text("租金"), .todo-item:has-text("租金")',
    );
    const todoCount = await rentalTodo.count();
    test.skip(todoCount === 0, '没有催收待办数据，跳过此测试');

    await rentalTodo.first().click();
    const reminderDialog = page.locator('[data-testid="rental-reminder-dialog"]');
    await expect(reminderDialog).toBeVisible({ timeout: 5000 });
  });

  test('2.4 RentalReminderDialog 中退租按钮可见', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);

    const rentalTodo = page.locator(
      '[data-testid="todo-item"]:has-text("催收"), .todo-item:has-text("催收"), [data-testid="todo-item"]:has-text("租金"), .todo-item:has-text("租金")',
    );
    const todoCount = await rentalTodo.count();
    test.skip(todoCount === 0, '没有催收待办数据，跳过此测试');

    await rentalTodo.first().click();
    const reminderDialog = page.locator('[data-testid="rental-reminder-dialog"]');
    await expect(reminderDialog).toBeVisible({ timeout: 5000 });

    const checkOutBtn = page.locator('[data-testid="btn-checkout"]');
    await expect(checkOutBtn).toBeVisible();
  });

  test('2.5 点击退租按钮打开 CheckOutDialog', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);

    const rentalTodo = page.locator(
      '[data-testid="todo-item"]:has-text("催收"), .todo-item:has-text("催收"), [data-testid="todo-item"]:has-text("租金"), .todo-item:has-text("租金")',
    );
    const todoCount = await rentalTodo.count();
    test.skip(todoCount === 0, '没有催收待办数据，跳过此测试');

    await rentalTodo.first().click();
    const reminderDialog = page.locator('[data-testid="rental-reminder-dialog"]');
    await expect(reminderDialog).toBeVisible({ timeout: 5000 });

    const checkOutBtn = page.locator('[data-testid="btn-checkout"]');
    await expect(checkOutBtn).toBeVisible();
    await checkOutBtn.click();

    const checkOutDialog = page.locator('[data-testid="checkout-dialog"]');
    await expect(checkOutDialog).toBeVisible({ timeout: 5000 });
  });

  test('2.6 CheckOutDialog 通过 rentalRecordId 正确加载数据', async ({ page, request }) => {
    await skipIfServicesUnavailable(request);
    await login(page);
    await navigateToDashboard(page);

    const rentalTodo = page.locator(
      '[data-testid="todo-item"]:has-text("催收"), .todo-item:has-text("催收"), [data-testid="todo-item"]:has-text("租金"), .todo-item:has-text("租金")',
    );
    const todoCount = await rentalTodo.count();
    test.skip(todoCount === 0, '没有催收待办数据，跳过此测试');

    await rentalTodo.first().click();
    const reminderDialog = page.locator('[data-testid="rental-reminder-dialog"]');
    await expect(reminderDialog).toBeVisible({ timeout: 5000 });

    const checkOutBtn = page.locator('[data-testid="btn-checkout"]');
    await expect(checkOutBtn).toBeVisible();
    await checkOutBtn.click();

    const checkOutDialog = page.locator('[data-testid="checkout-dialog"]');
    await expect(checkOutDialog).toBeVisible({ timeout: 5000 });

    const tenantInfo = page.locator('[data-testid="tenant-info"]');
    await expect(tenantInfo).toBeVisible({ timeout: 5000 });
    const text = await tenantInfo.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });
});
