/**
 * FEAT-031: 扩展 RentalRecordDto + Mapster 映射 - 静态验证
 * ⚠️ 仅适用于：后端 DTO 修改、映射配置
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('FEAT-031: 扩展 RentalRecordDto + Mapster 映射', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');

  test('1. RentalRecordDto 包含 Bills 属性', async () => {
    const dtoPath = path.join(serverPath, 'Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs');
    expect(fs.existsSync(dtoPath)).toBeTruthy();

    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toContain('Bills');
    expect(content).toMatch(/List<BillDto>\??\s*\{[^}]*\}/);
  });

  test('2. RentalRecordDto 引用 BillDto 命名空间', async () => {
    const dtoPath = path.join(serverPath, 'Gentle.Application/Dtos/RentalRecord/RentalRecordDto.cs');
    const content = fs.readFileSync(dtoPath, 'utf-8');
    expect(content).toMatch(/using\s+Gentle\.Application\.Dtos\.Bill/);
  });

  test('3. Mapper.cs 包含 Bills 映射配置', async () => {
    const mapperPath = path.join(serverPath, 'Gentle.Application/Mapper.cs');
    expect(fs.existsSync(mapperPath)).toBeTruthy();

    const content = fs.readFileSync(mapperPath, 'utf-8');
    expect(content).toMatch(/\.Map\(\s*dest\s*=>\s*dest\.Bills/);
  });

  test('4. Mapper.cs 映射中包含 Renter、Room、Community、Bills 完整配置', async () => {
    const mapperPath = path.join(serverPath, 'Gentle.Application/Mapper.cs');
    const content = fs.readFileSync(mapperPath, 'utf-8');

    // 验证 RentalRecord → RentalRecordDto 映射段包含所有字段
    const rentalMappingMatch = content.match(
      /config\.NewConfig<RentalRecord,\s*RentalRecordDto>\(\)[\s\S]*?\.Map\(\s*dest\s*=>\s*dest\.Bills/
    );
    expect(rentalMappingMatch).toBeTruthy();
  });

  test('5. dotnet build 构建成功', async () => {
    execSync('dotnet build', { cwd: serverPath, stdio: 'pipe' });
  });
});
