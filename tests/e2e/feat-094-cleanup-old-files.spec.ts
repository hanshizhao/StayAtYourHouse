/**
 * FEAT-094: 清理旧文件和路由 - E2E 测试
 * ✅ 适用于：前端页面路由验证
 * ⚠️ 强制要求：必须验证旧路由已移除
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-094: 清理旧文件和路由', () => {
  const projectRoot = path.join(__dirname, '../../');

  test('1. TDesign 示例组件已删除', () => {
    const files = [
      'Hans/src/pages/dashboard/base/components/TopPanel.vue',
      'Hans/src/pages/dashboard/base/components/MiddleChart.vue',
      'Hans/src/pages/dashboard/base/components/RankList.vue',
      'Hans/src/pages/dashboard/base/components/OutputOverview.vue',
      'Hans/src/pages/dashboard/base/constants.ts',
      'Hans/src/pages/dashboard/base/index.ts',
    ];
    for (const file of files) {
      expect(fs.existsSync(path.join(projectRoot, file))).toBeFalsy();
    }
  });

  test('2. 房源报表页面已删除', () => {
    const housingDir = path.join(projectRoot, 'Hans/src/pages/report/housing');
    expect(fs.existsSync(housingDir)).toBeFalsy();
  });

  test('3. 路由文件不包含 housing 路径', () => {
    const routeFile = path.join(projectRoot, 'Hans/src/router/modules/report.ts');
    const content = fs.readFileSync(routeFile, 'utf-8');
    expect(content).not.toContain('housing');
  });

  test('4. Dashboard 页面正常访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/dashboard/base`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });
});
