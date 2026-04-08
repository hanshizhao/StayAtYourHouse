/**
 * FEAT-143: 最终验证 - Area/RoomType 删除完整性检查
 * 类型: static
 *
 * 验证所有 FEAT-138~142 的工作成果：
 * 1. 后端文件不含 Area/RoomType 属性（除迁移回滚代码）
 * 2. 前端文件不含 area/roomType 引用
 * 3. 后端构建成功
 * 4. 前端构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-143: 最终验证 - Area/RoomType 完整清理', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const clientPath = path.join(projectRoot, 'Hans');

  // ==================== 后端文件验证 ====================

  const backendFiles = [
    'Gentle.Core/Entities/Room.cs',
    'Gentle.Application/Dtos/Room/RoomDto.cs',
    'Gentle.Application/Dtos/Room/CreateRoomInput.cs',
    'Gentle.Application/Dtos/Room/UpdateRoomInput.cs',
    'Gentle.Application/Services/RoomService.cs',
    'Gentle.Application/Services/ReportService.cs',
    'Gentle.Application/Dtos/Report/HousingOverviewDto.cs',
    'Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs',
  ];

  for (const file of backendFiles) {
    test(`后端文件存在: ${file}`, () => {
      const filePath = path.join(serverPath, file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    });
  }

  // 后端实体/DTO/Service 不应包含 Area/RoomType 属性
  test('Room.cs 不含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Core/Entities/Room.cs'), 'utf-8');
    expect(content).not.toMatch(/public\s+(\w+\s+)?Area\s*\{/);
    expect(content).not.toMatch(/public\s+(\w+\s+)?RoomType\s*\{/);
  });

  test('RoomDto.cs 不含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Dtos/Room/RoomDto.cs'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  test('CreateRoomInput.cs 不含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Dtos/Room/CreateRoomInput.cs'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  test('UpdateRoomInput.cs 不含 Area/RoomType 属性', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Dtos/Room/UpdateRoomInput.cs'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  test('RoomService.cs 不含 Area/RoomType 赋值', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Services/RoomService.cs'), 'utf-8');
    expect(content).not.toMatch(/\.Area\s*=/);
    expect(content).not.toMatch(/\.RoomType\s*=/);
  });

  test('ReportService.cs 不含 Area/RoomType 赋值', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Services/ReportService.cs'), 'utf-8');
    expect(content).not.toMatch(/\.Area\s*=/);
    expect(content).not.toMatch(/\.RoomType\s*=/);
  });

  test('HousingOverviewDto.VacantRoomDto 不含 Area/RoomType', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Dtos/Report/HousingOverviewDto.cs'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  test('RoomProfitRankingDto 不含 Area/RoomType', () => {
    const content = fs.readFileSync(path.join(serverPath, 'Gentle.Application/Dtos/Report/RoomProfitRankingDto.cs'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  // ==================== 迁移文件验证 ====================

  test('迁移文件 RemoveRoomAreaAndRoomType 存在', () => {
    const migrationsDir = path.join(serverPath, 'Gentle.Database.Migrations/Migrations');
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(
      f => f.includes('RemoveRoomAreaAndRoomType') && !f.endsWith('.Designer.cs')
    );
    expect(migrationFile).toBeDefined();
  });

  // ==================== 前端文件验证 ====================

  const frontendFiles = [
    'src/api/model/roomModel.ts',
    'src/pages/housing/room/index.vue',
    'src/pages/housing/room/detail.vue',
    'src/pages/housing/community/index.vue',
    'src/pages/tenant/check-in.vue',
  ];

  for (const file of frontendFiles) {
    test(`前端文件存在: ${file}`, () => {
      const filePath = path.join(clientPath, file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    });
  }

  test('roomModel.ts 不含 area/roomType', () => {
    const content = fs.readFileSync(path.join(clientPath, 'src/api/model/roomModel.ts'), 'utf-8');
    expect(content).not.toMatch(/\barea\b/);
    expect(content).not.toMatch(/\broomType\b/);
  });

  test('room/index.vue 不含 area/roomType 引用', () => {
    const content = fs.readFileSync(path.join(clientPath, 'src/pages/housing/room/index.vue'), 'utf-8');
    expect(content).not.toMatch(/\barea\b/);
    expect(content).not.toMatch(/\broomType\b/);
  });

  test('room/detail.vue 不含 面积/类型 展示', () => {
    const content = fs.readFileSync(path.join(clientPath, 'src/pages/housing/room/detail.vue'), 'utf-8');
    expect(content).not.toMatch(/\barea\b/);
    expect(content).not.toMatch(/\broomType\b/);
  });

  test('community/index.vue 不含 roomType 列', () => {
    const content = fs.readFileSync(path.join(clientPath, 'src/pages/housing/community/index.vue'), 'utf-8');
    expect(content).not.toMatch(/\broomType\b/);
  });

  test('check-in.vue 不含 area/roomType', () => {
    const content = fs.readFileSync(path.join(clientPath, 'src/pages/tenant/check-in.vue'), 'utf-8');
    expect(content).not.toMatch(/\barea\b/);
    expect(content).not.toMatch(/\broomType\b/);
  });

  // ==================== E2E 测试文件验证 ====================

  const e2eTestFiles = [
    'feat-002-room-entity.spec.ts',
    'feat-004-room-api.spec.ts',
    'feat-011-checkin-checkout-api.spec.ts',
    'feat-022-meter-api.spec.ts',
  ];

  for (const file of e2eTestFiles) {
    test(`E2E 测试文件存在: ${file}`, () => {
      const filePath = path.join(__dirname, file);
      expect(fs.existsSync(filePath)).toBeTruthy();
    });
  }

  test('feat-002 不含 Area/RoomType 断言', () => {
    const content = fs.readFileSync(path.join(__dirname, 'feat-002-room-entity.spec.ts'), 'utf-8');
    expect(content).not.toMatch(/\bArea\b/);
    expect(content).not.toMatch(/\bRoomType\b/);
  });

  test('feat-004 不含 area/roomType 数据和断言', () => {
    const content = fs.readFileSync(path.join(__dirname, 'feat-004-room-api.spec.ts'), 'utf-8');
    expect(content).not.toMatch(/area:\s*\d/);
    expect(content).not.toMatch(/roomType:\s*['"]/);
    expect(content).not.toMatch(/result\.data\.area/);
    expect(content).not.toMatch(/result\.data\.roomType/);
  });

  test('feat-011 不含 area: 50 数据', () => {
    const content = fs.readFileSync(path.join(__dirname, 'feat-011-checkin-checkout-api.spec.ts'), 'utf-8');
    expect(content).not.toMatch(/area:\s*50/);
  });

  test('feat-022 不含 area: 50 数据', () => {
    const content = fs.readFileSync(path.join(__dirname, 'feat-022-meter-api.spec.ts'), 'utf-8');
    expect(content).not.toMatch(/area:\s*50/);
  });

  // ==================== 构建验证 ====================

  test('后端 dotnet build 构建成功', () => {
    try {
      execSync('dotnet build --no-restore', {
        cwd: serverPath,
        stdio: 'pipe',
        timeout: 120000
      });
    } catch (error: any) {
      if (error.stdout) console.error('构建输出:', error.stdout.toString());
      if (error.stderr) console.error('构建错误:', error.stderr.toString());
      throw error;
    }
  });

  test('前端 npm run build 构建成功', () => {
    try {
      execSync('npm run build', {
        cwd: clientPath,
        stdio: 'pipe',
        timeout: 120000
      });
    } catch (error: any) {
      if (error.stdout) console.error('构建输出:', error.stdout.toString());
      if (error.stderr) console.error('构建错误:', error.stderr.toString());
      throw error;
    }
  });
});
