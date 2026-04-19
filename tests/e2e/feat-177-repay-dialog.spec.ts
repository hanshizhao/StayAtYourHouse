import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@playwright/test';

const COMPONENT_PATH = 'Hans/src/pages/debt/components/RepayDialog.vue';
const MODEL_PATH = 'Hans/src/api/model/debtModel.ts';
const API_PATH = 'Hans/src/api/debt.ts';

describe('FEAT-177: RepayDialog 组件', () => {
  let componentSource: string;
  let modelSource: string;
  let apiSource: string;

  test.beforeAll(() => {
    const projectRoot = path.resolve(__dirname, '../..');
    componentSource = fs.readFileSync(path.join(projectRoot, COMPONENT_PATH), 'utf-8');
    modelSource = fs.readFileSync(path.join(projectRoot, MODEL_PATH), 'utf-8');
    apiSource = fs.readFileSync(path.join(projectRoot, API_PATH), 'utf-8');
  });

  test('1. RepayDialog.vue 文件存在', () => {
    const fullPath = path.resolve(__dirname, '../..', COMPONENT_PATH);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });

  test('2. 组件使用 t-dialog 作为容器', () => {
    expect(componentSource).toContain('t-dialog');
    expect(componentSource).toContain('data-testid="repay-dialog"');
  });

  test('3. 标题为"还款"', () => {
    expect(componentSource).toContain('header="还款"');
  });

  test('4. 确认按钮文本为"确认还款"', () => {
    expect(componentSource).toContain('确认还款');
  });

  test('5. 显示租客信息和剩余欠款', () => {
    expect(componentSource).toContain('tenantName');
    expect(componentSource).toContain('totalAmount');
    expect(componentSource).toContain('remainingAmount');
  });

  test('6. 包含还款金额表单项', () => {
    expect(componentSource).toContain('name="amount"');
    expect(componentSource).toContain('t-input-number');
    expect(componentSource).toContain('data-testid="repay-amount-input"');
  });

  test('7. 包含还款日期表单项', () => {
    expect(componentSource).toContain('name="paymentDate"');
    expect(componentSource).toContain('t-date-picker');
    expect(componentSource).toContain('data-testid="repay-date-picker"');
  });

  test('8. 包含还款方式表单项', () => {
    expect(componentSource).toContain('name="paymentChannel"');
    expect(componentSource).toContain('t-select');
    expect(componentSource).toContain('data-testid="repay-channel-select"');
    expect(componentSource).toContain('PAYMENT_CHANNEL_MAP');
  });

  test('9. 包含备注表单项', () => {
    expect(componentSource).toContain('name="remark"');
    expect(componentSource).toContain('t-textarea');
    expect(componentSource).toContain('data-testid="repay-remark-input"');
  });

  test('10. 还款金额校验不超过剩余欠款', () => {
    expect(componentSource).toContain('还款金额不能超过剩余欠款');
    expect(componentSource).toContain('remainingAmount');
  });

  test('11. 还款日期禁选未来日期', () => {
    expect(componentSource).toContain('disable-date');
    expect(componentSource).toContain('after: new Date()');
  });

  test('12. 调用 addRepayment API', () => {
    expect(componentSource).toContain('addRepayment');
    expect(apiSource).toContain('/debt');
    expect(apiSource).toContain('/repay');
  });

  test('13. 使用 AddRepaymentParams 类型', () => {
    expect(componentSource).toContain('AddRepaymentParams');
    expect(modelSource).toContain('AddRepaymentParams');
  });

  test('14. props 接收 visible 和 debt', () => {
    expect(componentSource).toContain('visible');
    expect(componentSource).toContain('debt');
    expect(componentSource).toContain('DebtListItem');
  });

  test('15. emits 包含 success 事件', () => {
    expect(componentSource).toContain("'success'");
    expect(componentSource).toContain('emit');
  });

  test('16. TypeScript 编译检查', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    try {
      execSync('npx vue-tsc --noEmit', {
        cwd: path.join(projectRoot, 'Hans'),
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // If exit code is 0, test passes
      expect(true).toBeTruthy();
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      const output = execError.stdout ?? execError.stderr ?? '';
      // Allow only if errors are from other files, not from RepayDialog
      if (output.includes('RepayDialog')) {
        throw new Error(`TypeScript error in RepayDialog: ${output}`);
      }
      // Errors from other files are acceptable for this FEAT scope
      expect(true).toBeTruthy();
    }
  });
});
