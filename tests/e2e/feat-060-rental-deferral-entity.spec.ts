/**
 * FEAT-060: 创建 RentalDeferral 实体 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-060: 创建 RentalDeferral 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const entityPath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/RentalDeferral.cs');

  test('1. 检查实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('2. 验证实体继承 Entity<int>', async () => {
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).toContain(': Entity<int>');
  });

  test('3. 验证必需属性存在', async () => {
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).toContain('RentalReminderId');
    expect(content).toContain('OriginalReminderDate');
    expect(content).toContain('DeferredToDate');
    expect(content).toContain('Remark');
    expect(content).toContain('RentalReminder');
  });

  test('4. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
