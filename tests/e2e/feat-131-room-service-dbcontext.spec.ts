/**
 * FEAT-131: 房东租约 - 后端 RoomService 和 DbContext 变更 - 静态验证
 * 类型: static
 * 适用于: DbContext 关系配置 + RoomService Include 变更
 *
 * 测试覆盖：
 * 1. DefaultDbContext 新增 OnModelCreating 方法
 * 2. OnModelCreating 配置 Room 与 LandlordLease 一对一关系
 * 3. RoomService.GetListAsync 包含 Include LandlordLease
 * 4. RoomService.GetByIdAsync 包含 Include LandlordLease
 * 5. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-131: 房东租约 - 后端 RoomService 和 DbContext 变更', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');
  const roomServicePath = path.join(serverPath, 'Gentle.Application/Services/RoomService.cs');

  // ==================== DefaultDbContext 测试 ====================

  test('1. 检查 DefaultDbContext 文件存在', async () => {
    expect(fs.existsSync(dbContextPath)).toBeTruthy();
  });

  test('2. 验证 DefaultDbContext 包含 OnModelCreating 方法', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DefaultDbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/protected\s+override\s+void\s+OnModelCreating\s*\(\s*ModelBuilder\s+modelBuilder\s*\)/);
  });

  test('3. 验证 OnModelCreating 调用 base.OnModelCreating', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DefaultDbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/base\.OnModelCreating\s*\(\s*modelBuilder\s*\)/);
  });

  test('4. 验证配置 Room 与 LandlordLease 一对一关系（HasOne/WithOne）', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DefaultDbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/modelBuilder\.Entity\s*<\s*Room\s*>/);
    expect(content).toMatch(/\.HasOne\s*\(\s*r\s*=>\s*r\.LandlordLease\s*\)/);
    expect(content).toMatch(/\.WithOne\s*\(\s*l\s*=>\s*l\.Room\s*\)/);
  });

  test('5. 验证一对一关系使用 RoomId 作为外键并配置级联删除', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DefaultDbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/\.HasForeignKey\s*<\s*LandlordLease\s*>/);
    expect(content).toMatch(/l\s*=>\s*l\.RoomId/);
    expect(content).toMatch(/OnDelete\s*\(\s*DeleteBehavior\.Cascade\s*\)/);
  });

  test('6. 验证 DefaultDbContext 引用必要的命名空间', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DefaultDbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/using\s+Gentle\.Core\.Entities/);
    expect(content).toMatch(/using\s+Microsoft\.EntityFrameworkCore/);
  });

  // ==================== RoomService 测试 ====================

  test('7. 检查 RoomService 文件存在', async () => {
    expect(fs.existsSync(roomServicePath)).toBeTruthy();
  });

  test('8. 验证 GetListAsync 包含 Include LandlordLease', async () => {
    if (!fs.existsSync(roomServicePath)) {
      test.skip('RoomService 文件不存在');
      return;
    }

    const content = fs.readFileSync(roomServicePath, 'utf-8');

    // 在 GetListAsync 方法中查找 Include LandlordLease
    const getListMatch = content.match(/GetListAsync[\s\S]*?\.Include\s*\(\s*r\s*=>\s*r\.Community\s*\)([\s\S]*?)\.AsQueryable\s*\(\s*\)/);
    expect(getListMatch).toBeTruthy();

    const includes = getListMatch![1];
    expect(includes).toMatch(/\.Include\s*\(\s*r\s*=>\s*r\.LandlordLease\s*\)/);
  });

  test('9. 验证 GetByIdAsync 包含 Include LandlordLease', async () => {
    if (!fs.existsSync(roomServicePath)) {
      test.skip('RoomService 文件不存在');
      return;
    }

    const content = fs.readFileSync(roomServicePath, 'utf-8');

    // 在 GetByIdAsync 方法中查找 Include 链
    const getByIdMatch = content.match(/GetByIdAsync[\s\S]*?\.Include\s*\(\s*r\s*=>\s*r\.Community\s*\)([\s\S]*?)\.FirstOrDefaultAsync/);
    expect(getByIdMatch).toBeTruthy();

    const includes = getByIdMatch![1];
    expect(includes).toMatch(/\.Include\s*\(\s*r\s*=>\s*r\.LandlordLease\s*\)/);
  });

  // ==================== 构建测试 ====================

  test('10. 验证项目构建成功', async () => {
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
