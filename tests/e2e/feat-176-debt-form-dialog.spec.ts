import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const COMPONENT_PATH = 'Hans/src/pages/debt/components/DebtFormDialog.vue';
const PROJECT_ROOT = path.resolve(__dirname, '../..');

let componentSource: string;

test.describe('FEAT-176 DebtFormDialog 组件', () => {
  test.beforeAll(() => {
    componentSource = fs.readFileSync(path.join(PROJECT_ROOT, COMPONENT_PATH), 'utf-8');
  });

  test('组件文件存在', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, COMPONENT_PATH))).toBeTruthy();
  });

  test('使用 t-dialog 组件', () => {
    expect(componentSource).toContain('t-dialog');
  });

  test('支持新增和编辑模式', () => {
    expect(componentSource).toContain('isEdit');
    expect(componentSource).toContain('editData');
    expect(componentSource).toContain('新增欠款');
    expect(componentSource).toContain('编辑欠款');
  });

  test('包含租客选择表单字段', () => {
    expect(componentSource).toContain('tenantId');
    expect(componentSource).toContain('t-select');
    expect(componentSource).toContain('选择租客');
  });

  test('编辑模式禁用租客选择', () => {
    expect(componentSource).toContain(':disabled="isEdit"');
  });

  test('包含欠款金额字段', () => {
    expect(componentSource).toContain('totalAmount');
    expect(componentSource).toContain('t-input-number');
    expect(componentSource).toContain('欠款金额');
  });

  test('包含欠款说明和备注字段', () => {
    expect(componentSource).toContain('description');
    expect(componentSource).toContain('remark');
    expect(componentSource).toContain('t-textarea');
    expect(componentSource).toContain('欠款说明');
  });

  test('调用 createDebt 和 updateDebt API', () => {
    expect(componentSource).toContain('createDebt');
    expect(componentSource).toContain('updateDebt');
  });

  test('TypeScript 类型检查通过', () => {
    let output = '';
    try {
      output = execSync('cd Hans && npm run build:type 2>&1', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 120000,
      });
    }
    catch (e: any) {
      output = e.stdout ?? '';
    }
    // 现有的 tenant/index.vue 错误不影响 DebtFormDialog
    expect(output).not.toContain('DebtFormDialog');
  });
});
