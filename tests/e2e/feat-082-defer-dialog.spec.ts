/**
 * FEAT-082: 创建 DeferDialog 组件 - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-082: 创建 DeferDialog 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const componentPath = path.join(projectRoot, 'Hans/src/pages/dashboard/base/components/DeferDialog.vue');

  test('1. 检查组件文件存在', async () => {
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  test('2. 验证日期选择器', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('t-date-picker') || expect(content).toContain('DatePicker');
  });

  test('3. 验证备注输入', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('remark') || expect(content).toContain('Remark') || expect(content).toContain('备注');
  });

  test('4. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
