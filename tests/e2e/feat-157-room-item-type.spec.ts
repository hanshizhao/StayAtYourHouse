import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ROOM_MODEL_PATH = path.join(PROJECT_ROOT, 'Hans/src/api/model/roomModel.ts');

test.describe('FEAT-157: 前端 RoomItem 类型调整', () => {
  test('RoomItem 接口已删除 leaseDuration 和 daysUntilExpiry', () => {
    const content = fs.readFileSync(ROOM_MODEL_PATH, 'utf-8');

    // 验证旧字段已删除
    expect(content, '不应包含 leaseDuration 字段').not.toContain('leaseDuration');
    expect(content, '不应包含 daysUntilExpiry 字段').not.toContain('daysUntilExpiry');
  });

  test('RoomItem 接口已新增 tenantName、rentalStartDate、rentalEndDate', () => {
    const content = fs.readFileSync(ROOM_MODEL_PATH, 'utf-8');

    // 验证新字段存在
    expect(content, '应包含 tenantName 字段').toContain('tenantName');
    expect(content, '应包含 rentalStartDate 字段').toContain('rentalStartDate');
    expect(content, '应包含 rentalEndDate 字段').toContain('rentalEndDate');
  });

  test('新字段类型为 string | null 且可选', () => {
    const content = fs.readFileSync(ROOM_MODEL_PATH, 'utf-8');

    // 验证新字段类型定义
    expect(content).toMatch(/tenantName\??\s*:\s*string\s*\|\s*null/);
    expect(content).toMatch(/rentalStartDate\??\s*:\s*string\s*\|\s*null/);
    expect(content).toMatch(/rentalEndDate\??\s*:\s*string\s*\|\s*null/);
  });

  test('前端类型检查通过 (npm run build:type)', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(PROJECT_ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 60_000,
    });

    expect(result).toBeDefined();
  });
});
