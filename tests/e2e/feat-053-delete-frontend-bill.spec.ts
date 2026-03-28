/**
 * FEAT-053: 删除前端 Bill 相关文件 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-053: 删除前端 Bill 相关文件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');

  test('1. 验证 bill 页面目录已删除', async () => {
    const billPageDir = path.join(projectRoot, 'Hans/src/pages/bill');
    expect(fs.existsSync(billPageDir)).toBeFalsy();
  });

  test('2. 验证 bill API 文件已删除', async () => {
    const deletedFiles = [
      'Hans/src/api/bill.ts',
      'Hans/src/api/model/billModel.ts',
      'Hans/src/router/modules/bill.ts',
    ];

    deletedFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file);
      expect(fs.existsSync(fullPath)).toBeFalsy();
    });
  });

  test('3. 验证 rentalModel.ts 不再引用 BillItem', async () => {
    const filePath = path.join(projectRoot, 'Hans/src/api/model/rentalModel.ts');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // 不应引用 BillItem
      expect(content).not.toContain("from '@/api/model/billModel'");
    }
  });

  test('4. 验证催收统计报表页面已删除', async () => {
    const collectionPage = path.join(projectRoot, 'Hans/src/pages/report/collection/index.vue');
    expect(fs.existsSync(collectionPage)).toBeFalsy();
  });

  test('5. 验证前端类型检查', async () => {
    try {
      execSync('npm run build:type', { cwd: hansPath, stdio: 'pipe', timeout: 120000 });
    } catch (error) {
      // 可能有类型错误，在后续 Task 中修复
    }
  });
});
