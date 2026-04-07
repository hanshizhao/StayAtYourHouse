import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const SERVICES_DIR = path.join(GENTLE, 'Gentle.Application', 'Services');

test.describe('FEAT-117: 后端服务层', () => {
  test('IMaintenanceService 接口文件存在且继承 ITransient', () => {
    const filePath = path.join(SERVICES_DIR, 'IMaintenanceService.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('interface IMaintenanceService : ITransient');
  });

  test('IMaintenanceService 接口包含所有必需方法', () => {
    const filePath = path.join(SERVICES_DIR, 'IMaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('GetListAsync');
    expect(content).toContain('GetByIdAsync');
    expect(content).toContain('AddAsync');
    expect(content).toContain('UpdateAsync');
    expect(content).toContain('CompleteAsync');
    expect(content).toContain('DeleteAsync');
  });

  test('IMaintenanceService GetListAsync 返回元组分页类型', () => {
    const filePath = path.join(SERVICES_DIR, 'IMaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('List<MaintenanceDetailDto>');
    expect(content).toContain('int Total');
    expect(content).toContain('MaintenanceStatus? status');
    expect(content).toContain('MaintenancePriority? priority');
    expect(content).toContain('int? roomId');
    expect(content).toContain('int? communityId');
  });

  test('MaintenanceService 实现文件存在且实现接口', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('class MaintenanceService : IMaintenanceService');
  });

  test('MaintenanceService 注入 IRepository<MaintenanceRecord> 和 IRepository<Room>', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('IRepository<MaintenanceRecord>');
    expect(content).toContain('IRepository<Room>');
  });

  test('MaintenanceService 包含 Include Room.Community 查询', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('.Include(m => m.Room)');
    expect(content).toContain('.ThenInclude(r => r.Community)');
  });

  test('MaintenanceService 包含 MapToDto 手动映射', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MapToDto');
    expect(content).toContain('Adapt<MaintenanceDetailDto>');
    expect(content).toContain('RoomInfo');
  });

  test('MaintenanceService AddAsync 验证房间存在', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('房间');
    expect(content).toContain('不存在');
    expect(content).toContain('Oops.Oh');
  });

  test('MaintenanceService CompleteAsync 验证状态', () => {
    const filePath = path.join(SERVICES_DIR, 'MaintenanceService.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('已完成');
    expect(content).toContain('Completed');
    expect(content).toContain('CompletedDate');
  });

  test('Mapper.cs 包含 MaintenanceAddInput 映射配置', () => {
    const filePath = path.join(GENTLE, 'Gentle.Application', 'Mapper.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MaintenanceAddInput');
    expect(content).toContain('MaintenanceRecord');
    expect(content).toContain('NewConfig<MaintenanceAddInput, MaintenanceRecord>');
  });

  test('Mapper.cs 包含 MaintenanceRecord 到 MaintenanceDetailDto 映射', () => {
    const filePath = path.join(GENTLE, 'Gentle.Application', 'Mapper.cs');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('NewConfig<MaintenanceRecord, MaintenanceDetailDto>');
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
