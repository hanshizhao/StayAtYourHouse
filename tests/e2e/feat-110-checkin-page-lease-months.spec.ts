import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const CHECKIN_FILE = path.join(ROOT, 'Hans', 'src', 'pages', 'tenant', 'check-in.vue');

test.describe('FEAT-110: 更新入住页面', () => {
  const content = fs.readFileSync(CHECKIN_FILE, 'utf-8');

  test('模板使用 t-input-number 替代 t-radio-group', () => {
    // 不再使用 radio-group
    expect(content).not.toContain('t-radio-group');
    expect(content).not.toContain('LeaseTypeText');
    // 使用 input-number
    expect(content).toContain('t-input-number');
    expect(content).toContain('v-model="formData.leaseMonths"');
    expect(content).toContain(':min="1"');
    expect(content).toContain(':max="36"');
    expect(content).toContain('data-testid="lease-months"');
  });

  test('标签从"租期类型"改为"租期"', () => {
    expect(content).toContain('label="租期"');
    expect(content).not.toContain('label="租期类型"');
  });

  test('后缀显示"个月"', () => {
    expect(content).toContain('个月');
  });

  test('script 不再导入 LeaseTypeText 和 LeaseType', () => {
    expect(content).not.toContain("import { LeaseTypeText }");
    expect(content).not.toContain("LeaseType } from '@/utils/date'");
  });

  test('接口使用 leaseMonths: number', () => {
    expect(content).toMatch(/leaseMonths:\s*number/);
    expect(content).not.toContain('leaseType: LeaseType');
  });

  test('默认值 leaseMonths 为 1', () => {
    expect(content).toMatch(/leaseMonths:\s*1/);
    expect(content).not.toContain('LeaseType.Monthly');
  });

  test('calculateContractEndDate 使用 leaseMonths', () => {
    expect(content).toContain('calculateContractEndDate(formData.value.checkInDate, formData.value.leaseMonths)');
    expect(content).not.toContain('formData.value.leaseType');
  });

  test('提交参数使用 leaseMonths', () => {
    expect(content).toContain('leaseMonths: formData.value.leaseMonths');
    expect(content).not.toContain('leaseType: formData.value.leaseType');
  });

  test('表单验证规则包含 leaseMonths', () => {
    expect(content).toContain('leaseMonths:');
    expect(content).toContain('租期范围为1-36个月');
  });
});
