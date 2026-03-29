/**
 * FEAT-073: 创建 RentalReminderService 实现 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-073: 创建 RentalReminderService 实现', () => {
  const projectRoot = path.join(__dirname, '../../');
  const servicePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/RentalReminderService.cs');

  test('1. 检查服务文件存在', async () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  test('2. 验证服务实现 ITransient', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain(': IRentalReminderService');
    expect(content).toContain('ITransient');
  });

  test('3. 验证使用 Furion 异常', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain('Oops.Oh');
  });

  test('4. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
