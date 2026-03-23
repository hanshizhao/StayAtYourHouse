/**
 * FEAT-021: MeterRecord + UtilityBill 实体 - 静态验证
 * 类型: static
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-021: MeterRecord + UtilityBill 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');

  test('1. 检查实体文件存在', async () => {
    const meterPath = path.join(serverPath, 'Gentle.Core/Entities/MeterRecord.cs');
    const utilityPath = path.join(serverPath, 'Gentle.Core/Entities/UtilityBill.cs');
    const fs = require('fs');
    expect(fs.existsSync(meterPath)).toBeTruthy();
    expect(fs.existsSync(utilityPath)).toBeTruthy();
  });

  test('2. 验证构建成功', async () => {
    execSync('dotnet build', { cwd: serverPath, stdio: 'pipe' });
  });
});
