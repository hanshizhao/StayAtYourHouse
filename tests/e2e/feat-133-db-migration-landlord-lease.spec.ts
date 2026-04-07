import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const MIGRATIONS_DIR = path.join(GENTLE, 'Gentle.Database.Migrations', 'Migrations');

describe('FEAT-133: 数据库迁移 - LandlordLease', () => {
  test('迁移文件已生成', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddLandlordLease') && !f.endsWith('.Designer.cs'));
    expect(migrationFile).toBeDefined();
  });

  test('迁移包含创建 LandlordLease 表', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddLandlordLease') && !f.endsWith('.Designer.cs'));
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, migrationFile!), 'utf-8');
    expect(content).toContain('CreateTable');
    expect(content).toContain('"LandlordLease"');
  });

  test('RoomId 列有唯一索引', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddLandlordLease') && !f.endsWith('.Designer.cs'));
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, migrationFile!), 'utf-8');
    expect(content).toContain('IX_LandlordLease_RoomId');
    expect(content).toContain('unique: true');
  });

  test('RoomId 外键指向 Room 表，级联删除', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const migrationFile = files.find(f => f.includes('AddLandlordLease') && !f.endsWith('.Designer.cs'));
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, migrationFile!), 'utf-8');
    expect(content).toContain('FK_LandlordLease_Room_RoomId');
    expect(content).toContain('ReferentialAction.Cascade');
  });

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result).toContain('已成功生成');
    expect(result).toContain('0 个错误');
  });
});
