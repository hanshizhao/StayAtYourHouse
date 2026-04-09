/**
 * FEAT-148: E2E 测试更新 - 固定费用集成验证
 * 类型: e2e
 * 适用于: 集成测试
 *
 * 测试覆盖：
 * 1. API 测试中固定费用字段的数据与断言已添加
 * 2. 页面测试中固定费用输入框交互已添加
 * 3. feat-004 和 feat-006 测试文件包含固定费用相关代码
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..', '..');

test.describe('FEAT-148: E2E 测试更新 - 固定费用集成', () => {

  test('1. feat-004 API 测试包含固定费用创建数据', () => {
    const filePath = path.join(ROOT_DIR, 'tests/e2e/feat-004-room-api.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证创建测试包含固定费用字段
    expect(content).toContain('elevatorFee');
    expect(content).toContain('propertyFee');
    expect(content).toContain('internetFee');
    expect(content).toContain('otherFees');

    // 验证断言存在
    expect(content).toMatch(/expect\(result\.data\.elevatorFee\)/);
    expect(content).toMatch(/expect\(result\.data\.propertyFee\)/);
    expect(content).toMatch(/expect\(result\.data\.internetFee\)/);
    expect(content).toMatch(/expect\(result\.data\.otherFees\)/);
  });

  test('2. feat-004 API 测试包含固定费用更新数据', () => {
    const filePath = path.join(ROOT_DIR, 'tests/e2e/feat-004-room-api.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证更新测试数据包含固定费用
    const updateTestMatch = content.match(/更新接口 - 成功更新[\s\S]*?updateData\s*=\s*\{[\s\S]*?\}/);
    expect(updateTestMatch).toBeTruthy();
    expect(updateTestMatch![0]).toContain('elevatorFee');
    expect(updateTestMatch![0]).toContain('propertyFee');
    expect(updateTestMatch![0]).toContain('internetFee');
    expect(updateTestMatch![0]).toContain('otherFees');
  });

  test('3. feat-006 页面测试包含固定费用输入框填写', () => {
    const filePath = path.join(ROOT_DIR, 'tests/e2e/feat-006-room-page.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证固定费用 data-testid 引用
    expect(content).toContain('room-elevator-fee-input');
    expect(content).toContain('room-property-fee-input');
    expect(content).toContain('room-internet-fee-input');
    expect(content).toContain('room-other-fees-input');

    // 验证填写逻辑存在
    expect(content).toMatch(/fixedFeeFields/);
    expect(content).toMatch(/field\.testId/);
    expect(content).toMatch(/field\.value/);
  });

  test('4. feat-006 页面测试包含编辑回显固定费用验证', () => {
    const filePath = path.join(ROOT_DIR, 'tests/e2e/feat-006-room-page.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证编辑功能测试中包含固定费用验证
    const editTestMatch = content.match(/编辑功能[\s\S]*?fixedFeeTestIds[\s\S]*?for\s*\(const\s+testId/);
    expect(editTestMatch).toBeTruthy();
  });

  test('5. 固定费用值在测试中合理', () => {
    const filePath = path.join(ROOT_DIR, 'tests/e2e/feat-004-room-api.spec.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证创建测试中的固定费用值是正数
    const feeMatches = content.match(/elevatorFee:\s*(\d+)/g);
    expect(feeMatches).toBeTruthy();
    for (const match of feeMatches!) {
      const value = Number.parseInt(match.match(/elevatorFee:\s*(\d+)/)![1], 10);
      expect(value).toBeGreaterThan(0);
    }
  });
});
