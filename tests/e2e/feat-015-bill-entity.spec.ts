/**
 * FEAT-015: Bill 实体 - 静态验证（严谨版）
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

test.describe('FEAT-015: Bill 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Bill.cs');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');

  // 期望的实体属性（根据需求文档）
  const expectedProperties = [
    { name: 'Id', type: 'int', required: true },
    { name: 'RentalRecordId', type: 'int', required: true },
    { name: 'PeriodStart', type: 'DateTime', required: true },
    { name: 'PeriodEnd', type: 'DateTime', required: true },
    { name: 'DueDate', type: 'DateTime', required: true },
    { name: 'RentAmount', type: 'decimal', required: true },
    { name: 'WaterFee', type: 'decimal', required: true },
    { name: 'ElectricFee', type: 'decimal', required: true },
    { name: 'TotalAmount', type: 'decimal', required: true },
    { name: 'Status', type: 'string', required: true }, // 或 enum
    { name: 'PaidAmount', type: 'decimal', required: false },
    { name: 'PaidDate', type: 'DateTime', required: false },
    { name: 'CreatedAt', type: 'DateTime', required: true },
    { name: 'UpdatedAt', type: 'DateTime', required: false },
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
    expect(content).toMatch(/public\s+class\s+Bill/);
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

  test('5. 验证实体的 RentalRecordId 属性（租住记录ID）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 RentalRecordId 属性
    expect(content).toMatch(/public\s+int\s+RentalRecordId\s*\{\s*get;\s*set;\s*\}/);
  });

  test('6. 验证实体的账单周期属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 PeriodStart 和 PeriodEnd 属性
    expect(content).toMatch(/public\s+DateTime\s+PeriodStart\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DateTime\s+PeriodEnd\s*\{\s*get;\s*set;\s*\}/);
  });

  test('7. 验证实体的 DueDate 属性（应收日期）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 DueDate 属性
    expect(content).toMatch(/public\s+DateTime\s+DueDate\s*\{\s*get;\s*set;\s*\}/);
  });

  test('8. 验证实体的金额属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证金额属性
    expect(content).toMatch(/public\s+decimal\s+RentAmount\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+WaterFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+ElectricFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+TotalAmount\s*\{\s*get;\s*set;\s*\}/);
  });

  test('9. 验证实体的 Status 属性（账单状态）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证 Status 属性（可能是 string 或 enum）
    const hasStatus = content.match(/public\s+(string|int|BillStatus|enum)\s+Status\s*\{\s*get;\s*set;\s*\}/);
    expect(hasStatus).toBeTruthy();
  });

  test('10. 验证实体的收款信息属性（可选）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证收款信息属性（可选）
    expect(content).toMatch(/public\s+decimal\??\s+PaidAmount\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DateTime\??\s+PaidDate\s*\{\s*get;\s*set;\s*\}/);
  });

  test('11. 验证实体的时间戳属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证时间戳属性
    expect(content).toMatch(/public\s+DateTime\s+CreatedAt\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DateTime\??\s+UpdatedAt\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== DbContext 配置测试 ====================

  test('12. 验证 DbContext 包含 Bills DbSet', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    // 验证 DbSet 声明
    expect(content).toMatch(/public\s+DbSet<Bill>\s+Bills\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 构建测试 ====================

  test('13. 验证项目构建成功', async () => {
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

  test('14. 验证实体在正确的命名空间', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证命名空间
    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });

  // ==================== 业务规则验证 ====================

  test('15. 验证账单状态枚举（如果存在）', async () => {
    // 查找可能的枚举文件
    const enumPath = path.join(serverPath, 'Gentle.Core/Entities/BillStatus.cs');
    const enumPath2 = path.join(serverPath, 'Gentle.Core/Enums/BillStatus.cs');

    if (fs.existsSync(enumPath) || fs.existsSync(enumPath2)) {
      const content = fs.readFileSync(fs.existsSync(enumPath) ? enumPath : enumPath2, 'utf-8');

      // 验证枚举包含必要的状态
      expect(content).toMatch(/Pending|待收/);
      expect(content).toMatch(/Grace|宽限/);
      expect(content).toMatch(/Paid|已收/);
      expect(content).toMatch(/Overdue|逾期/);
    }
  });

  test('16. 验证实体与 RentalRecord 的关系', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证导航属性（如果有）
    const hasNavigationProperty = content.match(/public\s+RentalRecord\s+RentalRecord\s*\{\s*get;\s*set;\s*\}/);
    // 导航属性是可选的，但如果有会更好
    if (hasNavigationProperty) {
      expect(hasNavigationProperty).toBeTruthy();
    }
  });
});
