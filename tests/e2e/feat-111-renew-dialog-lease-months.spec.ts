import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');
const VUE_FILE = path.join(ROOT, 'Hans/src/pages/dashboard/base/components/RenewRentalDialog.vue');

test.describe('FEAT-111: 更新续租对话框 (LeaseType → LeaseMonths)', () => {
  test('RenewRentalDialog.vue 文件存在', () => {
    expect(fs.existsSync(VUE_FILE)).toBeTruthy();
  });

  const content = fs.readFileSync(VUE_FILE, 'utf-8');

  test('模板使用 t-input-number 替代 t-select', () => {
    // 不应包含 t-select（排除 upload 的 select）
    expect(content).not.toMatch(/<t-select\s+v-model="formData\.lease/);
    // 应包含 t-input-number 绑定 leaseMonths
    expect(content).toMatch(/<t-input-number\s+v-model="formData\.leaseMonths"/);
  });

  test('t-input-number 包含 min=1 max=36 约束', () => {
    expect(content).toMatch(/:min="1"/);
    expect(content).toMatch(/:max="36"/);
  });

  test('t-input-number 包含 data-testid="lease-months"', () => {
    expect(content).toMatch(/data-testid="lease-months"/);
  });

  test('表单项 name="leaseMonths"', () => {
    expect(content).toMatch(/name="leaseMonths"/);
  });

  test('label 为"租期月数"', () => {
    expect(content).toMatch(/label="租期月数"/);
  });

  test('不导入 LeaseType', () => {
    expect(content).not.toMatch(/import.*LeaseType.*from/);
  });

  test('不包含 leaseTypeOptions computed', () => {
    expect(content).not.toMatch(/leaseTypeOptions/);
  });

  test('formData 默认值使用 leaseMonths: 1', () => {
    expect(content).toMatch(/leaseMonths:\s*1/);
  });

  test('不包含 LeaseType.Monthly 引用', () => {
    expect(content).not.toMatch(/LeaseType\.Monthly/);
    expect(content).not.toMatch(/LeaseType\.HalfYear/);
    expect(content).not.toMatch(/LeaseType\.Yearly/);
  });

  test('验证规则包含 leaseMonths 范围校验 (1-36)', () => {
    expect(content).toMatch(/leaseMonths:\s*\[/);
    expect(content).toMatch(/val\s*<\s*1\s*\|\|\s*val\s*>\s*36/);
  });

  test('TypeScript 类型检查通过', () => {
    const result = execSync('cd Hans && npm run build:type', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe',
    });
    // build:type 输出中不应包含错误
    expect(result).not.toMatch(/error TS/);
  });
});
