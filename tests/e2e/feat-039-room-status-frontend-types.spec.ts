/**
 * FEAT-039: 前端类型定义 + 枚举扩展 - 静态验证
 * ⚠️ 仅适用于：前端类型定义、枚举扩展
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-039: 前端类型定义 + 枚举扩展', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');

  test('1. 检查 RoomStatus 枚举包含 Reclaimed', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/api/model/roomModel.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Reclaimed = 3');
  });

  test('2. 检查 RoomStatusText 包含已收回', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/api/model/roomModel.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/Reclaimed.*已收回/);
  });

  test('3. 验证构建成功', async () => {
    execSync('npx tsc --noEmit', { cwd: frontendPath, stdio: 'pipe' });
  });
});
