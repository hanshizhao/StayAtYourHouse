import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GENTLE_DIR = path.join(PROJECT_ROOT, 'Gentle');
const HANS_DIR = path.join(PROJECT_ROOT, 'Hans');

test.describe('FEAT-137 端到端验证', () => {
  // 构建类测试需要较长超时
  test.describe.configure({ timeout: 300_000 });

  test('1. 后端 dotnet build 编译成功', () => {
    // execSync 在编译失败时会抛出异常（非零退出码），测试自动失败
    execSync('dotnet build', {
      cwd: GENTLE_DIR,
      encoding: 'utf-8',
      timeout: 120_000,
    });
  });

  test('2. 前端 npm run build 构建成功', () => {
    execSync('npm run build', {
      cwd: HANS_DIR,
      encoding: 'utf-8',
      timeout: 180_000,
    });

    // 验证关键输出文件存在
    const distDir = path.join(HANS_DIR, 'dist');
    expect(fs.existsSync(distDir)).toBeTruthy();
    expect(fs.existsSync(path.join(distDir, 'index.html'))).toBeTruthy();
  });

  test('3. 前端 npm run lint 无错误', () => {
    // execSync 在 lint 失败时会抛出异常（非零退出码），测试自动失败
    execSync('npm run lint', {
      cwd: HANS_DIR,
      encoding: 'utf-8',
      timeout: 120_000,
    });
  });

  test('4. 房东租约所有模块文件存在性检查', () => {
    // 数据库迁移文件 (FEAT-133)
    const migrationDir = path.join(GENTLE_DIR, 'Gentle.Database.Migrations', 'Migrations');
    expect(fs.existsSync(migrationDir), `Migration directory missing: ${migrationDir}`).toBeTruthy();
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.includes('AddLandlordLease'))
      .map((f) => path.join(migrationDir, f));

    const files = [
      // 后端枚举和实体 (FEAT-128)
      path.join(GENTLE_DIR, 'Gentle.Core', 'Enums', 'PaymentMethod.cs'),
      path.join(GENTLE_DIR, 'Gentle.Core', 'Entities', 'LandlordLease.cs'),
      // 后端 DTO (FEAT-129)
      path.join(GENTLE_DIR, 'Gentle.Application', 'Dtos', 'LandlordLease', 'LandlordLeaseDto.cs'),
      path.join(GENTLE_DIR, 'Gentle.Application', 'Dtos', 'LandlordLease', 'CreateLandlordLeaseInput.cs'),
      path.join(GENTLE_DIR, 'Gentle.Application', 'Dtos', 'LandlordLease', 'UpdateLandlordLeaseInput.cs'),
      // 后端服务和 API (FEAT-130)
      path.join(GENTLE_DIR, 'Gentle.Application', 'Services', 'ILandlordLeaseService.cs'),
      path.join(GENTLE_DIR, 'Gentle.Application', 'Services', 'LandlordLeaseService.cs'),
      path.join(GENTLE_DIR, 'Gentle.Application', 'Apps', 'LandlordLeaseAppService.cs'),
      // 后端 DbContext 和 RoomService 变更 (FEAT-131)
      path.join(GENTLE_DIR, 'Gentle.EntityFramework.Core', 'DbContexts', 'DefaultDbContext.cs'),
      path.join(GENTLE_DIR, 'Gentle.Application', 'Services', 'RoomService.cs'),
      // 后端报表模块更新 (FEAT-132)
      path.join(GENTLE_DIR, 'Gentle.Application', 'Services', 'ReportService.cs'),
      // 前端类型和 API (FEAT-134)
      path.join(HANS_DIR, 'src', 'api', 'model', 'landlordLeaseModel.ts'),
      path.join(HANS_DIR, 'src', 'api', 'landlordLease.ts'),
      // 前端页面 (FEAT-135/136)
      path.join(HANS_DIR, 'src', 'pages', 'housing', 'room', 'index.vue'),
      path.join(HANS_DIR, 'src', 'pages', 'housing', 'room', 'detail.vue'),
      ...migrationFiles,
    ];

    for (const file of files) {
      expect(fs.existsSync(file), `Missing file: ${file}`).toBeTruthy();
    }
  });
});
