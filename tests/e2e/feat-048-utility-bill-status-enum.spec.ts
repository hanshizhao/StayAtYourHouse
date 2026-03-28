/**
 * FEAT-048: 修改 UtilityBillStatus 枚举（移除 Merged） - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('FEAT-048: 修改 UtilityBillStatus 枚举（移除 Merged）', () => {
  const projectRoot = path.join(__dirname, '../../');

  test('1. 验证 UtilityBillStatus 枚举只包含 Pending 和 Paid', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Enums/UtilityBillStatus.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 Pending 和 Paid
    expect(content).toContain('Pending = 0');
    expect(content).toContain('Paid = 1');

    // 不应包含 Merged
    expect(content).not.toContain('Merged');
  });

  test('2. 验证枚举结构正确', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Core/Enums/UtilityBillStatus.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证枚举声明存在
    expect(content).toContain('public enum UtilityBillStatus');
  });
});
