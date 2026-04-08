/**
 * FEAT-142: E2E 测试更新 - 删除 Area/RoomType 引用
 * 类型: static
 * 适用于: 集成验证
 *
 * 验证所有相关 E2E 测试文件已正确移除 Area/RoomType 引用。
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('FEAT-142: E2E 测试更新 - Area/RoomType 引用清理', () => {
  const testsDir = __dirname;

  const affectedFiles = [
    'feat-002-room-entity.spec.ts',
    'feat-004-room-api.spec.ts',
    'feat-011-checkin-checkout-api.spec.ts',
    'feat-022-meter-api.spec.ts',
  ];

  // ==================== 文件存在性 ====================

  for (const file of affectedFiles) {
    test(`文件存在: ${file}`, () => {
      const filePath = path.join(testsDir, file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    });
  }

  // ==================== Area/RoomType 引用已清除 ====================

  test('feat-002 不再断言 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(testsDir, 'feat-002-room-entity.spec.ts'), 'utf-8');

    // 不应包含 Area/RoomType 断言
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);

    // 测试标题应只包含 ContractImage 和 Remark
    expect(content).toMatch(/验证可选属性 - ContractImage, Remark/);
  });

  test('feat-004 不再包含 area/roomType 测试数据和断言', () => {
    const content = fs.readFileSync(path.join(testsDir, 'feat-004-room-api.spec.ts'), 'utf-8');

    // 测试数据不应包含 area/roomType 字段
    expect(content).not.toMatch(/area:\s*\d/);
    expect(content).not.toMatch(/roomType:\s*['"]/);

    // 断言不应包含 area/roomType
    expect(content).not.toMatch(/result\.data\.area/);
    expect(content).not.toMatch(/result\.data\.roomType/);
  });

  test('feat-011 房间创建数据不再包含 area', () => {
    const content = fs.readFileSync(path.join(testsDir, 'feat-011-checkin-checkout-api.spec.ts'), 'utf-8');

    // 房间创建数据不应包含 area 字段
    expect(content).not.toMatch(/area:\s*50/);
  });

  test('feat-022 房间创建数据不再包含 area', () => {
    const content = fs.readFileSync(path.join(testsDir, 'feat-022-meter-api.spec.ts'), 'utf-8');

    // 房间创建数据不应包含 area 字段
    expect(content).not.toMatch(/area:\s*50/);
  });
});
