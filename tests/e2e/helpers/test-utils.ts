/**
 * E2E 测试工具函数
 * 提供通用的测试辅助功能
 */
import { Page, APIRequestContext, expect } from "@playwright/test";

export const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
export const API_BASE = process.env.API_BASE || "http://localhost:5000";
export const TEST_DATA_PREFIX = "E2E_TEST_";

// 测试账号凭据
export const TEST_CREDENTIALS = {
  username: process.env.TEST_ADMIN_USER || "zhs",
  password: process.env.TEST_ADMIN_PASS || "gentle8023",
};

// ==================== 认证相关 ====================

/**
 * 登录并导航到目标页面
 */
export async function loginAndNavigate(
  page: Page,
  targetPath: string,
  credentials: { username: string; password: string } = TEST_CREDENTIALS,
): Promise<void> {
  await page.goto(`${BASE_URL}/auth/sign-in`);

  // 等待登录表单加载
  await page.waitForSelector(
    '[data-testid="username-input"], input[placeholder*="用户名"]',
    {
      timeout: 10000,
    },
  );

  // 填写凭据
  const usernameInput =
    page.locator('[data-testid="username-input"]').first() ||
    page.locator('input[placeholder*="用户名"]').first();
  const passwordInput =
    page.locator('[data-testid="password-input"]').first() ||
    page.locator('input[placeholder*="密码"]').first();
  const submitButton =
    page.locator('[data-testid="login-button"]').first() ||
    page.locator('button[type="submit"]').first();

  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);
  await submitButton.click();

  // 等待登录成功
  await page.waitForURL(/dashboard/, { timeout: 15000 });

  // 导航到目标页面
  await page.goto(`${BASE_URL}${targetPath}`);
  await page.waitForLoadState("networkidle");
}

/**
 * 获取 API 认证 Token
 */
export async function getApiToken(
  request: APIRequestContext,
  credentials: { username: string; password: string } = TEST_CREDENTIALS,
): Promise<string> {
  const response = await request.post(`${API_BASE}/api/auth/login`, {
    data: credentials,
  });

  expect(response.status()).toBe(200);

  const result = await response.json();
  expect(result.succeeded).toBe(true);

  return result.data.accessToken;
}

/**
 * 创建认证请求头
 */
export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ==================== 控制台错误追踪 ====================

/**
 * 设置控制台错误追踪器
 */
export function setupConsoleErrorTracker(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * 过滤关键错误（排除非关键警告）
 */
export function getCriticalErrors(errors: string[]): string[] {
  const ignorePatterns = [
    "favicon",
    "Warning:",
    "[HMR]",
    "DevTools",
    "chrome-extension",
    "ResizeObserver",
  ];

  return errors.filter(
    (e) => !ignorePatterns.some((pattern) => e.includes(pattern)),
  );
}

// ==================== 表格操作 ====================

/**
 * 等待表格加载完成
 */
export async function waitForTableReady(
  page: Page,
  tableSelector: string = '[data-testid="data-table"]',
): Promise<void> {
  // 等待表格出现
  await page.waitForSelector(tableSelector, { timeout: 10000 });

  // 等待加载状态消失
  const loadingSelector = '[data-testid="table-loading"], .t-loading';
  const loading = page.locator(loadingSelector);
  if ((await loading.count()) > 0) {
    await loading.waitFor({ state: "hidden", timeout: 10000 });
  }
}

/**
 * 获取表格行数
 */
export async function getTableRowCount(
  page: Page,
  tableSelector: string = '[data-testid="data-table"]',
): Promise<number> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  return await rows.count();
}

/**
 * 获取指定行的单元格文本
 */
export async function getCellText(
  page: Page,
  rowIndex: number,
  columnIndex: number,
  tableSelector: string = '[data-testid="data-table"]',
): Promise<string> {
  const cell = page
    .locator(`${tableSelector} tbody tr`)
    .nth(rowIndex)
    .locator("td")
    .nth(columnIndex);
  return (await cell.textContent()) || "";
}

