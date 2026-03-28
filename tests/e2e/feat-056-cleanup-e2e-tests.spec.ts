/**
 * FEAT-056: 清理 E2E 测试文件 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('FEAT-056: 清理 E2E 测试文件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const e2ePath = path.join(projectRoot, 'tests/e2e');

  test('1. 验证 Bill 相关 E2E 测试文件已删除', async () => {
    const deletedFiles = [
      'feat-015-bill-entity.spec.ts',
      'feat-016-collection-record-entity.spec.ts',
      'feat-017-bill-api.spec.ts',
      'feat-018-bill-page.spec.ts',
      'feat-019-collect-dialog.spec.ts',
      'feat-029-collection-report-page.spec.ts',
    ];

    deletedFiles.forEach(file => {
      const fullPath = path.join(e2ePath, file);
      expect(fs.existsSync(fullPath)).toBeFalsy();
    });
  });

  test('2. 验证 feat-020-dashboard-todo 不包含 Bill 待办', async () => {
    const filePath = path.join(e2ePath, 'feat-020-dashboard-todo.spec.ts');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 不应包含 Bill 相关断言
      expect(content).not.toContain('Bill待办');
    }
  });

  test('3. 验证 feat-024-utility-bill-page 不包含 Merged 测试', async () => {
    const filePath = path.join(e2ePath, 'feat-024-utility-bill-page.spec.ts');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 不应包含 Merged 状态测试
      expect(content).not.toContain('Merged');
    }
  });

  test('4. 验证 feat-031-rental-dto-mapper 包含 UtilityBills', async () => {
    const filePath = path.join(e2ePath, 'feat-031-rental-dto-mapper.spec.ts');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 应包含 UtilityBills 映射断言
      expect(content).toContain('UtilityBills');
    }
  });
});
