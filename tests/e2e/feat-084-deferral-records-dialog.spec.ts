/**
 * FEAT-084: 创建 DeferralRecordsDialog 组件 - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-084: 创建 DeferralRecordsDialog 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const componentPath = path.join(projectRoot, 'Hans/src/pages/dashboard/base/components/DeferralRecordsDialog.vue');

  test('1. 检查组件文件存在', async () => {
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  test('2. 验证表格组件', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content.includes('t-table') || content.includes('Table')).toBeTruthy();
  });

  test('3. 验证空状态', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content.includes('t-empty') || content.includes('Empty') || content.includes('empty')).toBeTruthy();
  });

  test('4. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
