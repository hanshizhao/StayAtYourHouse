import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const MIGRATIONS_DIR = path.join(GENTLE, 'Gentle.Database.Migrations', 'Migrations');

test.describe('FEAT-120: 数据库迁移', () => {
  test('迁移文件 AddMaintenanceRecord 存在', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddMaintenanceRecord') && !f.endsWith('.Designer.cs'));
    expect(migrationFile).toBeDefined();
  });

  test('迁移创建 maintenance_record 表', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddMaintenanceRecord') && !f.endsWith('.Designer.cs'));
    const filePath = path.join(MIGRATIONS_DIR, migrationFile!);
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('CreateTable');
    expect(content).toContain('"maintenance_record"');
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

  test('迁移包含 RoomId 索引', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddMaintenanceRecord') && !f.endsWith('.Designer.cs'));
    const filePath = path.join(MIGRATIONS_DIR, migrationFile!);
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('CreateIndex');
    expect(content).toContain('IX_maintenance_record_RoomId');
  });

  test('迁移包含 Room 外键', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddMaintenanceRecord') && !f.endsWith('.Designer.cs'));
    const filePath = path.join(MIGRATIONS_DIR, migrationFile!);
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('FK_maintenance_record_Room_RoomId');
    expect(content).toContain('principalTable: "Room"');
    expect(content).toContain('principalColumn: "Id"');
  });

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result.includes('Build succeeded') || result.includes('已成功生成')).toBeTruthy();
  });
});
