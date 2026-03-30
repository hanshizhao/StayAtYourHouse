import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, describe, beforeAll } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');
const GENTLE = path.join(ROOT, 'Gentle');

describe('FEAT-106: 更新后端服务层', () => {
  const rentalRecordServicePath = path.join(
    GENTLE,
    'Gentle.Application/Services/RentalRecordService.cs',
  );
  const rentalReminderServicePath = path.join(
    GENTLE,
    'Gentle.Application/Services/RentalReminderService.cs',
  );

  describe('RentalRecordService.cs', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(rentalRecordServicePath, 'utf-8');
    });

    test('CalculateContractEndDate 方法接受 int leaseMonths 参数', () => {
      expect(content).toContain(
        'CalculateContractEndDate(DateTime checkInDate, int leaseMonths)',
      );
    });

    test('CalculateContractEndDate 使用 AddMonths(leaseMonths)', () => {
      expect(content).toContain('checkInDate.AddMonths(leaseMonths).AddDays(-1)');
    });

    test('不再包含 LeaseType switch 分支', () => {
      expect(content).not.toContain('LeaseType.Monthly');
      expect(content).not.toContain('LeaseType.HalfYear');
      expect(content).not.toContain('LeaseType.Yearly');
    });

    test('CheckInAsync 使用 LeaseMonths', () => {
      expect(content).toContain('input.LeaseMonths');
      expect(content).toContain('LeaseMonths = input.LeaseMonths');
    });

    test('不再包含 LeaseType = input.LeaseType 引用', () => {
      expect(content).not.toContain('LeaseType = input.');
    });
  });

  describe('RentalReminderService.cs', () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(rentalReminderServicePath, 'utf-8');
    });

    test('续租创建新记录使用 LeaseMonths', () => {
      expect(content).toContain('LeaseMonths = input.LeaseMonths');
    });

    test('不再包含 LeaseType = input.LeaseType 引用', () => {
      expect(content).not.toContain('LeaseType = input.LeaseType');
    });
  });

  describe('编译验证', () => {
    test('Gentle.Application 项目编译成功', () => {
      expect(() => {
        execSync('dotnet build Gentle.Application/Gentle.Application.csproj --no-restore', {
          cwd: GENTLE,
          stdio: 'pipe',
        });
      }).not.toThrow();
    });
  });
});
