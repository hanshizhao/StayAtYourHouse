import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

const RENTAL_PAGE = resolve(__dirname, '../../Hans/src/pages/housing/rental/index.vue');

test.describe('FEAT-112 租赁列表页 - leaseMonthsText', () => {
  const source = readFileSync(RENTAL_PAGE, 'utf-8');

  test('列定义使用 leaseMonthsText 且标题为「租期」', () => {
    expect(source).toMatch(/colKey:\s*['"]leaseMonthsText['"]/);
    expect(source).toMatch(/title:\s*['"]租期['"]/);
    expect(source).not.toMatch(/colKey:\s*['"]leaseTypeText['"]/);
  });

  test('模板 slot 使用 #leaseMonthsText', () => {
    expect(source).toMatch(/#leaseMonthsText/);
    expect(source).not.toMatch(/#leaseTypeText/);
  });

  test('模板中引用 row.leaseMonthsText', () => {
    expect(source).toMatch(/row\.leaseMonthsText/);
    expect(source).not.toMatch(/row\.leaseTypeText/);
  });

  test('不引用已删除的 LeaseType 枚举', () => {
    expect(source).not.toMatch(/LeaseType(?!Text)/);
  });
});
