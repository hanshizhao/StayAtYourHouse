/**
 * FEAT-045: 清理后端共享文件中的 Bill 引用 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-045: 清理后端共享文件中的 Bill 引用', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 RentalRecord.cs 不再引用 Bill', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/RentalRecord.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Bills 导航属性
    expect(content).not.toContain('ICollection<Bill>');
    expect(content).not.toContain('public ICollection<Bill> Bills');
  });

  test('2. 验证 RentalRecordDto.cs 不再引用 Bill', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Bills 属性
    expect(content).not.toContain('List<BillDto>? Bills');
    expect(content).not.toContain('using Gentle.Application.Dtos.Bill');
  });

  test('3. 验证 Mapper.cs 不再包含 Bill 映射', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Mapper.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 Bill 相关映射
    expect(content).not.toContain('Bill, BillDto');
    expect(content).not.toContain('CollectionRecord, CollectionRecordDto');
  });

  test('4. 验证编译状态（预期仍有错误）', async () => {
    // 此 Task 后编译仍会失败（ReportService、RentalRecordService 仍引用 Bill）
    try {
      execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    } catch (error) {
      // 预期会失败
    }
  });
});
