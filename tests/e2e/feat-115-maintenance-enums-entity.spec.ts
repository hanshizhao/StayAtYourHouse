import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const ENUMS_DIR = path.join(GENTLE, 'Gentle.Core', 'Enums');
const ENTITIES_DIR = path.join(GENTLE, 'Gentle.Core', 'Entities');

test.describe('FEAT-115: 后端枚举和实体', () => {
  test('MaintenancePriority 枚举文件存在', () => {
    const filePath = path.join(ENUMS_DIR, 'MaintenancePriority.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('enum MaintenancePriority');
    expect(content).toContain('Urgent = 0');
    expect(content).toContain('Normal = 1');
    expect(content).toContain('Low = 2');
  });

  test('MaintenanceStatus 枚举文件存在', () => {
    const filePath = path.join(ENUMS_DIR, 'MaintenanceStatus.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('enum MaintenanceStatus');
    expect(content).toContain('Pending = 0');
    expect(content).toContain('InProgress = 1');
    expect(content).toContain('Completed = 2');
  });

  test('TodoType 枚举包含 Maintenance = 2', () => {
    const filePath = path.join(ENUMS_DIR, 'TodoType.cs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Maintenance = 2');
  });

  test('MaintenanceRecord 实体文件存在', () => {
    const filePath = path.join(ENTITIES_DIR, 'MaintenanceRecord.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class MaintenanceRecord : Entity<int>');
    expect(content).toContain('[Table("maintenance_record")]');
    expect(content).toContain('RoomId');
    expect(content).toContain('Description');
    expect(content).toContain('Priority');
    expect(content).toContain('Status');
    expect(content).toContain('ReportDate');
    expect(content).toContain('CompletedDate');
    expect(content).toContain('Cost');
    expect(content).toContain('RepairPerson');
    expect(content).toContain('RepairPhone');
    expect(content).toContain('Images');
    expect(content).toContain('Remark');
  });

  test('Room 实体包含 MaintenanceRecords 导航属性', () => {
    const filePath = path.join(ENTITIES_DIR, 'Room.cs');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('ICollection<MaintenanceRecord> MaintenanceRecords');
  });

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    // 兼容中英文环境：Build succeeded / 已成功生成
    expect(result.includes('Build succeeded') || result.includes('已成功生成')).toBeTruthy();
  });
});
