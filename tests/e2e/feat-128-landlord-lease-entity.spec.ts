/**
 * FEAT-128: 房东租约 - 后端枚举和实体 - 静态验证
 * 类型: static
 * 适用于: 后端枚举 + 实体
 *
 * 测试覆盖：
 * 1. PaymentMethod 枚举文件存在性及成员完整性
 * 2. LandlordLease 实体继承 Entity<int> 基类
 * 3. LandlordLease 实体属性完整性
 * 4. Room 实体新增 LandlordLease 导航属性
 * 5. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-128: 房东租约 - 后端枚举和实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const enumPath = path.join(serverPath, 'Gentle.Core/Enums/PaymentMethod.cs');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/LandlordLease.cs');
  const roomPath = path.join(serverPath, 'Gentle.Core/Entities/Room.cs');

  // ==================== PaymentMethod 枚举测试 ====================

  test('1. 检查 PaymentMethod 枚举文件存在', async () => {
    expect(fs.existsSync(enumPath)).toBeTruthy();
  });

  test('2. 验证 PaymentMethod 枚举成员完整性', async () => {
    if (!fs.existsSync(enumPath)) {
      test.skip('枚举文件不存在');
      return;
    }

    const content = fs.readFileSync(enumPath, 'utf-8');

    expect(content).toMatch(/namespace\s+Gentle\.Core\.Enums/);
    expect(content).toMatch(/Monthly\s*=\s*0/);
    expect(content).toMatch(/Quarterly\s*=\s*1/);
    expect(content).toMatch(/SemiAnnual\s*=\s*2/);
    expect(content).toMatch(/Annual\s*=\s*3/);
    expect(content).toMatch(/Custom\s*=\s*4/);
  });

  // ==================== LandlordLease 实体测试 ====================

  test('3. 检查 LandlordLease 实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('4. 验证 LandlordLease 继承 Entity<int> 基类', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+class\s+LandlordLease\s*:\s*Entity\s*<\s*int\s*>/);
    expect(content).toMatch(/using\s+Furion\.DatabaseAccessor/);
  });

  test('5. 验证 LandlordLease 实体在正确的命名空间', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/namespace\s+Gentle\.Core\.Entities/);
  });

  test('6. 验证 LandlordLease 引用 PaymentMethod 枚举', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/using\s+Gentle\.Core\.Enums/);
    expect(content).toMatch(/PaymentMethod/);
  });

  test('7. 验证 LandlordLease 关键属性（RoomId、房东信息）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+int\s+RoomId\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+Room\s+Room\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\s+LandlordName\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+LandlordPhone\s*\{\s*get;\s*set;\s*\}/);
  });

  test('8. 验证 LandlordLease 租金和付款属性', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\s+MonthlyRent\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+PaymentMethod\s+PaymentMethod\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+int\??\s+DepositMonths\s*\{\s*get;\s*set;\s*\}/);
  });

  test('9. 验证 LandlordLease 费用属性（水费、电费、电梯费等）', async () => {
    if (!fs.existsSync(entityPath)) {
      test.skip('实体文件不存在');
      return;
    }

    const content = fs.readFileSync(entityPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\??\s+WaterPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+ElectricPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+ElevatorFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+PropertyFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+InternetFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+OtherFees\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== Room 导航属性测试 ====================

  test('10. 验证 Room 实体新增 LandlordLease 导航属性', async () => {
    if (!fs.existsSync(roomPath)) {
      test.skip('Room 实体文件不存在');
      return;
    }

    const content = fs.readFileSync(roomPath, 'utf-8');

    expect(content).toMatch(/public\s+LandlordLease\??\s+LandlordLease\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== 构建测试 ====================

  test('11. 验证项目构建成功', async () => {
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
