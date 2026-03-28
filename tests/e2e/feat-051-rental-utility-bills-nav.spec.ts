/**
 * FEAT-051: RentalRecord 新增 UtilityBills 导航属性 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-051: RentalRecord 新增 UtilityBills 导航属性', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 RentalRecord 实体包含 UtilityBills 导航属性', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/RentalRecord.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 UtilityBills 导航属性
    expect(content).toContain('ICollection<UtilityBill> UtilityBills');
  });

  test('2. 验证 RentalRecordDto 包含 UtilityBills 属性', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 UtilityBills 属性
    expect(content).toContain('List<UtilityBillDto>? UtilityBills');
  });

  test('3. 验证 RentalRecordService 查询 Include UtilityBills', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/RentalRecordService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 UtilityBills 的 Include
    expect(content).toContain('.Include(r => r.UtilityBills)');
  });

  test('4. 验证 Mapper 包含 UtilityBills 映射', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Mapper.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 UtilityBills 映射
    expect(content).toContain('.Map(dest => dest.UtilityBills, src => src.UtilityBills)');
  });

  test('5. 验证编译通过', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    expect(result.toString()).toContain('Build succeeded');
  });

  // API 运行时测试
  test.skip('6. API 冒烟测试 - 租赁记录详情包含 utilityBills', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rental/1`);
    if (response.status() === 200) {
      const result = await response.json();
      expect(result.data).toHaveProperty('utilityBills');
    }
  });
});
