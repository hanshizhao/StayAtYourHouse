import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ROOT = path.resolve(__dirname, '..', '..');
const GENTLE = path.join(ROOT, 'Gentle');
const APPS_DIR = path.join(GENTLE, 'Gentle.Application', 'Apps');

test.describe('FEAT-118: 后端 API 控制器', () => {
  test('MaintenanceAppService 文件存在', () => {
    const filePath = path.join(APPS_DIR, 'MaintenanceAppService.cs');
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('MaintenanceAppService 实现 IDynamicApiController', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');
    expect(content).toContain('class MaintenanceAppService : IDynamicApiController');
  });

  test('MaintenanceAppService 使用 [Route("api/maintenance")] 路由', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');
    expect(content).toContain('[Route("api/maintenance")]');
  });

  test('MaintenanceAppService 使用 [Authorize] 授权', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');
    expect(content).toContain('[Authorize]');
  });

  test('MaintenanceAppService 注入 IMaintenanceService', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');
    expect(content).toContain('IMaintenanceService');
  });

  test('MaintenanceAppService 包含所有 API 端点方法', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    // GET /api/maintenance/list
    expect(content).toContain('[HttpGet("list")]');
    expect(content).toContain('GetList');

    // GET /api/maintenance/{id}
    expect(content).toContain('[HttpGet("{id}")]');
    expect(content).toContain('GetById');

    // POST /api/maintenance/add
    expect(content).toContain('[HttpPost("add")]');
    expect(content).toContain('Add');

    // PUT /api/maintenance/edit
    expect(content).toContain('[HttpPut("edit")]');
    expect(content).toContain('Edit');

    // POST /api/maintenance/{id}/complete
    expect(content).toContain('[HttpPost("{id}/complete")]');
    expect(content).toContain('Complete');

    // DELETE /api/maintenance/remove/{id}
    expect(content).toContain('[HttpDelete("remove/{id}")]');
    expect(content).toContain('Remove');
  });

  test('GetList 方法包含筛选参数（status/priority/roomId/communityId）', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    expect(content).toContain('MaintenanceStatus? status');
    expect(content).toContain('MaintenancePriority? priority');
    expect(content).toContain('int? roomId');
    expect(content).toContain('int? communityId');
    expect(content).toContain('page');
    expect(content).toContain('pageSize');
  });

  test('GetList 返回 items + total 结构', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    expect(content).toContain('items');
    expect(content).toContain('total');
  });

  test('ID 参数使用 [Range] 验证特性', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    expect(content).toContain('[Range(1, int.MaxValue');
  });

  test('分页参数有边界保护', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    expect(content).toContain('page < 1');
    expect(content).toContain('pageSize < 1');
    expect(content).toContain('pageSize > 100');
  });

  test('包含 [ApiDescriptionSettings] 分组配置', () => {
    const content = fs.readFileSync(path.join(APPS_DIR, 'MaintenanceAppService.cs'), 'utf-8');

    expect(content).toContain('[ApiDescriptionSettings(');
    expect(content).toContain('Name = "MaintenanceApp"');
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
