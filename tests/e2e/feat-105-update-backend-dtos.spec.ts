import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, describe } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');
const DTO_DIR = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos');

const checkInInputPath = path.join(DTO_DIR, 'RentalRecord', 'CheckInInput.cs');
const rentalRecordDtoPath = path.join(DTO_DIR, 'RentalRecord', 'RentalRecordDto.cs');
const renewRentalInputPath = path.join(DTO_DIR, 'Rental', 'RenewRentalInput.cs');

describe('FEAT-105: 更新后端 DTO - LeaseType 改为 LeaseMonths', () => {
  describe('CheckInInput.cs', () => {
    test('文件存在', () => {
      expect(fs.existsSync(checkInInputPath)).toBeTruthy();
    });

    test('包含 LeaseMonths int 属性', () => {
      const content = fs.readFileSync(checkInInputPath, 'utf-8');
      expect(content).toMatch(/public int LeaseMonths\s*\{[^}]*\}/);
    });

    test('LeaseMonths 默认值为 1', () => {
      const content = fs.readFileSync(checkInInputPath, 'utf-8');
      expect(content).toMatch(/public int LeaseMonths.*=.*1/);
    });

    test('LeaseMonths 有 Range(1, 36) 验证', () => {
      const content = fs.readFileSync(checkInInputPath, 'utf-8');
      expect(content).toMatch(/\[Range\(1,\s*36/);
    });

    test('不包含 LeaseType 引用', () => {
      const content = fs.readFileSync(checkInInputPath, 'utf-8');
      expect(content).not.toContain('LeaseType');
    });

    test('不引用 Gentle.Core.Enums', () => {
      const content = fs.readFileSync(checkInInputPath, 'utf-8');
      expect(content).not.toContain('using Gentle.Core.Enums');
    });
  });

  describe('RentalRecordDto.cs', () => {
    test('文件存在', () => {
      expect(fs.existsSync(rentalRecordDtoPath)).toBeTruthy();
    });

    test('包含 LeaseMonths int 属性', () => {
      const content = fs.readFileSync(rentalRecordDtoPath, 'utf-8');
      expect(content).toMatch(/public int LeaseMonths\s*\{[^}]*\}/);
    });

    test('包含 LeaseMonthsText 计算属性', () => {
      const content = fs.readFileSync(rentalRecordDtoPath, 'utf-8');
      expect(content).toMatch(/public string LeaseMonthsText\s*=>/);
      expect(content).toContain('LeaseMonths}个月');
    });

    test('不包含 LeaseType 属性', () => {
      const content = fs.readFileSync(rentalRecordDtoPath, 'utf-8');
      expect(content).not.toMatch(/public\s+\w*\s*LeaseType\s*\{/);
    });

    test('不包含 LeaseTypeText switch 表达式', () => {
      const content = fs.readFileSync(rentalRecordDtoPath, 'utf-8');
      expect(content).not.toContain('LeaseTypeText');
    });

    test('保留 Gentle.Core.Enums 引用（DepositStatus/RentalStatus）', () => {
      const content = fs.readFileSync(rentalRecordDtoPath, 'utf-8');
      expect(content).toContain('using Gentle.Core.Enums');
    });
  });

  describe('RenewRentalInput.cs', () => {
    test('文件存在', () => {
      expect(fs.existsSync(renewRentalInputPath)).toBeTruthy();
    });

    test('包含 LeaseMonths int 属性', () => {
      const content = fs.readFileSync(renewRentalInputPath, 'utf-8');
      expect(content).toMatch(/public int LeaseMonths\s*\{[^}]*\}/);
    });

    test('LeaseMonths 默认值为 1', () => {
      const content = fs.readFileSync(renewRentalInputPath, 'utf-8');
      expect(content).toMatch(/public int LeaseMonths.*=.*1/);
    });

    test('LeaseMonths 有 Range(1, 36) 验证', () => {
      const content = fs.readFileSync(renewRentalInputPath, 'utf-8');
      expect(content).toMatch(/\[Range\(1,\s*36/);
    });

    test('不包含 LeaseType 引用', () => {
      const content = fs.readFileSync(renewRentalInputPath, 'utf-8');
      expect(content).not.toContain('LeaseType');
    });

    test('不引用 Gentle.Core.Enums', () => {
      const content = fs.readFileSync(renewRentalInputPath, 'utf-8');
      expect(content).not.toContain('using Gentle.Core.Enums');
    });
  });

  describe('DTO 目录无残留 LeaseType 引用', () => {
    test('Dtos 目录下所有 .cs 文件不包含 LeaseType', () => {
      const csFiles = findCsFilesRecursive(DTO_DIR);
      const violatingFiles = csFiles.filter((f) => {
        const content = fs.readFileSync(f, 'utf-8');
        return content.includes('LeaseType');
      });

      expect(
        violatingFiles,
        `以下文件仍包含 LeaseType: ${violatingFiles.join(', ')}`,
      ).toEqual([]);
    });
  });

  describe('Gentle.Core 项目可独立编译', () => {
    test('dotnet build Gentle.Core 成功', () => {
      const result = execSync(
        'dotnet build Gentle.Core/Gentle.Core.csproj --no-restore',
        {
          cwd: path.join(ROOT, 'Gentle'),
          encoding: 'utf-8',
          timeout: 60_000,
        },
      );
      expect(result).toContain('成功');
    });
  });
});

function findCsFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findCsFilesRecursive(fullPath));
    } else if (entry.name.endsWith('.cs')) {
      results.push(fullPath);
    }
  }
  return results;
}
