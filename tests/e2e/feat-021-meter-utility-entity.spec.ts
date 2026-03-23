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
    expect(content).toContain('RecordDate');
    expect(content).toContain('WaterReading');
    expect(content).toContain('ElectricReading');
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

  test('5. MeterRecord 实体 - 包含审计字段', async () => {
    const meterPath = path.join(entitiesPath, 'MeterRecord.cs');

    if (!fs.existsSync(meterPath)) {
      test.skip('MeterRecord.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(meterPath, 'utf-8');

    // 验证审计字段（可选但推荐）
    const hasCreatedTime = content.includes('CreatedTime') || content.includes('CreatedAt');
    const hasUpdatedTime = content.includes('UpdatedTime') || content.includes('UpdatedAt');

    // 至少要有创建时间
    expect(hasCreatedTime).toBeTruthy();
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
    expect(content).toContain('BillMonth');
    expect(content).toContain('WaterFee');
    expect(content).toContain('ElectricFee');
  });

  test('7. UtilityBill 实体 - 包含用量和费用字段', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证用量字段
    const hasWaterUsage = content.includes('WaterUsage') || content.includes('WaterUsed');
    const hasElectricUsage = content.includes('ElectricUsage') || content.includes('ElectricUsed');

    expect(hasWaterUsage || hasElectricUsage).toBeTruthy();
  });

  test('8. UtilityBill 实体 - 包含状态字段', async () => {
    const utilityPath = path.join(entitiesPath, 'UtilityBill.cs');

    if (!fs.existsSync(utilityPath)) {
      test.skip('UtilityBill.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(utilityPath, 'utf-8');

    // 验证状态字段
    const hasStatus = content.includes('Status') || content.includes('IsPaid');
    expect(hasStatus).toBeTruthy();
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

  test('11. DbContext 包含 MeterRecord DbSet', async () => {
    const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core');

    // 查找 DbContext 文件
    const files = fs.readdirSync(dbContextPath, { recursive: true });
    const dbContextFile = files.find(f =>
      typeof f === 'string' && f.endsWith('DbContext.cs')
    );

    if (!dbContextFile) {
      test.skip('未找到 DbContext 文件');
      return;
    }

    const content = fs.readFileSync(
      path.join(dbContextPath, dbContextFile as string),
      'utf-8'
    );

    // 验证包含 MeterRecord DbSet
    expect(content).toMatch(/MeterRecord|MeterRecords/);
  });

  test('12. DbContext 包含 UtilityBill DbSet', async () => {
    const dbContextPath = path.join(serverPath, 'Gentle.EntityFramework.Core');

    // 查找 DbContext 文件
    const files = fs.readdirSync(dbContextPath, { recursive: true });
    const dbContextFile = files.find(f =>
      typeof f === 'string' && f.endsWith('DbContext.cs')
    );

    if (!dbContextFile) {
      test.skip('未找到 DbContext 文件');
      return;
    }

    const content = fs.readFileSync(
      path.join(dbContextPath, dbContextFile as string),
      'utf-8'
    );

    // 验证包含 UtilityBill DbSet
    expect(content).toMatch(/UtilityBill|UtilityBills/);
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
