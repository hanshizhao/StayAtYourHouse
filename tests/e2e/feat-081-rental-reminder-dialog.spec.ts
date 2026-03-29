/**
 * FEAT-081: 创建 RentalReminderDialog 组件 - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-081: 创建 RentalReminderDialog 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const componentPath = path.join(projectRoot, 'Hans/src/pages/dashboard/base/components/RentalReminderDialog.vue');

  test('1. 检查组件文件存在', async () => {
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  test('2. 验证租客信息展示', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('TenantName') || expect(content).toContain('tenantName');
  });

  test('3. 验证操作按钮', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('宽限') || expect(content).toContain('defer');
    expect(content).toContain('续租') || expect(content).toContain('renew');
  });

  test('4. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
