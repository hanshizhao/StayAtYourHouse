import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.join(__dirname, '../../');

test.describe('FEAT-149 Room固定费用最终验证', () => {
  const fields = ['ElevatorFee', 'PropertyFee', 'InternetFee', 'OtherFees'];

  // ── 后端：实体 ──
  test('Room 实体包含 4 个固定费用属性', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Core/Entities/Room.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    for (const field of fields) {
      expect(content, `Room 实体应包含 ${field}`).toContain(`public decimal? ${field}`);
    }
  });

  // ── 后端：DTO ──
  test('RoomDto 包含 4 个固定费用属性', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Room/RoomDto.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    for (const field of fields) {
      expect(content, `RoomDto 应包含 ${field}`).toContain(`public decimal? ${field}`);
    }
  });

  test('CreateRoomInput 包含 4 个固定费用属性', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Room/CreateRoomInput.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    for (const field of fields) {
      expect(content, `CreateRoomInput 应包含 ${field}`).toContain(`public decimal? ${field}`);
    }
  });

  test('UpdateRoomInput 包含 4 个固定费用属性', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Room/UpdateRoomInput.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    for (const field of fields) {
      expect(content, `UpdateRoomInput 应包含 ${field}`).toContain(`public decimal? ${field}`);
    }
  });

  // ── 后端：Service 映射 ──
  test('RoomService.UpdateAsync 包含 4 个固定费用映射', () => {
    const file = path.join(ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    for (const field of fields) {
      expect(content, `RoomService 应映射 ${field}`).toContain(`existing.${field} = input.${field}`);
    }
  });

  // ── 后端：迁移包含 AddColumn ──
  test('迁移文件包含 4 个 AddColumn 操作', () => {
    const migrationDir = path.join(ROOT, 'Gentle/Gentle.Database.Migrations/Migrations');
    const files = fs.readdirSync(migrationDir).filter(f => f.includes('RemoveRoomCostPrice') && !f.endsWith('Designer.cs'));
    expect(files.length, '应存在 RemoveRoomCostPrice 迁移文件').toBeGreaterThan(0);
    const content = fs.readFileSync(path.join(migrationDir, files[0]), 'utf-8');
    for (const field of fields) {
      expect(content, `迁移应包含 AddColumn ${field}`).toContain(`name: "${field}"`);
    }
  });

  // ── 前端：TypeScript Model ──
  test('roomModel.ts 包含 4 个固定费用属性', () => {
    const file = path.join(ROOT, 'Hans/src/api/model/roomModel.ts');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    const camelFields = ['elevatorFee', 'propertyFee', 'internetFee', 'otherFees'];
    for (const field of camelFields) {
      const count = (content.match(new RegExp(`${field}\\??: number`, 'g')) || []).length;
      expect(count, `roomModel.ts 应在 3 个接口中包含 ${field}`).toBeGreaterThanOrEqual(3);
    }
  });

  // ── 前端：房间编辑页面 ──
  test('room/index.vue 包含固定费用表单和赋值逻辑', () => {
    const file = path.join(ROOT, 'Hans/src/pages/housing/room/index.vue');
    expect(fs.existsSync(file)).toBeTruthy();
    const content = fs.readFileSync(file, 'utf-8');
    const camelFields = ['elevatorFee', 'propertyFee', 'internetFee', 'otherFees'];
    for (const field of camelFields) {
      expect(content, `页面应包含 ${field} 的 v-model`).toContain(`v-model="formData.${field}"`);
      expect(content, `页面应包含 ${field} 的编辑赋值`).toContain(`${field}: row.${field}`);
    }
  });

  // ── 后端构建 ──
  test('后端 dotnet build 成功', () => {
    const output = execSync('dotnet build', {
      cwd: path.join(ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(output).toContain('0 个错误');
  });

  // ── 前端类型检查 ──
  test('前端 npm run build:type 无类型错误', () => {
    // execSync 在非零退出码时抛出异常，build:type 成功即表示无类型错误
    execSync('npm run build:type', {
      cwd: path.join(ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: 'pipe',
    });
  });
});
