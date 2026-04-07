import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const DTOS_TODO_DIR = path.join(GENTLE, 'Gentle.Application', 'Dtos', 'Todo');
const SERVICES_DIR = path.join(GENTLE, 'Gentle.Application', 'Services');
const APPS_DIR = path.join(GENTLE, 'Gentle.Application', 'Apps');

test.describe('FEAT-119: 待办系统集成', () => {
  // ── TodoItemDto 修改验证 ──

  test('TodoItemDto 包含维修相关字段', () => {
    const content = fs.readFileSync(path.join(DTOS_TODO_DIR, 'TodoItemDto.cs'), 'utf-8');

    expect(content).toContain('Description');
    expect(content).toContain('Priority');
    expect(content).toContain('PriorityText');
    expect(content).toContain('MaintenanceCost');
    expect(content).toContain('MaintenanceStatus');
    expect(content).toContain('MaintenanceStatusText');
    expect(content).toContain('MaintenanceDetail');
  });

  test('TodoItemDto 引入 MaintenanceDetailDto', () => {
    const content = fs.readFileSync(path.join(DTOS_TODO_DIR, 'TodoItemDto.cs'), 'utf-8');
    expect(content).toContain('using Gentle.Application.Dtos.Maintenance');
  });

  test('TodoItemDto.CreatedTime 使用 switch 三分支（Utility/Rental/Maintenance）', () => {
    const content = fs.readFileSync(path.join(DTOS_TODO_DIR, 'TodoItemDto.cs'), 'utf-8');

    expect(content).toContain('Type switch');
    expect(content).toContain('TodoType.Utility');
    expect(content).toContain('TodoType.Rental');
    expect(content).toContain('TodoType.Maintenance');
  });

  // ── TodoListResult 修改验证 ──

  test('TodoListResult 包含 MaintenanceCount 属性', () => {
    const content = fs.readFileSync(path.join(DTOS_TODO_DIR, 'TodoListResult.cs'), 'utf-8');

    expect(content).toContain('MaintenanceCount');
    expect(content).toContain('int MaintenanceCount');
  });

  // ── TodoService 修改验证 ──

  test('TodoService 注入 IRepository<MaintenanceRecord>', () => {
    const content = fs.readFileSync(path.join(SERVICES_DIR, 'TodoService.cs'), 'utf-8');

    expect(content).toContain('IRepository<MaintenanceRecord>');
    expect(content).toContain('_maintenanceRepository');
  });

  test('TodoService.GetTodoListAsync 支持 maintenance 类型', () => {
    const content = fs.readFileSync(path.join(SERVICES_DIR, 'TodoService.cs'), 'utf-8');

    expect(content).toContain('"maintenance"');
    expect(content).toContain('includeMaintenance');
  });

  test('TodoService 包含 GetMaintenanceTodosAsync 方法', () => {
    const content = fs.readFileSync(path.join(SERVICES_DIR, 'TodoService.cs'), 'utf-8');

    expect(content).toContain('GetMaintenanceTodosAsync');
    // 筛选非已完成状态
    expect(content).toContain('MaintenanceStatus.Completed');
  });

  test('TodoService 包含 MapFromMaintenanceRecord 方法', () => {
    const content = fs.readFileSync(path.join(SERVICES_DIR, 'TodoService.cs'), 'utf-8');

    expect(content).toContain('MapFromMaintenanceRecord');
    expect(content).toContain('TodoType.Maintenance');
  });

  test('TodoService 返回结果包含 MaintenanceCount', () => {
    const content = fs.readFileSync(path.join(SERVICES_DIR, 'TodoService.cs'), 'utf-8');

    expect(content).toContain('MaintenanceCount = maintenanceCount');
  });

  // ── TodoAppService 修改验证 ──

  test('TodoAppService type 参数验证支持 maintenance', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'TodoAppService.cs'), 'utf-8');

    expect(content).toContain('"maintenance"');
  });

  test('TodoAppService 错误提示包含 maintenance', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'TodoAppService.cs'), 'utf-8');

    expect(content).toContain('maintenance');
  });

  // ── 编译验证 ──

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    expect(result.includes('Build succeeded') || result.includes('已成功生成')).toBeTruthy();
  });
});
