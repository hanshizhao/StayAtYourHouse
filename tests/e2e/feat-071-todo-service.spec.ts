/**
 * FEAT-071: 创建 TodoService 实现 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-071: 创建 TodoService 实现', () => {
  const projectRoot = path.join(__dirname, '../../');
  const servicePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/TodoService.cs');

  test('1. 检查服务文件存在', async () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  test('2. 验证服务实现 ITodoService', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain(': ITodoService');
  });

  test('2.1 验证接口继承 ITransient', async () => {
    const interfacePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/ITodoService.cs');
    const content = fs.readFileSync(interfacePath, 'utf-8');
    expect(content).toContain('ITransient');
  });

  test('3. 验证依赖注入', async () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    expect(content).toContain('IRepository<UtilityBill>');
    expect(content).toContain('IRepository<RentalReminder>');
    expect(content).toContain('IRepository<RentalRecord>');
  });

  test('4. 验证后端构建成功', async () => {
    execSync('dotnet build', { cwd: path.join(projectRoot, 'Gentle'), stdio: 'pipe' });
  });
});
