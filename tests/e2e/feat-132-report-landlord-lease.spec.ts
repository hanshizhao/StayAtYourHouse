import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, describe } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const GENTLE_DIR = path.join(PROJECT_ROOT, 'Gentle');

describe('FEAT-132: 后端报表模块更新', () => {
  const dtoFiles = {
    roomProfitRanking: path.join(
      GENTLE_DIR,
      'Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs',
    ),
    housingOverview: path.join(
      GENTLE_DIR,
      'Gentle.Application/Dtos/Report/HousingOverviewDto.cs',
    ),
    reportService: path.join(
      GENTLE_DIR,
      'Gentle.Application/Services/ReportService.cs',
    ),
  };

  test('RoomProfitRankingDto 文件存在', () => {
    expect(fs.existsSync(dtoFiles.roomProfitRanking)).toBeTruthy();
  });

  test('RoomProfitRankingDto 使用 LandlordLeaseMonthlyRent 替代 CostPrice', () => {
    const content = fs.readFileSync(dtoFiles.roomProfitRanking, 'utf-8');

    // 应包含 LandlordLeaseMonthlyRent 属性（decimal?）
    expect(content).toContain('LandlordLeaseMonthlyRent');
    expect(content).toMatch(/decimal\?\s+LandlordLeaseMonthlyRent/);

    // MonthlyProfit 应为普通属性（非计算属性）
    expect(content).toMatch(/decimal\s+MonthlyProfit\s*\{\s*get;\s*set;\s*\}/);

    // 不应再包含 CostPrice
    expect(content).not.toMatch(/public\s+decimal\s+CostPrice/);
  });

  test('HousingOverviewDto VacantRoomDto 使用 LandlordLeaseMonthlyRent 替代 CostPrice', () => {
    const content = fs.readFileSync(dtoFiles.housingOverview, 'utf-8');

    // VacantRoomDto 应包含 LandlordLeaseMonthlyRent
    expect(content).toContain('LandlordLeaseMonthlyRent');
    expect(content).toMatch(/decimal\?\s+LandlordLeaseMonthlyRent/);

    // VacantRoomDto 不应再包含 CostPrice
    const vacantRoomSection = content.substring(
      content.indexOf('class VacantRoomDto'),
    );
    expect(vacantRoomSection).not.toMatch(/public\s+decimal\s+CostPrice/);
  });

  test('ReportService 成本改为从 LandlordLease 读取', () => {
    const content = fs.readFileSync(dtoFiles.reportService, 'utf-8');

    // GetIncomeReportAsync 应使用 LandlordLease?.MonthlyRent
    expect(content).toContain('LandlordLease?.MonthlyRent');

    // 应包含 Include LandlordLease
    expect(content).toMatch(/Include\s*\(\s*r\s*=>\s*r\.LandlordLease\s*\)/);
    // 或 ThenInclude
    expect(content).toMatch(/ThenInclude\s*\(\s*r\s*=>\s*r\.LandlordLease\s*\)/);

    // 不应再有 rental.Room.CostPrice
    expect(content).not.toContain('rental.Room.CostPrice');

    // 不应再有 r.CostPrice（在 VacantRoomDto 赋值中）
    expect(content).not.toContain('CostPrice = r.CostPrice');
    expect(content).not.toContain('CostPrice = room.CostPrice');
  });

  test('ReportService GetRoomProfitRankingAsync 显式赋值 MonthlyProfit', () => {
    const content = fs.readFileSync(dtoFiles.reportService, 'utf-8');

    // MonthlyProfit 应显式赋值
    expect(content).toMatch(/MonthlyProfit\s*=\s*room\.RentPrice\s*-\s*\(room\.LandlordLease\?\.MonthlyRent\s*\?\?\s*0\)/);

    // LandlordLeaseMonthlyRent 应赋值
    expect(content).toContain('LandlordLeaseMonthlyRent = room.LandlordLease?.MonthlyRent');
  });

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE_DIR,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    expect(result).toContain('已成功生成');
    expect(result).toMatch(/0\s+个错误/);
  });
});
