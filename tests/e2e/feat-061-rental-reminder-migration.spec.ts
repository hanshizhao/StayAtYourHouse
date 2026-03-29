/**
 * FEAT-061: 创建数据库迁移 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-061: 创建数据库迁移', () => {
  const projectRoot = path.join(__dirname, '../../');
  const migrationsDir = path.join(projectRoot, 'Gentle/Gentle.Database.Migrations/Migrations');

  test('1. 检查迁移文件存在', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f => 
      f.includes('AddRentalReminderAndDeferral') && f.endsWith('.cs')
    );
    expect(migrationFile).toBeTruthy();
  });

  test('2. 验证迁移包含表创建', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f =>
      f.includes('AddRentalReminderAndDeferral') && f.endsWith('.cs')
    );
    if (migrationFile) {
      const content = fs.readFileSync(path.join(migrationsDir, migrationFile), 'utf-8');
      // 迁移使用 snake_case 表名
      expect(content).toContain('rental_reminder');
      expect(content).toContain('rental_deferral');
      // 验证关键列
      expect(content).toContain('RentalRecordId');
      expect(content).toContain('RentalReminderId');
      expect(content).toContain('DeferredToDate');
    }
  });
});
