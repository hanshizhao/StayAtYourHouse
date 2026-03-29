/**
 * FEAT-070: 创建 ITodoService 接口 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-070: 创建 ITodoService 接口', () => {
  const projectRoot = path.join(__dirname, '../../');
  const interfacePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/ITodoService.cs');

  test('1. 检查接口文件存在', async () => {
    expect(fs.existsSync(interfacePath)).toBeTruthy();
  });

  test('2. 验证接口定义', async () => {
    const content = fs.readFileSync(interfacePath, 'utf-8');
    expect(content).toContain('interface ITodoService');
    expect(content).toContain('GetTodoListAsync');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
