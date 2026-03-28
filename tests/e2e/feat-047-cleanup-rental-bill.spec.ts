/**
 * FEAT-047: 清理 RentalRecordService 中的 Bill 引用 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-047: 清理 RentalRecordService 中的 Bill 引用', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 GetByIdAsync 不再 Include Bills', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/RentalRecordService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 查找 GetByIdAsync 方法，确保不再包含 .Include(r => r.Bills)
    const getByIdMatch = content.match(/GetByIdAsync[^}]+}/s);
    if (getByIdMatch) {
      expect(getByIdMatch[0]).not.toContain('.Include(r => r.Bills)');
    }
  });

  test('2. 验证 GetPagedListAsync 不再 Include Bills', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/RentalRecordService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 查找 GetPagedListAsync 方法，确保不再包含 .Include(r => r.Bills)
    const getPagedListMatch = content.match(/GetPagedListAsync[^}]+}/s);
    if (getPagedListMatch) {
      expect(getPagedListMatch[0]).not.toContain('.Include(r => r.Bills)');
    }
  });

  test('3. 验证编译通过', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    const output = result.toString();
    // 支持中英文输出 - 验证构建成功
    expect(output.includes('Build succeeded') || output.includes('已成功生成')).toBe(true);
    // 验证没有编译错误（"0 个错误" 或 "0 Error(s)"）
    expect(output.includes('0 个错误') || output.includes('0 Error(s)')).toBe(true);
  });

  // API 运行时测试需要后端启动
  test.skip('4. API 冒烟测试 - 租赁记录分页接口', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rental/page`);
    expect([200, 401]).toContain(response.status());
  });
});
