/**
 * FEAT-093: 更新 i18n 文件 - 静态验证
 * ⚠️ 仅适用于：配置文件、类型定义
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { expect, test } from '@playwright/test';

test.describe('FEAT-093: 更新 i18n 文件', () => {
  const projectRoot = path.join(__dirname, '../../');

  test('1. 中文 i18n 文件存在', () => {
    const filePath = path.join(
      projectRoot,
      'Hans/src/locales/lang/zh_CN/pages/dashboard-base.ts',
    );
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('2. 英文 i18n 文件存在', () => {
    const filePath = path.join(
      projectRoot,
      'Hans/src/locales/lang/en_US/pages/dashboard-base.ts',
    );
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('3. 中文 i18n 包含必要命名空间', () => {
    const filePath = path.join(
      projectRoot,
      'Hans/src/locales/lang/zh_CN/pages/dashboard-base.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    const requiredKeys = ['stats', 'finance', 'occupancy', 'community', 'vacant', 'error'];
    for (const key of requiredKeys) {
      expect(content).toContain(key);
    }
  });

  test('4. 英文 i18n 包含必要命名空间', () => {
    const filePath = path.join(
      projectRoot,
      'Hans/src/locales/lang/en_US/pages/dashboard-base.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    const requiredKeys = ['stats', 'finance', 'occupancy', 'community', 'vacant', 'error'];
    for (const key of requiredKeys) {
      expect(content).toContain(key);
    }
  });
});
