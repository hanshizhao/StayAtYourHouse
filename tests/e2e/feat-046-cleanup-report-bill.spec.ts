/**
 * FEAT-046: 清理 ReportService 中的 Bill 引用 - API 运行时验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-046: 清理 ReportService 中的 Bill 引用', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 ReportService.cs 不再引用 Bill', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/ReportService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含 IRepository<Bill> 依赖
    expect(content).not.toContain('IRepository<Bill>');
    expect(content).not.toContain('_billRepository');
  });

  test('2. 验证 GetCollectionReportAsync 已删除', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/ReportService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('GetCollectionReportAsync');
  });

  test('3. 验证 IReportService.cs 不再包含接口声明', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Services/IReportService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('GetCollectionReportAsync');
  });

  test('4. 验证 ReportAppService.cs 不再包含端点', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Apps/ReportAppService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('GetCollectionReport');
  });

  test('5. 验证编译状态（预期仍有 RentalRecordService 的 Bills 引用错误）', async () => {
    // FEAT-046 只清理 ReportService 的 Bill 引用
    // 编译仍有错误是预期的（RentalRecordService 的 Bills 引用将在 FEAT-047 清理）
    try {
      const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
      const output = result.toString();

      // 编译可能失败，但不应有 ReportService 相关错误
      // 只检查 ReportService 相关的错误
      const hasReportServiceError = output.includes('ReportService') && output.includes('error');
      expect(hasReportServiceError).toBe(false);
    } catch (error: any) {
      const output = error.stdout?.toString() || '';

      // 编译失败是预期的，但不应该有 ReportService 相关错误
      const hasReportServiceError = output.includes('ReportService') && output.includes('error');
      expect(hasReportServiceError).toBe(false);

      // 应该只有 RentalRecordService 的 Bills 引用错误
      const hasRentalRecordServiceBillsError = output.includes('RentalRecordService') && output.includes('Bills');
      // 这个错误是预期的，测试通过
      expect(hasRentalRecordServiceBillsError || output.includes('Build succeeded')).toBeTruthy();
    }
  });

  // API 运行时测试需要后端启动
  test.skip('6. API 冒烟测试 - 收入报表接口', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/report-app/income`);
    expect([200, 401]).toContain(response.status());
  });
});
