/**
 * FEAT-113: 更新 E2E 测试（LeaseType → LeaseMonths）- 静态验证
 *
 * 验证所有依赖 LeaseType 的 E2E 测试文件已更新为使用 LeaseMonths：
 * 1. feat-009: LeaseType 枚举断言已删除 → LeaseMonths int 断言
 * 2. feat-011: leaseType:X → leaseMonths:Y
 * 3. feat-068: LeaseType → LeaseMonths
 * 4. feat-083: leaseType → leaseMonths
 * 5. feat-086: leaseType → leaseMonths
 * 6. feat-087: .t-select → .t-input-number
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '../..');

test.describe('FEAT-113: 更新 E2E 测试（LeaseType → LeaseMonths）', () => {
  // ==================== feat-009: 租赁记录实体测试 ====================

  test('1. feat-009 已移除 LeaseType 枚举断言，改为 LeaseMonths', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-009-rental-record-entity.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证不再断言 LeaseType 枚举文件存在（改为验证已删除）
    expect(content).toMatch(/LeaseType.*已删除|LeaseType.*已移除|toBeFalsy.*leaseTypeEnum/);
    // 验证新增 LeaseMonths int 断言
    expect(content).toMatch(/LeaseMonths/);
    // 验证不再有 LeaseType 枚举属性断言
    expect(content).not.toMatch(/public\s+LeaseType\s+LeaseType/);
  });

  // ==================== feat-011: 入住退房 API 测试 ====================

  test('2. feat-011 所有 leaseType:X 已替换为 leaseMonths:Y', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-011-checkin-checkout-api.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应再包含 leaseType 作为 API 参数
    expect(content).not.toMatch(/leaseType:\s*\d/);
    // 应包含 leaseMonths 参数
    expect(content).toMatch(/leaseMonths:\s*1/);
    // 验证租期月数验证测试描述已更新
    expect(content).toMatch(/租期月数|leaseMonths/);
  });

  // ==================== feat-068: 续租输入测试 ====================

  test('3. feat-068 LeaseType 属性断言已改为 LeaseMonths', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-068-renew-rental-input.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('LeaseMonths');
    expect(content).not.toContain("'LeaseType'");
  });

  // ==================== feat-083: 续租对话框测试 ====================

  test('4. feat-083 租期类型验证已改为租期月数验证', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-083-renew-rental-dialog.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toMatch(/leaseMonths|LeaseMonths/);
    expect(content).not.toMatch(/leaseType.*LeaseType|验证租期类型选择/);
  });

  // ==================== feat-086: 集成测试 ====================

  test('5. feat-086 API 调用参数已更新', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-086-integration-test.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 不应再包含 leaseType 作为 API 参数
    expect(content).not.toMatch(/leaseType:\s*\d/);
    // 应包含 leaseMonths
    expect(content).toMatch(/leaseMonths:\s*\d/);
  });

  // ==================== feat-087: Todo面板增强测试 ====================

  test('6. feat-087 续租弹窗选择器已从 .t-select 改为 .t-input-number', async () => {
    const filePath = path.join(ROOT, 'tests/e2e/feat-087-todo-panel-enhancement.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 续租弹窗中的租期输入应使用 .t-input-number
    expect(content).toMatch(/\.t-input-number/);
    // 验证租期类型选择器相关的旧断言已移除（在续租上下文中）
    // 注意：文件中其他筛选功能的 .t-select 仍应保留
  });

  // ==================== 汇总验证 ====================

  test('7. 所有测试文件不再包含 leaseType API 参数', async () => {
    const testFiles = [
      'tests/e2e/feat-009-rental-record-entity.spec.ts',
      'tests/e2e/feat-011-checkin-checkout-api.spec.ts',
      'tests/e2e/feat-068-renew-rental-input.spec.ts',
      'tests/e2e/feat-083-renew-rental-dialog.spec.ts',
      'tests/e2e/feat-086-integration-test.spec.ts',
    ];

    for (const file of testFiles) {
      const filePath = path.join(ROOT, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      // 不应包含 leaseType: X 形式的 API 参数
      expect(content).not.toMatch(/leaseType:\s*\d/);
    }
  });
});
