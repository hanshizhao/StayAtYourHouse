/**
 * FEAT-075: 创建催收提醒后台服务 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-075: 创建催收提醒后台服务', () => {
  const projectRoot = path.join(__dirname, '../../');
  const servicePath = path.join(projectRoot, 'Gentle/Gentle.Application/BackgroundServices/RentalReminderBackgroundService.cs');

  test('1. 检查服务文件存在', async () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  test('2. 验证继承 BackgroundService', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain(': BackgroundService');
  });

  test('3. 验证 ExecuteAsync 方法', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain('ExecuteAsync');
    expect(content).toContain('CancellationToken');
  });

  test('4. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
