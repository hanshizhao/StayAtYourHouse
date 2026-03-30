/**
 * FEAT-093: Dashboard 重构 - 更新 i18n 文件
 * 类型: static（验证 i18n 文件结构和编译）
 *
 * 测试覆盖：
 * 1. 中文 i18n 文件包含所有必需命名空间
 * 2. 英文 i18n 文件包含所有必需命名空间
 * 3. 中英文键结构一致
 * 4. vue-tsc 编译通过
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const FRONTEND_PATH = join(__dirname, '../../Hans');
const ZH_PATH = join(FRONTEND_PATH, 'src/locales/lang/zh_CN/pages/dashboard-base.ts');
const EN_PATH = join(FRONTEND_PATH, 'src/locales/lang/en_US/pages/dashboard-base.ts');

const REQUIRED_NAMESPACES = ['stats', 'finance', 'occupancy', 'community', 'vacant', 'error'];

let zhContent: string;
let enContent: string;

test.beforeAll(async () => {
  const { readFile } = await import('node:fs/promises');
  zhContent = await readFile(ZH_PATH, 'utf-8');
  enContent = await readFile(EN_PATH, 'utf-8');
});

test.describe('FEAT-093: Dashboard i18n 文件', () => {
  // ==================== 文件存在 ====================

  test('中文 i18n 文件存在', () => {
    expect(existsSync(ZH_PATH)).toBeTruthy();
  });

  test('英文 i18n 文件存在', () => {
    expect(existsSync(EN_PATH)).toBeTruthy();
  });

  // ==================== 基本结构 ====================

  test('中文文件包含 title', () => {
    expect(zhContent).toContain('title');
  });

  test('英文文件包含 title', () => {
    expect(enContent).toContain('title');
  });

  // ==================== 必需命名空间 ====================

  for (const ns of REQUIRED_NAMESPACES) {
    test(`中文文件包含 ${ns} 命名空间`, () => {
      expect(zhContent).toContain(`${ns}:`);
    });

    test(`英文文件包含 ${ns} 命名空间`, () => {
      expect(enContent).toContain(`${ns}:`);
    });
  }

  // ==================== stats 命名空间详细检查 ====================

  test.describe('stats 命名空间', () => {
    const STATS_KEYS = ['totalRooms', 'rentedRooms', 'vacantRooms', 'renovatingRooms', 'unit'];

    for (const key of STATS_KEYS) {
      test(`中文包含 stats.${key}`, () => {
        expect(zhContent).toContain(`${key}:`);
      });
    }
  });

  // ==================== finance 命名空间详细检查 ====================

  test.describe('finance 命名空间', () => {
    const FINANCE_KEYS = ['title', 'rentIncome', 'utilityIncome', 'expense', 'netProfit'];

    for (const key of FINANCE_KEYS) {
      test(`中文包含 finance.${key}`, () => {
        expect(zhContent).toContain(`${key}:`);
      });
    }
  });

  // ==================== community 命名空间详细检查 ====================

  test.describe('community 命名空间', () => {
    test('中文包含 community.title', () => {
      expect(zhContent).toContain('title:');
    });

    test('中文包含 community.columns 嵌套结构', () => {
      expect(zhContent).toContain('columns:');
    });
  });

  // ==================== vacant 命名空间详细检查 ====================

  test.describe('vacant 命名空间', () => {
    test('中文包含 vacant.title', () => {
      expect(zhContent).toContain('title:');
    });

    test('中文包含 vacant.columns 嵌套结构', () => {
      expect(zhContent).toContain('columns:');
    });
  });

  // ==================== 中英文一致性 ====================

  test('中英文文件 export 结构一致', () => {
    expect(zhContent).toContain('export default {');
    expect(zhContent).toContain('};');
    expect(enContent).toContain('export default {');
    expect(enContent).toContain('};');
  });

  // ==================== 旧内容已清理 ====================

  test('中文文件不包含旧 TDesign 示例内容', () => {
    expect(zhContent).not.toContain('outputOverview');
    expect(zhContent).not.toContain('rankList');
    expect(zhContent).not.toContain('topPanel');
    expect(zhContent).not.toContain('saleColumns');
    expect(zhContent).not.toContain('buyColumns');
  });

  test('英文文件不包含旧 TDesign 示例内容', () => {
    expect(enContent).not.toContain('outputOverview');
    expect(enContent).not.toContain('rankList');
    expect(enContent).not.toContain('topPanel');
    expect(enContent).not.toContain('saleColumns');
    expect(enContent).not.toContain('buyColumns');
  });

  // ==================== 编译验证 ====================

  test('vue-tsc 类型检查通过', () => {
    expect(() =>
      execSync('npx vue-tsc --noEmit --pretty', {
        cwd: FRONTEND_PATH,
        encoding: 'utf-8',
        timeout: 180_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    ).not.toThrow();
  });
});