// ==================== 表单操作 ====================

/**
 * 填写表单字段
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>,
): Promise<void> {
  for (const [testId, value] of Object.entries(fields)) {
    const input = page.locator(`[data-testid="${testId}"]`);
    await input.fill(value);
  }
}

/**
 * 等待弹窗出现
 */
export async function waitForDialog(
  page: Page,
  dialogSelector: string = '[data-testid="form-dialog"]',
): Promise<void> {
  await page.waitForSelector(dialogSelector, { timeout: 5000 });
}

/**
 * 等待弹窗关闭
 */
export async function waitForDialogClose(
  page: Page,
  dialogSelector: string = '[data-testid="form-dialog"]',
): Promise<void> {
  await page.waitForSelector(dialogSelector, {
    state: "hidden",
    timeout: 5000,
  });
}

// ==================== Toast 消息 ====================

/**
 * 等待成功 Toast
 */
export async function waitForSuccessToast(
  page: Page,
  timeout = 10000,
): Promise<string> {
  const toastSelectors = [
    '[data-testid="success-toast"]',
    '[data-sonner-toast][data-type="success"]',
    ".t-message--success",
    ".t-notification--success",
  ];

  for (const selector of toastSelectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return (await page.locator(selector).textContent()) || "";
    } catch {
      continue;
    }
  }

  throw new Error("Success toast not found within timeout");
}

/**
 * 等待错误 Toast
 */
export async function waitForErrorToast(
  page: Page,
  timeout = 10000,
): Promise<string> {
  const toastSelectors = [
    '[data-testid="error-toast"]',
    '[data-sonner-toast][data-type="error"]',
    ".t-message--error",
    ".t-notification--error",
  ];

  for (const selector of toastSelectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return (await page.locator(selector).textContent()) || "";
    } catch {
      continue;
    }
  }

  throw new Error("Error toast not found within timeout");
}

// ==================== 数据生成 ====================

/**
 * 生成唯一测试名称
 */
export function generateTestName(prefix: string = TEST_DATA_PREFIX): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成测试手机号
 */
export function generateTestPhone(): string {
  return `138${Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")}`;
}

/**
 * 生成测试身份证号（格式正确但非真实）
 */
export function generateTestIdCard(): string {
  const areaCode = "110101"; // 北京市东城区
  const birthDate = "19900101";
  const sequence = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  const checkCode = "X"; // 简化，实际需要计算
  return `${areaCode}${birthDate}${sequence}${checkCode}`;
}

// ==================== API 数据清理 ====================

/**
 * 清理测试数据
 */
export async function cleanupTestData(
  request: APIRequestContext,
  token: string,
  endpoint: string,
  ids: number[],
): Promise<void> {
  for (const id of ids) {
    try {
      await request.delete(`${API_BASE}${endpoint}/${id}`, {
        headers: authHeaders(token),
      });
    } catch {
      // 忽略清理错误
    }
  }
}

// ==================== 断言辅助 ====================

/**
 * 断言 API 响应成功
 */
export async function assertApiSuccess(
  response: {
    status: () => number;
    json: () => Promise<any>;
  },
  expectedStatus = 200,
): Promise<any> {
  expect(response.status()).toBe(expectedStatus);
  const result = await response.json();
  expect(result.succeeded).toBe(true);
  return result;
}

/**
 * 断言 API 响应失败
 */
export async function assertApiFailure(
  response: {
    status: () => number;
    json: () => Promise<any>;
  },
  expectedStatus = 400,
): Promise<any> {
  expect(response.status()).toBe(expectedStatus);
  const result = await response.json();
  expect(result.succeeded).toBe(false);
  return result;
}

/**
 * 断言页面无关键错误
 */
export function assertNoCriticalErrors(consoleErrors: string[]): void {
  const criticalErrors = getCriticalErrors(consoleErrors);
  expect(criticalErrors).toHaveLength(0);
}
