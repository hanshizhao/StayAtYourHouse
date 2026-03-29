/**
 * FEAT-064: 创建 TodoItemDto - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-064: 创建 TodoItemDto', () => {
  const projectRoot = path.join(__dirname, '../../');
  const dtoPath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Todo/TodoItemDto.cs');

  test('1. 检查 DTO 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('2. 验证公共属性', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('Type');
    expect(content).toContain('Id');
    expect(content).toContain('RoomInfo');
  });

  test('3. 验证水电费字段', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('Amount');
    expect(content).toContain('Period');
    expect(content).toContain('UtilityBill');
  });

  test('4. 验证催收房租字段', async () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('TenantName');
    expect(content).toContain('MonthlyRent');
    expect(content).toContain('RentalReminder');
  });

  test('5. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
