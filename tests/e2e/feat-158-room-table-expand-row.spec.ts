import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from '@playwright/test';

const INDEX_VUE = path.resolve(__dirname, '../../Hans/src/pages/housing/room/index.vue');

describe('FEAT-158: 前端表格重设计 — 删列、加展开行、清理死代码', () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(INDEX_VUE, 'utf-8');
  });

  // ── Step 1: 三列已删除 ──

  test('columns 不含 anjuCodeSubmitted 列配置', () => {
    const match = source.match(/colKey:\s*['"]anjuCodeSubmitted['"]/);
    expect(match).toBeNull();
  });

  test('columns 不含 leaseDuration 列配置', () => {
    const match = source.match(/colKey:\s*['"]leaseDuration['"]/);
    expect(match).toBeNull();
  });

  test('columns 不含 daysUntilExpiry 列配置', () => {
    const match = source.match(/colKey:\s*['"]daysUntilExpiry['"]/);
    expect(match).toBeNull();
  });

  // ── Step 2: 三个模板槽已删除 ──

  test('模板 #anjuCodeSubmitted 已删除', () => {
    expect(source).not.toContain('#anjuCodeSubmitted');
  });

  test('模板 #leaseDuration 已删除', () => {
    expect(source).not.toContain('#leaseDuration');
  });

  test('模板 #daysUntilExpiry 已删除', () => {
    expect(source).not.toContain('#daysUntilExpiry');
  });

  // ── Step 3: t-table 展开行属性和模板 ──

  test('t-table 绑定 :expanded-row-keys', () => {
    expect(source).toContain(':expanded-row-keys="expandedRowKeys"');
  });

  test('t-table 绑定 @expand-change', () => {
    expect(source).toContain('@expand-change="handleExpandChange"');
  });

  test('存在 #expandedRow 模板', () => {
    expect(source).toContain('#expandedRow');
  });

  test('展开行模板包含租客信息展示', () => {
    expect(source).toContain('row.tenantName');
  });

  test('展开行模板包含租期信息展示', () => {
    expect(source).toContain('row.rentalStartDate');
    expect(source).toContain('row.rentalEndDate');
  });

  test('展开行模板包含安居码展示', () => {
    expect(source).toContain('row.anjuCodeSubmitted');
  });

  test('展开行空状态显示"暂无租客信息"', () => {
    expect(source).toContain('暂无租客信息');
  });

  // ── Step 4: 展开行 script 逻辑 ──

  test('存在 expandedRowKeys ref', () => {
    expect(source).toMatch(/const\s+expandedRowKeys\s*=\s*ref/);
  });

  test('存在 handleExpandChange 函数', () => {
    expect(source).toMatch(/function\s+handleExpandChange/);
  });

  test('handlePageChange 重置展开状态', () => {
    const pageChangeMatch = source.match(
      /function\s+handlePageChange[\s\S]*?expandedRowKeys\.value\s*=\s*\[\]/,
    );
    expect(pageChangeMatch).not.toBeNull();
  });

  // ── Step 5: getExpiryClass 已删除 ──

  test('getExpiryClass 函数已删除', () => {
    expect(source).not.toMatch(/function\s+getExpiryClass/);
  });

  // ── Step 6: CSS 类更新 ──

  test('过期 CSS 类已删除', () => {
    expect(source).not.toContain('.expiry-positive');
    expect(source).not.toContain('.expiry-zero');
    expect(source).not.toContain('.expiry-negative');
  });

  test('展开行样式类已添加', () => {
    expect(source).toContain('.expanded-row');
    expect(source).toContain('.expanded-item');
    expect(source).toContain('.expanded-label');
    expect(source).toContain('.expanded-value');
  });

  test('展开行空状态样式已添加', () => {
    expect(source).toContain('.expanded-row-empty');
  });

  // ── Step 7: 构建验证 ──

  test('npm run build:type 无类型错误', () => {
    const result = execSync('npm run build:type', {
      cwd: path.resolve(__dirname, '../../Hans'),
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result).not.toContain('error TS');
  });
});
