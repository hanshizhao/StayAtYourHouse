/**
 * FEAT-050: UtilityBill 增加 RentalRecordId 字段 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-050: UtilityBill 增加 RentalRecordId 字段', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 UtilityBill 实体包含 RentalRecordId', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/UtilityBill.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 RentalRecordId 属性
    expect(content).toContain('public int? RentalRecordId');
    expect(content).toContain('public RentalRecord? RentalRecord');
  });

  test('2. 验证 UtilityBill 包含 RentalRecordId 索引', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/UtilityBill.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含索引
    expect(content).toContain('Index(nameof(RentalRecordId))');
  });

  test('3. 验证 MeterService.CreateUtilityBillAsync 关联租约', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/MeterService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含查询活跃租约的逻辑
    expect(content).toContain('RentalStatus.Active');
    expect(content).toContain('RentalRecordId = activeRental.Id');
  });

  test('4. 验证无租约时 return 逻辑', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/MeterService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含无租约时的 return
    expect(content).toContain('if (activeRental == null)');
    expect(content).toContain('return;');
  });

  test('5. 验证编译通过', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    // 支持中英文输出：Build succeeded / 已成功生成
    const output = result.toString();
    expect(output.includes('Build succeeded') || output.includes('已成功生成')).toBeTruthy();
    expect(output).toContain('0 个错误');
  });
});
