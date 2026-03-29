/**
 * FEAT-063: 创建待办类型枚举 TodoType - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-063: 创建待办类型枚举 TodoType', () => {
  const projectRoot = path.join(__dirname, '../../');
  const enumPath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Todo/TodoType.cs');

  test('1. 检查枚举文件存在', async () => {
    expect(fs.existsSync(enumPath)).toBeTruthy();
  });

  test('2. 验证枚举内容', async () => {
    const content = fs.readFileSync(enumPath, 'utf-8');
    expect(content).toContain('enum TodoType');
    expect(content).toContain('Utility = 0');
    expect(content).toContain('Rental = 1');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
