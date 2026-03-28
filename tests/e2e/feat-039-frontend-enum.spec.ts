/**
 * FEAT-039: 前端类型定义 + 枚举扩展 - 静态验证
 * ⚠️ 仅适用于：前端类型定义、枚举
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-039: 前端类型定义 + 枚举扩展', () => {
  const projectRoot = path.join(__dirname, '../../');
  const modelPath = path.join(projectRoot, 'Hans/src/api/model/roomModel.ts');

  test('1. 检查 roomModel.ts 文件存在', async () => {
    expect(fs.existsSync(modelPath)).toBeTruthy();
  });

  test('2. 验证 RoomStatus 枚举包含 Reclaimed', async () => {
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/Reclaimed\s*=\s*3/);
  });

  test('3. 验证 RoomStatusText 包含已收回映射', async () => {
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/RoomStatus\.Reclaimed.*已收回/);
  });

  test('4. 验证前后端枚举值一致', async () => {
    const frontendContent = fs.readFileSync(modelPath, 'utf-8');
    const backendContent = fs.readFileSync(
      path.join(projectRoot, 'Gentle/Gentle.Core/Enums/RoomStatus.cs'),
      'utf-8',
    );

    // 前端 Reclaimed = 3
    expect(frontendContent).toMatch(/Reclaimed\s*=\s*3/);
    // 后端 Reclaimed = 3
    expect(backendContent).toMatch(/Reclaimed\s*=\s*3/);
  });

  test('5. 验证 npm run build 成功', async () => {
    execSync('npm run build', {
      cwd: path.join(projectRoot, 'Hans'),
      stdio: 'pipe',
      timeout: 120000,
    });
  });
});
