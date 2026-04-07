import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const HANS_DIR = path.join(PROJECT_ROOT, 'Hans');

test.describe('FEAT-125: 前端待办模型和 API 修改', () => {
  const todoModelPath = path.join(HANS_DIR, 'src/api/model/todoModel.ts');
  const todoApiPath = path.join(HANS_DIR, 'src/api/todo.ts');
  const maintenanceModelPath = path.join(HANS_DIR, 'src/api/model/maintenanceModel.ts');

  test.describe('文件存在检查', () => {
    test('todoModel.ts 文件存在', () => {
      expect(fs.existsSync(todoModelPath)).toBeTruthy();
    });

    test('todo.ts 文件存在', () => {
      expect(fs.existsSync(todoApiPath)).toBeTruthy();
    });

    test('maintenanceModel.ts 依赖文件存在', () => {
      expect(fs.existsSync(maintenanceModelPath)).toBeTruthy();
    });
  });

  test.describe('todoModel.ts 内容验证', () => {
    let todoModelContent: string;

    test.beforeAll(() => {
      todoModelContent = fs.readFileSync(todoModelPath, 'utf-8');
    });

    test('TodoType 枚举包含 Maintenance = 2', () => {
      expect(todoModelContent).toMatch(/Maintenance\s*=\s*2/);
    });

    test('TodoTypeText 包含维修类型映射', () => {
      expect(todoModelContent).toMatch(/\[TodoType\.Maintenance\]\s*:\s*['"]维修['"]/);
    });

    test('TodoItem 接口包含维修描述字段 description', () => {
      expect(todoModelContent).toMatch(/description\?:/);
    });

    test('TodoItem 接口包含优先级字段 priority', () => {
      expect(todoModelContent).toMatch(/priority\?:/);
    });

    test('TodoItem 接口包含优先级文本字段 priorityText', () => {
      expect(todoModelContent).toMatch(/priorityText\?:/);
    });

    test('TodoItem 接口包含维修费用字段 maintenanceCost', () => {
      expect(todoModelContent).toMatch(/maintenanceCost\?:/);
    });

    test('TodoItem 接口包含维修状态字段 maintenanceStatus', () => {
      expect(todoModelContent).toMatch(/maintenanceStatus\?:/);
    });

    test('TodoItem 接口包含维修状态文本字段 maintenanceStatusText', () => {
      expect(todoModelContent).toMatch(/maintenanceStatusText\?:/);
    });

    test('TodoItem 接口包含维修详情字段 maintenanceDetail', () => {
      expect(todoModelContent).toMatch(/maintenanceDetail\?:/);
    });

    test('TodoListResult 接口包含 maintenanceCount 字段', () => {
      expect(todoModelContent).toMatch(/maintenanceCount\s*:\s*number/);
    });

    test('从 maintenanceModel 导出 MaintenanceDetail 类型', () => {
      expect(todoModelContent).toMatch(/export type \{ MaintenanceDetail \} from ['"]\.\/maintenanceModel['"]/);
    });

    test('从 maintenanceModel 导出枚举类型', () => {
      expect(todoModelContent).toMatch(/export type \{ MaintenancePriority, MaintenanceStatus \} from ['"]\.\/maintenanceModel['"]/);
    });
  });

  test.describe('todo.ts 内容验证', () => {
    let todoApiContent: string;

    test.beforeAll(() => {
      todoApiContent = fs.readFileSync(todoApiPath, 'utf-8');
    });

    test('todoTypeToString 支持 maintenance 类型', () => {
      expect(todoApiContent).toMatch(/case TodoTypeEnum\.Maintenance:\s*return\s*['"]maintenance['"]/);
    });

    test('todoTypeToString 使用 switch 语句（非三元运算符）', () => {
      expect(todoApiContent).toMatch(/switch\s*\(type\)/);
    });
  });

  test.describe('前端构建验证', () => {
    test('npm run build 构建成功', () => {
      const result = execSync('npm run build', {
        cwd: HANS_DIR,
        encoding: 'utf-8',
        timeout: 180_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      expect(result).toBeTruthy();
    });
  });
});
