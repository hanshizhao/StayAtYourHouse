/**
 * FEAT-172: 后端 AppService - DebtAppService API 控制器
 * 类型: api_runtime
 *
 * 测试覆盖：
 * 1. DebtAppService 文件存在
 * 2. IDynamicApiController 实现
 * 3. 路由配置 [Route("api/debt")]
 * 4. [Authorize] 授权特性
 * 5. ApiDescriptionSettings 分组配置
 * 6. 7 个端点定义（路由 + HTTP 方法）
 * 7. 项目构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-172: 后端 AppService - DebtAppService API 控制器', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const appServicePath = path.join(serverPath, 'Gentle.Application/Apps/DebtAppService.cs');

  // ==================== 文件存在性测试 ====================

  test('1. 检查 DebtAppService 文件存在', async () => {
    expect(fs.existsSync(appServicePath)).toBeTruthy();
  });

  // ==================== Furion 控制器模式测试 ====================

  test('2. 验证 IDynamicApiController 实现', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // 必须实现 IDynamicApiController（Furion 动态 API）
    expect(content).toMatch(/IDynamicApiController/);

    // 必须有 ApiDescriptionSettings 分组配置
    expect(content).toMatch(/ApiDescriptionSettings/);
    expect(content).toMatch(/Name\s*=\s*"DebtApp"/);
    expect(content).toMatch(/Order\s*=\s*12/);

    // 必须在 Application.Apps 命名空间下
    expect(content).toMatch(/namespace\s+Gentle\.Application\.Apps/);
  });

  // ==================== 路由和授权测试 ====================

  test('3. 验证路由配置 [Route("api/debt")]', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // 路由前缀
    expect(content).toMatch(/\[Route\("api\/debt"\)\]/);

    // 授权特性
    expect(content).toMatch(/\[Authorize\]/);
  });

  // ==================== 端点定义测试 ====================

  test('4. 验证 7 个端点定义', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // GET list - 欠款列表
    expect(content).toMatch(/\[HttpGet\("list"\)\]/);
    expect(content).toMatch(/GetList\s*\(/);

    // GET {id} - 欠款详情
    expect(content).toMatch(/\[HttpGet\("\{id\}"\)\]/);
    expect(content).toMatch(/GetById\s*\(\s*int\s+id\s*\)/);

    // POST add - 新增欠款
    expect(content).toMatch(/\[HttpPost\("add"\)\]/);
    expect(content).toMatch(/Add\s*\(CreateDebtInput/);

    // PUT edit - 编辑欠款
    expect(content).toMatch(/\[HttpPut\("edit"\)\]/);
    expect(content).toMatch(/Edit\s*\(UpdateDebtInput/);

    // DELETE remove/{id} - 删除欠款
    expect(content).toMatch(/\[HttpDelete\("remove\/\{id\}"\)\]/);
    expect(content).toMatch(/Remove\s*\(\s*int\s+id\s*\)/);

    // POST {id}/repay - 添加还款
    expect(content).toMatch(/\[HttpPost\("\{id\}\/repay"\)\]/);
    expect(content).toMatch(/AddRepayment\s*\(\s*int\s+id\s*,\s*AddRepaymentInput/);

    // DELETE repay/remove/{id} - 删除还款
    expect(content).toMatch(/\[HttpDelete\("repay\/remove\/\{id\}"\)\]/);
    expect(content).toMatch(/RemoveRepayment\s*\(\s*int\s+id\s*\)/);
  });

  // ==================== 服务注入测试 ====================

  test('5. 验证 IDebtService 依赖注入', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // 注入 IDebtService
    expect(content).toMatch(/IDebtService/);

    // 构造函数注入模式
    expect(content).toMatch(/DebtAppService\s*\(\s*IDebtService/);

    // 调用服务方法
    expect(content).toMatch(/_debtService\.GetListAsync/);
    expect(content).toMatch(/_debtService\.GetByIdAsync/);
    expect(content).toMatch(/_debtService\.AddAsync/);
    expect(content).toMatch(/_debtService\.UpdateAsync/);
    expect(content).toMatch(/_debtService\.DeleteAsync/);
    expect(content).toMatch(/_debtService\.AddRepaymentAsync/);
    expect(content).toMatch(/_debtService\.DeleteRepaymentAsync/);
  });

  // ==================== 返回类型测试 ====================

  test('6. 验证端点返回类型', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // GetList → DebtListResult
    expect(content).toMatch(/Task<DebtListResult>\s+GetList/);

    // GetById → DebtDetailDto
    expect(content).toMatch(/Task<DebtDetailDto>\s+GetById/);

    // Add → DebtDetailDto
    expect(content).toMatch(/Task<DebtDetailDto>\s+Add/);

    // Edit → DebtDetailDto
    expect(content).toMatch(/Task<DebtDetailDto>\s+Edit/);

    // Remove → Task (void)
    expect(content).toMatch(/async\s+Task\s+Remove\s*\(\s*int\s+id\s*\)/);

    // AddRepayment → DebtRepaymentDto
    expect(content).toMatch(/Task<DebtRepaymentDto>\s+AddRepayment/);

    // RemoveRepayment → Task (void)
    expect(content).toMatch(/async\s+Task\s+RemoveRepayment\s*\(\s*int\s+id\s*\)/);
  });

  // ==================== 构建验证 ====================

  test('7. 项目构建成功', async () => {
    const result = execSync('dotnet build', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });
});
