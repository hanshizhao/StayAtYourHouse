/**
 * FEAT-056: 清理 E2E 测试文件 - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. Bill 相关 E2E 测试文件已删除
 * 2. Dashboard 待办测试已更新（无 Bill 引用）
 * 3. Utility bill page 测试无 Merged 引用
 * 4. Full flow 测试无 Bill 催收流程
 * 5. Rental DTO Mapper 测试已更新
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';

test.describe('FEAT-056: 清理 E2E 测试文件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const e2ePath = path.join(projectRoot, 'tests/e2e');

  // ==================== 步骤1: Bill 相关测试文件已删除 ====================

  test('1. feat-015-bill-entity.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-015-bill-entity.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test('2. feat-016-collection-record-entity.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-016-collection-record-entity.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test('3. feat-017-bill-api.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-017-bill-api.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test('4. feat-018-bill-page.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-018-bill-page.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test('5. feat-019-collect-dialog.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-019-collect-dialog.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  test('6. feat-029-collection-report-page.spec.ts 已删除', async () => {
    const filePath = path.join(e2ePath, 'feat-029-collection-report-page.spec.ts');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });

  // ==================== 步骤2: Dashboard 待办测试已更新 ====================

  test('7. feat-020-dashboard-todo.spec.ts 不包含 Bill 待办断言', async () => {
    const filePath = path.join(e2ePath, 'feat-020-dashboard-todo.spec.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    // 不应包含 Bill 相关断言
    expect(content).not.toContain('Bill待办');
  });

  test('8. feat-020-dashboard-todo.spec.ts 包含 UtilityBill 相关测试', async () => {
    const filePath = path.join(e2ePath, 'feat-020-dashboard-todo.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含水电费待办测试
    expect(content).toContain('水电费待办');
  });

  // ==================== 步骤3: Utility bill page 测试无 Merged 引用 ====================

  test('9. feat-024-utility-bill-page.spec.ts 不包含 Merged 状态测试', async () => {
    const filePath = path.join(e2ePath, 'feat-024-utility-bill-page.spec.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    // 不应包含 Merged 状态测试
    expect(content).not.toContain('Merged');
  });

  // ==================== 步骤4: Full flow 测试已更新 ====================

  test('10. feat-030-full-flow.spec.ts 不包含 Bill 催收流程', async () => {
    const filePath = path.join(e2ePath, 'feat-030-full-flow.spec.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含账单列表页测试（旧 Bill 页面）
    // 使用正则匹配完整路径
    const hasOldBillPage = /['"`]\/bill\/list['"`]/.test(content);
    expect(hasOldBillPage).toBeFalsy();

    // 不应包含催收统计报表测试
    expect(content).not.toContain('/report/collection');
  });

  test('11. feat-030-full-flow.spec.ts 包含水电费管理流程', async () => {
    const filePath = path.join(e2ePath, 'feat-030-full-flow.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含水电费管理流程测试
    expect(content).toContain('水电费管理');
  });

  // ==================== 步骤5: Rental DTO Mapper 测试已更新 ====================

  test('12. feat-031-rental-dto-mapper.spec.ts 包含 UtilityBills 属性测试', async () => {
    const filePath = path.join(e2ePath, 'feat-031-rental-dto-mapper.spec.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');

    // 应包含 UtilityBills 属性测试
    expect(content).toContain('UtilityBills');
  });

  test('13. feat-031-rental-dto-mapper.spec.ts 不包含 Bills 属性测试', async () => {
    const filePath = path.join(e2ePath, 'feat-031-rental-dto-mapper.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应包含旧的 Bills 属性测试（单独的 Bills 属性）
    expect(content).not.toMatch(/Bills属性/);
  });

  // ==================== 综合验证 ====================

  test('14. 验证旧的 Bill 功能测试文件已删除（feat-015 到 feat-019）', async () => {
    const files = fs.readdirSync(e2ePath).filter(f => f.endsWith('.spec.ts'));

    // 旧的 Bill 功能测试文件（feat-015 到 feat-019）应该已删除
    const oldBillTestFiles = files.filter(f => {
      const match = f.match(/feat-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num >= 15 && num <= 19;
      }
      return false;
    });

    // 这些文件应该不存在（已删除）
    for (const file of oldBillTestFiles) {
      expect(file).not.toContain('bill');
    }
  });
});
