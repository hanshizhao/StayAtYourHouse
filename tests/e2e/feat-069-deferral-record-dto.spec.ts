/**
 * FEAT-069: 创建 DeferralRecordDto - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-069: 创建 DeferralRecordDto', () => {
  const projectRoot = path.join(__dirname, '../../');
  const dtoPath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Rental/DeferralRecordDto.cs');

  test('1. 检查 DTO 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('2. 验证 DeferralRecordDto 属性', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('Id');
    expect(content).toContain('OriginalReminderDate');
    expect(content).toContain('DeferredToDate');
    expect(content).toContain('Remark');
    expect(content).toContain('CreatedTime');
  });

  test('3. 验证 DeferralListResult 属性', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('DeferralListResult');
    expect(content).toContain('Items');
    expect(content).toContain('Total');
  });

  test('4. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
