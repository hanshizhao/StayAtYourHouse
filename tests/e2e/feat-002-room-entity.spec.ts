/**
 * FEAT-002: Room（房间）实体 - 静态验证
 * 类型: static
 * 适用于: 后端实体
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-002: Room 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');

  test('1. 检查实体文件存在', async () => {
    const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Room.cs');
    const fileExists = require('fs').existsSync(entityPath);
    expect(fileExists).toBeTruthy();
  });

  test('2. 检查枚举文件存在', async () => {
    const enumPath = path.join(serverPath, 'Gentle.Core/Enums/RoomStatus.cs');
    const fileExists = require('fs').existsSync(enumPath);
    expect(fileExists).toBeTruthy();
  });

  test('3. 验证构建成功', async () => {
    execSync('dotnet build', { cwd: serverPath, stdio: 'pipe' });
  });
});
