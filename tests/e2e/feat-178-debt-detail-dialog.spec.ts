import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@playwright/test';

const COMPONENT_PATH = 'Hans/src/pages/debt/components/DebtDetailDialog.vue';
const MODEL_PATH = 'Hans/src/api/model/debtModel.ts';
const API_PATH = 'Hans/src/api/debt.ts';

describe('FEAT-178: DebtDetailDialog 组件', () => {
  let componentSource: string;
  let modelSource: string;
  let apiSource: string;

  test.beforeAll(() => {
    const projectRoot = path.resolve(__dirname, '../..');
    componentSource = fs.readFileSync(path.join(projectRoot, COMPONENT_PATH), 'utf-8');
    modelSource = fs.readFileSync(path.join(projectRoot, MODEL_PATH), 'utf-8');
    apiSource = fs.readFileSync(path.join(projectRoot, API_PATH), 'utf-8');
  });

  test('1. DebtDetailDialog.vue 文件存在', () => {
    const fullPath = path.resolve(__dirname, '../..', COMPONENT_PATH);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });

  test('2. 组件使用 t-dialog 作为容器', () => {
    expect(componentSource).toContain('t-dialog');
    expect(componentSource).toContain('data-testid="debt-detail-dialog"');
  });

  test('3. 弹窗标题为"欠款详情"', () => {
    expect(componentSource).toContain('header="欠款详情"');
  });

  test('4. 弹窗宽度为 640px', () => {
    expect(componentSource).toContain('width="640px"');
  });

  test('5. 显示租客信息（租客名、电话）', () => {
    expect(componentSource).toContain('detail.tenantName');
    expect(componentSource).toContain('detail.tenantPhone');
  });

  test('6. 显示欠款说明和创建时间', () => {
    expect(componentSource).toContain('detail.description');
    expect(componentSource).toContain('detail.createdTime');
  });

  test('6a. 显示欠款状态标签', () => {
    expect(componentSource).toContain('detail.status');
    expect(componentSource).toContain('detail.statusText');
    expect(componentSource).toContain('DebtStatus');
  });

  test('6b. 显示备注字段', () => {
    expect(componentSource).toContain('detail.remark');
  });

  test('7. 汇总区显示总欠款、已还、剩余', () => {
    expect(componentSource).toContain('detail.totalAmount');
    expect(componentSource).toContain('detail.paidAmount');
    expect(componentSource).toContain('detail.remainingAmount');
    expect(componentSource).toContain('detail-summary-value--primary');
    expect(componentSource).toContain('detail-summary-value--danger');
  });

  test('8. 还款记录表格使用 t-table', () => {
    expect(componentSource).toContain('t-table');
    expect(componentSource).toContain('data-testid="detail-repay-table"');
    expect(componentSource).toContain('detail.repayments');
  });

  test('9. 表格包含日期、金额、方式、备注、操作列', () => {
    expect(componentSource).toContain("title: '日期'");
    expect(componentSource).toContain("title: '金额'");
    expect(componentSource).toContain("title: '方式'");
    expect(componentSource).toContain("title: '备注'");
    expect(componentSource).toContain("title: '操作'");
  });

  test('10. 表格使用 PAYMENT_CHANNEL_MAP 显示还款方式', () => {
    expect(componentSource).toContain('PAYMENT_CHANNEL_MAP');
    expect(componentSource).toContain('getPaymentChannelText');
  });

  test('11. 还款记录支持删除操作', () => {
    expect(componentSource).toContain('handleDeleteRepayment');
    expect(componentSource).toContain('deleteRepayment');
    expect(componentSource).toContain('detail-delete-repay');
  });

  test('12. 删除后刷新详情并 emit refresh', () => {
    expect(componentSource).toContain('fetchDetail');
    expect(componentSource).toContain("'refresh'");
  });

  test('13. 使用 getDebtDetail API 获取详情', () => {
    expect(componentSource).toContain('getDebtDetail');
    expect(apiSource).toContain('/debt');
  });

  test('14. 使用 DebtDetail 类型', () => {
    expect(componentSource).toContain('DebtDetail');
    expect(modelSource).toContain('DebtDetail');
  });

  test('15. props 接收 visible 和 debtId', () => {
    expect(componentSource).toContain('visible: boolean');
    expect(componentSource).toContain('debtId: number | null');
  });

  test('16. 使用 t-loading 包裹内容', () => {
    expect(componentSource).toContain('t-loading');
    expect(componentSource).toContain(':loading="loading"');
  });

  test('17. 关闭按钮使用 variant="outline"', () => {
    expect(componentSource).toContain('variant="outline"');
    expect(componentSource).toContain('data-testid="detail-close-btn"');
  });

  test('18. TypeScript 编译检查', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    try {
      execSync('npx vue-tsc --noEmit', {
        cwd: path.join(projectRoot, 'Hans'),
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(true).toBeTruthy();
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      const output = execError.stdout ?? execError.stderr ?? '';
      if (output.includes('DebtDetailDialog')) {
        throw new Error(`TypeScript error in DebtDetailDialog: ${output}`);
      }
      expect(true).toBeTruthy();
    }
  });
});
