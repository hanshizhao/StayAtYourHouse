/**
 * FEAT-057: 最终验证 - E2E 完整流程测试
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const API_BASE = process.env.API_BASE || 'http://localhost:5000';

test.describe('FEAT-057: 最终验证', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');
  const hansPath = path.join(projectRoot, 'Hans');

  test('1. 后端构建成功', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 120000 });
    const output = result.toString();
    // 兼容中英文环境：Build succeeded / 已成功生成
    expect(output.includes('Build succeeded') || output.includes('已成功生成')).toBeTruthy();
  });

  test('2. 前端类型检查通过', async () => {
    const result = execSync('npm run build:type', { cwd: hansPath, stdio: 'pipe', timeout: 120000 });
    expect(result.toString()).not.toContain('error');
  });

  test('3. 前端完整构建成功', async () => {
    const result = execSync('npm run build', { cwd: hansPath, stdio: 'pipe', timeout: 180000 });
    expect(result.toString()).toContain('built in');
  });

  test('4. 验证 Bill 相关文件已完全删除', async () => {
    // 后端
    const backendDeletedFiles = [
      'Gentle/Gentle.Core/Entities/Bill.cs',
      'Gentle/Gentle.Core/Entities/CollectionRecord.cs',
      'Gentle/Gentle.Core/Enums/BillStatus.cs',
      'Gentle/Gentle.Core/Enums/CollectResult.cs',
      'Gentle/Gentle.Application/Apps/BillAppService.cs',
      'Gentle/Gentle.Application/Services/IBillService.cs',
      'Gentle/Gentle.Application/Services/BillService.cs',
    ];

    backendDeletedFiles.forEach(file => {
      expect(fs.existsSync(path.join(projectRoot, file))).toBeFalsy();
    });

    // 前端
    const frontendDeletedFiles = [
      'Hans/src/pages/bill',
      'Hans/src/api/bill.ts',
      'Hans/src/api/model/billModel.ts',
      'Hans/src/router/modules/bill.ts',
    ];

    frontendDeletedFiles.forEach(file => {
      expect(fs.existsSync(path.join(projectRoot, file))).toBeFalsy();
    });
  });

  test('5. 验证 UtilityBill 与 RentalRecord 关联正确', async () => {
    const utilityBillPath = path.join(projectRoot, 'Gentle/Gentle.Core/Entities/UtilityBill.cs');
    const content = fs.readFileSync(utilityBillPath, 'utf-8');

    expect(content).toContain('RentalRecordId');
    expect(content).toContain('RentalRecord? RentalRecord');
  });

  test('6. 验证前端 UtilityBillStatus 不包含 Merged', async () => {
    const meterModelPath = path.join(projectRoot, 'Hans/src/api/model/meterModel.ts');
    const content = fs.readFileSync(meterModelPath, 'utf-8');

    expect(content).not.toContain('Merged');
  });

  // 运行时测试需要服务启动
  test.skip('7. 后端 API 正常启动', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.status()).toBe(200);
  });

  test.skip('8. 前端页面正常加载', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 验证页面不报错
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Warning:')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test.skip('9. 租赁记录页展示水电费账单', async ({ page }) => {
    await page.goto(`${BASE_URL}/housing/rental`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });
});
