/**
 * FEAT-009: RentalRecord（租住记录）实体 - 静态验证（严谨版）
 * 类型: static
 * 适用于: 后端实体
 *
 * 测试覆盖：
 * 1. 实体文件存在性
 * 2. 枚举文件存在性（LeaseType, RentalStatus, DepositStatus）
 * 3. 实体属性完整性
 * 4. 外键关系配置（Tenant, Room）
 * 5. DbContext 配置
 * 6. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-009: RentalRecord 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/RentalRecord.cs');
  const leaseTypeEnumPath = path.join(serverPath, 'Gentle.Core/Enums/LeaseType.cs');
  const rentalStatusEnumPath = path.join(serverPath, 'Gentle.Core/Enums/RentalStatus.cs');
  const depositStatusEnumPath = path.join(serverPath, 'Gentle.Core/Enums/DepositStatus.cs');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');

  // ==================== 文件存在性测试 ====================

  test('1. 检查实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('2. 检查 LeaseType 枚举文件存在', async () => {
    expect(fs.existsSync(leaseTypeEnumPath)).toBeTruthy();
  });

  test('3. 检查 RentalStatus 枚举文件存在', async () => {
    expect(fs.existsSync(rentalStatusEnumPath)).toBeTruthy();
  });

  test('4. 检查 DepositStatus 枚举文件存在', async () => {
    expect(fs.existsSync(depositStatusEnumPath)).toBeTruthy();
  });

  test('5. 检查 DbContext 文件存在', async () => {
    expect(fs.existsSync(dbContextPath)).toBeTruthy();
  });

  // ==================== 枚举测试 ====================

  test('6. 验证 LeaseType 枚举定义', async () => {
    if (!fs.existsSync(leaseTypeEnumPath)) {
      test.skip('枚举文件不存在');
      return;
    }

    const content = fs.readFileSync(leaseTypeEnumPath, 'utf-8');

    expect(content).toMatch(/public\s+enum\s+LeaseType/);
    expect(content).toMatch(/Monthly\s*=\s*0/);
    expect(content).toMatch(/HalfYear|Quarterly/); // 半年或季度
    expect(content).toMatch(/Yearly/);
  });

  test('7. 验证 RentalStatus 枚举定义', async () => {
    if (!fs.existsSync(rentalStatusEnumPath)) {
      test.skip('枚举文件不存在');
      return;
    }

    const content = fs.readFileSync(rentalStatusEnumPath, 'utf-8');

    expect(content).toMatch(/public\s+enum\s+RentalStatus/);
    expect(content).toMatch(/Active\s*=\s*0/);
    expect(content).toMatch(/Terminated/);
  });

  test('8. 验证 DepositStatus 枚举定义', async () => {
    if (!fs.existsSync(depositStatusEnumPath)) {
      test.skip('枚举文件不存在');
      return;
    }

    const content = fs.readFileSync(depositStatusEnumPath, 'utf-8');

    expect(content).toMatch(/public\s+enum\s+DepositStatus/);
    expect(content).toMatch(/Received/);
    expect(content).toMatch(/Refunded/);
    expect(content).toMatch(/Deducted/);
  });

  // ==================== 实体属性测试 ====================

  test('9. 验证实体类声明', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+class\s+RentalRecord/);
  });

  test('10. 验证实体继承 Entity<int>（Furion 框架自动提供 Id）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // Furion 框架：继承 Entity<int> 自动获得 Id 属性，无需手动定义
    expect(content).toMatch(/public\s+class\s+RentalRecord\s*:\s*Entity<int>/);
  });

  test('11. 验证日期属性 - CheckInDate, ContractEndDate, CheckOutDate', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+DateTime\s+CheckInDate\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DateTime\s+ContractEndDate\s*\{\s*get;\s*set;\s*\}/);
    // CheckOutDate 可选
    expect(content).toMatch(/public\s+DateTime\??\s+CheckOutDate\s*\{\s*get;\s*set;\s*\}/);
  });

  test('12. 验证金额属性 - MonthlyRent, Deposit, DepositDeduction', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\s+MonthlyRent\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+Deposit\s*\{\s*get;\s*set;\s*\}/);
    // DepositDeduction 可选
    expect(content).toMatch(/public\s+decimal\??\s+DepositDeduction\s*\{\s*get;\s*set;\s*\}/);
  });

  test('13. 验证枚举属性 - LeaseType, Status, DepositStatus', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+LeaseType\s+LeaseType\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+RentalStatus\s+Status\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DepositStatus\s+DepositStatus\s*\{\s*get;\s*set;\s*\}/);
  });

  test('14. 验证可选属性 - Remark, CheckOutRemark', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+string\??\s+Remark\s*\{\s*get;\s*set;\s*\}/);
    // CheckOutRemark 可选
    expect(content).toMatch(/public\s+string\??\s+CheckOutRemark\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 外键关系测试 ====================

  test('15. 验证 Tenant 外键关系', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+int\s+TenantId\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+Tenant\s+Tenant\s*\{\s*get;\s*set;\s*\}/);
  });

  test('16. 验证 Room 外键关系', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+int\s+RoomId\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+Room\s+Room\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== DbContext 配置测试 ====================

  test('17. 验证 Furion 框架自动发现实体（无需手动配置 DbSet）', async () => {
    // Furion 框架会自动发现所有继承 Entity<T> 的实体
    // 验证实体文件存在且继承 Entity<int> 即可
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证实体实现 IEntity 接口（通过继承 Entity<int>）
    expect(content).toMatch(/public\s+class\s+RentalRecord\s*:\s*Entity<int>/);

    // 验证 DbContext 继承 AppDbContext（Furion 自动发现机制）
    if (fs.existsSync(dbContextPath)) {
      const dbContent = fs.readFileSync(dbContextPath, 'utf-8');
      expect(dbContent).toMatch(/AppDbContext/);
    }
  });

  // ==================== 构建测试 ====================

  test('18. 验证项目构建成功', async () => {
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

  test('19. 验证实体在正确的命名空间', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });
});
