/**
 * FEAT-001: Community（小区）实体 - 静态验证（严谨版）
 * 类型: static
 * 适用于: 后端实体
 *
 * 测试覆盖：
 * 1. 实体文件存在性
 * 2. 实体属性完整性
 * 3. DbContext 配置
 * 4. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-001: Community 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Community.cs');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');

  // 期望的实体属性
  const expectedProperties = [
    { name: 'Id', type: 'int' },
    { name: 'Name', type: 'string' },
    { name: 'Address', type: 'string?' },
    { name: 'PropertyPhone', type: 'string?' },
    { name: 'Remark', type: 'string?' },
  ];

  // ==================== 文件存在性测试 ====================

  test('1. 检查实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('2. 检查 DbContext 文件存在', async () => {
    expect(fs.existsSync(dbContextPath)).toBeTruthy();
  });

  // ==================== 实体属性测试 ====================

  test('3. 验证实体类声明', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证类声明
    expect(content).toMatch(/public\s+class\s+Community/);
  });

  test('4. 验证实体的 Id 属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 Id 属性
    expect(content).toMatch(/public\s+int\s+Id\s*\{\s*get;\s*set;\s*\}/);
  });

  test('5. 验证实体的 Name 属性（必填字段）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 Name 属性（非空 string）
    expect(content).toMatch(/public\s+string\s+Name\s*\{\s*get;\s*set;\s*\}/);
  });

  test('6. 验证实体的可选属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证可选属性（可空 string?）
    expect(content).toMatch(/public\s+string\??\s+Address\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+PropertyPhone\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+Remark\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== DbContext 配置测试 ====================

  test('7. 验证 DbContext 包含 Communities DbSet', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // 验证 DbSet 声明
    expect(content).toMatch(/public\s+DbSet<Community>\s+Communities\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 构建测试 ====================

  test('8. 验证项目构建成功', async () => {
    try {
      execSync('dotnet build --no-restore', {
        cwd: serverPath,
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (error: any) {
      // 输出构建错误信息
      if (error.stdout) {
        console.error('构建输出:', error.stdout.toString());
      }
      if (error.stderr) {
        console.error('构建错误:', error.stderr.toString());
      }
      throw error;
    }
  });

  test('9. 验证实体在正确的命名空间', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证命名空间
    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });
});
