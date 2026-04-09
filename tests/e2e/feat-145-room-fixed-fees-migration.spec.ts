/**
 * FEAT-145: Room 固定费用 - 数据库迁移 - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. RemoveRoomCostPrice 迁移文件存在（合并了 DropColumn CostPrice 和 AddColumn 4 个固定费用）
 * 2. 迁移 Up 方法包含 DropColumn CostPrice 操作
 * 3. 迁移 Up 方法包含 4 个 AddColumn 操作（ElevatorFee、PropertyFee、InternetFee、OtherFees）
 * 4. 所有列类型为 decimal(10,2) 且 nullable
 * 5. 迁移 Down 方法包含 4 个 DropColumn 操作和 AddColumn CostPrice
 * 6. 迁移不包含非预期的 UpdateData 操作
 * 7. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-145: Room 固定费用 - 数据库迁移', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');
  const migrationsDir = path.join(gentlePath, 'Gentle.Database.Migrations/Migrations');

  const fixedFeeFields = ['ElevatorFee', 'PropertyFee', 'InternetFee', 'OtherFees'];

  // 查找 RemoveRoomCostPrice 迁移文件（合并了固定费用添加）
  function findMigrationFile(): string | null {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f => f.includes('RemoveRoomCostPrice') && f.endsWith('.cs') && !f.endsWith('.Designer.cs'));
    return migrationFile ? path.join(migrationsDir, migrationFile) : null;
  }

  // ==================== 迁移文件存在性测试 ====================

  test('RemoveRoomCostPrice 迁移文件存在', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile, '应存在 RemoveRoomCostPrice 迁移文件').not.toBeNull();
  });

  // ==================== Up 方法 - DropColumn CostPrice 测试 ====================

  test('迁移 Up 方法不包含 DropColumn CostPrice 操作（已由旧迁移完成）', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    const upMethod = content.match(/protected override void Up\([\s\S]*?protected override void Down/)?.[0];
    expect(upMethod, '应存在 Up 方法').toBeTruthy();
    expect(upMethod!, 'Up 方法不应包含 DropColumn 操作').not.toContain('DropColumn');
  });

  // ==================== Up 方法 - AddColumn 操作测试 ====================

  test('迁移 Up 方法包含 4 个 AddColumn 操作', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    for (const field of fixedFeeFields) {
      expect(content, `Up 方法应包含 AddColumn("${field}")操作`).toContain(`name: "${field}"`);
      expect(content, 'Up 方法应包含 AddColumn 操作').toContain('AddColumn<decimal>');
    }
  });

  test('所有固定费用列类型为 decimal(10,2)', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    const upMethod = content.match(/protected override void Up\([\s\S]*?protected override void Down/)?.[0];
    expect(upMethod, '应存在 Up 方法').toBeTruthy();

    const addColumnBlocks = upMethod!.match(/AddColumn<decimal>\([\s\S]*?\);/g);
    expect(addColumnBlocks, '应至少有 4 个 AddColumn 调用').toHaveLength(4);

    for (const block of addColumnBlocks!) {
      expect(block, '列类型应为 decimal(10,2)').toContain('decimal(10,2)');
    }
  });

  test('所有固定费用列为 nullable', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    const upMethod = content.match(/protected override void Up\([\s\S]*?protected override void Down/)?.[0];
    expect(upMethod, '应存在 Up 方法').toBeTruthy();

    const addColumnCalls = upMethod!.match(/AddColumn<decimal>\([\s\S]*?\);/g);
    expect(addColumnCalls, 'Up 方法应有 4 个 AddColumn 调用').toHaveLength(4);

    for (const call of addColumnCalls!) {
      expect(call, '列应为 nullable').toContain('nullable: true');
    }
  });

  // ==================== 非预期变更检测 ====================

  test('迁移不包含非预期的 UpdateData 操作', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    expect(content, '不应包含 UpdateData 操作').not.toContain('UpdateData');
    expect(content, '不应引用 User 表').not.toContain('"User"');
  });

  // ==================== Down 方法 - 恢复操作测试 ====================

  test('迁移 Down 方法包含 4 个 DropColumn', () => {
    const migrationFile = findMigrationFile();
    expect(migrationFile).not.toBeNull();
    const content = fs.readFileSync(migrationFile!, 'utf-8');

    const downMethodMatch = content.match(/protected override void Down\b[\s\S]*?\r?\n\s{8}\}/);
    expect(downMethodMatch, '应存在 Down 方法').toBeTruthy();

    const downMethod = downMethodMatch![0];

    // Down 方法应有 4 个 DropColumn（固定费用列）
    for (const field of fixedFeeFields) {
      expect(downMethod, `Down 方法应包含 DropColumn("${field}")`).toContain(`name: "${field}"`);
    }

    const dropColumnCount = (downMethod.match(/DropColumn\(/g) || []).length;
    expect(dropColumnCount, 'Down 方法应有 4 个 DropColumn 调用').toBe(4);
  });

  // ==================== 构建验证 ====================

  test('dotnet build 构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: gentlePath,
      encoding: 'utf-8',
      timeout: 120000,
    });
    expect(result).toContain('0 个错误');
  });
});
