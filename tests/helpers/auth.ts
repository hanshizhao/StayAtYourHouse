/**
 * E2E 测试共享辅助函数
 * 提供认证相关的工具函数
 */
import { Page, APIRequestContext } from '@playwright/test';

/**
 * 环境变量配置
 */
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
export const API_BASE = process.env.API_BASE || 'http://localhost:5000';

/**
 * 测试凭据 - 从环境变量获取，避免硬编码
 */
export const getTestCredentials = () => ({
  username: process.env.TEST_USERNAME || 'zhs',
  password: process.env.TEST_PASSWORD || 'gentle8023',
});

/**
 * 验证测试凭据是否已配置
 */
export const validateTestCredentials = (): void => {
  const { password } = getTestCredentials();
  if (!password) {
    throw new Error('TEST_PASSWORD environment variable is required for E2E tests');
  }
};

/**
 * 登录并导航到目标页面
 * @param page Playwright Page 对象
 * @param targetPath 目标路径（如 /dashboard）
 */
export async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
  const { username, password } = getTestCredentials();
  validateTestCredentials();

  await page.goto(`${BASE_URL}/auth/sign-in`);
  await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
  await page.fill('input[placeholder="请输入账号"]', username);
  await page.fill('input[placeholder="请输入密码"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.goto(`${BASE_URL}${targetPath}`);
  await page.waitForLoadState('networkidle');
}

/**
 * 通过 API 获取管理员 Token
 * @param request Playwright APIRequestContext 对象
 * @returns 认证 Token
 */
export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const { username, password } = getTestCredentials();
  validateTestCredentials();

  const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
    data: { account: username, password },
  });

  if (!loginResponse.ok()) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  const result = await loginResponse.json();

  if (!result.succeeded || !result.data?.token) {
    throw new Error('Login response did not contain expected token');
  }

  return result.data.token;
}

/**
 * 创建认证请求头
 * @param token 认证 Token
 * @returns 包含认证头的请求头对象
 */
export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
