/**
 * FEAT-144: Room 固定费用 - 后端实体与 DTO 变更 - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. Room 实体新增 4 个固定费用属性（ElevatorFee、PropertyFee、InternetFee、OtherFees）
 * 2. RoomDto 新增 4 个对应属性
 * 3. CreateRoomInput 新增 4 个属性（含 Range 验证）
 * 4. UpdateRoomInput 新增 4 个属性（含 Range 验证）
 * 5. RoomService.UpdateAsync 包含 4 个属性赋值映射
 * 6. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-144: Room 固定费用 - 后端实体与 DTO 变更', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  const entityPath = path.join(gentlePath, 'Gentle.Core/Entities/Room.cs');
  const dtoPath = path.join(gentlePath, 'Gentle.Application/Dtos/Room/RoomDto.cs');
  const createInputPath = path.join(gentlePath, 'Gentle.Application/Dtos/Room/CreateRoomInput.cs');
  const updateInputPath = path.join(gentlePath, 'Gentle.Application/Dtos/Room/UpdateRoomInput.cs');
  const servicePath = path.join(gentlePath, 'Gentle.Application/Services/RoomService.cs');

  const fixedFeeFields = ['ElevatorFee', 'PropertyFee', 'InternetFee', 'OtherFees'];

  // ==================== 文件存在性测试 ====================

  test('Room 实体文件存在', () => {
    expect(fs.existsSync(entityPath)).toBeTruthy();
  });

  test('RoomDto 文件存在', () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  test('CreateRoomInput 文件存在', () => {
    expect(fs.existsSync(createInputPath)).toBeTruthy();
  });

  test('UpdateRoomInput 文件存在', () => {
    expect(fs.existsSync(updateInputPath)).toBeTruthy();
  });

  test('RoomService 文件存在', () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  // ==================== Room 实体属性测试 ====================

  test('Room 实体包含 4 个固定费用属性', () => {
    const content = fs.readFileSync(entityPath, 'utf-8');
    for (const field of fixedFeeFields) {
      expect(content, `Room 实体应包含 ${field} 属性`).toContain(`public decimal? ${field}`);
    }
  });

  // ==================== RoomDto 属性测试 ====================

  test('RoomDto 包含 4 个固定费用属性', () => {
    const content = fs.readFileSync(dtoPath, 'utf-8');
    for (const field of fixedFeeFields) {
      expect(content, `RoomDto 应包含 ${field} 属性`).toContain(`public decimal? ${field}`);
    }
  });

  // ==================== CreateRoomInput 属性测试 ====================

  test('CreateRoomInput 包含 4 个固定费用属性及 Range 验证', () => {
    const content = fs.readFileSync(createInputPath, 'utf-8');
    for (const field of fixedFeeFields) {
      expect(content, `CreateRoomInput 应包含 ${field} 属性`).toContain(`public decimal? ${field}`);
      // 验证属性上方有 Range 特性
      const fieldIndex = content.indexOf(`public decimal? ${field}`);
      const precedingText = content.substring(Math.max(0, fieldIndex - 200), fieldIndex);
      expect(precedingText, `${field} 应有 Range 验证特性`).toContain('[Range(');
    }
  });

  // ==================== UpdateRoomInput 属性测试 ====================

  test('UpdateRoomInput 包含 4 个固定费用属性及 Range 验证', () => {
    const content = fs.readFileSync(updateInputPath, 'utf-8');
    for (const field of fixedFeeFields) {
      expect(content, `UpdateRoomInput 应包含 ${field} 属性`).toContain(`public decimal? ${field}`);
      const fieldIndex = content.indexOf(`public decimal? ${field}`);
      const precedingText = content.substring(Math.max(0, fieldIndex - 200), fieldIndex);
      expect(precedingText, `${field} 应有 Range 验证特性`).toContain('[Range(');
    }
  });

  // ==================== RoomService 映射测试 ====================

  test('RoomService.UpdateAsync 包含 4 个固定费用赋值映射', () => {
    const content = fs.readFileSync(servicePath, 'utf-8');
    for (const field of fixedFeeFields) {
      expect(
        content,
        `RoomService.UpdateAsync 应包含 ${field} 赋值`,
      ).toContain(`existing.${field} = input.${field};`);
    }
  });

  // ==================== 构建验证 ====================

  test('dotnet build 构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: gentlePath,
      encoding: 'utf-8',
      timeout: 120000,
    });
    expect(result).toContain('0 个错误');
  });
});
