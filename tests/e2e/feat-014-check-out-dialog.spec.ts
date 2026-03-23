/**
 * FEAT-014: 退租弹窗 - E2E 测试
 * 类型: e2e
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-014: 退租弹窗', () => {
  async function loginAndNavigate(page: any, targetPath: string) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  test('1. 弹窗组件存在', async ({ page }) => {
    // 验证组件文件存在
    const componentPath = 'Hans/src/pages/tenant/components/CheckOutDialog.vue';
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../', componentPath);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });
});
