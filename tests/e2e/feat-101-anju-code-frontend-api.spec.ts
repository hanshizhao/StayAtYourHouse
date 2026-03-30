import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');
const modelFile = path.join(ROOT, 'Hans/src/api/model/rentalModel.ts');
const rentalApiFile = path.join(ROOT, 'Hans/src/api/rental.ts');

test.describe('FEAT-101: 前端类型与 API — 新增 confirmAnjuCode', () => {
  const modelContent = fs.readFileSync(modelFile, 'utf-8');
  const apiContent = fs.readFileSync(rentalApiFile, 'utf-8');

  test.describe('rentalModel.ts — isAnJuCodeSubmitted 字段', () => {
    test('文件存在', () => {
      test.expect(fs.existsSync(modelFile)).toBeTruthy();
    });

    test('RentalRecordDto 接口包含 isAnJuCodeSubmitted 字段', () => {
      const dtoMatch = modelContent.match(/export interface RentalRecordDto \{[\s\S]*?isAnJuCodeSubmitted:\s*boolean/);
      test.expect(dtoMatch).not.toBeNull();
    });

    test('isAnJuCodeSubmitted 位于 createdTime 和 utilityBills 之间', () => {
      const order = modelContent.indexOf('createdTime') < modelContent.indexOf('isAnJuCodeSubmitted')
        && modelContent.indexOf('isAnJuCodeSubmitted') < modelContent.indexOf('utilityBills');
      test.expect(order).toBeTruthy();
    });
  });

  test.describe('rental.ts — Api 常量与 confirmAnjuCode 函数', () => {
    test('文件存在', () => {
      test.expect(fs.existsSync(rentalApiFile)).toBeTruthy();
    });

    test('Api 常量包含 ConfirmAnJuCode 路径', () => {
      test.expect(apiContent).toContain("ConfirmAnJuCode: '/rental/confirm-anju-code'");
    });

    test('导出 confirmAnjuCode 函数', () => {
      const fnMatch = apiContent.match(/export function confirmAnjuCode\s*\(\s*id:\s*number\s*\)/);
      test.expect(fnMatch).not.toBeNull();
    });

    test('confirmAnjuCode 使用 POST 方法调用 ConfirmAnJuCode 路径', () => {
      test.expect(apiContent).toContain('request.post<RentalRecordDto>');
      test.expect(apiContent).toContain('Api.ConfirmAnJuCode');
    });
  });
});
