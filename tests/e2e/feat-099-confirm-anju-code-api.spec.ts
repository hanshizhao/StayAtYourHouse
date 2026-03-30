import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

test.describe('FEAT-099: 后端 API 层 — 新增确认接口端点', () => {
  const appServicePath = path.join(ROOT, 'Gentle/Gentle.Application/Apps/RentalAppService.cs');

  test('RentalAppService 包含 ConfirmAnJuCode 方法', () => {
    const content = fs.readFileSync(appServicePath, 'utf-8');
    test.expect(content).toContain('public async Task<RentalRecordDto> ConfirmAnJuCode(int id)');
  });

  test('ConfirmAnJuCode 方法具有 HttpPost 路由特性 confirm-anju-code/{id}', () => {
    const content = fs.readFileSync(appServicePath, 'utf-8');
    const methodIndex = content.indexOf('public async Task<RentalRecordDto> ConfirmAnJuCode');
    const precedingText = content.substring(Math.max(0, methodIndex - 300), methodIndex);
    test.expect(precedingText).toContain('[HttpPost("confirm-anju-code/{id}")]');
  });

  test('ConfirmAnJuCode 方法调用 _rentalRecordService.ConfirmAnJuCodeAsync', () => {
    const content = fs.readFileSync(appServicePath, 'utf-8');
    const methodIndex = content.indexOf('public async Task<RentalRecordDto> ConfirmAnJuCode');
    const nextMethodIndex = content.indexOf('/// <summary>', methodIndex + 1);
    const methodBody = nextMethodIndex > 0
      ? content.substring(methodIndex, nextMethodIndex)
      : content.substring(methodIndex);
    test.expect(methodBody).toContain('_rentalRecordService.ConfirmAnJuCodeAsync(id)');
  });

  test('后端 Application 项目构建通过', () => {
    const result = execSync('dotnet build Gentle/Gentle.Application/Gentle.Application.csproj --no-restore', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60000,
    });
    test.expect(result).toContain('0 个错误');
  });
});
