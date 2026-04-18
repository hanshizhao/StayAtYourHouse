import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const HANS_DIR = path.join(PROJECT_ROOT, 'Hans');

test.describe('FEAT-164: 前端 API 模型更新', () => {
  const roomModelPath = path.join(HANS_DIR, 'src/api/model/roomModel.ts');
  const roomApiPath = path.join(HANS_DIR, 'src/api/room.ts');

  test('roomModel.ts 文件存在', () => {
    expect(fs.existsSync(roomModelPath)).toBeTruthy();
  });

  test('LeaseStatus 枚举定义正确（Normal=0, ExpiringSoon=1, Expired=2, None=3）', () => {
    const content = fs.readFileSync(roomModelPath, 'utf-8');

    expect(content).toContain('export enum LeaseStatus');
    expect(content).toContain('Normal = 0');
    expect(content).toContain('ExpiringSoon = 1');
    expect(content).toContain('Expired = 2');
    expect(content).toContain('None = 3');
  });

  test('RoomItem 新增 5 个租约字段', () => {
    const content = fs.readFileSync(roomModelPath, 'utf-8');

    expect(content).toContain('landlordLeaseStatus: LeaseStatus');
    expect(content).toContain('landlordLeaseExpiredDays?: number | null');
    expect(content).toContain('tenantLeaseStatus: LeaseStatus');
    expect(content).toContain('tenantLeaseExpiredDays?: number | null');
    expect(content).toContain('tenantMonthlyRent?: number | null');
  });

  test('GetRoomListParams 新增分页参数', () => {
    const content = fs.readFileSync(roomModelPath, 'utf-8');

    expect(content).toContain('hasLeaseAlert?: boolean');
    expect(content).toContain('page?: number');
    expect(content).toContain('pageSize?: number');
  });

  test('RoomListResult 分页结果类型定义正确', () => {
    const content = fs.readFileSync(roomModelPath, 'utf-8');

    expect(content).toContain('export interface RoomListResult');
    expect(content).toContain('list: RoomItem[]');
    expect(content).toContain('total: number');
    expect(content).toContain('page: number');
    expect(content).toContain('pageSize: number');
  });

  test('room.ts getRoomList 返回类型改为 RoomListResult', () => {
    const content = fs.readFileSync(roomApiPath, 'utf-8');

    expect(content).toContain('import type { CreateRoomParams, GetRoomListParams, RoomItem, RoomListResult, UpdateRoomParams }');
    expect(content).toContain('request.get<RoomListResult>');
  });

  test('前端类型检查通过（排除预存 tenant 错误）', () => {
    let output: string;
    try {
      output = execSync('npm run build:type 2>&1', {
        cwd: HANS_DIR,
        encoding: 'utf-8',
        timeout: 120_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }
    catch (err: any) {
      output = err.stdout ?? '';
    }

    // 只允许预先存在的 tenant/index.vue 错误
    const errors = output
      .split('\n')
      .filter(line => line.includes('error TS'))
      .filter(line => !line.includes('tenant/index.vue'));

    expect(errors).toHaveLength(0);
  });
});
