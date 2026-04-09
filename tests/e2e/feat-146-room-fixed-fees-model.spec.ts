/**
 * FEAT-146: Room 固定费用 - 前端 TypeScript Model 变更 - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. RoomItem 接口新增 elevatorFee、propertyFee、internetFee、otherFees
 * 2. CreateRoomParams 接口新增对应 4 个属性
 * 3. UpdateRoomParams 接口新增对应 4 个属性
 * 4. npm run build:type 无类型错误
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const projectRoot = path.join(__dirname, '../../');
const modelFile = path.join(projectRoot, 'Hans/src/api/model/roomModel.ts');

const fixedFeeFields = ['elevatorFee', 'propertyFee', 'internetFee', 'otherFees'];

test.describe('FEAT-146: 前端 TypeScript Model 变更', () => {
  let modelContent: string;

  test.beforeAll(() => {
    modelContent = fs.readFileSync(modelFile, 'utf-8');
  });

  test('roomModel.ts 文件存在', () => {
    expect(fs.existsSync(modelFile)).toBeTruthy();
  });

  // ==================== RoomItem 接口 ====================

  for (const field of fixedFeeFields) {
    test(`RoomItem 接口包含 ${field} 可选属性`, () => {
      const block = extractInterfaceBlock(modelContent, 'RoomItem');
      expect(block).toContain(`${field}?: number;`);
    });
  }

  // ==================== CreateRoomParams 接口 ====================

  for (const field of fixedFeeFields) {
    test(`CreateRoomParams 接口包含 ${field} 可选属性`, () => {
      const block = extractInterfaceBlock(modelContent, 'CreateRoomParams');
      expect(block).toContain(`${field}?: number;`);
    });
  }

  // ==================== UpdateRoomParams 接口 ====================

  for (const field of fixedFeeFields) {
    test(`UpdateRoomParams 接口包含 ${field} 可选属性`, () => {
      const block = extractInterfaceBlock(modelContent, 'UpdateRoomParams');
      expect(block).toContain(`${field}?: number;`);
    });
  }

  // ==================== 构建验证 ====================

  test('npm run build:type 无类型错误', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(projectRoot, 'Hans'),
      encoding: 'utf-8',
      timeout: 60_000,
    });
    expect(result).toBeDefined();
  });
});

/**
 * 从 TypeScript 文件内容中提取指定 interface 的块
 */
function extractInterfaceBlock(content: string, interfaceName: string): string {
  const regex = new RegExp(
    `export interface ${interfaceName} \\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`,
    's',
  );
  const match = content.match(regex);
  return match ? match[1] : '';
}
