import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const DTOS_DIR = path.join(GENTLE, 'Gentle.Application', 'Dtos', 'Maintenance');

test.describe('FEAT-116: 后端 DTO', () => {
  test('MaintenanceAddInput 文件存在且包含验证特性', () => {
    const filePath = path.join(DTOS_DIR, 'MaintenanceAddInput.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class MaintenanceAddInput');
    expect(content).toContain('[Required(ErrorMessage = "房间ID不能为空")]');
    expect(content).toContain('[Required(ErrorMessage = "维修描述不能为空")]');
    expect(content).toContain('[MaxLength(500, ErrorMessage = "维修描述长度不能超过500个字符")]');
    expect(content).toContain('[Phone(ErrorMessage = "维修人员电话格式不正确")]');
    expect(content).toContain('[MaxLength(4000, ErrorMessage = "图片数据长度不能超过4000个字符")]');
    expect(content).toContain('MaintenancePriority Priority');
  });

  test('MaintenanceUpdateInput 文件存在且包含 Id 和验证特性', () => {
    const filePath = path.join(DTOS_DIR, 'MaintenanceUpdateInput.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class MaintenanceUpdateInput');
    expect(content).toContain('[Required(ErrorMessage = "维修记录ID不能为空")]');
    expect(content).toContain('public int Id { get; set; }');
    expect(content).toContain('MaintenanceStatus Status');
  });

  test('MaintenanceDetailDto 文件存在且包含 RoomInfo 和文本属性', () => {
    const filePath = path.join(DTOS_DIR, 'MaintenanceDetailDto.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class MaintenanceDetailDto');
    expect(content).toContain('string RoomInfo');
    expect(content).toContain('string PriorityText');
    expect(content).toContain('string StatusText');
    expect(content).toContain('紧急');
    expect(content).toContain('待处理');
    expect(content).toContain('进行中');
    expect(content).toContain('已完成');
    expect(content).toContain('DateTimeOffset CreatedTime');
  });

  test('CompleteMaintenanceInput 文件存在且包含验证特性', () => {
    const filePath = path.join(DTOS_DIR, 'CompleteMaintenanceInput.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class CompleteMaintenanceInput');
    expect(content).toContain('decimal? ActualCost');
    expect(content).toContain('[Range(0, double.MaxValue');
    expect(content).toContain('[MaxLength(500');
  });

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result.includes('Build succeeded') || result.includes('已成功生成')).toBeTruthy();
  });
});
