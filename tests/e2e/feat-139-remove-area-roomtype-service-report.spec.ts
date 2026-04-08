import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, describe } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

describe('FEAT-139: 后端 Service + Report DTO 删除 Area/RoomType', () => {
  const serviceFiles = [
    'Gentle/Gentle.Application/Services/RoomService.cs',
    'Gentle/Gentle.Application/Services/ReportService.cs',
  ];

  const dtoFiles = [
    'Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs',
    'Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs',
  ];

  test('源文件应存在', () => {
    for (const file of [...serviceFiles, ...dtoFiles]) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} 应存在`).toBeTruthy();
    }
  });

  test('RoomService.UpdateAsync 不包含 Area/RoomType 赋值', () => {
    const content = fs.readFileSync(path.join(ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs'), 'utf-8');
    expect(content, '不应包含 existing.Area = input.Area').not.toContain('existing.Area = input.Area');
    expect(content, '不应包含 existing.RoomType = input.RoomType').not.toContain('existing.RoomType = input.RoomType');
  });

  test('ReportService 不包含 Area/RoomType 赋值', () => {
    const content = fs.readFileSync(path.join(ROOT, 'Gentle/Gentle.Application/Services/ReportService.cs'), 'utf-8');
    expect(content, '不应包含 Area = r.Area').not.toContain('Area = r.Area');
    expect(content, '不应包含 RoomType = r.RoomType').not.toContain('RoomType = r.RoomType');
    expect(content, '不应包含 Area = room.Area').not.toContain('Area = room.Area');
    expect(content, '不应包含 RoomType = room.RoomType').not.toContain('RoomType = room.RoomType');
  });

  test('HousingOverviewDto.VacantRoomDto 不包含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Report/HousingOverviewDto.cs'), 'utf-8');
    // 检查 VacantRoomDto 类区域内不应有 Area 或 RoomType 属性定义
    const vacantRoomDtoMatch = content.match(/class VacantRoomDto\s*\{[\s\S]*?\n\}/);
    expect(vacantRoomDtoMatch, '应找到 VacantRoomDto 类定义').toBeTruthy();
    const vacantRoomDtoContent = vacantRoomDtoMatch![0];
    expect(vacantRoomDtoContent, 'VacantRoomDto 不应包含 Area 属性').not.toContain('public decimal? Area');
    expect(vacantRoomDtoContent, 'VacantRoomDto 不应包含 RoomType 属性').not.toContain('public string? RoomType');
  });

  test('RoomProfitRankingDto 不包含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs'), 'utf-8');
    expect(content, '不应包含 Area 属性').not.toContain('public decimal? Area');
    expect(content, '不应包含 RoomType 属性').not.toContain('public string? RoomType');
  });

  test('后端 dotnet build 构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: path.join(ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result, '构建应成功').toContain('已成功生成');
  });
});
