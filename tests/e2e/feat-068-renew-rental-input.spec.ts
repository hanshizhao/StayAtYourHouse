/**
 * FEAT-068: 创建 RenewRentalInput - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-068: 创建 RenewRentalInput', () => {
  const projectRoot = path.join(__dirname, '../../');
  const dtoPath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Rental/RenewRentalInput.cs');

  test('1. 检查 DTO 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('2. 验证属性', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('LeaseType');
    expect(content).toContain('MonthlyRent');
    expect(content).toContain('ContractEndDate');
    expect(content).toContain('ContractImage');
    expect(content).toContain('Remark');
    expect(content).toContain('Required');
    expect(content).toContain('Range');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
