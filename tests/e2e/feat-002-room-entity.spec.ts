/**
 * FEAT-002: Room（房间）实体 - 静态验证（严谨版）
 * 类型: static
 * 适用于: 后端实体
 *
 * 测试覆盖：
 * 1. 实体文件存在性
 * 2. 枚举文件存在性
 * 3. 实体属性完整性
 * 4. 外键关系配置
 * 5. DbContext 配置
 * 6. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-002: Room 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Room.cs');
  const enumPath = path.join(serverPath, 'Gentle.Core/Enums/RoomStatus.cs');
  const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core/DbContexts/DefaultDbContext.cs');

  // ==================== 文件存在性测试 ====================

  test('1. 检查实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('2. 检查 RoomStatus 枚举文件存在', async () => {
    expect(fs.existsSync(enumPath)).toBeTruthy();
  });

  test('3. 检查 DbContext 文件存在', async () => {
    expect(fs.existsSync(dbContextPath)).toBeTruthy();
  });

  // ==================== 枚举测试 ====================

  test('4. 验证 RoomStatus 枚举定义', async () => {
    if (!fs.existsSync(enumPath)) {
      test.skip('枚举文件不存在');
      return;
    }

    const content = fs.readFileSync(enumPath, 'utf-8');

    // 验证枚举声明
    expect(content).toMatch(/public\s+enum\s+RoomStatus/);

    // 验证枚举值
    expect(content).toMatch(/Vacant\s*=\s*0/);
    expect(content).toMatch(/Rented\s*=\s*1/);
    expect(content).toMatch(/Renovating\s*=\s*2/);
  });

  // ==================== 实体属性测试 ====================

  test('5. 验证实体类声明', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+class\s+Room/);
  });

  test('6. 验证基本属性 - Id, Building, RoomNumber', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+int\s+Id\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\s+Building\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\s+RoomNumber\s*\{\s*get;\s*set;\s*\}/);
  });

  test('7. 验证价格属性 - CostPrice, RentPrice, Deposit', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\s+CostPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+RentPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+Deposit\s*\{\s*get;\s*set;\s*\}/);
  });

  test('8. 验证水电价格属性 - WaterPrice, ElectricPrice', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\??\s+WaterPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+ElectricPrice\s*\{\s*get;\s*set;\s*\}/);
  });

  test('9. 验证可选属性 - Area, RoomType, ContractImage, Remark', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+ContractImage\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+Remark\s*\{\s*get;\s*set;\s*\}/);
  });

  test('10. 验证状态属性 - Status (RoomStatus)', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+RoomStatus\s+Status\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 外键关系测试 ====================

  test('11. 验证 Community 外键关系', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    // 验证外键 ID
    expect(content).toMatch(/public\s+int\s+CommunityId\s*\{\s*get;\s*set;\s*\}/);

    // 验证导航属性
    expect(content).toMatch(/public\s+Community\s+Community\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== DbContext 配置测试 ====================

  test('12. 验证 DbContext 包含 Rooms DbSet', async () => {
    if (!fs.existsSync(dbContextPath)) {
      test.skip('DbContext 文件不存在');
      return;
    }

    const content = fs.readFileSync(dbContextPath, 'utf-8');

    expect(content).toMatch(/public\s+DbSet<Room>\s+Rooms\s*\{\s*get;\s*set;\s*\}/);
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

    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });
});
