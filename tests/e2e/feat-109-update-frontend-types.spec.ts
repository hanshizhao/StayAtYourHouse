import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');

test('FEAT-109: rentalModel.ts - LeaseType 枚举和 LeaseTypeText 已删除', () => {
  const content = fs.readFileSync(path.join(ROOT, 'Hans/src/api/model/rentalModel.ts'), 'utf-8');

  // LeaseType 枚举已删除
  expect(content).not.toContain('export enum LeaseType');
  expect(content).not.toContain('LeaseType.Monthly');
  expect(content).not.toContain('LeaseType.HalfYear');
  expect(content).not.toContain('LeaseType.Yearly');

  // LeaseTypeText 已删除
  expect(content).not.toContain('LeaseTypeText');

  // CheckInInput 使用 leaseMonths: number
  expect(content).toMatch(/leaseMonths:\s*number/);

  // RentalRecordDto 使用 leaseMonths + leaseMonthsText
  expect(content).toContain('leaseMonthsText: string');
});

test('FEAT-109: todoModel.ts - LeaseType 导入/导出已删除', () => {
  const content = fs.readFileSync(path.join(ROOT, 'Hans/src/api/model/todoModel.ts'), 'utf-8');

  // LeaseType 导入已删除
  expect(content).not.toContain("from './rentalModel'");

  // LeaseType/LeaseTypeText 导出已删除
  expect(content).not.toContain('export { LeaseType');
  expect(content).not.toContain('LeaseTypeText');

  // RenewRentalInput 使用 leaseMonths: number
  expect(content).toContain('leaseMonths: number');
  expect(content).not.toContain('leaseType: LeaseType');
});

test('FEAT-109: date.ts - calculateContractEndDate 使用 leaseMonths 参数', () => {
  const content = fs.readFileSync(path.join(ROOT, 'Hans/src/utils/date.ts'), 'utf-8');

  // LeaseType 导入/导出已删除
  expect(content).not.toContain("from '@/api/model/rentalModel'");

  // 函数签名使用 leaseMonths: number
  expect(content).toMatch(/leaseMonths:\s*number\s*\|\s*null\s*\|\s*undefined/);

  // 不再包含 switch/case 结构
  expect(content).not.toContain('switch');
  expect(content).not.toContain('LeaseType.Monthly');
  expect(content).not.toContain('LeaseType.HalfYear');
  expect(content).not.toContain('LeaseType.Yearly');

  // 使用简化的 dayjs 链式调用
  expect(content).toMatch(/\.add\(leaseMonths,\s*'month'\)\.subtract\(1,\s*'day'\)/);
});
