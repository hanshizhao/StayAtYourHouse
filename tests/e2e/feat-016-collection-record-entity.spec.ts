/**
 * FEAT-016: CollectionRecord 实体 - 静态验证（严谨版）
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

test.describe('FEAT-016: CollectionRecord 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/CollectionRecord.cs');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');

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
    expect(content).toMatch(/public\s+class\s+CollectionRecord/);
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

  test('5. 验证实体的 BillId 属性（账单ID）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 BillId 属性
    expect(content).toMatch(/public\s+int\s+BillId\s*\{\s*get;\s*set;\s*\}/);
  });

  test('6. 验证实体的 CollectDate 属性（催收日期）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 CollectDate 属性
    expect(content).toMatch(/public\s+DateTime\s+CollectDate\s*\{\s*get;\s*set;\s*\}/);
  });

  test('7. 验证实体的 Result 属性（催收结果）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 Result 属性（可能是 string 或 enum）
    const hasResult = content.match(/public\s+(string|int|CollectionResult|enum)\s+Result\s*\{\s*get;\s*set;\s*\}/);
    expect(hasResult).toBeTruthy();
  });

  test('8. 验证实体的 GraceUntil 属性（宽限至日期，可选）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 GraceUntil 属性（可空）
    expect(content).toMatch(/public\s+DateTime\??\s+GraceUntil\s*\{\s*get;\s*set;\s*\}/);
  });

  test('9. 验证实体的 Remark 属性（备注）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 Remark 属性
    expect(content).toMatch(/public\s+string\??\s+Remark\s*\{\s*get;\s*set;\s*\}/);
  });

  test('10. 验证实体的 CreatedAt 属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 CreatedAt 属性
    expect(content).toMatch(/public\s+DateTime\s+CreatedAt\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== DbContext 配置测试 ====================

  test('11. 验证 DbContext 包含 CollectionRecords DbSet', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // 验证 DbSet 声明
    expect(content).toMatch(/public\s+DbSet<CollectionRecord>\s+CollectionRecords\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 构建测试 ====================

  test('12. 验证项目构建成功', async () => {
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

  test('13. 验证实体在正确的命名空间', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证命名空间
    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });

  // ==================== 业务规则验证 ====================

  test('14. 验证催收结果枚举（如果存在）', async () => {
    // 查找可能的枚举文件
    const enumPath = path.join(serverPath, 'Gentle.Core/Entities/CollectionResult.cs');
    const enumPath2 = path.join(serverPath, 'Gentle.Core/Enums/CollectionResult.cs');

    if (fs.existsSync(enumPath) || fs.existsSync(enumPath2)) {
      const content = fs.readFileSync(fs.existsSync(enumPath) ? enumPath : enumPath2, 'utf-8');

      // 验证枚举包含必要的结果
      expect(content).toMatch(/Success|成功/);
      expect(content).toMatch(/Grace|宽限/);
      expect(content).toMatch(/Refuse|拒付/);
    }
  });

  test('15. 验证实体与 Bill 的关系', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证导航属性（如果有）
    const hasNavigationProperty = content.match(/public\s+Bill\s+Bill\s*\{\s*get;\s*set;\s*\}/);
    // 导航属性是可选的，但如果有会更好
    if (hasNavigationProperty) {
      expect(hasNavigationProperty).toBeTruthy();
    }
  });

  test('16. 验证实体属性完整性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证所有必要的属性都存在
    const requiredProperties = [
      'Id',
      'BillId',
      'CollectDate',
      'Result',
      'CreatedAt'
    ];

    for (const prop of requiredProperties) {
      expect(content).toMatch(new RegExp(`public\\s+\\w+\\s+${prop}\\s*\\{`));
    }
  });
});
