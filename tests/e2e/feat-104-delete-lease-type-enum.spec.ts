import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, describe } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GENTLE_ROOT = path.join(PROJECT_ROOT, 'Gentle');

describe('FEAT-104: 删除枚举 + 更新实体', () => {
  test('LeaseType.cs 枚举文件已删除', () => {
    const leaseTypePath = path.join(
      GENTLE_ROOT,
      'Gentle.Core',
      'Enums',
      'LeaseType.cs',
    );
    expect(fs.existsSync(leaseTypePath)).toBeFalsy();
  });

  test('RentalRecord 实体包含 LeaseMonths int 属性', () => {
    const rentalRecordPath = path.join(
      GENTLE_ROOT,
      'Gentle.Core',
      'Entities',
      'RentalRecord.cs',
    );
    const content = fs.readFileSync(rentalRecordPath, 'utf-8');

    // 验证 LeaseMonths 属性存在
    expect(content).toMatch(/public int LeaseMonths/);

    // 验证 Range(1, 36) 验证特性
    expect(content).toMatch(/\[Range\(1,\s*36/);

    // 验证默认值为 1
    expect(content).toMatch(/LeaseMonths.*=.*1/);

    // 验证旧的 LeaseType 枚举属性已移除
    expect(content).not.toMatch(/public LeaseType LeaseType/);

    // 验证仍保留 Gentle.Core.Enums using（DepositStatus/RentalStatus）
    expect(content).toMatch(/using Gentle\.Core\.Enums/);
  });

  test('Gentle.Core 项目独立编译成功（下游项目由 FEAT-105/106 修复）', () => {
    const result = execSync('dotnet build Gentle.Core/Gentle.Core.csproj', {
      cwd: GENTLE_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true,
    });
    expect(result).toContain('已成功生成');
    expect(result).toMatch(/0 个错误/);
  });
});
