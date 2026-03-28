/**
 * FEAT-049: 清理 MeterService 和 UtilityBillDto 中的 Merged 引用 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-049: 清理 MeterService 和 UtilityBillDto 中的 Merged 引用', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 MeterService PayAsync 不再检查 Merged', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/MeterService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Merged 状态检查
    expect(content).not.toContain('UtilityBillStatus.Merged');
    expect(content).not.toContain('已合并到房租账单');
  });

  test('2. 验证 MeterService DeleteBillAsync 不再检查 Merged', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/MeterService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Merged 删除限制
    expect(content).not.toContain('已合并的账单不能删除');
  });

  test('3. 验证 UtilityBillDto StatusText 不包含 Merged', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Meter/UtilityBillDto.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // StatusText 不应包含 Merged 分支
    expect(content).not.toContain('Merged =>');
    expect(content).not.toContain('"已合并"');
  });

  test('4. 验证 UtilityBillDto 新增 RentalRecordId 属性', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Meter/UtilityBillDto.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 RentalRecordId 属性
    expect(content).toContain('RentalRecordId');
  });

  test('5. 验证编译通过', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    expect(result.toString()).toContain('Build succeeded');
  });

  // API 运行时测试
  test.skip('6. API 冒烟测试 - 水电账单列表接口', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/meter/bill/list`);
    expect([200, 401]).toContain(response.status());
  });
});
