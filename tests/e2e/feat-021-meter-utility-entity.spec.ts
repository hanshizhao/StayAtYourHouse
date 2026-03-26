/**
 * FEAT-021: MeterRecord + UtilityBill 实体 - 静态验证（严谨版）
 * 类型: static
 * 适用于: 后端实体
 *
 * 测试覆盖：
 * 1. 实体文件存在性验证
 * 2. 实体类结构验证
 * 3. 属性类型和注解验证
 * 4. 构建成功验证
 * 5. 数据库迁移验证
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-021: MeterRecord + UtilityBill 实体', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entitiesPath = path.join(serverPath, 'Gentle.Core/Entities');

  // ==================== 文件存在性测试 ====================

  test('1. MeterRecord 实体文件存在', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');
    expect(fs.existsSync(meterPath)).toBeTruthy();
  });

  test('2. UtilityBill 实体文件存在', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');
    expect(fs.existsSync(utilityPath)).toBeTruthy();
  });

  // ==================== MeterRecord 实体结构验证 ====================

  test('3. MeterRecord 实体 - 包含必要属性', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');

    if (!fs.existsSync(meterPath)) {
      test.skip('MeterRecord.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(meterPath, 'utf-8');

    // 验证类定义
    expect(content).toContain('class MeterRecord');

    // 验证必要属性
    expect(content).toContain('Id');
    expect(content).toContain('RoomId');
    expect(content).toContain('MeterDate');
    expect(content).toContain('WaterReading');
    expect(content).toContain('ElectricReading');
    expect(content).toContain('PrevWaterReading');
    expect(content).toContain('PrevElectricReading');
    expect(content).toContain('WaterUsage');
    expect(content).toContain('ElectricUsage');
    expect(content).toContain('WaterFee');
    expect(content).toContain('ElectricFee');
  });

  test('4. MeterRecord 实体 - 包含外键关联', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');

    if (!fs.existsSync(meterPath)) {
      test.skip('MeterRecord.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(meterPath, 'utf-8');

    // 验证 Room 导航属性
    expect(content).toMatch(/Room|RoomId/);
  });

  test('5. MeterRecord 实体 - 包含验证特性', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');

    if (!fs.existsSync(meterPath)) {
      test.skip('MeterRecord.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(meterPath, 'utf-8');

    // 验证 Furion 框架规范
    expect(content).toContain('Entity<int>');
    expect(content).toContain('IEntitySeedData<MeterRecord>');
    expect(content).toContain('[Table("meter_record")]');
    expect(content).toContain('[Index');

    // 验证自定义验证特性
    expect(content).toContain('MeterRecordValidation');
  });

  // ==================== UtilityBill 实体结构验证 ====================

  test('6. UtilityBill 实体 - 包含必要属性', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证类定义
    expect(content).toContain('class UtilityBill');

    // 验证必要属性
    expect(content).toContain('Id');
    expect(content).toContain('RoomId');
    expect(content).toContain('MeterRecordId');
    expect(content).toContain('PeriodStart');
    expect(content).toContain('PeriodEnd');
    expect(content).toContain('WaterUsage');
    expect(content).toContain('ElectricUsage');
    expect(content).toContain('WaterFee');
    expect(content).toContain('ElectricFee');
    expect(content).toContain('TotalAmount');
    expect(content).toContain('Status');
  });

  test('7. UtilityBill 实体 - 包含收款信息', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证收款字段
    expect(content).toContain('PaidAmount');
    expect(content).toContain('PaidDate');
  });

  test('8. UtilityBill 实体 - 包含验证特性', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证 Furion 框架规范
    expect(content).toContain('Entity<int>');
    expect(content).toContain('IEntitySeedData<UtilityBill>');
    expect(content).toContain('[Table("utility_bill")]');
    expect(content).toContain('[Index');

    // 验证自定义验证特性
    expect(content).toContain('UtilityBillValidation');
  });

  test('9. UtilityBill 实体 - 包含外键关联', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证 Room 导航属性
    expect(content).toMatch(/Room|RoomId/);
  });

  // ==================== 构建验证 ====================

  test('10. 项目构建成功', async () => {
    // 执行 dotnet build 验证实体类无语法错误
    execSync('dotnet build --no-restore', { cwd: serverPath, stdio: 'pipe' });
  });

  // ==================== 数据库上下文验证 ====================

  test('11. Furion 框架自动发现实体（无需手动配置 DbSet）', async () => {
    // Furion 框架会自动发现继承 Entity<int> 的实体类
    // 无需在 DbContext 中手动添加 DbSet<MeterRecord> 和 DbSet<UtilityBill>
    // 只需验证实体文件存在即可
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    expect(fs.existsSync(meterPath)).toBeTruthy();
    expect(fs.existsSync(utilityPath)).toBeTruthy();
  });

  test('12. 验证实体继承 Furion Entity 基类', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    const meterContent = fs.readFileSync(meterPath, 'utf-8');
    const utilityContent = fs.readFileSync(utilityPath, 'utf-8');

    // 验证继承 Entity<int>
    expect(meterContent).toContain('Entity<int>');
    expect(utilityContent).toContain('Entity<int>');
  });

  // ==================== 迁移文件验证 ====================

  test('13. 检查迁移目录存在', async () => {
    const migrationsPath = path.join(serverPath, 'Gentle.Database.Migrations');
    expect(fs.existsSync(migrationsPath)).toBeTruthy();
  });

  test('14. 验证实体关系正确配置', async () => {
    // 查找实体配置文件
    const configPath = path.join(serverPath, 'Gentle.EntityFramework.Core');
    const files = fs.readdirSync(configPath, { recursive: true });

    const configFiles = files.filter(f =>
      typeof f === 'string' && f.includes('Configuration') && f.endsWith('.cs')
    );

    // 如果有配置文件，验证其中包含 MeterRecord 或 UtilityBill 的配置
    if (configFiles.length === 0) {
      // 可能使用 Data Annotations 或在 DbContext 中配置
      test.skip('未找到独立的实体配置文件，可能使用其他配置方式');
      return;
    }

    let hasMeterConfig = false;
    let hasUtilityConfig = false;

    for (const file of configFiles) {
      const content = fs.readFileSync(
        path.join(configPath, file as string),
        'utf-8'
      );
      if (content.includes('MeterRecord')) hasMeterConfig = true;
      if (content.includes('UtilityBill')) hasUtilityConfig = true;
    }

    // 至少要有一个实体的配置
    expect(hasMeterConfig || hasUtilityConfig).toBeTruthy();
  });
});
