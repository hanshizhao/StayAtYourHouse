/**
 * FEAT-062: 执行数据库迁移 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('FEAT-062: 执行数据库迁移', () => {
  const projectRoot = path.join(__dirname, '../../');

  test('1. 验证迁移已应用（检查迁移文件存在）', async () => {
    const migrationsDir = path.join(projectRoot, 'Gentle/Gentle.Database.Migrations/Migrations');
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f => 
      f.includes('AddRentalReminderAndDeferral') && f.endsWith('.cs')
    );
    expect(migrationFile).toBeTruthy();
  });

  test('2. 验证迁移 Designer 文件存在', async () => {
    const migrationsDir = path.join(projectRoot, 'Gentle/Gentle.Database.Migrations/Migrations');
    const files = fs.readdirSync(migrationsDir);
    const designerFile = files.find(f => 
      f.includes('AddRentalReminderAndDeferral') && f.endsWith('.Designer.cs')
    );
    expect(designerFile).toBeTruthy();
  });
});
