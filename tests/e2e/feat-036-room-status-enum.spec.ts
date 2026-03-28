/**
 * FEAT-036: 后端枚举扩展 RoomStatus.Reclaimed - 静态验证
 * ⚠️ 仅适用于：后端枚举定义
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-036: 后端枚举扩展 RoomStatus.Reclaimed', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');

  test('1. 检查 RoomStatus 枚举文件包含 Reclaimed', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Enums/RoomStatus.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Reclaimed = 3');
  });

  test('2. 验证构建成功', async () => {
    execSync('dotnet build', { cwd: serverPath, stdio: 'pipe' });
  });
});
