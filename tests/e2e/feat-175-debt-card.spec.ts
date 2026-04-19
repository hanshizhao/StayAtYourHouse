/**
 * FEAT-175: 前端 DebtCard 组件 - 欠款卡片展示
 * 类型: static
 *
 * 测试覆盖：
 * 1. DebtCard.vue 文件存在 + 模板结构 + 类型使用 + TDesign 组件 + scoped 样式
 * 2. debtModel.ts 包含 DebtListItem 所需字段
 * 3. TypeScript 编译通过（无 debt 相关错误）
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-175: 前端 DebtCard 组件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');
  const componentFile = path.join(hansPath, 'src/pages/debt/components/DebtCard.vue');
  const modelFile = path.join(hansPath, 'src/api/model/debtModel.ts');

  let componentContent: string;
  let modelContent: string;

  test.beforeAll(() => {
    componentContent = fs.readFileSync(componentFile, 'utf-8');
    modelContent = fs.readFileSync(modelFile, 'utf-8');
  });

  // ==================== DebtCard.vue 测试 ====================

  test('1. DebtCard.vue 文件存在', async () => {
    expect(fs.existsSync(componentFile)).toBeTruthy();
  });

  test('2. DebtCard.vue 包含必要的模板结构', async () => {
    // 租客姓名和电话
    expect(componentContent).toContain('tenantName');
    expect(componentContent).toContain('tenantPhone');

    // 状态标签
    expect(componentContent).toContain('statusTheme');
    expect(componentContent).toContain('statusText');

    // 进度条
    expect(componentContent).toContain('paidPercentage');
    expect(componentContent).toContain('paidAmount');
    expect(componentContent).toContain('totalAmount');

    // 操作按钮
    expect(componentContent).toContain("emit('repay'");
    expect(componentContent).toContain("emit('detail'");
    expect(componentContent).toContain("emit('edit'");
    expect(componentContent).toContain("emit('delete'");
  });

  test('3. DebtCard.vue 使用 DebtListItem 类型', async () => {
    expect(componentContent).toContain('DebtListItem');
  });

  test('4. DebtCard.vue 导入 DebtStatus 枚举', async () => {
    expect(componentContent).toContain('DebtStatus');
  });

  test('5. DebtCard.vue 使用 TDesign 组件', async () => {
    expect(componentContent).toContain('t-card');
    expect(componentContent).toContain('t-tag');
    expect(componentContent).toContain('t-progress');
    expect(componentContent).toContain('t-button');
    expect(componentContent).toContain('t-space');
  });

  test('6. DebtCard.vue 使用 scoped 样式', async () => {
    expect(componentContent).toContain('scoped');
    expect(componentContent).toContain('debt-card');
  });

  // ==================== debtModel.ts 字段测试 ====================

  test('7. debtModel.ts 包含 DebtListItem 所需字段', async () => {
    expect(modelContent).toContain('tenantName');
    expect(modelContent).toContain('tenantPhone');
    expect(modelContent).toContain('totalAmount');
    expect(modelContent).toContain('paidAmount');
    expect(modelContent).toContain('remainingAmount');
    expect(modelContent).toContain('status');
    expect(modelContent).toContain('statusText');
  });

  // ==================== TypeScript 编译测试 ====================

  test('8. TypeScript 编译无 debt 相关错误', async () => {
    let output = '';
    try {
      output = execSync('npx vue-tsc --noEmit 2>&1', {
        cwd: hansPath,
        encoding: 'utf-8',
        timeout: 120000,
      });
    } catch (e: any) {
      output = e.stdout ?? '';
    }

    expect(output).not.toMatch(/debt/i);
  });
});
