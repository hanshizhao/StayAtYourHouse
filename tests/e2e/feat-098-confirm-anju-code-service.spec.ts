import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

test.describe('FEAT-098: 后端服务层 — 新增 ConfirmAnJuCodeAsync 方法', () => {
  const interfacePath = path.join(ROOT, 'Gentle/Gentle.Application/Services/IRentalRecordService.cs');
  const servicePath = path.join(ROOT, 'Gentle/Gentle.Application/Services/RentalRecordService.cs');

  test('IRentalRecordService 接口包含 ConfirmAnJuCodeAsync 方法签名', () => {
    const content = fs.readFileSync(interfacePath, 'utf-8');
    test.expect(content).toContain('Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id)');
  });

  test('RentalRecordService 实现类包含 ConfirmAnJuCodeAsync 方法', () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    test.expect(content).toContain('public async Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id)');
  });

  test('ConfirmAnJuCodeAsync 包含 UnitOfWork 特性', () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    // 找到方法声明行，检查上方是否有 [UnitOfWork]
    const methodIndex = content.indexOf('public async Task<RentalRecordDto> ConfirmAnJuCodeAsync');
    const precedingText = content.substring(Math.max(0, methodIndex - 200), methodIndex);
    test.expect(precedingText).toContain('[UnitOfWork]');
  });

  test('ConfirmAnJuCodeAsync 包含幂等处理', () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    const methodIndex = content.indexOf('ConfirmAnJuCodeAsync(int id)');
    // 获取方法体（从方法声明到下一个方法声明）
    const nextMethodIndex = content.indexOf('private static', methodIndex);
    const methodBody = nextMethodIndex > 0
      ? content.substring(methodIndex, nextMethodIndex)
      : content.substring(methodIndex);
    test.expect(methodBody).toContain('IsAnJuCodeSubmitted');
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
