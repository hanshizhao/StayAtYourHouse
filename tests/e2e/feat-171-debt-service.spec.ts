/**
 * FEAT-171: 后端服务层 - IDebtService 接口和 DebtService 实现
 * 类型: api_runtime（服务层验证，完整 API 测试在 FEAT-172）
 *
 * 测试覆盖：
 * 1. IDebtService 接口文件存在及 ITransient 标记
 * 2. DebtService 实现文件存在及关键方法
 * 3. 接口方法签名完整性（7个方法）
 * 4. 服务实现模式（仓储注入、异常处理、结算判定逻辑）
 * 5. 项目构建成功
 *
 * 注意：完整 API 端点测试在 FEAT-172（DebtAppService）中覆盖
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-171: 后端服务层 - IDebtService 接口和 DebtService 实现', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const interfacePath = path.join(serverPath, 'Gentle.Application/Services/IDebtService.cs');
  const servicePath = path.join(serverPath, 'Gentle.Application/Services/DebtService.cs');

  // ==================== 文件存在性测试 ====================

  test('1. 检查 IDebtService 接口文件存在', async () => {
    expect(fs.existsSync(interfacePath)).toBeTruthy();
  });

  test('2. 检查 DebtService 实现文件存在', async () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  // ==================== 接口代码模式测试 ====================

  test('3. 验证 IDebtService 接口模式', async () => {
    if (!fs.existsSync(interfacePath)) {
      test.skip('接口文件不存在');
      return;
    }

    const content = fs.readFileSync(interfacePath, 'utf-8');

    // 必须标记 ITransient（Furion 自动注册）
    expect(content).toMatch(/ITransient/);

    // 必须包含 7 个方法签名
    expect(content).toMatch(/GetListAsync/);
    expect(content).toMatch(/GetByIdAsync/);
    expect(content).toMatch(/AddAsync/);
    expect(content).toMatch(/UpdateAsync/);
    expect(content).toMatch(/DeleteAsync/);
    expect(content).toMatch(/AddRepaymentAsync/);
    expect(content).toMatch(/DeleteRepaymentAsync/);

    // 使用正确的 DTO 类型
    expect(content).toMatch(/DebtListResult/);
    expect(content).toMatch(/DebtDetailDto/);
    expect(content).toMatch(/DebtRepaymentDto/);
    expect(content).toMatch(/DebtListInput/);
    expect(content).toMatch(/CreateDebtInput/);
    expect(content).toMatch(/UpdateDebtInput/);
    expect(content).toMatch(/AddRepaymentInput/);
  });

  // ==================== 服务实现代码模式测试 ====================

  test('4. 验证 DebtService 实现模式', async () => {
    if (!fs.existsSync(servicePath)) {
      test.skip('服务文件不存在');
      return;
    }

    const content = fs.readFileSync(servicePath, 'utf-8');

    // 必须实现 IDebtService
    expect(content).toMatch(/class\s+DebtService/);
    expect(content).toMatch(/IDebtService/);

    // 必须注入三个仓储
    expect(content).toMatch(/IRepository<Core\.Entities\.Debt>/);
    expect(content).toMatch(/IRepository<Core\.Entities\.DebtRepayment>/);
    expect(content).toMatch(/IRepository<Core\.Entities\.Tenant>/);

    // 必须使用 Furion 异常处理
    expect(content).toMatch(/Oops\.Oh/);

    // 关键业务逻辑：还清自动判定
    expect(content).toMatch(/DebtStatus\.Settled/);

    // 关键业务逻辑：删除还款时恢复状态
    expect(content).toMatch(/DebtStatus\.Ongoing/);

    // 关键业务逻辑：删除欠款校验无还款记录
    expect(content).toMatch(/存在还款记录.*无法删除/);

    // 关键业务逻辑：还款金额不超过剩余欠款
    expect(content).toMatch(/超过剩余欠款/);
  });

  // ==================== 构建验证 ====================

  test('5. 项目构建成功', async () => {
    const result = execSync('dotnet build', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });
});
