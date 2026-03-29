/**
 * FEAT-078: 创建 todo.ts API 封装 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-078: 创建 todo.ts API 封装', () => {
  const projectRoot = path.join(__dirname, '../../');
  const apiPath = path.join(projectRoot, 'Hans/src/api/todo.ts');

  test('1. 检查 API 文件存在', async () => {
    expect(fs.existsSync(apiPath)).toBeTruthy();
  });

  test('2. 验证 API 函数', async () => {
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toContain('getTodoList');
    expect(content).toContain('deferReminder');
    expect(content).toContain('renewRental');
    expect(content).toContain('getDeferrals');
  });

  test('3. 验证 API 路径', async () => {
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toContain('/api/todo/list');
    expect(content).toContain('/api/todo/rental-reminder');
  });

  test('4. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
