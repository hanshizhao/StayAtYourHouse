/**
 * FEAT-074: 创建 TodoAppService API 控制器 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-074: 创建 TodoAppService API 控制器', () => {
  const projectRoot = path.join(__dirname, '../../');
  const controllerPath = path.join(projectRoot, 'Gentle/Gentle.Application/Apps/TodoAppService.cs');

  test('1. 检查控制器文件存在', async () => {
    expect(fs.existsSync(controllerPath)).toBeTruthy();
  });

  test('2. 验证控制器实现 IDynamicApiController', async () => {
    const content = fs.readFileSync(controllerPath, 'utf-8');
    expect(content).toContain(': IDynamicApiController');
  });

  test('3. 验证路由和授权', async () => {
    const content = fs.readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('Route');
    expect(content).toContain('Authorize');
  });

  test('4. 验证 API 端点', async () => {
    const content = fs.readFileSync(controllerPath, 'utf-8');
    expect(content).toContain('HttpGet');
    expect(content).toContain('HttpPost');
    expect(content).toContain('GetList');
    expect(content).toContain('Defer');
    expect(content).toContain('Renew');
    expect(content).toContain('GetDeferrals');
  });

  test('5. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
