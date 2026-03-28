/**
 * FEAT-033: 前端类型定义 + API 函数 + 路由 - 静态验证
 * ⚠️ 仅适用于：前端类型定义、API 封装、路由配置
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('FEAT-033: 前端类型定义 + API 函数 + 路由', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');

  test('1. rentalModel.ts 包含 bills 字段', async () => {
    const modelPath = path.join(frontendPath, 'src/api/model/rentalModel.ts');
    expect(fs.existsSync(modelPath)).toBeTruthy();

    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/bills\??\s*:\s*BillItem\[\]/);
  });

  test('2. rentalModel.ts 引入 BillItem 类型', async () => {
    const modelPath = path.join(frontendPath, 'src/api/model/rentalModel.ts');
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/import\s+type\s+\{[^}]*BillItem[^}]*\}\s+from\s+['"]@\/api\/model\/billModel['"]/);
  });

  test('3. rentalModel.ts 包含 RentalPageParams 类型', async () => {
    const modelPath = path.join(frontendPath, 'src/api/model/rentalModel.ts');
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/export\s+interface\s+RentalPageParams/);
    expect(content).toContain('status?');
    expect(content).toContain('roomId?');
    expect(content).toContain('page?');
    expect(content).toContain('pageSize?');
  });

  test('4. rentalModel.ts 包含 RentalPageResult 类型', async () => {
    const modelPath = path.join(frontendPath, 'src/api/model/rentalModel.ts');
    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toMatch(/export\s+interface\s+RentalPageResult/);
    expect(content).toContain('items:');
    expect(content).toContain('total:');
  });

  test('5. rental.ts 包含 getRentalPage 函数', async () => {
    const apiPath = path.join(frontendPath, 'src/api/rental.ts');
    expect(fs.existsSync(apiPath)).toBeTruthy();

    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toMatch(/export\s+function\s+getRentalPage/);
    expect(content).toMatch(/RentalPageParams/);
    expect(content).toMatch(/RentalPageResult/);
  });

  test('6. rental.ts 包含 Page 路由常量', async () => {
    const apiPath = path.join(frontendPath, 'src/api/rental.ts');
    const content = fs.readFileSync(apiPath, 'utf-8');
    expect(content).toMatch(/Page:\s*['"]\/rental\/page['"]/);
  });

  test('7. housing.ts 包含租赁记录路由', async () => {
    const routerPath = path.join(frontendPath, 'src/router/modules/housing.ts');
    expect(fs.existsSync(routerPath)).toBeTruthy();

    const content = fs.readFileSync(routerPath, 'utf-8');
    expect(content).toMatch(/path:\s*['"]rental['"]/);
    expect(content).toMatch(/HousingRental/);
    expect(content).toMatch(/housing\/rental\/index\.vue/);
  });

  test('8. TypeScript 类型检查通过', async () => {
    execSync('npx tsc --noEmit', { cwd: frontendPath, stdio: 'pipe', timeout: 60000 });
  });
});
