/**
 * FEAT-129: 房东租约 - 后端 DTO 和 Mapster 映射 - 静态验证
 * 类型: static
 * 适用于: DTO 文件 + Mapper 配置
 *
 * 测试覆盖：
 * 1. LandlordLeaseDto 文件存在性及属性完整性
 * 2. CreateLandlordLeaseInput 文件存在性及验证特性
 * 3. UpdateLandlordLeaseInput 文件存在性及验证特性
 * 4. RoomDto 新增 LandlordLease 属性
 * 5. CreateRoomInput/UpdateRoomInput CostPrice 去掉 [Required]
 * 6. Mapper.cs Profit 计算改用 LandlordLease.MonthlyRent
 * 7. Mapper.cs 新增 LandlordLease 映射配置
 * 8. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-129: 房东租约 - 后端 DTO 和 Mapster 映射', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const dtoPath = path.join(serverPath, 'Gentle.Application/Dtos/LandlordLease/LandlordLeaseDto.cs');
  const createInputPath = path.join(serverPath, 'Gentle.Application/Dtos/LandlordLease/CreateLandlordLeaseInput.cs');
  const updateInputPath = path.join(serverPath, 'Gentle.Application/Dtos/LandlordLease/UpdateLandlordLeaseInput.cs');
  const roomDtoPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/RoomDto.cs');
  const createRoomInputPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/CreateRoomInput.cs');
  const updateRoomInputPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/UpdateRoomInput.cs');
  const mapperPath = path.join(serverPath, 'Gentle.Application/Mapper.cs');

  // ==================== LandlordLeaseDto 测试 ====================

  test('1. 检查 LandlordLeaseDto 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('2. 验证 LandlordLeaseDto 命名空间和关键属性', async () => {
    if (!fs.existsSync(dtoPath)) {
      test.skip('LandlordLeaseDto 文件不存在');
      return;
    }

    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/namespace\s+Gentle\.Application\.Dtos\.LandlordLease/);
    expect(content).toMatch(/public\s+int\s+Id\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+int\s+RoomId\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\s+LandlordName\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\s+MonthlyRent\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+PaymentMethod\s+PaymentMethod\s*\{\s*get;\s*set;\s*\}/);
  });

  test('3. 验证 LandlordLeaseDto 费用属性和 RoomInfo', async () => {
    if (!fs.existsSync(dtoPath)) {
      test.skip('LandlordLeaseDto 文件不存在');
      return;
    }

    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\??\s+WaterPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+ElectricPrice\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+ElevatorFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+PropertyFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+InternetFee\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+decimal\??\s+OtherFees\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+string\??\s+RoomInfo\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/public\s+DateTimeOffset\s+CreatedTime\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== CreateLandlordLeaseInput 测试 ====================

  test('4. 检查 CreateLandlordLeaseInput 文件存在', async () => {
    expect(fs.existsSync(createInputPath)).toBeTruthy();
  });

  test('5. 验证 CreateLandlordLeaseInput 必填字段和验证特性', async () => {
    if (!fs.existsSync(createInputPath)) {
      test.skip('CreateLandlordLeaseInput 文件不存在');
      return;
    }

    const content = fs.readFileSync(createInputPath, 'utf-8');

    // 命名空间
    expect(content).toMatch(/namespace\s+Gentle\.Application\.Dtos\.LandlordLease/);

    // RoomId 必填
    expect(content).toMatch(/RoomId[\s\S]*?\[Required/);

    // LandlordName 必填 + MaxLength
    expect(content).toMatch(/LandlordName[\s\S]*?\[Required/);
    expect(content).toMatch(/MaxLength\(50/);

    // MonthlyRent 必填 + Range
    expect(content).toMatch(/MonthlyRent[\s\S]*?\[Required/);
    expect(content).toMatch(/Range\(0/);

    // PaymentMethod 必填（[Required] 在属性声明之前）
    expect(content).toMatch(/\[Required[\s\S]*?PaymentMethod PaymentMethod/);
  });

  // ==================== UpdateLandlordLeaseInput 测试 ====================

  test('6. 检查 UpdateLandlordLeaseInput 文件存在', async () => {
    expect(fs.existsSync(updateInputPath)).toBeTruthy();
  });

  test('7. 验证 UpdateLandlordLeaseInput 包含 Id 且无 RoomId', async () => {
    if (!fs.existsSync(updateInputPath)) {
      test.skip('UpdateLandlordLeaseInput 文件不存在');
      return;
    }

    const content = fs.readFileSync(updateInputPath, 'utf-8');

    // 命名空间
    expect(content).toMatch(/namespace\s+Gentle\.Application\.Dtos\.LandlordLease/);

    // Id 必填
    expect(content).toMatch(/public\s+int\s+Id\s*\{\s*get;\s*set;\s*\}/);
    expect(content).toMatch(/Id[\s\S]*?\[Required/);

    // 不包含 RoomId
    expect(content).not.toMatch(/RoomId/);
  });

  // ==================== RoomDto 变更测试 ====================

  test('8. 验证 RoomDto 新增 LandlordLease 属性', async () => {
    if (!fs.existsSync(roomDtoPath)) {
      test.skip('RoomDto 文件不存在');
      return;
    }

    const content = fs.readFileSync(roomDtoPath, 'utf-8');

    // 引用 LandlordLeaseDto 命名空间
    expect(content).toMatch(/using\s+Gentle\.Application\.Dtos\.LandlordLease/);

    // LandlordLease 属性
    expect(content).toMatch(/public\s+LandlordLeaseDto\??\s+LandlordLease\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== CreateRoomInput/UpdateRoomInput 变更测试 ====================

  test('9. 验证 CreateRoomInput CostPrice 去掉 [Required]', async () => {
    if (!fs.existsSync(createRoomInputPath)) {
      test.skip('CreateRoomInput 文件不存在');
      return;
    }

    const content = fs.readFileSync(createRoomInputPath, 'utf-8');

    // 确认 CostPrice 字段存在
    expect(content).toMatch(/public\s+decimal\s+CostPrice\s*\{\s*get;\s*set;\s*\}/);

    // CostPrice 仍有 Range 验证
    expect(content).toMatch(/CostPrice[\s\S]*?Range\(0/);

    // CostPrice 上方不应有 [Required]（成本价注释后紧跟 Range 而非 Required）
    const costPriceBlock = content.match(/成本价[\s\S]*?public\s+decimal\s+CostPrice\s*\{\s*get;\s*set;\s*\}/)?.[0] ?? '';
    expect(costPriceBlock).not.toMatch(/\[Required/);
  });

  test('10. 验证 UpdateRoomInput CostPrice 去掉 [Required]', async () => {
    if (!fs.existsSync(updateRoomInputPath)) {
      test.skip('UpdateRoomInput 文件不存在');
      return;
    }

    const content = fs.readFileSync(updateRoomInputPath, 'utf-8');

    expect(content).toMatch(/public\s+decimal\s+CostPrice\s*\{\s*get;\s*set;\s*\}/);

    const costPriceBlock = content.match(/成本价[\s\S]*?public\s+decimal\s+CostPrice\s*\{\s*get;\s*set;\s*\}/)?.[0] ?? '';
    expect(costPriceBlock).not.toMatch(/\[Required/);
  });

  // ==================== Mapper.cs 变更测试 ====================

  test('11. 验证 Mapper.cs Profit 计算使用 LandlordLease', async () => {
    if (!fs.existsSync(mapperPath)) {
      test.skip('Mapper.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(mapperPath, 'utf-8');

    // 引用 LandlordLease DTO 命名空间
    expect(content).toMatch(/using\s+Gentle\.Application\.Dtos\.LandlordLease/);

    // Profit 计算使用 LandlordLease.MonthlyRent
    expect(content).toMatch(/src\.LandlordLease\s*!=\s*null\s*\?\s*src\.LandlordLease\.MonthlyRent\s*:\s*0/);
  });

  test('12. 验证 Mapper.cs 新增 LandlordLease 映射配置', async () => {
    if (!fs.existsSync(mapperPath)) {
      test.skip('Mapper.cs 文件不存在');
      return;
    }

    const content = fs.readFileSync(mapperPath, 'utf-8');

    // LandlordLease -> LandlordLeaseDto 映射（含 RoomInfo）
    expect(content).toMatch(/config\.NewConfig<LandlordLease,\s*LandlordLeaseDto>/);
    expect(content).toMatch(/dest\.RoomInfo/);

    // CreateLandlordLeaseInput -> LandlordLease 映射
    expect(content).toMatch(/config\.NewConfig<CreateLandlordLeaseInput,\s*LandlordLease>/);

    // UpdateLandlordLeaseInput -> LandlordLease 映射
    expect(content).toMatch(/config\.NewConfig<UpdateLandlordLeaseInput,\s*LandlordLease>/);
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
});
