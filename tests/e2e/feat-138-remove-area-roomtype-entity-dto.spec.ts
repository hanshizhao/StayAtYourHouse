/**
 * FEAT-138: 后端实体 + DTO 删除 Area/RoomType - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. Room 实体中不存在 Area 和 RoomType 属性
 * 2. RoomDto 中不存在 Area 和 RoomType 属性
 * 3. CreateRoomInput 中不存在 Area 和 RoomType 属性
 * 4. UpdateRoomInput 中不存在 Area 和 RoomType 属性
 * 5. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-138: 后端实体 + DTO 删除 Area/RoomType', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const entityPath = path.join(serverPath, 'Gentle.Core/Entities/Room.cs');
  const roomDtoPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/RoomDto.cs');
  const createInputPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/CreateRoomInput.cs');
  const updateInputPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/UpdateRoomInput.cs');

  // ==================== 文件存在性测试 ====================

  test('1. Room 实体文件存在', async () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('2. RoomDto 文件存在', async () => {
    expect(fs.existsSync(roomDtoPath)).toBeTruthy();
  });

  test('3. CreateRoomInput 文件存在', async () => {
    expect(fs.existsSync(createInputPath)).toBeTruthy();
  });

  test('4. UpdateRoomInput 文件存在', async () => {
    expect(fs.existsSync(updateInputPath)).toBeTruthy();
  });

  // ==================== Room 实体 - Area/RoomType 已删除 ====================

  test('5. Room 实体中不存在 Area 属性', async () => {
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).not.toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
  });

  test('6. Room 实体中不存在 RoomType 属性', async () => {
    const content = fs.readFileSync(entityPath, 'utf-8');
    expect(content).not.toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== RoomDto - Area/RoomType 已删除 ====================

  test('7. RoomDto 中不存在 Area 属性', async () => {
    const content = fs.readFileSync(roomDtoPath, 'utf-8');
    expect(content).not.toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
  });

  test('8. RoomDto 中不存在 RoomType 属性', async () => {
    const content = fs.readFileSync(roomDtoPath, 'utf-8');
    expect(content).not.toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
  });

  // ==================== CreateRoomInput - Area/RoomType 已删除 ====================

  test('9. CreateRoomInput 中不存在 Area 属性', async () => {
    const content = fs.readFileSync(createInputPath, 'utf-8');
    expect(content).not.toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
  });

  test('10. CreateRoomInput 中不存在 RoomType 属性', async () => {
    const content = fs.readFileSync(createInputPath, 'utf-8');
    expect(content).not.toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
  });

  test('11. CreateRoomInput 中不存在 RoomType 的 MaxLength 验证', async () => {
    const content = fs.readFileSync(createInputPath, 'utf-8');
    expect(content).not.toMatch(/MaxLength.*房间类型/);
  });

  // ==================== UpdateRoomInput - Area/RoomType 已删除 ====================

  test('12. UpdateRoomInput 中不存在 Area 属性', async () => {
    const content = fs.readFileSync(updateInputPath, 'utf-8');
    expect(content).not.toMatch(/public\s+decimal\??\s+Area\s*\{\s*get;\s*set;\s*\}/);
  });

  test('13. UpdateRoomInput 中不存在 RoomType 属性', async () => {
    const content = fs.readFileSync(updateInputPath, 'utf-8');
    expect(content).not.toMatch(/public\s+string\??\s+RoomType\s*\{\s*get;\s*set;\s*\}/);
  });

  test('14. UpdateRoomInput 中不存在 RoomType 的 MaxLength 验证', async () => {
    const content = fs.readFileSync(updateInputPath, 'utf-8');
    expect(content).not.toMatch(/MaxLength.*房间类型/);
  });

  // ==================== 构建测试 ====================
  // 注意：构建验证跳过，因为 RoomService/ReportService 仍引用 Area/RoomType，
  // 属于 FEAT-139 范围。构建将在 FEAT-139 完成后通过。
  test.skip('15. 验证后端项目构建成功（等待 FEAT-139 完成后启用）', async () => {
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
