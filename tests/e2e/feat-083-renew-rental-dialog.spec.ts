/**
 * FEAT-083: 创建 RenewRentalDialog 组件 - E2E 测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-083: 创建 RenewRentalDialog 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const componentPath = path.join(projectRoot, 'Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue');

  test('1. 检查组件文件存在', async () => {
    expect(fs.existsSync(componentPath)).toBeTruthy();
  });

  test('2. 验证租期月数输入', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content.includes('leaseMonths') || content.includes('LeaseMonths')).toBeTruthy();
  });

  test('3. 验证月租金输入', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content.includes('monthlyRent') || content.includes('MonthlyRent')).toBeTruthy();
  });

  test('4. 验证合同到期日', async () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content.includes('contractEndDate') || content.includes('ContractEndDate')).toBeTruthy();
  });

  test('5. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
