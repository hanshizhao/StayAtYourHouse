/**
 * FEAT-121: 前端 API 层和路由 - 静态验证
 * 类型: static
 * 适用于: 前端 API 模型、API 服务、路由模块
 *
 * 测试覆盖：
 * 1. API 模型文件存在性 + 枚举 + 接口验证
 * 2. API 服务文件存在性 + 函数导出验证
 * 3. 路由模块文件存在性 + 路由结构验证
 * 4. TypeScript 类型检查通过
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-121: 前端 API 层和路由', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');
  const apiModelPath = path.join(frontendPath, 'src/api/model');
  const apiPath = path.join(frontendPath, 'src/api');
  const routerModulesPath = path.join(frontendPath, 'src/router/modules');

  // ==================== API 模型文件验证 ====================

  test('1. maintenanceModel.ts 文件存在', async () => {
    const filePath = path.join(apiModelPath, 'maintenanceModel.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('2. maintenanceModel.ts - 包含 MaintenancePriority 枚举', async () => {
    const filePath = path.join(apiModelPath, 'maintenanceModel.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('enum MaintenancePriority');
    expect(content).toContain('Urgent');
    expect(content).toContain('Normal');
    expect(content).toContain('Low');
  });

  test('3. maintenanceModel.ts - 包含 MaintenanceStatus 枚举', async () => {
    const filePath = path.join(apiModelPath, 'maintenanceModel.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('enum MaintenanceStatus');
    expect(content).toContain('Pending');
    expect(content).toContain('InProgress');
    expect(content).toContain('Completed');
  });

  test('4. maintenanceModel.ts - 包含文本映射', async () => {
    const filePath = path.join(apiModelPath, 'maintenanceModel.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('MaintenancePriorityText');
    expect(content).toContain('MaintenanceStatusText');
  });

  test('5. maintenanceModel.ts - 包含核心接口定义', async () => {
    const filePath = path.join(apiModelPath, 'maintenanceModel.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');

    // 详情 DTO
    expect(content).toContain('interface MaintenanceDetail');
    expect(content).toContain('roomId');
    expect(content).toContain('roomInfo');
    expect(content).toContain('description');
    expect(content).toContain('priority');
    expect(content).toContain('status');
    expect(content).toContain('reportDate');
    expect(content).toContain('repairPerson');
    expect(content).toContain('repairPhone');
    expect(content).toContain('images');
    expect(content).toContain('remark');

    // 列表结果
    expect(content).toContain('interface MaintenanceListResult');
    expect(content).toContain('items');
    expect(content).toContain('total');

    // 输入接口
    expect(content).toContain('interface MaintenanceAddInput');
    expect(content).toContain('interface MaintenanceUpdateInput');
    expect(content).toContain('interface CompleteMaintenanceInput');
    expect(content).toContain('interface MaintenanceListParams');
  });

  // ==================== API 服务文件验证 ====================

  test('6. maintenance.ts API 服务文件存在', async () => {
    const filePath = path.join(apiPath, 'maintenance.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('7. maintenance.ts - 导出 CRUD 函数', async () => {
    const filePath = path.join(apiPath, 'maintenance.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');

    // 导入 request
    expect(content).toContain("from '@/utils/request'");

    // API 路由常量
    expect(content).toContain('maintenance');

    // CRUD 函数
    expect(content).toContain('export function getMaintenanceList');
    expect(content).toContain('export function getMaintenanceById');
    expect(content).toContain('export function addMaintenance');
    expect(content).toContain('export function updateMaintenance');
    expect(content).toContain('export function completeMaintenance');
    expect(content).toContain('export function deleteMaintenance');
  });

  test('8. maintenance.ts - 使用正确的 HTTP 方法', async () => {
    const filePath = path.join(apiPath, 'maintenance.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('request.get');
    expect(content).toContain('request.post');
    expect(content).toContain('request.put');
    expect(content).toContain('request.delete');
  });

  // ==================== 路由模块文件验证 ====================

  test('9. maintenance 路由模块文件存在', async () => {
    const filePath = path.join(routerModulesPath, 'maintenance.ts');
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('10. 路由模块 - 包含 Layout 和子路由', async () => {
    const filePath = path.join(routerModulesPath, 'maintenance.ts');
    if (!fs.existsSync(filePath)) { test.skip('文件不存在'); return; }

    const content = fs.readFileSync(filePath, 'utf-8');

    // 引入 Layout
    expect(content).toContain("@/layouts/index.vue");

    // 顶级路由
    expect(content).toContain("path: '/maintenance'");
    expect(content).toContain('component: Layout');

    // 子路由
    expect(content).toContain('path: \'list\'');
    expect(content).toContain('path: \'add\'');
    expect(content).toContain('path: \'edit/:id\'');

    // 懒加载页面组件
    expect(content).toContain("import('@/pages/maintenance/list.vue')");
    expect(content).toContain("import('@/pages/maintenance/add.vue')");

    // 中英文标题
    expect(content).toContain('zh_CN');
    expect(content).toContain('en_US');
  });

  // ==================== TypeScript 类型检查 ====================

  test('11. TypeScript 类型检查通过', async () => {
    execSync('npx vue-tsc --noEmit', { cwd: frontendPath, stdio: 'pipe' });
  });
});
