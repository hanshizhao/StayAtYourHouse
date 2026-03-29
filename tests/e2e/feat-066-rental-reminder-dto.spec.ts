/**
 * FEAT-066: 创建 RentalReminderDto - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-066: 创建 RentalReminderDto', () => {
  const projectRoot = path.join(__dirname, '../../');
  const dtoPath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Rental/RentalReminderDto.cs');

  test('1. 检查 DTO 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('2. 验证属性', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('Id');
    expect(content).toContain('RentalRecordId');
    expect(content).toContain('RoomInfo');
    expect(content).toContain('TenantName');
    expect(content).toContain('MonthlyRent');
    expect(content).toContain('ContractEndDate');
    expect(content).toContain('DeferralCount');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
