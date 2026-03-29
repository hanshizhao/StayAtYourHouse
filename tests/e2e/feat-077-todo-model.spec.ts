/**
 * FEAT-077: 创建 todoModel.ts 类型定义 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-077: 创建 todoModel.ts 类型定义', () => {
  const projectRoot = path.join(__dirname, '../../');
  const modelPath = path.join(projectRoot, 'Hans/src/api/model/todoModel.ts');

  test('1. 检查类型文件存在', async () => {
    expect(fs.existsSync(modelPath)).toBeTruthy();
  });

  test('2. 验证 TodoType 枚举', async () => {
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toContain('enum TodoType');
    expect(content).toContain('Utility');
    expect(content).toContain('Rental');
  });

  test('3. 验证 TodoItem 接口', async () => {
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toContain('interface TodoItem');
    expect(content).toContain('type:');
    expect(content).toContain('id:');
    expect(content).toContain('roomInfo:');
  });

  test('4. 验证其他接口', async () => {
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toContain('TodoListResult');
    expect(content).toContain('RentalReminderItem');
    expect(content).toContain('DeferReminderInput');
    expect(content).toContain('RenewRentalInput');
    expect(content).toContain('DeferralRecord');
  });

  test('5. 验证前端构建成功', async () => {
    execSync('npm run build:type', { cwd: path.join(projectRoot, 'Hans'), stdio: 'pipe' });
  });
});
