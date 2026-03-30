import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

test.describe('FEAT-097: 后端实体 — 新增 IsAnJuCodeSubmitted 属性', () => {
  const entityFile = path.join(ROOT, 'Gentle/Gentle.Core/Entities/RentalRecord.cs');
  const dtoFile = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs');

  test('RentalRecord 实体文件存在', () => {
    test.expect(fs.existsSync(entityFile)).toBeTruthy();
  });

  test('RentalRecord 实体包含 IsAnJuCodeSubmitted 属性', () => {
    const content = fs.readFileSync(entityFile, 'utf-8');
    test.expect(content).toContain('public bool IsAnJuCodeSubmitted { get; set; }');
    test.expect(content).toContain('= false');
  });

  test('RentalRecordDto 文件存在', () => {
    test.expect(fs.existsSync(dtoFile)).toBeTruthy();
  });

  test('RentalRecordDto 包含 IsAnJuCodeSubmitted 字段', () => {
    const content = fs.readFileSync(dtoFile, 'utf-8');
    test.expect(content).toContain('public bool IsAnJuCodeSubmitted { get; set; }');
  });

  test('后端 Core 项目构建通过', () => {
    const result = execSync('dotnet build Gentle/Gentle.Core/Gentle.Core.csproj --no-restore', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60000,
    });
    test.expect(result).toContain('0 个错误');
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
