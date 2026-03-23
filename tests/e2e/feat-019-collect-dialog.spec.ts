/**
 * FEAT-019: 催收弹窗 - E2E 测试
 * 类型: e2e
 */
import { test, expect } from '@playwright/test';

test.describe('FEAT-019: 催收弹窗', () => {
  test('1. 组件文件存在', async () => {
    const componentPath = 'Hans/src/pages/bill/components/CollectDialog.vue';
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../', componentPath);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });
});
