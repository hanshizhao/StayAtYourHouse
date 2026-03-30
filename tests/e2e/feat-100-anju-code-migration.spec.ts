import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

test.describe('FEAT-100: 数据库迁移 — AddAnJuCodeSubmittedToRentalRecord', () => {
  const migrationsDir = path.join(ROOT, 'Gentle/Gentle.Database.Migrations/Migrations');

  test('迁移文件已生成', () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f =>
      f.includes('AddAnJuCodeSubmittedToRentalRecord')
      && !f.endsWith('.Designer.cs'),
    );
    test.expect(migrationFile).toBeDefined();
  });

  test('迁移文件包含 AddColumn 操作添加 IsAnJuCodeSubmitted 列', () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f =>
      f.includes('AddAnJuCodeSubmittedToRentalRecord')
      && !f.endsWith('.Designer.cs'),
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    test.expect(content).toContain('AddColumn');
    test.expect(content).toContain('IsAnJuCodeSubmitted');
    test.expect(content).toContain('rental_record');
  });

  test('迁移列类型为 boolean，默认值为 false', () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f =>
      f.includes('AddAnJuCodeSubmittedToRentalRecord')
      && !f.endsWith('.Designer.cs'),
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    test.expect(content).toContain('defaultValue: false');
  });

  test('迁移文件包含 Down 方法用于回滚', () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f =>
      f.includes('AddAnJuCodeSubmittedToRentalRecord')
      && !f.endsWith('.Designer.cs'),
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    test.expect(content).toContain('DropColumn');
    test.expect(content).toContain('IsAnJuCodeSubmitted');
  });
});
