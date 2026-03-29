/**
 * FEAT-085: 后端单元测试 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-085: 后端单元测试', () => {
  const projectRoot = path.join(__dirname, '../../');
  const testsPath = path.join(projectRoot, 'Gentle/Gentle.Tests/Services/TodoServiceTests.cs');

  test('1. 检查测试文件存在', async () => {
    expect(fs.existsSync(testsPath)).toBeTruthy();
  });

  test('2. 验证测试类定义', async () => {
    const content = fs.readFileSync(testsPath, 'utf-8');
    expect(content).toContain('TodoServiceTests');
  });

  test('3. 验证测试方法', async () => {
    const content = fs.readFileSync(testsPath, 'utf-8');
    expect(content).toContain('[Fact]');
    expect(content).toContain('GetTodoListAsync');
  });

  test('4. 验证后端测试编译', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
