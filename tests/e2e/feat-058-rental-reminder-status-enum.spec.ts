/**
 * FEAT-058: 创建 RentalReminderStatus 枚举 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-058: 创建 RentalReminderStatus 枚举', () => {
  const projectRoot = path.join(__dirname, '../../');
  const enumPath = path.join(projectRoot, 'Gentle/Gentle.Core/Enums/RentalReminderStatus.cs');

  test('1. 检查枚举文件存在', async () => {
    expect(fs.existsSync(enumPath)).toBeTruthy();
  });

  test('2. 验证枚举内容', async () => {
    const content = fs.readFileSync(enumPath, 'utf-8');
    expect(content).toContain('enum RentalReminderStatus');
    expect(content).toContain('Pending = 0');
    expect(content).toContain('Deferred = 1');
    expect(content).toContain('Completed = 2');
  });

  test('3. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
