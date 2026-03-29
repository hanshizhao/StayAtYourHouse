/**
 * FEAT-052: 数据库迁移 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-052: 数据库迁移', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');
  const migrationsPath = path.join(gentlePath, 'Gentle.Database.Migrations/Migrations');

  test('1. 验证迁移文件已生成', async () => {
    // 查找最新的迁移文件
    const files = fs.readdirSync(migrationsPath);
    const migrationFiles = files.filter(f =>
      f.includes('RemoveBillAndAddUtilityBillRentalLink') ||
      f.includes('remove_bill_add_utility_bill_rental_link')
    );

    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  test('2. 验证迁移文件包含删除 bill 表', async () => {
    const files = fs.readdirSync(migrationsPath);
    const migrationFile = files.find(f =>
      f.includes('RemoveBillAndAddUtilityBillRentalLink') ||
      f.includes('remove_bill_add_utility_bill_rental_link')
    );

    if (migrationFile) {
      const content = fs.readFileSync(path.join(migrationsPath, migrationFile), 'utf-8');
      // 应包含删除表的语句
      expect(content.toLowerCase()).toContain('drop table');
    }
  });

  test('3. 验证迁移文件包含 rental_record_id 列', async () => {
    const files = fs.readdirSync(migrationsPath);
    const migrationFile = files.find(f =>
      f.includes('RemoveBillAndAddUtilityBillRentalLink') ||
      f.includes('remove_bill_add_utility_bill_rental_link')
    );

    if (migrationFile) {
      const content = fs.readFileSync(path.join(migrationsPath, migrationFile), 'utf-8');
      // 应包含 rental_record_id 列
      expect(content.toLowerCase()).toContain('rental_record_id');
    }
  });

  test('4. 验证编译通过', async () => {
    const result = execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
    const output = result.toString();
    // 支持中文和英文环境
    expect(output.includes('Build succeeded') || output.includes('已成功生成')).toBeTruthy();
  });
});
