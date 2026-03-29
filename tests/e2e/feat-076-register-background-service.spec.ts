/**
 * FEAT-076: 注册后台服务 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-076: 注册后台服务', () => {
  const projectRoot = path.join(__dirname, '../../');
  const startupPath = path.join(projectRoot, 'Gentle/Gentle.Web.Core/Startup.cs');

  test('1. 检查 Startup.cs 存在', async () => {
    expect(fs.existsSync(startupPath)).toBeTruthy();
  });

  test('2. 验证后台服务注册', async () => {
    const content = fs.readFileSync(startupPath, 'utf-8');
    expect(content).toContain('AddHostedService');
    expect(content).toContain('RentalReminderBackgroundService');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
