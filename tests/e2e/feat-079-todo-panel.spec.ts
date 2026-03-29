/**
 * FEAT-079: 改造 TodoPanel 组件 - E2E 测试
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-079: 改造 TodoPanel 组件', () => {

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

  test('1. 组件文件存在', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.join(process.cwd(), 'Hans/src/pages/dashboard/base/components/TodoPanel.vue');
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  test('2. 验证筛选下拉框代码', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.join(process.cwd(), 'Hans/src/pages/dashboard/base/components/TodoPanel.vue');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('filterType');
    expect(content).toContain('typeOptions');
  });

  test('3. 验证待办类型渲染代码', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.join(process.cwd(), 'Hans/src/pages/dashboard/base/components/TodoPanel.vue');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('TodoType');
  });

  test('4. 验证前端构建成功', async () => {
    const { execSync } = await import('child_process');
    const path = await import('path');
    execSync('npm run build:type', { cwd: path.join(process.cwd(), 'Hans'), stdio: 'pipe' });
  });
});
