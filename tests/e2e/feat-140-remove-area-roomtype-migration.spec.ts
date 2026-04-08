/**
 * FEAT-140: 数据库迁移 - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. 迁移文件存在
 * 2. 迁移 Up 方法包含 DropColumn("Area", "Room")
 * 3. 迁移 Up 方法包含 DropColumn("RoomType", "Room")
 * 4. 迁移 Down 方法包含 AddColumn("Area")
 * 5. 迁移 Down 方法包含 AddColumn("RoomType")
 * 6. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-140: 数据库迁移', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const migrationsDir = path.join(serverPath, 'Gentle.Database.Migrations/Migrations');

  // ==================== 查找迁移文件 ====================

  test('1. 迁移文件 RemoveRoomAreaAndRoomType 存在', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    expect(migrationFile).toBeDefined();
  });

  // ==================== 迁移内容验证 ====================

  test('2. Up 方法包含 DropColumn("Area", "Room")', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    expect(content).toContain('DropColumn');
    expect(content).toMatch(/name:\s*"Area"/);
    expect(content).toMatch(/table:\s*"Room"/);
  });

  test('3. Up 方法包含 DropColumn("RoomType", "Room")', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    expect(content).toContain('DropColumn');
    expect(content).toMatch(/name:\s*"RoomType"/);
    expect(content).toMatch(/table:\s*"Room"/);
  });

  test('4. Down 方法包含 AddColumn("Area")', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    expect(content).toMatch(/AddColumn.*\n.*name:\s*"Area"/s);
  });

  test('5. Down 方法包含 AddColumn("RoomType")', async () => {
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf-8');
    expect(content).toMatch(/AddColumn.*\n.*name:\s*"RoomType"/s);
  });

  // ==================== 构建测试 ====================

  test('6. 验证后端项目构建成功', async () => {
    try {
      execSync('dotnet build --no-restore', {
        cwd: serverPath,
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (error: any) {
      if (error.stdout) {
        console.error('构建输出:', error.stdout.toString());
      }
      if (error.stderr) {
        console.error('构建错误:', error.stderr.toString());
      }
      throw error;
    }
  });
});
