/**
 * FEAT-173: 数据库迁移 AddDebtTables - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. 迁移文件存在性（Up 和 Down 方法）
 * 2. 迁移文件包含 debt 和 debt_repayment 两张表的创建
 * 3. debt 表包含 DebtorId FK 指向 Tenant 表
 * 4. debt_repayment 表包含 DebtId FK 指向 debt 表
 * 5. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const projectRoot = path.resolve(__dirname, '../..');
const gentleRoot = path.join(projectRoot, 'Gentle');
const migrationsDir = path.join(gentleRoot, 'Gentle.Database.Migrations', 'Migrations');

test.describe('FEAT-173: 数据库迁移 AddDebtTables', () => {
  let migrationFile: string | undefined;
  let migrationContent: string;

  test.beforeAll(() => {
    const files = fs.readdirSync(migrationsDir);
    migrationFile = files.find(f => f.includes('AddDebtTables') && !f.endsWith('.Designer.cs'));
    if (migrationFile) {
      migrationContent = fs.readFileSync(path.join(migrationsDir, migrationFile), 'utf-8');
    }
  });

  test('迁移文件存在', () => {
    expect(migrationFile).toBeDefined();
    const filePath = path.join(migrationsDir, migrationFile!);
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('迁移文件包含 debt 表创建', () => {
    expect(migrationContent).toContain('CreateTable');
    expect(migrationContent).toContain('"debt"');
    expect(migrationContent).toContain('DebtorId');
    expect(migrationContent).toContain('TotalAmount');
    expect(migrationContent).toContain('Status');
  });

  test('迁移文件包含 debt_repayment 表创建', () => {
    expect(migrationContent).toContain('"debt_repayment"');
    expect(migrationContent).toContain('DebtId');
    expect(migrationContent).toContain('Amount');
    expect(migrationContent).toContain('PaymentDate');
    expect(migrationContent).toContain('PaymentChannel');
  });

  test('debt 表有指向 Tenant 的 FK', () => {
    expect(migrationContent).toContain('FK_debt_Tenant_DebtorId');
    expect(migrationContent).toContain('principalTable: "Tenant"');
  });

  test('debt_repayment 表有指向 debt 的 FK', () => {
    expect(migrationContent).toContain('FK_debt_repayment_debt_DebtId');
    expect(migrationContent).toContain('principalTable: "debt"');
  });

  test('迁移文件包含索引创建', () => {
    expect(migrationContent).toContain('IX_debt_DebtorId');
    expect(migrationContent).toContain('IX_debt_repayment_DebtId');
  });

  test('迁移文件包含 Down 方法（回滚）', () => {
    expect(migrationContent).toContain('DropTable');
    expect(migrationContent).toContain('"debt_repayment"');
  });

  test('后端项目构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: gentleRoot,
      encoding: 'utf-8',
      timeout: 60000,
    });
    expect(result).toContain('已成功生成');
    expect(result).not.toContain('error ');
  });
});
