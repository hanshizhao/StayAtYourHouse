/**
 * FEAT-001: Community（小区）实体 - 静态验证
 * 类型: static
 * 适用于: 后端实体
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-001: Community 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');

  test('1. 检查实体文件存在', async () => {
    const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Community.cs');
    const fileExists = require('fs').existsSync(entityPath);
    expect(fileExists).toBeTruthy();
  });

  test('2. 验证构建成功', async () => {
    execSync('dotnet build', { cwd: serverPath, stdio: 'pipe' });
  });
});
