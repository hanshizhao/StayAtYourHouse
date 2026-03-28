/**
 * FEAT-044: 删除后端 Bill 服务层和 DTO - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('FEAT-044: 删除后端 Bill 服务层和 DTO', () => {
  const projectRoot = path.join(__dirname, '../../');

  test('1. 验证 Bill 服务层文件已删除', async () => {
    const deletedFiles = [
      'Gentle/Gentle.Application/Apps/BillAppService.cs',
      'Gentle/Gentle.Application/Services/IBillService.cs',
      'Gentle/Gentle.Application/Services/BillService.cs',
    ];

    deletedFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file);
      expect(fs.existsSync(fullPath)).toBeFalsy();
    });
  });

  test('2. 验证 Bill DTO 目录已删除', async () => {
    const dtoDir = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Bill');
    expect(fs.existsSync(dtoDir)).toBeFalsy();
  });

  test('3. 验证 CollectionReportDto 已删除', async () => {
    const filePath = path.join(projectRoot, 'Gentle/Gentle.Application/Dtos/Report/CollectionReportDto.cs');
    expect(fs.existsSync(filePath)).toBeFalsy();
  });
});
